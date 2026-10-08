export type JournalMetricRecord = {
  aliases: string[];
  impactFactor?: number;
  impactFactorYear?: number;
  impactSource: string;
  impactSourceUrl: string;
  impactCheckedAt: string;
  quartile?: string;
  quartileYear?: number;
  quartileSource: string;
  quartileSourceUrl: string;
  quartileCheckedAt: string;
};

const checkedAt = '2026-09-15';

export const journalMetricRecords: JournalMetricRecord[] = [
  {
    aliases: [
      'Energy for Sustainable Development',
      'Energy Sustainable Development/Energy for sustainable development',
    ],
    impactFactor: 5.2,
    impactFactorYear: 2025,
    impactSource: 'Comillas IIT 期刊目录（公开网页汇编）',
    impactSourceUrl:
      'https://www.iit.comillas.edu/publicacion/info_revista/en/988/Energy_for_Sustainable_Development',
    impactCheckedAt: checkedAt,
    quartile: 'JCR Q2',
    quartileYear: 2025,
    quartileSource: 'Comillas IIT 期刊目录（公开网页汇编）',
    quartileSourceUrl:
      'https://www.iit.comillas.edu/publicacion/info_revista/en/988/Energy_for_Sustainable_Development',
    quartileCheckedAt: checkedAt,
  },
  {
    aliases: ['Eurasian Geography and Economics'],
    impactFactor: 2.8,
    impactFactorYear: 2025,
    impactSource: 'Taylor & Francis 期刊指标页',
    impactSourceUrl:
      'https://www.tandfonline.com/journals/rege20/about-this-journal',
    impactCheckedAt: checkedAt,
    quartile: 'JCR Q1',
    quartileYear: 2025,
    quartileSource: 'Taylor & Francis 期刊指标页',
    quartileSourceUrl:
      'https://www.tandfonline.com/journals/rege20/about-this-journal',
    quartileCheckedAt: checkedAt,
  },
  {
    aliases: ['Frontiers in Political Science'],
    impactFactor: 2.0,
    impactFactorYear: 2025,
    impactSource: 'Frontiers 官方影响力页',
    impactSourceUrl: 'https://www.frontiersin.org/about/impact',
    impactCheckedAt: checkedAt,
    quartile: 'JCR Q2',
    quartileYear: 2025,
    quartileSource: 'Frontiers 官方影响力页',
    quartileSourceUrl: 'https://www.frontiersin.org/about/impact',
    quartileCheckedAt: checkedAt,
  },
  {
    aliases: ['Frontiers in Sustainable Food Systems'],
    impactFactor: 4.1,
    impactFactorYear: 2025,
    impactSource: 'Frontiers 官方影响力页',
    impactSourceUrl: 'https://www.frontiersin.org/about/impact',
    impactCheckedAt: checkedAt,
    quartile: 'JCR Q2',
    quartileYear: 2025,
    quartileSource: 'Frontiers 官方影响力页',
    quartileSourceUrl: 'https://www.frontiersin.org/about/impact',
    quartileCheckedAt: checkedAt,
  },
  {
    aliases: ['Open Economies Review'],
    impactFactor: 0.9,
    impactFactorYear: 2025,
    impactSource: 'Springer Nature 期刊主页',
    impactSourceUrl: 'https://link.springer.com/journal/11079',
    impactCheckedAt: checkedAt,
    quartile: 'Scopus Q2',
    quartileYear: 2025,
    quartileSource: 'Journal Indexes（公开 Scopus 汇编）',
    quartileSourceUrl:
      'https://journalindexes.com/open-economies-review-09237992/',
    quartileCheckedAt: checkedAt,
  },
  {
    aliases: ['Tapuya Latin American Science Technology and Society'],
    impactFactor: 0.9,
    impactFactorYear: 2025,
    impactSource: 'Taylor & Francis 期刊指标页',
    impactSourceUrl:
      'https://www.tandfonline.com/journals/ttap20/about-this-journal',
    impactCheckedAt: checkedAt,
    quartile: 'JCR Q2',
    quartileYear: 2025,
    quartileSource: 'Taylor & Francis 期刊指标页',
    quartileSourceUrl:
      'https://www.tandfonline.com/journals/ttap20/about-this-journal',
    quartileCheckedAt: checkedAt,
  },
  {
    aliases: ['Siber Journal of Transportation and Logistics'],
    impactSource: 'Siber Journal 官网（未见可信公开 JIF）',
    impactSourceUrl: 'https://research.e-siber.org/SJTL',
    impactCheckedAt: checkedAt,
    quartileSource: 'Siber Journal 官网（未见可信公开分区）',
    quartileSourceUrl: 'https://research.e-siber.org/SJTL',
    quartileCheckedAt: checkedAt,
  },
  {
    aliases: ['Zenodo (CERN European Organization for Nuclear Research)'],
    impactSource: 'Zenodo 官方说明（资料库，JIF 不适用）',
    impactSourceUrl: 'https://about.zenodo.org/',
    impactCheckedAt: checkedAt,
    quartileSource: 'Zenodo 官方说明（资料库，期刊分区不适用）',
    quartileSourceUrl: 'https://about.zenodo.org/',
    quartileCheckedAt: checkedAt,
  },
];

function normalizeJournal(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function findJournalMetrics(journal?: string | null) {
  if (!journal) return undefined;
  const normalized = normalizeJournal(journal);
  return journalMetricRecords.find((record) =>
    record.aliases.some((alias) => normalizeJournal(alias) === normalized),
  );
}

export async function applyKnownJournalMetrics(
  database: D1Database,
  paperId: string,
  journal?: string | null,
) {
  const metrics = findJournalMetrics(journal);
  if (!metrics) return false;

  await database
    .prepare(
      `UPDATE papers SET
        impact_factor = ?, impact_factor_year = ?, impact_metric_source = ?,
        impact_metric_source_url = ?, impact_metric_checked_at = ?,
        journal_quartile = ?, journal_quartile_year = ?,
        journal_quartile_source = ?, journal_quartile_source_url = ?,
        journal_quartile_checked_at = ?
      WHERE id = ?`,
    )
    .bind(
      metrics.impactFactor ?? null,
      metrics.impactFactorYear ?? null,
      metrics.impactSource,
      metrics.impactSourceUrl,
      metrics.impactCheckedAt,
      metrics.quartile ?? null,
      metrics.quartileYear ?? null,
      metrics.quartileSource,
      metrics.quartileSourceUrl,
      metrics.quartileCheckedAt,
      paperId,
    )
    .run();
  return true;
}
