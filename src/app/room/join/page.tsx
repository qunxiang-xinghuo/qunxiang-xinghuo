/**
 * @file 加入房间页面
 * @description 双人创作 - 加入房间
 * 输入6位房间号，选择角色，加入创作房间
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export default function JoinRoomPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    roomId: "",
    role: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.roomId.trim() || formData.roomId.length !== 6) {
      toast.error("请输入 6 位房间号");
      return;
    }
    
    if (!formData.role) {
      toast.error("请选择角色");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/rooms/${formData.roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: formData.role, guestId: "anonymous" }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("加入成功！");
        router.push(`/room/${formData.roomId}`);
      } else {
        toast.error(data.error || "加入失败");
      }
    } catch (error) {
      toast.error("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">加入房间</CardTitle>
          <CardDescription>
            输入房间号，选择角色，开始创作
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="roomId">房间号</Label>
              <Input
                id="roomId"
                placeholder="请输入 6 位房间号"
                value={formData.roomId}
                onChange={(e) => setFormData({ ...formData, roomId: e.target.value.toUpperCase() })}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-muted-foreground">
                6 位字符，例如：ABC123
              </p>
            </div>

            <div className="space-y-2">
              <Label>选择角色</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="A" id="roleA" />
                  <Label htmlFor="roleA" className="flex-1 cursor-pointer">
                    <div className="font-medium">角色 A</div>
                    <div className="text-xs text-muted-foreground">先手发言</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="B" id="roleB" />
                  <Label htmlFor="roleB" className="flex-1 cursor-pointer">
                    <div className="font-medium">角色 B</div>
                    <div className="text-xs text-muted-foreground">后手回应</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "加入中..." : "加入房间"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
