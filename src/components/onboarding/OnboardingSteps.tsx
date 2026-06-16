"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Globe,
  FileText,
  Bell,
  Check,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const STEPS = [
  {
    title: "欢迎使用岗位监测助手",
    description: "AI 驱动的招聘岗位自动监测与推送系统",
    icon: Sparkles,
  },
  {
    title: "添加监测网站",
    description: "输入你关注的招聘网站搜索链接",
    icon: Globe,
  },
  {
    title: "描述你的需求",
    description: "让 AI 理解你想要什么样的岗位",
    icon: FileText,
  },
  {
    title: "完成设置",
    description: "开始自动监测，接收精准推送",
    icon: Bell,
  },
];

export function OnboardingSteps() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [urls, setUrls] = useState<string[]>([""]);
  const [requirements, setRequirements] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    try {
      // Save URLs
      const validUrls = urls.filter((u) => u.trim());
      if (validUrls.length > 0) {
        await fetch("/api/sites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            validUrls.map((url) => ({
              url: url.startsWith("http") ? url : `https://${url}`,
            }))
          ),
        });
      }

      // Save requirements
      if (requirements.trim()) {
        await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobRequirements: requirements }),
        });
      }

      // Mark onboarding as completed
      localStorage.setItem("onboarding-completed", "true");
      router.push("/");
      router.refresh();
    } catch {
      // Continue anyway
      localStorage.setItem("onboarding-completed", "true");
      router.push("/");
    }
  };

  const current = STEPS[step];

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-8 bg-primary" : i < step ? "w-2 bg-primary/50" : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <current.icon className="h-10 w-10 text-primary" />
          </div>
        </div>

        {/* Title & Desc */}
        <div>
          <h2 className="text-2xl font-bold">{current.title}</h2>
          <p className="text-muted-foreground mt-2">{current.description}</p>
        </div>

        {/* Content per step */}
        <div className="text-left space-y-4">
          {step === 0 && (
            <div className="space-y-3 text-center">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-lg border p-3">
                  <Globe className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                  <p>自动爬取</p>
                </div>
                <div className="rounded-lg border p-3">
                  <Sparkles className="h-6 w-6 mx-auto mb-1 text-purple-500" />
                  <p>AI 匹配</p>
                </div>
                <div className="rounded-lg border p-3">
                  <Bell className="h-6 w-6 mx-auto mb-1 text-orange-500" />
                  <p>即时推送</p>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              {urls.map((url, i) => (
                <Input
                  key={i}
                  placeholder="粘贴招聘网站搜索 URL"
                  value={url}
                  onChange={(e) => {
                    const newUrls = [...urls];
                    newUrls[i] = e.target.value;
                    setUrls(newUrls);
                  }}
                />
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUrls([...urls, ""])}
              >
                添加更多
              </Button>
            </div>
          )}

          {step === 2 && (
            <Textarea
              placeholder={`用自然语言描述你想要的岗位，例如：
"北京或远程的前端开发岗位，React/TypeScript，薪资 20k 以上，3年经验"`}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="min-h-[120px]"
            />
          )}

          {step === 3 && (
            <div className="text-center space-y-2">
              <Check className="h-12 w-12 mx-auto text-green-500" />
              <p className="font-medium">一切就绪！</p>
              <p className="text-sm text-muted-foreground">
                系统将每 30 分钟自动监测一次，
                <br />
                发现匹配岗位后立即推送通知
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          {step > 0 ? (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
            >
              上一步
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                localStorage.setItem("onboarding-completed", "true");
                router.push("/");
              }}
            >
              跳过引导
            </Button>
          )}

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)}>
              下一步
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={loading}>
              {loading ? "保存中..." : "开始使用"}
              <Check className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
