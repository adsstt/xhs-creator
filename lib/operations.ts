// Ported from legacy_streamlit/operations.py

export interface MetricRecord {
  title: string
  publish_date: string
  topic: string
  views: number
  likes: number
  favorites: number
  comments: number
}

export interface Summary {
  notes: number
  views: number
  likes: number
  favorites: number
  comments: number
  engagement_rate: number
  avg_views: number
  top_records: MetricRecord[]
}

export interface TopicBreakdown {
  topic: string
  notes: number
  views: number
  likes: number
  favorites: number
  comments: number
  engagement_rate: number
}

function parseIntSafe(value: unknown): number {
  const n = parseInt(String(value ?? 0), 10)
  return isNaN(n) ? 0 : Math.max(0, n)
}

export function normalizeRecord(record: Partial<MetricRecord>): MetricRecord {
  return {
    title: String(record.title ?? '未命名笔记').trim(),
    publish_date: String(record.publish_date ?? new Date().toISOString().split('T')[0]).trim(),
    topic: String(record.topic ?? '未分类').trim(),
    views: parseIntSafe(record.views),
    likes: parseIntSafe(record.likes),
    favorites: parseIntSafe(record.favorites),
    comments: parseIntSafe(record.comments),
  }
}

export function calculateSummary(records: MetricRecord[]): Summary {
  const normalized = records.map(normalizeRecord)
  const totals = {
    notes: normalized.length,
    views: normalized.reduce((s, r) => s + r.views, 0),
    likes: normalized.reduce((s, r) => s + r.likes, 0),
    favorites: normalized.reduce((s, r) => s + r.favorites, 0),
    comments: normalized.reduce((s, r) => s + r.comments, 0),
  }
  const engagementActions = totals.likes + totals.favorites + totals.comments
  const engagement_rate = totals.views > 0 ? Math.round((engagementActions / totals.views) * 10000) / 100 : 0
  const avg_views = totals.notes > 0 ? Math.round((totals.views / totals.notes) * 10) / 10 : 0
  const top_records = [...normalized]
    .sort((a, b) => {
      const scoreA = a.likes + a.favorites * 1.2 + a.comments * 1.5
      const scoreB = b.likes + b.favorites * 1.2 + b.comments * 1.5
      return scoreB - scoreA || b.views - a.views
    })
    .slice(0, 5)
  return { ...totals, engagement_rate, avg_views, top_records }
}

export function topicBreakdown(records: MetricRecord[]): TopicBreakdown[] {
  const buckets: Record<string, TopicBreakdown> = {}
  for (const record of records.map(normalizeRecord)) {
    if (!buckets[record.topic]) {
      buckets[record.topic] = { topic: record.topic, notes: 0, views: 0, likes: 0, favorites: 0, comments: 0, engagement_rate: 0 }
    }
    const b = buckets[record.topic]
    b.notes++
    b.views += record.views
    b.likes += record.likes
    b.favorites += record.favorites
    b.comments += record.comments
  }
  for (const b of Object.values(buckets)) {
    const actions = b.likes + b.favorites + b.comments
    b.engagement_rate = b.views > 0 ? Math.round((actions / b.views) * 10000) / 100 : 0
  }
  return Object.values(buckets).sort((a, b) => b.engagement_rate - a.engagement_rate || b.views - a.views)
}

export function generateInsights(records: MetricRecord[]): string[] {
  const summary = calculateSummary(records)
  if (!summary.notes) {
    return [
      '先录入 3-5 条历史笔记数据，系统就能开始识别更值得复用的选题和标题方向。',
      '建议至少记录曝光、点赞、收藏、评论四项，后续复盘会更稳定。',
    ]
  }
  const insights: string[] = []
  const topics = topicBreakdown(records)
  if (topics.length) {
    const best = topics[0]
    insights.push(`当前表现最好的内容方向是「${best.topic}」，互动率约 ${best.engagement_rate}%，可以优先复用它的选题结构。`)
  }
  if (summary.top_records.length) {
    const top = summary.top_records[0]
    insights.push(`最高价值笔记是「${top.title}」，建议拆解它的标题钩子、封面字和正文开头。`)
  }
  if (summary.engagement_rate < 3) {
    insights.push('整体互动率偏低，下一批内容建议强化收藏理由，例如清单、步骤、避坑和可复用模板。')
  } else {
    insights.push('整体互动率已有基础，下一步可以做 A/B 标题测试，保留同选题不同钩子的表现差异。')
  }
  return insights
}

export function importCSVRecords(csvText: string): MetricRecord[] {
  const lines = csvText.split('\n').filter(Boolean)
  if (!lines.length) return []
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^\uFEFF/, ''))
  const records: MetricRecord[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = (cols[idx] ?? '').trim() })
    records.push(normalizeRecord({
      title: row.title ?? row['标题'] ?? row['笔记标题'],
      publish_date: row.publish_date ?? row['发布日期'] ?? row['日期'],
      topic: row.topic ?? row['赛道'] ?? row['分类'],
      views: parseIntSafe(row.views ?? row['曝光'] ?? row['浏览']),
      likes: parseIntSafe(row.likes ?? row['点赞']),
      favorites: parseIntSafe(row.favorites ?? row['收藏']),
      comments: parseIntSafe(row.comments ?? row['评论']),
    }))
  }
  return records
}

export function metricSeries(records: MetricRecord[], field: string): number[] {
  const last7 = records.slice(-7)
  if (field === 'engagement_rate') {
    return last7.map((r) => {
      const actions = r.likes + r.favorites + r.comments
      return r.views > 0 ? Math.round((actions / r.views) * 10000) / 100 : 0
    })
  }
  return last7.map((r) => Number((r as unknown as Record<string, unknown>)[field] ?? 0))
}

export const SAMPLE_METRICS_CSV = `标题,日期,分类,曝光,点赞,收藏,评论
春日咖啡店探店,2026-04-01,探店,12800,532,318,47
通勤穿搭分享,2026-04-03,穿搭,9600,418,205,29
周末居家收纳,2026-04-06,家居,7400,286,173,18
`
