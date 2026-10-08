export type EvidenceReference = {
  id: string;
  page: string;
  pageIndex: number;
  summary: string;
};

export type Indicator = {
  name: string;
  definition: string;
  evidence: EvidenceReference;
};

export type Paper = {
  id: string;
  title: string;
  titleZh: string;
  authors: string[];
  journal: string;
  impactFactor?: number;
  impactFactorYear?: number;
  impactMetricSource?: string;
  impactMetricSourceUrl?: string;
  impactMetricCheckedAt?: string;
  journalQuartile?: string;
  journalQuartileYear?: number;
  journalQuartileSource?: string;
  journalQuartileSourceUrl?: string;
  journalQuartileCheckedAt?: string;
  date: string;
  score: number;
  source: string;
  indexes: string[];
  kind: '研究论文' | '综述' | '理论论文';
  topic: string;
  abstractOriginal: string;
  abstractZh: string;
  researchMethod: string;
  dataSources: string;
  coreConclusion: string;
  extensibleQuestions: string[];
  doi?: string;
  officialUrl?: string;
  readingMinutes: number;
  recommendationReasons: string[];
  indicators: Indicator[];
  isNew?: boolean;
  isPlaceholder?: boolean;
};

export const papers: Paper[] = [
  {
    id: 'weaponized-interdependence',
    title:
      'Weaponized Interdependence: How Global Economic Networks Shape State Coercion',
    titleZh: '武器化相互依赖：全球经济网络如何塑造国家强制力',
    authors: ['Henry Farrell', 'Abraham L. Newman'],
    journal: 'International Security',
    date: '2019-07-01',
    score: 94,
    source: 'OpenAlex',
    indexes: ['SSCI'],
    kind: '理论论文',
    topic: '地缘政治',
    abstractOriginal:
      '当前演示记录仅导入了结构化元数据。接入合法摘要或 PDF 后，这里将逐字保留来源提供的英文 Original Abstract。',
    abstractZh:
      '文章解释了拥有全球网络枢纽管辖权的国家，如何利用信息可见性和流量控制对其他行为体施加强制。',
    researchMethod: `研究设计：论文采用机制导向的理论建构，并以关键基础设施案例说明网络结构如何转化为国家权力。它不是用大样本检验平均效应，而是识别“枢纽位置—信息或访问控制—强制结果”的因果链条。

案例与比较逻辑：作者选择跨境金融报文体系和互联网基础设施作为具有差异的关键案例，比较网络集中度、管辖权与国家干预能力。案例的作用是检验同一机制能否跨领域成立，而非代表所有全球网络。

概念操作化：网络中心性被转化为少数枢纽对信息流和交易流的集中程度；国家能力进一步区分为获取全景信息的“全景效应”和切断他者网络接入的“阻断效应”。研究者可据此观察节点集中度、法律管辖范围、数据可见性与实际制裁行为。

分析步骤：先描绘网络拓扑与枢纽，再确认枢纽受何种司法辖区控制，随后追踪政府如何调动企业或基础设施，最后考察监控、制裁或排除结果。

适用边界与延伸：该方法最适合研究高度集中、跨境依赖强且国家能够影响关键节点的网络。后续可加入网络中心性指标、事件数据和跨国案例，检验云计算、芯片、支付与海底电缆领域的外部有效性。`,
    dataSources:
      '公开制度材料、跨境金融与互联网基础设施案例、既有网络研究文献。',
    coreConclusion:
      '全球化网络并非天然分散权力；当网络高度集中且枢纽处于特定国家管辖之下时，相互依赖可被转化为监控与阻断能力。',
    extensibleQuestions: [
      '数字支付与云计算网络是否复制了相同的枢纽权力？',
      '中小国家可以通过哪些网络冗余策略降低脆弱性？',
      '网络武器化何时会加速制度碎片化？',
    ],
    doi: '10.1162/isec_a_00351',
    officialUrl:
      'https://direct.mit.edu/isec/article/44/1/42/12237/Weaponized-Interdependence-How-Global-Economic',
    readingMinutes: 11,
    recommendationReasons: [
      '匹配“地缘政治”与“国际政治经济”关键词组',
      '与关注主题“数字主权”形成直接概念连接',
    ],
    indicators: [
      {
        name: '网络中心性',
        definition: '关键交换与信息流是否集中经过少数枢纽节点。',
        evidence: {
          id: 'ev-wi-51',
          page: '51',
          pageIndex: 50,
          summary: '文章在该页将高度集中的网络拓扑与枢纽国家的结构性优势相连。',
        },
      },
      {
        name: '全景效应 / 阻断效应',
        definition: '分别表示获取流量信息与切断网络访问的能力。',
        evidence: {
          id: 'ev-wi-55',
          page: '55–58',
          pageIndex: 54,
          summary: '作者在此区分信息优势与网络排除两种强制机制。',
        },
      },
    ],
    isNew: true,
  },
  {
    id: 'global-ir',
    title: 'Global International Relations (IR) and Regional Worlds',
    titleZh: '全球国际关系学与区域世界：国际研究的新议程',
    authors: ['Amitav Acharya'],
    journal: 'International Studies Quarterly',
    date: '2014-12-01',
    score: 91,
    source: 'OpenAlex',
    indexes: ['SSCI'],
    kind: '理论论文',
    topic: '区域国别',
    abstractOriginal:
      '当前演示记录未保存出版方摘要全文。正式导入时将显示来源提供的英文 Original Abstract，并单独保存中文翻译。',
    abstractZh:
      '文章提出全球国际关系学议程，主张在保持共同学科框架的同时，承认区域经验、思想传统和多元主体的理论贡献。',
    researchMethod: `研究设计：论文属于规范性与概念性理论研究，通过学科史回顾、概念综合和议程建构提出“全球国际关系学”。重点不在估计因果效应，而在诊断既有知识结构的偏差并建立可供后续经验研究使用的分析框架。

材料选择：作者综合国际关系理论史、区域主义、后殖民研究和不同地区的思想传统，以典型论述和学科发展轨迹说明主流理论的中心化问题。

概念建构：文章将多元普遍主义、世界历史、区域世界与区域能动性组织成相互关联的概念体系。阅读时应区分作者的描述性判断、规范性主张和可经验检验的命题。

分析步骤：先识别学科排除机制，再比较不同区域知识的进入路径，随后提出六项全球 IR 原则，并讨论它们如何修正既有理论。

适用边界与延伸：这类方法擅长建立研究议程，但不能单独证明各原则的经验效力。可进一步用课程大纲、引文网络、期刊作者地域、概念传播路径和跨语种文献计量，把“知识多元性”与“区域能动性”转化为可比较指标。`,
    dataSources:
      '国际关系理论史、区域主义与后殖民研究文献、不同地区的知识传统。',
    coreConclusion:
      '全球国际关系学不是用一个新的普遍主义替代旧中心，而是通过多元普遍主义、世界历史与区域能动性重构学科。',
    extensibleQuestions: [
      '如何把“区域能动性”转化为可比较的经验指标？',
      '不同语种知识进入国际关系主流理论的路径有何差异？',
      '全球 IR 是否会形成新的中心—边缘结构？',
    ],
    doi: '10.1111/isqu.12171',
    officialUrl: 'https://academic.oup.com/isq/article/58/4/647/1794367',
    readingMinutes: 8,
    recommendationReasons: [
      '匹配“区域国别”与“域外知识体系”关键词组',
      '是知识网络中“区域能动性”节点的高连接论文',
    ],
    indicators: [
      {
        name: '区域能动性',
        definition:
          '区域主体生产规则、制度与知识，而非只是接受外部秩序的能力。',
        evidence: {
          id: 'ev-gir-652',
          page: '652',
          pageIndex: 5,
          summary: '该页将区域世界视为构成全球秩序的主动单元。',
        },
      },
      {
        name: '知识多元性',
        definition: '理论来源、历史经验和研究主体的地域与文明分布。',
        evidence: {
          id: 'ev-gir-655',
          page: '655',
          pageIndex: 8,
          summary: '文章在此阐明多元普遍主义与本土知识之间的关系。',
        },
      },
    ],
    isNew: true,
  },
  {
    id: 'essence-of-hedging',
    title:
      "The Essence of Hedging: Malaysia and Singapore's Response to a Rising China",
    titleZh: '对冲的本质：马来西亚与新加坡对中国崛起的回应',
    authors: ['Cheng-Chwee Kuik'],
    journal: 'Contemporary Southeast Asia',
    date: '2008-08-01',
    score: 86,
    source: 'OpenAlex',
    indexes: ['SSCI'],
    kind: '研究论文',
    topic: '区域国别',
    abstractOriginal:
      '来源摘要尚未写入演示记录；正式同步时优先从合法元数据源读取，PDF 抽取内容则绑定版本与页码。',
    abstractZh:
      '论文比较马来西亚和新加坡的政策组合，以解释小国为何同时采取收益最大化与风险应对策略。',
    researchMethod: `研究设计：论文采用马来西亚—新加坡双案例比较，并结合过程追踪解释小国对华政策为何形成不同的对冲组合。比较重点是相似外部压力下的政策差异，因此接近“最相似案例”逻辑。

案例与时间范围：两国都位于东南亚、经济上依赖区域市场且面对中国崛起，但国家能力、国内合法性需求与安全认知不同。作者沿关键政策阶段追踪经济接触、安全合作与风险保险措施。

概念操作化：对冲不是含混或不选边，而是同时出现收益最大化、有限制衡与风险应对。研究者可将高层访问、贸易投资安排、军事合作、第三方安全关系与公开立场编码为可观察指标。

分析步骤：先界定对冲及替代策略，再为每个案例建立政策组合时间线，随后把政策变化与国内合法性、威胁感知和外部不确定性相连，最后进行跨案例比较。

适用边界与延伸：双案例能揭示机制，却难以估计各因素的独立效应。后续可扩展到更多东南亚国家，建立“政策工具—强度—对象—时间”面板数据，并用危机事件检验对冲是否以及何时转化为选边。`,
    dataSources: '政策文件、领导人讲话、外交与安全合作记录，以及相关二手研究。',
    coreConclusion:
      '对冲不是中立或简单的平衡，而是由经济接触、有限制衡与风险保险组成的多向政策组合。',
    extensibleQuestions: [
      '对冲策略可以用哪些可观察指标区分于模糊政策？',
      '国内政权合法性如何影响对冲组合？',
      '危机时期的快速选边是否意味着对冲终止？',
    ],
    doi: '10.1355/CS30-2A',
    officialUrl: 'https://doi.org/10.1355/CS30-2A',
    readingMinutes: 10,
    recommendationReasons: [
      '与“东南亚”“战略自主”“大国竞争”同时匹配',
      '包含可操作化的对冲策略指标',
    ],
    indicators: [
      {
        name: '政策组合多样性',
        definition: '一国是否同时使用经济接触、有限制衡与风险保险工具。',
        evidence: {
          id: 'ev-hedge-166',
          page: '166–168',
          pageIndex: 7,
          summary: '论文在这几页给出对冲及其政策组成的操作性界定。',
        },
      },
      {
        name: '选边风险',
        definition: '完全依附任何一方可能带来的政治、安全与经济成本。',
        evidence: {
          id: 'ev-hedge-171',
          page: '171',
          pageIndex: 12,
          summary: '比较案例以选边成本解释政策组合差异。',
        },
      },
    ],
  },
  {
    id: 'cn-placeholder',
    title: '待导入的 CSSCI / AMI 文献示例',
    titleZh: 'CSSCI 与 AMI 期刊文献将以目录标签进入同一主表',
    authors: ['导入后显示作者'],
    journal: '待匹配中文期刊',
    date: '—',
    score: 80,
    source: 'CNKI',
    indexes: ['CSSCI', 'AMI'],
    kind: '研究论文',
    topic: '域外知识体系',
    abstractOriginal:
      '此条目用于展示结构，不代表真实论文。接入机构授权或合法导出文件后，这里显示原始摘要。',
    abstractZh: '导入后自动保存中文摘要或英文摘要的中文翻译。',
    researchMethod:
      '等待 DeepSeek 从摘要或合法导入的正文中抽取，并绑定证据页码。',
    dataSources: '等待抽取。',
    coreConclusion: '等待抽取。',
    extensibleQuestions: ['等待分析后生成，并允许研究者编辑。'],
    readingMinutes: 0,
    recommendationReasons: ['展示 CSSCI 与 AMI 目录标签的导入位置'],
    indicators: [],
    isPlaceholder: true,
  },
];

export const sourceStatus = [
  { name: 'OpenAlex', status: '已连接', tone: 'ready' },
  { name: 'Semantic Scholar', status: '已接入', tone: 'ready' },
  { name: 'SSRN', status: '元数据', tone: 'ready' },
  { name: 'SSCI / WoS', status: '待授权', tone: 'pending' },
  { name: '中国知网', status: '待授权', tone: 'pending' },
  { name: 'CSSCI', status: '2025–2026 目录标签', tone: 'ready' },
  { name: 'AMI', status: '2022 目录标签', tone: 'ready' },
] as const;
