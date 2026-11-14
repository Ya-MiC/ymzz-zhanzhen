export interface ZhanzhenApi {
  // 語錄
  listUtterances(limit: number, offset: number): Promise<{ items: Utterance[]; total: number }>
  ingest(items: IngestItem[]): Promise<{ accepted: number; rejected: number; errors: string[] }>
  // 標籤
  listTags(): Promise<{ id: number; name: string }[]>
  attachTag(utteranceId: string, tagId: number, origin: 'auto' | 'manual'): Promise<void>
  // 評分
  scoreUtterance(text: string): Promise<{ total: number; parts: ScoreParts }>
  // AI 注解（付費）
  annotate(ids: string[]): Promise<{ items: { id: string; tags: string[]; note: string }[] }>
  // 星雲
  nebulaLinks(utteranceId: string): Promise<{ utterance_id: string; ai_output_id: number; weight: number }[]>
  // 付費
  createOrder(amountFen: number): Promise<{ url: string; trade_no: string }>
  queryOrder(tradeNo: string): Promise<{ status: string }>
  consumeEntitlement(): Promise<boolean>
}

export interface Utterance {
  id: string
  text: string
  created_at: string
  source_platform?: string
  source_tool?: string
  session_id?: string
  message_id?: string
  project_id?: string
  score_total?: number
  score_parts?: string
  text_sha256: string
}

export interface IngestItem {
  text: string
  source_platform?: string
  source_tool?: string
  session_id?: string
  message_id?: string
  project_id?: string
  created_at?: string
}

export interface ScoreParts {
  specificity: number
  recurrence: number
  actionability: number
  novelty: number
}
