"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface Message {
  id: string;
  round: number;
  role: "A" | "B";
  content: string;
  timestamp: string;
}

interface Room {
  id: string;
  scene: string;
  roleAName: string;
  roleBName: string;
  messages: Message[];
}

interface StoryAnalysis {
  goldenQuote: string;
  lingeringMood: string;
  secret: string;
  plotTwist: string;
}

export default function CompletePage() {
  const params = useParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [analysis, setAnalysis] = useState<StoryAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompleteData();
  }, [params.id]);

  const loadCompleteData = async () => {
    try {
      // 加载房间信息
      const roomResponse = await fetch(`/api/rooms/${params.id}`);
      const roomData = await roomResponse.json();

      if (roomData.success) {
        setRoom(roomData.data);

        // 触发 AI 分析
        const analysisResponse = await fetch(`/api/rooms/${params.id}/ai-suggest`, {
          method: "GET",
        });
        const analysisData = await analysisResponse.json();

        if (analysisData.success) {
          setAnalysis(analysisData.data);
        }
      } else {
        toast.error("房间不存在");
      }
    } catch (error) {
      toast.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  const copyStory = () => {
    if (!room) return;

    const storyText = `
${room.scene}

角色 A：${room.roleAName}
角色 B：${room.roleBName}

${room.messages
  .map(
    (msg) =>
      `第${msg.round}轮 ${msg.role === "A" ? room.roleAName : room.roleBName}：${msg.content}`
  )
  .join("\n\n")}
`.trim();

    navigator.clipboard.writeText(storyText);
    toast.success("已复制到剪贴板");
  };

  const shareLink = () => {
    const url = `${window.location.origin}/room/${params.id}`;
    navigator.clipboard.writeText(url);
    toast.success("链接已复制");
  };

  const exportToZhihu = () => {
    if (!room || !analysis) return;

    const content = `
# ${room.scene}：${room.roleAName}与${room.roleBName}的 10 轮对话

## 故事背景
${room.scene}

角色 A：${room.roleAName}
角色 B：${room.roleBName}

---

## 完整对话

${room.messages
  .map(
    (msg) =>
      `**第${msg.round}轮** ${msg.role === "A" ? room.roleAName : room.roleBName}：${msg.content}`
  )
  .join("\n\n")}

---

## 故事分析

### 💬 金句
> ${analysis.goldenQuote}

### 🌅 余韵
${analysis.lingeringMood}

### 🔒 秘密
${analysis.secret}

### 🔄 反转
${analysis.plotTwist}

---

*由群像·星火创作*
*https://qunxiangxinghuo.cn*
`.trim();

    navigator.clipboard.writeText(content);
    toast.success("知乎格式已复制");
  };

  const exportToXiaohongshu = () => {
    if (!room || !analysis) return;

    const caption = `
${analysis.goldenQuote}

在${room.scene}，${room.roleAName}和${room.roleBName}的 10 轮对话，
留下了${analysis.lingeringMood}的余韵。

 秘密：${analysis.secret}
🔄 反转：${analysis.plotTwist}

来群像·星火，和陌生人一起创作故事✨
链接：${window.location.origin}/room/${params.id}

#群像星火 #对话体小说 #故事创作 #陌生人社交 #文学创作
`.trim();

    navigator.clipboard.writeText(caption);
    toast.success("小红书文案已复制");
  };

  const saveToLocal = () => {
    if (!room || !analysis) return;

    const content = `# ${room.scene}：${room.roleAName}与${room.roleBName}的 10 轮对话

## 故事背景
${room.scene}

角色 A：${room.roleAName}
角色 B：${room.roleBName}

---

## 💬 金句
> ${analysis.goldenQuote}

## 🌅 余韵
${analysis.lingeringMood}

##  秘密
${analysis.secret}

## 🔄 反转
${analysis.plotTwist}

---

## 完整对话

${room.messages
  .map(
    (msg) =>
      `**第${msg.round}轮** ${msg.role === "A" ? room.roleAName : room.roleBName}：${msg.content}`
  )
  .join("\n\n")}

---

创作于 群像·星火
${new Date().toLocaleString("zh-CN")}
`;

    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${room.scene}-${room.roleAName}与${room.roleBName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("故事已保存到本地");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">分析故事中...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">房间不存在</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">故事完成！</h1>
        <p className="text-muted-foreground">
          {room.scene} · {room.roleAName} × {room.roleBName}
        </p>
      </div>

      {/* 金句高亮显示 */}
      {analysis && (
        <Card className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6 pb-6">
            <div className="text-center space-y-3">
              <div className="text-sm text-blue-600 font-medium">💬 故事金句</div>
              <p className="text-xl md:text-2xl font-serif italic text-gray-800 leading-relaxed">
                "{analysis.goldenQuote}"
              </p>
              <Button
                onClick={() => {
                  const quoteText = `"${analysis.goldenQuote}"\n\n—— ${room.scene}\n${room.roleAName} × ${room.roleBName}`;
                  navigator.clipboard.writeText(quoteText);
                  toast.success("金句已复制");
                }}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                复制金句
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 分析卡片 */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <span>🌅</span> 余韵
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{analysis.lingeringMood}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <span></span> 秘密
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{analysis.secret}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <span>🔄</span> 反转
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{analysis.plotTwist}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 完整故事 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>完整对话</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {room.messages.map((message) => (
                <div key={message.id} className="border-b pb-3 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">第{message.round}轮</Badge>
                    <span className="font-medium">
                      {message.role === "A" ? room.roleAName : room.roleBName}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{message.content}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button onClick={saveToLocal} variant="default">
          💾 保存到本地
        </Button>
        <Button onClick={copyStory} variant="outline">
           复制故事
        </Button>
        <Button onClick={shareLink} variant="outline">
          🔗 分享链接
        </Button>
        <Button onClick={exportToZhihu} variant="outline">
          📝 导出为知乎文章
        </Button>
        <Button onClick={exportToXiaohongshu} variant="secondary">
          📱 导出为小红书图文
        </Button>
      </div>
    </div>
  );
}
