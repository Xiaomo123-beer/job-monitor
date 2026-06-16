"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { JobDetail } from "@/components/jobs/JobDetail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { JobPosting } from "@/types";

export default function JobDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchJob = useCallback(() => {
    setLoading(true);
    fetch(`/api/jobs/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setJob(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  return (
    <div className="space-y-6">
      <Link href="/jobs" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回岗位列表
        </Link>

      <JobDetail job={job} loading={loading} onUpdate={fetchJob} />
    </div>
  );
}
