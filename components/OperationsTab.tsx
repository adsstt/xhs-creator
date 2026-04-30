'use client'
import { useState } from 'react'
import {
  type MetricRecord,
  calculateSummary,
  topicBreakdown,
  generateInsights,
  importCSVRecords,
  metricSeries,
  SAMPLE_METRICS_CSV,
} from '@/lib/operations'

const STORAGE_KEY = 'xhs_metrics_records'

function loadRecords(): MetricRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

function saveRecords(records: MetricRecord[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

function SparklineSvg({ values, stroke = '#e8755c' }: { values: number[]; stroke?: string }) {
  let series = values.filter((v) => v != null).map(Number)
  if (!series.length) series = [0]
  if (series.length === 1) series = [series[0], series[0]]
  const W = 132, H = 42, PAD = 4
  const minV = Math.min(...series)
  const maxV = Math.max(...series)
  const span = Math.max(maxV - minV, 1)
  const points = series.map((v, i) => ({
    x: PAD + (W - PAD * 2) * i / (series.length - 1),
    y: H - PAD - ((v - minV) / span) * (H - PAD * 2),
  }))
  const line = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const last = points[points.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="metric-sparkline" aria-hidden="true" style={{ width: '100%', height: 42 }}>
      <polyline points={line} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 4.5 : 3.4} fill="#fffdf8" stroke={stroke} strokeWidth="2.4" />
      ))}
      <circle cx={last.x} cy={last.y} r="2.1" fill={stroke} />
    </svg>
  )
}

const today = new Date()
const currentYear = today.getFullYear()
const YEARS = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i)
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

