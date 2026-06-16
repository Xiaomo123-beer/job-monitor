"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JobCardSkeleton } from "@/components/jobs/JobCardSkeleton";
import { formatRelativeTime, getScoreColor, getScoreLabel } from "@/lib/utils";
import { Briefcase } from "lucide-react";
import type { JobPosting } from "@/types";

export function RecentJobs() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/jobs?pageSize=5&sortBy=createdAt&sortOrder=desc")
      .then((res) => res.json())
      .then((data) => {
        setJobs(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>最近匹配</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <JobCardSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>最近匹配</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>暂无匹配岗位</p>
            <p className="text-sm mt-1">添加监控网站后等待自动抓取和匹配</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>最近匹配</CardTitle>
        <Link href="/jobs" className="text-sm text-primary hover:underline">
          查看全部
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {jobs.map((job) => {
          const match = job.matchResults?.[0];
          return (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{job.title}</span>
                  {match && (
                    <Badge
                      variant="outline"
                      className={getScoreColor(match.score)}
                    >
                      {getScoreLabel(match.score)}
                    </Badge>
                  )}
                  {match && !match.isRead && (
                    <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {job.company} · {job.salary || "薪资面议"} · {job.location}
                </p>
              </div>
              <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                {formatRelativeTime(job.firstSeenAt)}
              </span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
