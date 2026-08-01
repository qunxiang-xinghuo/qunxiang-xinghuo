/**
 * @file 创建房间页面
 * @description 双人创作 - 创建房间
 * 输入场景、角色A、角色B，生成6位房间号和分享链接
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function CreateRoomPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    scene: "",
    roleAName: "",
    roleBName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.scene.trim()) {
      toast.error("请输入场景描述");
      return;
    }
    
    if (!formData.roleAName.trim() || !formData.roleBName.trim()) {
      toast.error("请输入角色名字");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("房间创建成功！");
        router.push(`/room/${data.data.roomId}`);
      } else {
        toast.error(data.error || "创建失败");
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
          <CardTitle className="text-2xl">创建房间</CardTitle>
          <CardDescription>
            设置场景和角色，开始双人创作之旅
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 预设场景按钮 */}
            <div className="space-y-2">
              <Label>预设场景（点击快速填入）</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, scene: "机场候机厅，两个多年未见的老友偶然重逢，航班延误让他们有了叙旧的机会" })}
                  className="text-left h-auto py-2 px-3"
                >
                  ✈️ 机场重逢
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, scene: "深夜便利店，两个失眠的陌生人在货架前相遇，分享着各自的孤独" })}
                  className="text-left h-auto py-2 px-3"
                >
                  🏪 深夜便利店
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, scene: "雨夜站台，末班车即将离去，两个人在雨中等待着，是否要一起撑伞同行" })}
                  className="text-left h-auto py-2 px-3"
                >
                  🌧️ 雨夜站台
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scene">场景描述</Label>
              <Textarea
                id="scene"
                placeholder="例如：机场候机厅，两个陌生人偶然相遇..."
                value={formData.scene}
                onChange={(e) => setFormData({ ...formData, scene: e.target.value })}
                maxLength={200}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                {formData.scene.length}/200 字
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roleAName">角色 A 名字</Label>
                <Input
                  id="roleAName"
                  placeholder="例如：林晓"
                  value={formData.roleAName}
                  onChange={(e) => setFormData({ ...formData, roleAName: e.target.value })}
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.roleAName.length}/20 字
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roleBName">角色 B 名字</Label>
                <Input
                  id="roleBName"
                  placeholder="例如：陈默"
                  value={formData.roleBName}
                  onChange={(e) => setFormData({ ...formData, roleBName: e.target.value })}
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.roleBName.length}/20 字
                </p>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "创建中..." : "创建房间"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
