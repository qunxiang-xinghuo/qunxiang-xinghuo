/**
 * @file 对话页面
 * @description 双人创作 - 实时对话界面
 * 两个角色轮流对话，每轮100字限制，共10轮
 * 支持 AI 续写建议，2秒轮询同步消息
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { ReportButton } from "@/components/report-button";

interface Message {
  id: string;
  round: number;
  role: "A" | "B";
  content: string;
  isAI: boolean;
  aiStyle?: string;
  timestamp: string;
}

interface Room {
  id: string;
  scene: string;
  roleAName: string;
  roleBName: string;
  status: string;
  currentRound: number;
  currentRole: "A" | "B";
  messages: Message[];
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [myRole, setMyRole] = useState<"A" | "B" | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ style: string; content: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const MAX_LENGTH = 100;
  const MAX_ROUNDS = 10;

  // 加载房间信息
  useEffect(() => {
    loadRoom();
  }, [params.id]);

  // 滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 定时刷新消息
  useEffect(() => {
    if (!room || room.status !== "active") return;

    const interval = setInterval(() => {
      loadMessages();
    }, 2000);

    return () => clearInterval(interval);
  }, [room]);

  const loadRoom = async () => {
    try {
      const response = await fetch(`/api/rooms/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setRoom(data.data);
        setMessages(data.data.messages || []);
        
        // 判断我的角色
        if (session?.user?.id) {
          const myRole = data.data.messages.find((m: Message) => m.role === "A")?.role || "A";
          setMyRole(myRole);
        }
      } else {
        toast.error(data.error || "房间不存在");
        router.push("/");
      }
    } catch {
      toast.error("加载失败");
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/rooms/${params.id}/messages`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.data);
        
        // 检查是否完成
        const lastMessage = data.data[data.data.length - 1];
        if (lastMessage && lastMessage.round >= MAX_ROUNDS) {
          router.push(`/room/${params.id}/complete`);
        }
      }
    } catch {
      console.error("加载消息失败", error);
    }
  };

  const handleSubmit = async () => {
    if (!inputValue.trim()) {
      toast.error("请输入内容");
      return;
    }

    if (inputValue.length > MAX_LENGTH) {
      toast.error(`内容超出${MAX_LENGTH}字限制`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/rooms/${params.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: inputValue,
          role: myRole,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setInputValue("");
        setMessages(data.data.messages);
        
        // 获取 AI 续写建议
        if (data.data.suggestions && data.data.suggestions.length > 0) {
          setSuggestions(data.data.suggestions);
          setShowSuggestions(true);
        }
      } else {
        toast.error(data.error || "发送失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: { style: string; content: string }) => {
    setInputValue(suggestion.content);
    setShowSuggestions(false);
    toast.success("已填入输入框，可修改后提交");
  };

  const isMyTurn = room && myRole && room.currentRole === myRole;
  const isWaiting = room && myRole && room.currentRole !== myRole;

  if (!room) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl h-[calc(100vh-100px)] flex flex-col">
      {/* 顶部信息栏 */}
      <Card className="mb-4">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{room.scene}</h1>
              <p className="text-sm text-muted-foreground">
                {room.roleAName} × {room.roleBName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  第 {room.currentRound} 轮/共{MAX_ROUNDS}轮
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {isMyTurn ? "轮到你了" : isWaiting ? "等待对方" : ""}
                </p>
              </div>
              {/* 举报按钮 */}
              <ReportButton targetType="room" targetId={room.id} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 对话历史区 */}
      <Card className="flex-1 mb-4 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === myRole ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.role === myRole
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="text-xs opacity-70 mb-1">
                    {message.role === "A" ? room.roleAName : room.roleBName}
                    {message.isAI && ` (AI·${message.aiStyle})`}
                  </div>
                  <div className="text-sm">{message.content}</div>
                  <div className="text-xs opacity-50 mt-1">
                    第{message.round}轮
                  </div>
                </div>
              </div>
            ))}
            
            {isWaiting && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-sm text-muted-foreground">
                    ⏳ 等待对方输入...
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* AI 续写建议 */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">AI 续写建议</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSuggestions(false)}
                className="w-full"
              >
                自己写
              </Button>
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left justify-start"
                >
                  <span className="font-medium">{suggestion.style}：</span>
                  <span className="ml-2 truncate">{suggestion.content}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 输入区 */}
      <Card>
        <CardContent className="py-4">
          <div className="space-y-3">
            <Textarea
              placeholder={isMyTurn ? "输入你的对话..." : "等待对方输入..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={!isMyTurn || loading}
              maxLength={MAX_LENGTH}
              className="resize-none"
              rows={3}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {inputValue.length}/{MAX_LENGTH}字
              </span>
              <Button
                onClick={handleSubmit}
                disabled={!isMyTurn || loading || !inputValue.trim()}
              >
                {loading ? "发送中..." : "提交"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
