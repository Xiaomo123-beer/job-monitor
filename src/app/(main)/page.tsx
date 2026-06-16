"use client";

import { StatsCards } from "@/components/dashboard/StatsCards";
import { SiteList } from "@/components/dashboard/SiteList";
import { RecentJobs } from "@/components/dashboard/RecentJobs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function DashboardPage() {
  const [crawling, setCrawling] = useState(false);

  const handleManualCrawl = async () => {
    setCrawling(true);
    try {
      const res = await fetch("/api/crawl", { method: "POST" });
      const data = await res.json();
      const totalNew = data.results?.reduce(
        (sum: number, r: { newJobIds?: string[] }) =>
          sum + (r.newJobIds?.length || 0),
        0
      );
      toast.success(`爬取完成！发现 ${totalNew || 0} 个新岗位`);
      // Refresh the page after a short delay
      setTimeout(() => window.location.reload(), 2000);
    } catch {
      toast.error("爬取失败，请检查网站状态");
    } finally {
      setCrawling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            招聘岗位监测概览
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/jobs" className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted">
            <Search className="h-4 w-4 mr-2" />
            浏览岗位
          </Link>
          <Button
            variant="outline"
            onClick={handleManualCrawl}
            disabled={crawling}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${crawling ? "animate-spin" : ""}`}
            />
            {crawling ? "爬取中..." : "立即爬取"}
          </Button>
          <Link href="/configure" className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/80">
            <Plus className="h-4 w-4 mr-2" />
            添加监控
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Two columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SiteList compact />
        <RecentJobs />
      </div>
    </div>
  );
}
