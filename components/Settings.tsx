'use client'
import { useState } from 'react'

export interface AppSettings {
  apiKey: string
  openaiImageApiKey: string
  aliyunImageApiKey: string
  enableThemeImage: boolean
  openaiImageModel: string
  openaiImageSize: string
  openaiImageQuality: string
  aliyunImageModel: string
  aliyunImageSize: string
}

interface Props {
  settings: AppSettings
  onChange: (s: AppSettings) => void
}

const SIZE_OPTIONS = ['1024x1024', '1024x1536', '1536x1024']
const QUALITY_OPTIONS = ['low', 'medium', 'high', 'auto']
const OPENAI_MODEL_OPTIONS = ['gpt-image-2', 'gpt-image-1', 'gpt-image-1-mini']
const ALIYUN_MODEL_OPTIONS = ['wanx2.1-t2i-turbo', 'wanx2.0-t2i-turbo', 'wan2.2-t2i-flash', 'qwen-image']

export default function Settings({ settings, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [confirmedField, setConfirmedField] = useState('')
  const set = (patch: Partial<AppSettings>) => onChange({ ...settings, ...patch })

  function confirmInput(field: string) {
    setConfirmedField(field)
    window.setTimeout(() => setConfirmedField((current) => current === field ? '' : current), 1800)
  }

  function handleConfirmKey(e: React.KeyboardEvent<HTMLInputElement>, field: string) {
    if (e.key !== 'Enter') return
    e.currentTarget.blur()
    confirmInput(field)
  }

  return (
    <>
      <button className="settings-btn" onClick={() => setOpen(true)}>⚙ 设置</button>

      {open && <div className="settings-overlay open" onClick={() => setOpen(false)} />}

      <div className={`settings-sidebar${open ? ' open' : ''}`}>
        <div className="settings-rail-head">
          <button className="settings-close" onClick={() => setOpen(false)} aria-label="关闭设置">×</button>
          <span>设置</span>
          <small>连接与生图</small>
        </div>

        <div className="settings-group-title">文本生成</div>
        <div className="form-group">
          <label>DeepSeek API 密钥</label>
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) => set({ apiKey: e.target.value })}
            onBlur={() => confirmInput('apiKey')}
            onKeyDown={(e) => handleConfirmKey(e, 'apiKey')}
            placeholder="sk-..."
          />
          {confirmedField === 'apiKey' && <small className="settings-confirm-tip">已确认保存</small>}
        </div>

        <div className="settings-group-title">主题图片</div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={settings.enableThemeImage}
              onChange={(e) => set({ enableThemeImage: e.target.checked })}
              style={{ marginRight: 8 }}
            />
            启用主题生图（可选）
          </label>
        </div>

        {settings.enableThemeImage && (
          <>
            <p className="ops-subtle" style={{ marginBottom: 8 }}>Free-first：ChatGPT 网页版 → OpenAI API → 阿里万相</p>

            <span className="settings-provider">OpenAI API（付费）</span>
            <div className="form-group">
              <label>API 密钥</label>
              <input
                type="password"
                value={settings.openaiImageApiKey}
                onChange={(e) => set({ openaiImageApiKey: e.target.value })}
                onBlur={() => confirmInput('openaiImageApiKey')}
                onKeyDown={(e) => handleConfirmKey(e, 'openaiImageApiKey')}
                placeholder="sk-..."
              />
              {confirmedField === 'openaiImageApiKey' && <small className="settings-confirm-tip">已确认保存</small>}
            </div>
            <div className="form-group">
              <label>模型</label>
              <select value={settings.openaiImageModel} onChange={(e) => set({ openaiImageModel: e.target.value })}>
                {OPENAI_MODEL_OPTIONS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>图片尺寸</label>
              <select value={settings.openaiImageSize} onChange={(e) => set({ openaiImageSize: e.target.value })}>
                {SIZE_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>图片质量</label>
              <select value={settings.openaiImageQuality} onChange={(e) => set({ openaiImageQuality: e.target.value })}>
                {QUALITY_OPTIONS.map((q) => <option key={q}>{q}</option>)}
              </select>
            </div>

            <span className="settings-provider">阿里万相（付费备用）</span>
            <div className="form-group">
              <label>API 密钥（DashScope）</label>
              <input
                type="password"
                value={settings.aliyunImageApiKey}
                onChange={(e) => set({ aliyunImageApiKey: e.target.value })}
                onBlur={() => confirmInput('aliyunImageApiKey')}
                onKeyDown={(e) => handleConfirmKey(e, 'aliyunImageApiKey')}
                placeholder="sk-..."
              />
              {confirmedField === 'aliyunImageApiKey' && <small className="settings-confirm-tip">已确认保存</small>}
            </div>
            <div className="form-group">
              <label>模型</label>
              <select value={settings.aliyunImageModel} onChange={(e) => set({ aliyunImageModel: e.target.value })}>
                {ALIYUN_MODEL_OPTIONS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>图片尺寸</label>
              <select value={settings.aliyunImageSize} onChange={(e) => set({ aliyunImageSize: e.target.value })}>
                {SIZE_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </>
        )}
      </div>
    </>
  )
}