export default function OperationsTab() {
  const [records, setRecords] = useState<MetricRecord[]>(() => loadRecords())
  const [activeDataTab, setActiveDataTab] = useState<'topics' | 'recent'>('topics')
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null)
  const [form, setForm] = useState({
    title: '', topic: '未分类', views: 0, likes: 0, favorites: 0, comments: 0,
    year: currentYear, month: today.getMonth() + 1, day: today.getDate(),
  })
  const [importSuccess, setImportSuccess] = useState('')

  const summary = calculateSummary(records)
  const insights = generateInsights(records)
  const topics = topicBreakdown(records)

  function update(records: MetricRecord[]) {
    setRecords(records)
    saveRecords(records)
    setPendingDeleteIndex(null)
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    const padded = `${form.year}-${String(form.month).padStart(2, '0')}-${String(form.day).padStart(2, '0')}`
    const rec: MetricRecord = {
      title: form.title || '未命名笔记',
      publish_date: padded,
      topic: form.topic || '未分类',
      views: form.views, likes: form.likes, favorites: form.favorites, comments: form.comments,
    }
    const next = [...records, rec]
    update(next)
    setForm({ title: '', topic: '未分类', views: 0, likes: 0, favorites: 0, comments: 0, year: currentYear, month: today.getMonth() + 1, day: today.getDate() })
  }

  function handleCSVFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const imported = importCSVRecords(text)
      const next = [...records, ...imported]
      update(next)
      setImportSuccess(`已导入 ${imported.length} 条数据。`)
      setTimeout(() => setImportSuccess(''), 3000)
    }
    reader.readAsText(file, 'utf-8')
  }

  function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    handleCSVFile(e.target.files?.[0])
    e.target.value = ''
  }

  function handleDeleteRecord(index: number) {
    if (pendingDeleteIndex !== index) {
      setPendingDeleteIndex(index)
      return
    }
    update(records.filter((_, i) => i !== index))
  }

  const metricDefs = [
    { label: '笔记数', value: summary.notes, series: metricSeries(records, 'views'), color: '#e8755c' },
    { label: '总曝光', value: summary.views, series: metricSeries(records, 'views'), color: '#e8755c' },
    { label: '总点赞', value: summary.likes, series: metricSeries(records, 'likes'), color: '#88b7c9' },
    { label: '总收藏', value: summary.favorites, series: metricSeries(records, 'favorites'), color: '#8fb69b' },
    { label: '互动率', value: `${summary.engagement_rate}%`, series: metricSeries(records, 'engagement_rate'), color: '#f1b854' },
  ]

  const maxDays = new Date(form.year, form.month, 0).getDate()

  return (
    <div className="ops-shell">
      <div>
        <div className="ops-head">
          <h2>运营数据</h2>
          <p>集中查看关键指标、录入数据并生成复盘建议，快速看清最近表现，推进下一轮优化。</p>
        </div>
        <div className="metric-strip">
          {metricDefs.map(({ label, value, series, color }) => (
            <div key={label} className="metric">
              <span>{label}</span>
              <b>{value}</b>
              <SparklineSvg values={series} stroke={color} />
            </div>
          ))}
        </div>
      </div>

      {/* Entry form */}
      <div className="section-card">
        <div className="ops-entry-head">
          <div>
            <h3>数据录入与导入</h3>
            <p>手动补录单条笔记，也可以批量导入历史 CSV 数据。</p>
          </div>
        </div>
        <form className="ops-entry-form" onSubmit={handleFormSubmit}>
          <div className="ops-entry-main">
            <div className="form-group">
              <label>标题</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="笔记标题" />
            </div>
            <div className="form-group">
              <label>内容方向</label>
              <input type="text" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
            </div>
          </div>

          <div className="metric-input-grid">
            <label className="metric-input"><span>曝光</span><input type="number" min={0} value={form.views} onChange={(e) => setForm({ ...form, views: +e.target.value })} /></label>
            <label className="metric-input"><span>点赞</span><input type="number" min={0} value={form.likes} onChange={(e) => setForm({ ...form, likes: +e.target.value })} /></label>
            <label className="metric-input"><span>收藏</span><input type="number" min={0} value={form.favorites} onChange={(e) => setForm({ ...form, favorites: +e.target.value })} /></label>
            <label className="metric-input"><span>评论</span><input type="number" min={0} value={form.comments} onChange={(e) => setForm({ ...form, comments: +e.target.value })} /></label>
          </div>

          <div className="ops-form-footer">
            <div className="inline-date-field">
              <span>发布日期：</span>
              <select value={form.year} onChange={(e) => setForm({ ...form, year: +e.target.value })}>
                {YEARS.map((y) => <option key={y}>{y}</option>)}
              </select>
              <span>年</span>
              <select value={form.month} onChange={(e) => setForm({ ...form, month: +e.target.value })}>
                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <span>月</span>
              <select value={Math.min(form.day, maxDays)} onChange={(e) => setForm({ ...form, day: +e.target.value })}>
                {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <span>日</span>
            </div>
            <button type="submit" className="btn-primary ops-save-btn">保存并刷新看板</button>
          </div>
        </form>

        <div className="csv-import-panel">
          <div>
            <h4>批量导入 CSV</h4>
            <p>适合一次性补充多条历史数据。</p>
          </div>
          <a
            className="btn-download"
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(SAMPLE_METRICS_CSV)}`}
            download="小红书运营数据模板.csv"
          >下载 CSV 示例模板</a>
          <label
            className="file-upload-label csv-dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              handleCSVFile(e.dataTransfer.files?.[0])
            }}
          >
            <input type="file" accept=".csv" onChange={handleCSVImport} style={{ display: 'none' }} />
            点击或拖拽 CSV 文件至此处导入
          </label>
        </div>
        {importSuccess && <div className="alert-info" style={{ marginTop: 8 }}>{importSuccess}</div>}
      </div>

      {/* Data tables */}
      <div className="section-card">
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button className={`tab-btn${activeDataTab === 'topics' ? ' active' : ''}`} onClick={() => setActiveDataTab('topics')}>方向表现</button>
          <button className={`tab-btn${activeDataTab === 'recent' ? ' active' : ''}`} onClick={() => setActiveDataTab('recent')}>近期数据</button>
        </div>
        {activeDataTab === 'topics' && (
          <div className="data-table-wrap">
            <table>
              <thead>
                <tr><th>方向</th><th>笔记数</th><th>总曝光</th><th>总点赞</th><th>总收藏</th><th>总评论</th><th>互动率</th></tr>
              </thead>
              <tbody>
                {topics.map((t) => (
                  <tr key={t.topic}>
                    <td>{t.topic}</td><td>{t.notes}</td><td>{t.views}</td><td>{t.likes}</td><td>{t.favorites}</td><td>{t.comments}</td><td>{t.engagement_rate}%</td>
                  </tr>
                ))}
                {!topics.length && <tr><td colSpan={7} style={{ color: 'var(--muted)', textAlign: 'center', padding: 20 }}>暂无数据</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {activeDataTab === 'recent' && (
          <div className="data-table-wrap">
            <table>
              <thead>
                <tr><th>标题</th><th>日期</th><th>方向</th><th>曝光</th><th>点赞</th><th>收藏</th><th>评论</th><th>操作</th></tr>
              </thead>
              <tbody>
                {records.slice(-20).reverse().map((r, i) => (
                  <tr key={`${r.publish_date}-${r.title}-${records.length - 1 - i}`}>
                    <td>{r.title}</td><td>{r.publish_date}</td><td>{r.topic}</td><td>{r.views}</td><td>{r.likes}</td><td>{r.favorites}</td><td>{r.comments}</td>
                    <td>
                      <button
                        type="button"
                        className={`table-delete-btn${pendingDeleteIndex === records.length - 1 - i ? ' confirming' : ''}`}
                        onClick={() => handleDeleteRecord(records.length - 1 - i)}
                      >
                        {pendingDeleteIndex === records.length - 1 - i ? '确认删除' : '删除'}
                      </button>
                    </td>
                  </tr>
                ))}
                {!records.length && <tr><td colSpan={8} style={{ color: 'var(--muted)', textAlign: 'center', padding: 20 }}>暂无数据</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="ops-insight-card">
        <div className="ops-insight-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="ops-insight-icon">AI</span>
            <h3>复盘建议</h3>
          </div>
          <span className="ops-subtle">基于当前记录自动提炼的下一步建议</span>
        </div>
        <ul className="ops-insight-list">
          {insights.map((insight, i) => <li key={i}>{insight}</li>)}
        </ul>
      </div>
    </div>
  )
}
