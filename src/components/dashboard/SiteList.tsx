"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, Pause, AlertTriangle, ExternalLink, Trash2 } from "lucide-react";
import { formatRelativeTime, getStatusColor, getStatusLabel } from "@/lib/utils";
import { toast } from "sonner";
import type { JobSite as JobSiteType } from "@/types";

interface SiteListProps {
  compact?: boolean;
}

export function SiteList({ compact = false }: SiteListProps) {
  const [sites, setSites] = useState<JobSiteType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSites = () => {
    fetch("/api/sites")
      .then((res) => res.json())
      .then((data) => {
        setSites(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/sites/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSites(sites.filter((s) => s.id !== id));
        toast.success("网站已删除");
      }
    } catch {
      toast.error("删除失败");
    }
  };

  const handlePause = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    try {
      const res = await fetch(`/api/sites/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchSites();
        toast.success(newStatus === "active" ? "已恢复监测" : "已暂停监测");
      }
    } catch {
      toast.error("操作失败");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>监控网站</CardTitle>
        </CardHeader>
        <CardContent>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (sites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>监控网站</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>暂无监控网站</p>
            <p className="text-sm mt-1">点击"添加监控"开始配置</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displaySites = compact ? sites.slice(0, 5) : sites;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>监控网站</CardTitle>
        {compact && sites.length > 5 && (
          <Link href="/jobs" className="text-sm text-primary hover:underline">
            查看全部
          </Link>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {displaySites.map((site) => (
          <div
            key={site.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{site.name}</span>
                <Badge variant="outline" className={getStatusColor(site.status)}>
                  {getStatusLabel(site.status)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className="truncate">{site.url}</span>
                {site.lastCrawledAt && (
                  <span>· {formatRelativeTime(site.lastCrawledAt)}抓取</span>
                )}
                {site._count && (
                  <span>· {site._count.jobPostings} 个岗位</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="icon"
                title={site.status === "active" ? "暂停" : "恢复"}
                onClick={() => handlePause(site.id, site.status)}
              >
                <Pause className="h-4 w-4" />
              </Button>
              <a href={site.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-muted">
                  <ExternalLink className="h-4 w-4" />
              </a>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(site.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
