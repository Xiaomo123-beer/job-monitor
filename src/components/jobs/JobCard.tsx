"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatRelativeTime,
  getScoreColor,
  getScoreLabel,
  truncateText,
} from "@/lib/utils";
import { Star, StarOff, Eye, EyeOff, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { JobPosting } from "@/types";

interface JobCardProps {
  job: JobPosting;
  onUpdate?: () => void;
}

export function JobCard({ job, onUpdate }: JobCardProps) {
  const match = job.matchResults?.[0];

  const handleReadToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!match) return;

    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchResultId: match.id,
          isRead: !match.isRead,
        }),
      });
      if (res.ok) {
        onUpdate?.();
        toast.success(match.isRead ? "标记为未读" : "标记为已读");
      }
    } catch {
      toast.error("操作失败");
    }
  };

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
        onUpdate?.();
        toast.success(match.isFavorited ? "已取消收藏" : "已收藏");
      }
    } catch {
      toast.error("操作失败");
    }
  };

  return (
    <Link
      href={`/jobs/${job.id}`}
      className={`block rounded-lg border p-4 hover:bg-accent transition-colors ${
        match && !match.isRead ? "border-l-2 border-l-blue-500" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold truncate">{job.title}</h3>
            {match && (
              <Badge
                variant="outline"
                className={`text-xs ${getScoreColor(match.score)}`}
              >
                {getScoreLabel(match.score)} · {match.score}分
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-1">
            {job.company || "未知公司"}
            {job.salary && ` · ${job.salary}`}
            {job.location && ` · ${job.location}`}
          </p>

          {match && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {truncateText(match.matchReason, 80)}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(job.firstSeenAt)}
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title={match?.isRead ? "标记未读" : "标记已读"}
              onClick={handleReadToggle}
            >
              {match?.isRead ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title={match?.isFavorited ? "取消收藏" : "收藏"}
              onClick={handleFavoriteToggle}
            >
              {match?.isFavorited ? (
                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
              ) : (
                <StarOff className="h-3.5 w-3.5" />
              )}
            </Button>
            <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg p-1.5 hover:bg-muted"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
          </div>
        </div>
      </div>
    </Link>
  );
}
