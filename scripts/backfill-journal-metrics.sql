UPDATE papers SET
  impact_factor = 5.2,
  impact_factor_year = 2025,
  impact_metric_source = 'Comillas IIT 期刊目录（公开网页汇编）',
  impact_metric_source_url = 'https://www.iit.comillas.edu/publicacion/info_revista/en/988/Energy_for_Sustainable_Development',
  impact_metric_checked_at = '2026-09-15',
  journal_quartile = 'JCR Q2',
  journal_quartile_year = 2025,
  journal_quartile_source = 'Comillas IIT 期刊目录（公开网页汇编）',
  journal_quartile_source_url = 'https://www.iit.comillas.edu/publicacion/info_revista/en/988/Energy_for_Sustainable_Development',
  journal_quartile_checked_at = '2026-09-15'
WHERE journal IN (
  'Energy for Sustainable Development',
  'Energy Sustainable Development/Energy for sustainable development'
);

UPDATE papers SET
  impact_factor = 2.8,
  impact_factor_year = 2025,
  impact_metric_source = 'Taylor & Francis 期刊指标页',
  impact_metric_source_url = 'https://www.tandfonline.com/journals/rege20/about-this-journal',
  impact_metric_checked_at = '2026-09-15',
  journal_quartile = 'JCR Q1',
  journal_quartile_year = 2025,
  journal_quartile_source = 'Taylor & Francis 期刊指标页',
  journal_quartile_source_url = 'https://www.tandfonline.com/journals/rege20/about-this-journal',
  journal_quartile_checked_at = '2026-09-15'
WHERE journal = 'Eurasian Geography and Economics';

UPDATE papers SET
  impact_factor = 2.0,
  impact_factor_year = 2025,
  impact_metric_source = 'Frontiers 官方影响力页',
  impact_metric_source_url = 'https://www.frontiersin.org/about/impact',
  impact_metric_checked_at = '2026-09-15',
  journal_quartile = 'JCR Q2',
  journal_quartile_year = 2025,
  journal_quartile_source = 'Frontiers 官方影响力页',
  journal_quartile_source_url = 'https://www.frontiersin.org/about/impact',
  journal_quartile_checked_at = '2026-09-15'
WHERE journal = 'Frontiers in Political Science';

UPDATE papers SET
  impact_factor = 4.1,
  impact_factor_year = 2025,
  impact_metric_source = 'Frontiers 官方影响力页',
  impact_metric_source_url = 'https://www.frontiersin.org/about/impact',
  impact_metric_checked_at = '2026-09-15',
  journal_quartile = 'JCR Q2',
  journal_quartile_year = 2025,
  journal_quartile_source = 'Frontiers 官方影响力页',
  journal_quartile_source_url = 'https://www.frontiersin.org/about/impact',
  journal_quartile_checked_at = '2026-09-15'
WHERE journal = 'Frontiers in Sustainable Food Systems';

UPDATE papers SET
  impact_factor = 0.9,
  impact_factor_year = 2025,
  impact_metric_source = 'Springer Nature 期刊主页',
  impact_metric_source_url = 'https://link.springer.com/journal/11079',
  impact_metric_checked_at = '2026-09-15',
  journal_quartile = 'Scopus Q2',
  journal_quartile_year = 2025,
  journal_quartile_source = 'Journal Indexes（公开 Scopus 汇编）',
  journal_quartile_source_url = 'https://journalindexes.com/open-economies-review-09237992/',
  journal_quartile_checked_at = '2026-09-15'
WHERE journal = 'Open Economies Review';

UPDATE papers SET
  impact_factor = 0.9,
  impact_factor_year = 2025,
  impact_metric_source = 'Taylor & Francis 期刊指标页',
  impact_metric_source_url = 'https://www.tandfonline.com/journals/ttap20/about-this-journal',
  impact_metric_checked_at = '2026-09-15',
  journal_quartile = 'JCR Q2',
  journal_quartile_year = 2025,
  journal_quartile_source = 'Taylor & Francis 期刊指标页',
  journal_quartile_source_url = 'https://www.tandfonline.com/journals/ttap20/about-this-journal',
  journal_quartile_checked_at = '2026-09-15'
WHERE journal = 'Tapuya Latin American Science Technology and Society';

UPDATE papers SET
  impact_factor = NULL,
  impact_factor_year = NULL,
  impact_metric_source = 'Siber Journal 官网（未见可信公开 JIF）',
  impact_metric_source_url = 'https://research.e-siber.org/SJTL',
  impact_metric_checked_at = '2026-09-15',
  journal_quartile = NULL,
  journal_quartile_year = NULL,
  journal_quartile_source = 'Siber Journal 官网（未见可信公开分区）',
  journal_quartile_source_url = 'https://research.e-siber.org/SJTL',
  journal_quartile_checked_at = '2026-09-15'
WHERE journal = 'Siber Journal of Transportation and Logistics';

UPDATE papers SET
  impact_factor = NULL,
  impact_factor_year = NULL,
  impact_metric_source = 'Zenodo 官方说明（资料库，JIF 不适用）',
  impact_metric_source_url = 'https://about.zenodo.org/',
  impact_metric_checked_at = '2026-09-15',
  journal_quartile = NULL,
  journal_quartile_year = NULL,
  journal_quartile_source = 'Zenodo 官方说明（资料库，期刊分区不适用）',
  journal_quartile_source_url = 'https://about.zenodo.org/',
  journal_quartile_checked_at = '2026-09-15'
WHERE journal = 'Zenodo (CERN European Organization for Nuclear Research)';
