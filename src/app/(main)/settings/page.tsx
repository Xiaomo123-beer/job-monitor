"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  Mail,
  Globe,
  Download,
  Trash2,
  Loader2,
  AlertTriangle,
  Clock,
  HardDrive,
} from "lucide-react";
import { toast } from "sonner";
import type { UserSettings } from "@/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = () => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const update = (field: string, value: unknown) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("设置已保存");
    } catch {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (format: "csv" | "json") => {
    try {
      const res = await fetch(`/api/export?format=${format}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `matched-jobs.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`已导出为 ${format.toUpperCase()}`);
    } catch {
      toast.error("导出失败");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">设置</h1>
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-destructive" />
        <p>无法加载设置</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">设置</h1>
        <p className="text-muted-foreground mt-1">管理通知偏好和数据策略</p>
      </div>

      {/* AI Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            AI 匹配设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>AI 服务商</Label>
            <Select
              value={settings.aiProvider || "openai"}
              onValueChange={(v) => update("aiProvider", v || "openai")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="deepseek">DeepSeek</SelectItem>
                <SelectItem value="custom">自定义兼容接口</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input
              type="password"
              placeholder={
                                settings.aiProvider === "deepseek"
                                  ? "sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                                  : "sk-..."
                              }
              value={settings.openaiApiKey || ""}
              onChange={(e) => update("openaiApiKey", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              用于 AI 语义匹配。未配置时将使用关键词匹配
            </p>
          </div>
          <div className="space-y-2">
            <Label>模型名称</Label>
            <Input
              placeholder={
                settings.aiProvider === "deepseek"
                  ? "deepseek-chat"
                  : "gpt-4o-mini"
              }
              value={settings.aiModel || ""}
              onChange={(e) => update("aiModel", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              DeepSeek 支持: deepseek-chat, deepseek-reasoner
            </p>
          </div>
          <div className="space-y-2">
            <Label>API Base URL（自定义接口地址）</Label>
            <Input
              placeholder="https://api.openai.com/v1"
              value={settings.openaiBaseUrl || ""}
              onChange={(e) => update("openaiBaseUrl", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>最低匹配分数</Label>
            <Select
              value={String(settings.minMatchScore)}
              onValueChange={(v) => update("minMatchScore", parseInt(v || "60"))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="80">80 — 仅高度匹配</SelectItem>
                <SelectItem value="60">60 — 中度匹配及以上</SelectItem>
                <SelectItem value="40">40 — 包含低度匹配</SelectItem>
                <SelectItem value="20">20 — 几乎全部</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            通知偏好
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>浏览器推送</Label>
              <p className="text-xs text-muted-foreground">匹配后桌面通知</p>
            </div>
            <Switch
              checked={settings.notifyBrowser}
              onCheckedChange={(v) => update("notifyBrowser", v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>邮件通知</Label>
              <p className="text-xs text-muted-foreground">发送到邮箱</p>
            </div>
            <Switch
              checked={settings.notifyEmail}
              onCheckedChange={(v) => update("notifyEmail", v)}
            />
          </div>
          {settings.notifyEmail && (
            <>
              <div className="space-y-2">
                <Label>邮箱地址</Label>
                <Input
                  type="email"
                  value={settings.emailAddress || ""}
                  onChange={(e) => update("emailAddress", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input
                    value={settings.emailHost || ""}
                    onChange={(e) => update("emailHost", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input
                    type="number"
                    value={settings.emailPort || ""}
                    onChange={(e) =>
                      update("emailPort", parseInt(e.target.value) || null)
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>邮箱密码/授权码</Label>
                <Input
                  type="password"
                  value={settings.emailPassword || ""}
                  onChange={(e) => update("emailPassword", e.target.value)}
                />
              </div>
            </>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Webhook 通知</Label>
              <p className="text-xs text-muted-foreground">
                钉钉/飞书/企微
              </p>
            </div>
            <Switch
              checked={settings.notifyWebhook}
              onCheckedChange={(v) => update("notifyWebhook", v)}
            />
          </div>
          {settings.notifyWebhook && (
            <>
              <div className="space-y-2">
                <Label>Webhook 类型</Label>
                <Select
                  value={settings.webhookType || "feishu"}
                  onValueChange={(v) => update("webhookType", v || "feishu")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feishu">飞书</SelectItem>
                    <SelectItem value="dingtalk">钉钉</SelectItem>
                    <SelectItem value="wechat">企业微信</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  value={settings.webhookUrl || ""}
                  onChange={(e) => update("webhookUrl", e.target.value)}
                />
              </div>
            </>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                仅工作时间通知
              </Label>
              <p className="text-xs text-muted-foreground">
                9:00-18:00 发送通知
              </p>
            </div>
            <Switch
              checked={settings.notifyWorkHoursOnly}
              onCheckedChange={(v) => update("notifyWorkHoursOnly", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data & Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            数据管理
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>数据保留天数</Label>
            <Select
              value={String(settings.dataRetentionDays)}
              onValueChange={(v) => update("dataRetentionDays", parseInt(v || "30"))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 天</SelectItem>
                <SelectItem value="14">14 天</SelectItem>
                <SelectItem value="30">30 天</SelectItem>
                <SelectItem value="60">60 天</SelectItem>
                <SelectItem value="90">90 天</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              超过此天数的非收藏记录将被自动清理
            </p>
          </div>

          <Separator />

          <Label>导出匹配记录</Label>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport("csv")}>
              <Download className="h-4 w-4 mr-2" />
              导出 CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport("json")}>
              <Download className="h-4 w-4 mr-2" />
              导出 JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              保存中...
            </>
          ) : (
            "保存设置"
          )}
        </Button>
      </div>
    </div>
  );
}
