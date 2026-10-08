'use client';

import type { ReactNode } from 'react';
import {
  ArrowUpRight,
  BookOpenText,
  ChevronDown,
  CircleHelp,
  Database,
  Fingerprint,
  FlaskConical,
  Quote,
  type LucideIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { Paper } from '@/lib/literature-data';

function ScorePill({ score }: { score: number }) {
  const tone =
    score >= 90
      ? 'bg-[#173b36] text-white'
      : score >= 80
        ? 'bg-[#dbe9df] text-[#173b36]'
        : 'bg-[#f3e5bd] text-[#6f4e12]';

  return (
    <div
      aria-label={`关键词相关度 ${score} 分`}
      className={`flex size-12 shrink-0 flex-col items-center justify-center rounded-full ${tone}`}
    >
      <span className="text-base font-semibold leading-none">{score}</span>
      <span className="mt-0.5 text-[9px] font-medium opacity-75">相关度</span>
    </div>
  );
}

function Section({
  icon: Icon,
  label,
  children,
  accent = false,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border p-4 ${accent ? 'border-[#cdbb88] bg-[#f8f0da]/72' : 'border-border/85 bg-card'}`}
    >
      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="text-[13.5px] leading-7 text-foreground/90">{children}</div>
    </section>
  );
}

function MetricSourceLink({
  label,
  source,
  sourceUrl,
  checkedAt,
}: {
  label: string;
  source?: string;
  sourceUrl?: string;
  checkedAt?: string;
}) {
  if (!source) return null;
  const sourceName = sourceUrl ? (
    <a
      className="underline decoration-border underline-offset-2 hover:text-foreground"
      href={sourceUrl}
      rel="noreferrer"
      target="_blank"
    >
      {source}
    </a>
  ) : (
    source
  );

  return (
    <span>
      {label}：{sourceName}
      {checkedAt ? ` · 核验于 ${checkedAt}` : ''}
    </span>
  );
}

export function PaperCard({
  paper,
  defaultOpen = false,
}: {
  paper: Paper;
  defaultOpen?: boolean;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <Card className="paper-card gap-0 py-0">
        <CardHeader className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 px-4 py-5 sm:px-5">
          <ScorePill score={paper.score} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                className="border-primary/20 bg-primary/5 text-primary"
                variant="outline"
              >
                {paper.source}
              </Badge>
              {paper.indexes.map((indexName) => (
                <Badge
                  className={
                    indexName === 'CSSCI' || indexName === 'AMI'
                      ? 'border-[#bd9a3e]/35 bg-[#f7efd8] text-[#6f5418]'
                      : undefined
                  }
                  key={indexName}
                  variant={
                    indexName === 'CSSCI' || indexName === 'AMI'
                      ? 'outline'
                      : 'secondary'
                  }
                >
                  {indexName}
                </Badge>
              ))}
              <Badge variant="secondary">{paper.kind}</Badge>
              <Badge variant="secondary">{paper.topic}</Badge>
              {paper.isNew && (
                <span className="rounded-full bg-[#f3e5bd] px-2 py-0.5 text-[10px] font-medium text-[#6f4e12]">
                  NEW
                </span>
              )}
              {paper.isPlaceholder && (
                <span className="rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                  结构示例
                </span>
              )}
            </div>

            <h2 className="mt-3 font-serif text-[1.08rem] font-semibold leading-[1.45] tracking-[-0.015em] sm:text-[1.18rem]">
              {paper.title}
            </h2>
            {paper.titleZh !== paper.title && (
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                {paper.titleZh}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span>{paper.authors.join(' · ')}</span>
              <span className="hidden size-0.5 rounded-full bg-border sm:block" />
              <span className="font-semibold text-foreground/90">
                {paper.journal}
              </span>
              <span>{paper.date}</span>
              <span
                className="rounded bg-muted px-1.5 py-0.5 font-semibold text-foreground/85"
                title={
                  paper.impactMetricSource ?? '尚未导入可追溯的影响因子数据'
                }
              >
                {paper.impactFactor !== undefined
                  ? `JIF ${paper.impactFactor}${paper.impactFactorYear ? ` · ${paper.impactFactorYear}` : ''}`
                  : paper.impactMetricSource
                    ? 'JIF 无公开值'
                    : 'JIF 待核验'}
              </span>
              <span
                className="rounded bg-muted px-1.5 py-0.5 font-semibold text-foreground/85"
                title={
                  paper.journalQuartileSource ?? '尚未导入可追溯的期刊分区数据'
                }
              >
                {paper.journalQuartile
                  ? `${paper.journalQuartile}${paper.journalQuartileYear ? ` · ${paper.journalQuartileYear}` : ''}`
                  : paper.journalQuartileSource
                    ? '分区无公开值'
                    : '分区待核验'}
              </span>
            </div>
            {(paper.impactMetricSource || paper.journalQuartileSource) && (
              <div className="mt-2 flex flex-col gap-0.5 text-[11px] leading-5 text-muted-foreground">
                <MetricSourceLink
                  checkedAt={paper.impactMetricCheckedAt}
                  label="JIF 来源"
                  source={paper.impactMetricSource}
                  sourceUrl={paper.impactMetricSourceUrl}
                />
                <MetricSourceLink
                  checkedAt={paper.journalQuartileCheckedAt}
                  label="分区来源"
                  source={paper.journalQuartileSource}
                  sourceUrl={paper.journalQuartileSourceUrl}
                />
              </div>
            )}

            <p className="mt-4 line-clamp-2 max-w-4xl text-sm leading-6 text-foreground/90">
              {paper.abstractZh}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <CollapsibleTrigger
                render={<Button className="-ml-2" size="sm" variant="ghost" />}
              >
                <BookOpenText data-icon="inline-start" />
                展开阅读卡片
                <ChevronDown data-icon="inline-end" />
              </CollapsibleTrigger>
              <span className="ml-auto hidden text-[10px] text-muted-foreground sm:block">
                {paper.readingMinutes > 0
                  ? `约 ${paper.readingMinutes} 分钟`
                  : '等待导入'}
              </span>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="border-t border-border/70 bg-muted/28 px-4 py-5 sm:px-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">结构化阅读卡片</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  原文与 AI 分析分层保存；证据页码绑定具体 PDF 版本。
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {paper.doi && (
                  <a
                    className={buttonVariants({
                      size: 'sm',
                      variant: 'outline',
                    })}
                    href={`https://doi.org/${paper.doi}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    DOI · {paper.doi}
                    <ArrowUpRight data-icon="inline-end" />
                  </a>
                )}
                {paper.officialUrl && (
                  <a
                    className={buttonVariants({
                      size: 'sm',
                      variant: 'outline',
                    })}
                    href={paper.officialUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    官方论文页面
                    <ArrowUpRight data-icon="inline-end" />
                  </a>
                )}
                {!paper.doi && !paper.officialUrl && (
                  <Badge variant="outline">DOI / 官方页等待导入</Badge>
                )}
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <Section icon={Quote} label="Original Abstract">
                  <p className="font-serif text-[13.5px] leading-7">
                    {paper.abstractOriginal}
                  </p>
                </Section>
              </div>
              <div className="lg:col-span-2">
                <Section accent icon={Fingerprint} label="核心结论">
                  {paper.coreConclusion}
                </Section>
              </div>
              <div className="lg:col-span-2">
                <Section icon={FlaskConical} label="研究方法">
                  <p className="whitespace-pre-line">{paper.researchMethod}</p>
                </Section>
              </div>
              <div className="lg:col-span-2">
                <Section icon={Database} label="数据来源">
                  {paper.dataSources}
                </Section>
              </div>
              <div className="lg:col-span-2">
                <Section icon={CircleHelp} label="可延伸的研究问题">
                  <ol className="space-y-2">
                    {paper.extensibleQuestions.map((question, index) => (
                      <li className="flex gap-2" key={question}>
                        <span className="mt-0.5 font-mono text-[11px] text-primary">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span>{question}</span>
                      </li>
                    ))}
                  </ol>
                </Section>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
