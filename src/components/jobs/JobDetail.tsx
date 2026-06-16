"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getScoreColor,
  getScoreLabel,
  formatRelativeTime,
} from "@/lib/utils";
import {
  Star,
  StarOff,
  ExternalLink,
  Building2,
  MapPin,
  Briefcase,
  GraduationCap,
  Clock,
  DollarSign,
  Brain,
} from "lucide-react";
import { toast } from "sonner";
import type { JobPosting } from "@/types";

interface JobDetailProps {
  job: JobPosting | null;
  loading: boolean;
  onUpdate: () => void;
}

export function JobDetail({ job, loading, onUpdate }: JobDetailProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Briefcase className="h-16 w-16 mx-auto mb-4 opacity-20" />
        <p>岗位未找到</p>
      </div>
    );
  }

  const match = job.matchResults?.[0];

  const handleFavorite = async () => {
    if (!match) return;
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchResultId: match.id,
          isFavorited: !match.isFavorited,
        }),
      });
      if (res.ok) {
        onUpdate();
        toast.success(match.isFavorited ? "已取消收藏" : "已收藏");
      }
    } catch {
      toast.error("操作失败");
    }
  };

  const handleMarkRead = async () => {
    if (!match || match.isRead) return;
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchResultId: match.id,
          isRead: true,
        }),
      });
      if (res.ok) onUpdate();
    } catch {
      // silently fail
    }
  };

  // Mark as read when viewing
  if (match && !match.isRead) {
    handleMarkRead();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <div className="flex items-center gap-3 mt-2 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {job.company || "未知公司"}
              </span>
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatRelativeTime(job.firstSeenAt)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleFavorite}
            >
              {match?.isFavorited ? (
                <>
                  <Star className="h-4 w-4 mr-2 text-yellow-500 fill-yellow-500" />
                  已收藏
                </>
              ) : (
                <>
                  <StarOff className="h-4 w-4 mr-2" />
                  收藏
                </>
              )}
            </Button>
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/80">
                <ExternalLink className="h-4 w-4 mr-2" />
                查看原页面
              </a>
          </div>
        </div>
      </div>

      {/* Match score */}
      {match && (
        <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI 匹配分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <Badge
                className={`text-lg px-3 py-1 ${getScoreColor(match.score)}`}
              >
                {getScoreLabel(match.score)} · {match.score}分
              </Badge>
            </div>
            <p className="text-sm leading-relaxed">{match.matchReason}</p>
          </CardContent>
        </Card>
      )}

      {/* Job details */}
      <div className="grid gap-4 sm:grid-cols-2">
        {job.salary && (
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">薪资</p>
                <p className="font-semibold">{job.salary}</p>
              </div>
            </CardContent>
          </Card>
        )}
        {job.experience && (
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">经验要求</p>
                <p className="font-semibold">{job.experience}</p>
              </div>
            </CardContent>
          </Card>
        )}
        {job.education && (
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-xs text-muted-foreground">学历要求</p>
                <p className="font-semibold">{job.education}</p>
              </div>
            </CardContent>
          </Card>
        )}
        {job.site && (
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-xs text-muted-foreground">来源</p>
                <p className="font-semibold">{job.site.name}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Full JD */}
      <Card>
        <CardHeader>
          <CardTitle>岗位描述</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
            {job.description || "暂无详细描述"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
