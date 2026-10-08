'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpenText,
  CheckCircle2,
  Filter,
  Globe2,
  RefreshCw,
} from 'lucide-react';

import { PaperCard } from '@/app/paper-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Paper } from '@/lib/literature-data';

export default function LiteratureDashboard() {
  const [paperList, setPaperList] = useState<Paper[]>([]);
  const [topic, setTopic] = useState('全部主题');
  const [minimumScore, setMinimumScore] = useState(70);
  const [syncState, setSyncState] = useState<
    'idle' | 'checking' | 'checked' | 'unavailable'
  >('idle');
  const [dataSource, setDataSource] = useState<
    'checking' | 'd1' | 'unavailable'
  >('checking');
  const [recommendationDate, setRecommendationDate] = useState<string>();
  const todayDate = useMemo(() => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );
    return `${values.year}-${values.month}-${values.day}`;
  }, []);

  const topics = useMemo(
    () => ['全部主题', ...new Set(paperList.map((paper) => paper.topic))],
    [paperList],
  );

  const refreshRecommendations = useCallback(async () => {
    setSyncState('checking');
    try {
      const response = await fetch('/api/recommendations');
      const payload = (await response.json()) as {
        source?: string;
        recommendationDate?: string | null;
        papers?: Paper[];
      };
      if (!response.ok || payload.source !== 'd1' || !payload.papers) {
        throw new Error('D1 unavailable');
      }
      setPaperList(payload.papers);
      setRecommendationDate(payload.recommendationDate ?? undefined);
      setDataSource('d1');
      setSyncState('checked');
    } catch {
      setPaperList([]);
      setRecommendationDate(undefined);
      setDataSource('unavailable');
      setSyncState('unavailable');
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshRecommendations();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [refreshRecommendations]);

  const filtered = useMemo(() => {
    return paperList.filter((paper) => {
      return (
        paper.score >= minimumScore &&
        (topic === '全部主题' || paper.topic === topic)
      );
    });
  }, [minimumScore, paperList, topic]);

  function clearFilters() {
    setTopic('全部主题');
    setMinimumScore(70);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/75 bg-background/94 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-5xl items-center gap-3 px-4 py-2 sm:px-6">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(22,58,53,0.18)]">
            <Globe2 className="size-[18px]" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              Nomad · 每日论文推荐
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              区域国别与国际研究
            </p>
          </div>
          <Button
            className="ml-auto"
            disabled={syncState === 'checking'}
            onClick={() => void refreshRecommendations()}
            size="lg"
            variant={syncState === 'checked' ? 'outline' : 'default'}
          >
            {syncState === 'checked' ? (
              <CheckCircle2 data-icon="inline-start" />
            ) : (
              <RefreshCw
                className={
                  syncState === 'checking' ? 'animate-spin' : undefined
                }
                data-icon="inline-start"
              />
            )}
            {syncState === 'idle'
              ? '读取推荐'
              : syncState === 'checking'
                ? '读取 D1…'
                : syncState === 'checked'
                  ? 'D1 已连接'
                  : '当前环境未连接'}
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">
              DAILY PAPERS · {todayDate.replaceAll('-', '.')}
            </p>
            <h1 className="mt-2 font-serif text-[clamp(1.8rem,4vw,2.6rem)] font-semibold tracking-[-0.035em]">
              今日论文推荐
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {recommendationDate && recommendationDate !== todayDate && (
              <Badge className="h-7 px-3" variant="secondary">
                数据批次 {recommendationDate.replaceAll('-', '.')}
              </Badge>
            )}
            <Badge className="h-7 px-3" variant="outline">
              推荐 {paperList.length} 篇
            </Badge>
            <Badge className="h-7 px-3" variant="outline">
              评分 ≥ {minimumScore}
            </Badge>
          </div>
        </div>

        <Card className="mt-7 gap-0 py-0">
          <CardContent className="grid gap-3 p-3 sm:grid-cols-[minmax(180px,1fr)_minmax(220px,1fr)] sm:items-center">
            <select
              aria-label="按研究主题筛选"
              className="h-10 w-full rounded-xl border-0 bg-muted/65 px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setTopic(event.target.value)}
              value={topic}
            >
              {topics.map((topicName) => (
                <option key={topicName} value={topicName}>
                  {topicName}
                </option>
              ))}
            </select>
            <label className="flex h-10 items-center gap-3 rounded-xl bg-muted/65 px-3 text-xs text-muted-foreground">
              <Filter className="size-3.5" />
              最低评分
              <input
                aria-label="最低关键词评分"
                className="h-1.5 min-w-0 flex-1 accent-[#173b36]"
                max="95"
                min="60"
                onChange={(event) =>
                  setMinimumScore(Number(event.target.value))
                }
                step="5"
                type="range"
                value={minimumScore}
              />
              <strong className="w-5 text-foreground">{minimumScore}</strong>
            </label>
          </CardContent>
        </Card>

        <div className="mt-5 space-y-3">
          {filtered.map((paper, index) => (
            <PaperCard defaultOpen={index === 0} key={paper.id} paper={paper} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
            <BookOpenText className="mx-auto size-8 text-muted-foreground/55" />
            <p className="mt-3 text-sm font-medium">
              {dataSource === 'unavailable'
                ? '本地预览尚未连接远程 D1'
                : dataSource === 'checking'
                  ? '正在读取今日最新论文'
                  : '没有符合当前条件的论文'}
            </p>
            {dataSource === 'd1' && (
              <button
                className="mt-2 text-xs text-primary underline underline-offset-4"
                onClick={clearFilters}
                type="button"
              >
                清除筛选
              </button>
            )}
          </div>
        )}

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-4 text-[11px] text-muted-foreground">
          <span>当前显示 {filtered.length} 篇</span>
          <span>去重后分析 · 默认每天同步</span>
        </footer>
      </section>
    </main>
  );
}
