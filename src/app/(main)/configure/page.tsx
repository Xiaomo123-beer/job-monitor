"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Globe,
  FileText,
  Filter,
  Bell,
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { id: "sites", label: "添加网站", icon: Globe },
  { id: "requirements", label: "需求描述", icon: FileText },
  { id: "filters", label: "筛选条件", icon: Filter },
  { id: "notifications", label: "通知设置", icon: Bell },
];

export default function ConfigurePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: URLs
  const [urlInput, setUrlInput] = useState("");
  const [urls, setUrls] = useState<string[]>([]);

  // Step 2: Requirements
  const [requirements, setRequirements] = useState("");

  // Step 3: Filters
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [bonusInput, setBonusInput] = useState("");
  const [bonusKeywords, setBonusKeywords] = useState<string[]>([]);
  const [excludeInput, setExcludeInput] = useState("");
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);

  // Step 4: Notifications
  const [frequency, setFrequency] = useState("30");
  const [notifyBrowser, setNotifyBrowser] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [notifyWebhook, setNotifyWebhook] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookType, setWebhookType] = useState("feishu");
  const [workHoursOnly, setWorkHoursOnly] = useState(false);

  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (trimmed && !urls.includes(trimmed)) {
      setUrls([...urls, trimmed]);
      setUrlInput("");
    }
  };

  const removeUrl = (url: string) => {
    setUrls(urls.filter((u) => u !== url));
  };

  const addLocation = () => {
    const trimmed = locationInput.trim();
    if (trimmed && !locations.includes(trimmed)) {
      setLocations([...locations, trimmed]);
      setLocationInput("");
    }
  };

  const addKeyword = (
    value: string,
    list: string[],
    setter: (v: string[]) => void,
    inputSetter: (v: string) => void
  ) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setter([...list, trimmed]);
      inputSetter("");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save sites
      if (urls.length > 0) {
        const sitesRes = await fetch("/api/sites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            urls.map((url) => ({ url, name: new URL(url.startsWith("http") ? url : `https://${url}`).hostname }))
          ),
        });
        if (!sitesRes.ok) throw new Error("Failed to save sites");
      }

      // Save settings
      const settingsRes = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobRequirements: requirements,
          salaryMin: salaryMin ? parseInt(salaryMin) : null,
          salaryMax: salaryMax ? parseInt(salaryMax) : null,
          locationCities: JSON.stringify(locations),
          experienceLevel: experienceLevel || null,
          educationLevel: educationLevel || null,
          bonusKeywords: JSON.stringify(bonusKeywords),
          excludeKeywords: JSON.stringify(excludeKeywords),
          monitorFrequency: parseInt(frequency),
          notifyBrowser,
          notifyEmail,
          emailAddress: notifyEmail ? emailAddress : null,
          notifyWebhook,
          webhookUrl: notifyWebhook ? webhookUrl : null,
          webhookType,
          notifyWorkHoursOnly: workHoursOnly,
        }),
      });
      if (!settingsRes.ok) throw new Error("Failed to save settings");

      toast.success("配置保存成功！系统将开始监测");
      router.push("/");
    } catch {
      toast.error("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">监控配置</h1>
        <p className="text-muted-foreground mt-1">配置招聘网站监测规则</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <button
              onClick={() => setStep(i)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <s.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
            )}
          </div>
        ))}
      </div>

      <Card>
        {/* Step 1: Add URLs */}
        {step === 0 && (
          <>
            <CardHeader>
              <CardTitle>添加招聘网站 URL</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="粘贴招聘网站搜索链接，如 https://www.zhipin.com/web/geek/job?query=前端开发&city=100010000"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addUrl()}
                />
                <Button onClick={addUrl} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {urls.length > 0 && (
                <div className="space-y-2">
                  {urls.map((url) => (
                    <div
                      key={url}
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                    >
                      <span className="truncate flex-1">{url}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeUrl(url)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {urls.length === 0 && (
                <div className="rounded-lg border-2 border-dashed p-8 text-center text-muted-foreground">
                  <Globe className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>粘贴招聘网站搜索 URL</p>
                  <p className="text-xs mt-1">
                    支持 Boss直聘、猎聘、拉勾、智联招聘、LinkedIn
                  </p>
                </div>
              )}
            </CardContent>
          </>
        )}

        {/* Step 2: Requirements */}
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>岗位需求描述</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={`用自然语言描述你想要的岗位，例如：
"我需要找一份北京或远程的前端开发岗位，技术栈 React/TypeScript，薪资 20k 以上，3年经验，偏好中大型互联网公司"`}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="min-h-[150px]"
              />
              <p className="text-xs text-muted-foreground">
                AI 将根据这段描述理解你的需求，对岗位进行语义匹配
              </p>
            </CardContent>
          </>
        )}

        {/* Step 3: Filters */}
        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>筛选条件（可选）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>最低薪资 (K)</Label>
                  <Input
                    type="number"
                    placeholder="如 15"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>最高薪资 (K)</Label>
                  <Input
                    type="number"
                    placeholder="如 35"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>工作城市</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="输入城市名，按回车添加"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addLocation()}
                  />
                  <Button onClick={addLocation} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {locations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {locations.map((loc) => (
                      <Badge key={loc} variant="secondary" className="gap-1">
                        {loc}
                        <button
                          onClick={() =>
                            setLocations(locations.filter((l) => l !== loc))
                          }
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>经验要求</Label>
                  <Select
                    value={experienceLevel}
                    onValueChange={(v) => setExperienceLevel(v || "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="不限" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="不限">不限</SelectItem>
                      <SelectItem value="应届生">应届生</SelectItem>
                      <SelectItem value="1-3年">1-3年</SelectItem>
                      <SelectItem value="3-5年">3-5年</SelectItem>
                      <SelectItem value="5-10年">5-10年</SelectItem>
                      <SelectItem value="10年以上">10年以上</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>学历要求</Label>
                  <Select
                    value={educationLevel}
                    onValueChange={(v) => setEducationLevel(v || "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="不限" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="不限">不限</SelectItem>
                      <SelectItem value="大专">大专</SelectItem>
                      <SelectItem value="本科">本科</SelectItem>
                      <SelectItem value="硕士">硕士</SelectItem>
                      <SelectItem value="博士">博士</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>加分关键词</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="如 React, 远程办公"
                    value={bonusInput}
                    onChange={(e) => setBonusInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      addKeyword(
                        bonusInput,
                        bonusKeywords,
                        setBonusKeywords,
                        setBonusInput
                      )
                    }
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      addKeyword(
                        bonusInput,
                        bonusKeywords,
                        setBonusKeywords,
                        setBonusInput
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {bonusKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {bonusKeywords.map((kw) => (
                      <Badge key={kw} variant="secondary" className="gap-1 bg-green-50 dark:bg-green-950">
                        + {kw}
                        <button
                          onClick={() =>
                            setBonusKeywords(
                              bonusKeywords.filter((k) => k !== kw)
                            )
                          }
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>排除关键词</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="如 996, 外包"
                    value={excludeInput}
                    onChange={(e) => setExcludeInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      addKeyword(
                        excludeInput,
                        excludeKeywords,
                        setExcludeKeywords,
                        setExcludeInput
                      )
                    }
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      addKeyword(
                        excludeInput,
                        excludeKeywords,
                        setExcludeKeywords,
                        setExcludeInput
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {excludeKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {excludeKeywords.map((kw) => (
                      <Badge key={kw} variant="secondary" className="gap-1 bg-red-50 dark:bg-red-950">
                        - {kw}
                        <button
                          onClick={() =>
                            setExcludeKeywords(
                              excludeKeywords.filter((k) => k !== kw)
                            )
                          }
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </>
        )}

        {/* Step 4: Notifications */}
        {step === 3 && (
          <>
            <CardHeader>
              <CardTitle>通知设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>监测频率</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v || "30")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">每 15 分钟</SelectItem>
                    <SelectItem value="30">每 30 分钟</SelectItem>
                    <SelectItem value="60">每 1 小时</SelectItem>
                    <SelectItem value="180">每 3 小时</SelectItem>
                    <SelectItem value="360">每 6 小时</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>浏览器推送</Label>
                    <p className="text-xs text-muted-foreground">
                      匹配到新岗位时推送桌面通知
                    </p>
                  </div>
                  <Switch
                    checked={notifyBrowser}
                    onCheckedChange={setNotifyBrowser}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>邮件通知</Label>
                    <p className="text-xs text-muted-foreground">
                      发送匹配结果到邮箱
                    </p>
                  </div>
                  <Switch
                    checked={notifyEmail}
                    onCheckedChange={setNotifyEmail}
                  />
                </div>
                {notifyEmail && (
                  <Input
                    placeholder="your-email@example.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                  />
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Webhook 通知</Label>
                    <p className="text-xs text-muted-foreground">
                      通过钉钉/飞书/企业微信接收通知
                    </p>
                  </div>
                  <Switch
                    checked={notifyWebhook}
                    onCheckedChange={setNotifyWebhook}
                  />
                </div>
                {notifyWebhook && (
                  <div className="space-y-2">
                    <Select
                      value={webhookType}
                      onValueChange={(v) => setWebhookType(v || "feishu")}
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
                    <Input
                      placeholder="Webhook URL"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>仅工作时间通知</Label>
                  <p className="text-xs text-muted-foreground">
                    9:00 - 18:00 发送通知
                  </p>
                </div>
                <Switch
                  checked={workHoursOnly}
                  onCheckedChange={setWorkHoursOnly}
                />
              </div>
            </CardContent>
          </>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          上一步
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)}>
            下一步
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                保存并开始监测
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
