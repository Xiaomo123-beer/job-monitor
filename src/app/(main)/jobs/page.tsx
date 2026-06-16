"use client";

import { useEffect, useState, useCallback } from "react";
import { JobCard } from "@/components/jobs/JobCard";
import { JobCardSkeleton } from "@/components/jobs/JobCardSkeleton";
import { JobFilters } from "@/components/jobs/JobFilters";
import { Button } from "@/components/ui/button";
import { Briefcase, ChevronLeft, ChevronRight } from "lucide-react";
import type { JobPosting } from "@/types";

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [minScore, setMinScore] = useState("0");
  const [isRead, setIsRead] = useState("all");

  const fetchJobs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "20",
      sortBy,
      sortOrder: "desc",
      minScore,
    });
    if (keyword) params.set("keyword", keyword);
    if (isRead !== "all") params.set("isRead", isRead);

    fetch(`/api/jobs?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setJobs(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, keyword, sortBy, minScore, isRead]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">岗位列表</h1>
        <p className="text-muted-foreground mt-1">AI 匹配的岗位结果</p>
      </div>

      <JobFilters
        keyword={keyword}
        onKeywordChange={(v) => {
          setKeyword(v);
          setPage(1);
        }}
        sortBy={sortBy}
        onSortByChange={(v) => {
          setSortBy(v);
          setPage(1);
        }}
        minScore={minScore}
        onMinScoreChange={(v) => {
          setMinScore(v);
          setPage(1);
        }}
        isRead={isRead}
        onIsReadChange={(v) => {
          setIsRead(v);
          setPage(1);
        }}
      />

      {/* Job list */}
      <div className="space-y-2">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))
          : jobs.length === 0
          ? (
            <div className="text-center py-16 text-muted-foreground">
              <Briefcase className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">暂无匹配岗位</p>
              <p className="text-sm mt-1">
                添加监控网站并等待爬取完成后，AI 将自动匹配岗位
              </p>
            </div>
          )
          : jobs.map((job) => (
              <JobCard key={job.id} job={job} onUpdate={fetchJobs} />
            ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            上一页
          </Button>
          <span className="text-sm text-muted-foreground px-3">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            下一页
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
