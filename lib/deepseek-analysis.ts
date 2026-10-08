export type PaperAnalysisInput = {
  title: string;
  authors: string[];
  journal: string | null;
  publicationDate: string | null;
  abstractOriginal: string;
};

export type PaperAnalysis = {
  titleZh: string;
  abstractZh: string;
  researchMethod: string;
  dataSources: string;
  coreConclusion: string;
  extensibleQuestions: string[];
  innovations: string;
  limitations: string;
  futureDirections: string;
};

type DeepSeekResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

function requireString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`DeepSeek 返回的 ${field} 不完整。`);
  }
  return value.trim();
}

function parseAnalysis(content: string): PaperAnalysis {
  const parsed = JSON.parse(content) as Record<string, unknown>;
  const questions = Array.isArray(parsed.extensibleQuestions)
    ? parsed.extensibleQuestions
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 5)
    : [];

  return {
    titleZh: requireString(parsed.titleZh, '中文标题'),
    abstractZh: requireString(parsed.abstractZh, '中文摘要'),
    researchMethod: requireString(parsed.researchMethod, '研究方法'),
    dataSources: requireString(parsed.dataSources, '数据来源'),
    coreConclusion: requireString(parsed.coreConclusion, '核心结论'),
    extensibleQuestions: questions,
    innovations: requireString(parsed.innovations, '创新点'),
    limitations: requireString(parsed.limitations, '局限'),
    futureDirections: requireString(parsed.futureDirections, '未来方向'),
  };
}

export async function analyzePaperWithDeepSeek(
  paper: PaperAnalysisInput,
  options: {
    apiKey: string;
    baseUrl?: string;
    model?: string;
  },
) {
  const baseUrl = (options.baseUrl ?? 'https://api.deepseek.com').replace(
    /\/$/,
    '',
  );
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model ?? 'deepseek-flash',
      thinking: { type: 'disabled' },
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 3200,
      messages: [
        {
          role: 'system',
          content:
            '你是区域国别、国际政治、地缘政治、国际关系与全球治理研究助理。只能依据用户提供的文献元数据和摘要分析，不得补造样本、变量、方法、数据或结论。证据不足时必须明确写“摘要未说明”，并给出研究者阅读正文时应核查的项目。输出必须是 JSON。',
        },
        {
          role: 'user',
          content: `请将下列论文转换成结构化中文阅读卡片。

标题：${paper.title}
作者：${paper.authors.join(', ') || '未提供'}
期刊：${paper.journal ?? '未提供'}
发表时间：${paper.publicationDate ?? '未提供'}
摘要：${paper.abstractOriginal}

返回以下 JSON 字段：titleZh、abstractZh、researchMethod、dataSources、coreConclusion、extensibleQuestions、innovations、limitations、futureDirections。

其中 researchMethod 是重点，写成 350–650 字、详略得当的研究方法说明，必须使用以下六个小标题并以换行分隔：
1. 研究设计
2. 案例/样本与比较逻辑
3. 核心概念、变量或指标的操作化
4. 分析步骤
5. 识别局限与适用边界
6. 可借鉴的延伸方法

它不仅要概括作者做了什么，还要解释为什么这样设计、研究者如何复用、正文中还需核查什么。若摘要没有方法信息，不能猜测，应指出缺口，并根据论文问题给出“可采用但并非原文已采用”的延伸方案。extensibleQuestions 返回 3–5 个具体问题的字符串数组。`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `DeepSeek 分析失败 (${response.status}): ${(await response.text()).slice(0, 240)}`,
    );
  }

  const payload = (await response.json()) as DeepSeekResponse;
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error('DeepSeek 未返回分析内容。');
  return parseAnalysis(content);
}
