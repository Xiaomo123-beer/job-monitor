"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface JobFiltersProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  minScore: string;
  onMinScoreChange: (value: string) => void;
  isRead: string;
  onIsReadChange: (value: string) => void;
}

export function JobFilters({
  keyword,
  onKeywordChange,
  sortBy,
  onSortByChange,
  minScore,
  onMinScoreChange,
  isRead,
  onIsReadChange,
}: JobFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索岗位、公司..."
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={sortBy} onValueChange={(v) => onSortByChange(v || "createdAt")}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="排序" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt">最新发布</SelectItem>
          <SelectItem value="score">匹配度</SelectItem>
          <SelectItem value="salary">薪资</SelectItem>
        </SelectContent>
      </Select>
      <Select value={minScore} onValueChange={(v) => onMinScoreChange(v || "0")}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="最低匹配度" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">全部</SelectItem>
          <SelectItem value="80">80分以上</SelectItem>
          <SelectItem value="60">60分以上</SelectItem>
          <SelectItem value="40">40分以上</SelectItem>
        </SelectContent>
      </Select>
      <Select value={isRead} onValueChange={(v) => onIsReadChange(v || "all")}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="阅读状态" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部</SelectItem>
          <SelectItem value="false">未读</SelectItem>
          <SelectItem value="true">已读</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
