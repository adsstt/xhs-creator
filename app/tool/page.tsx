'use client'
import { useState } from 'react'
import Link from 'next/link'
import Settings, { type AppSettings } from '@/components/Settings'
import CreatorTab from '@/components/CreatorTab'
import OperationsTab from '@/components/OperationsTab'

const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  openaiImageApiKey: '',
  aliyunImageApiKey: '',
  enableThemeImage: false,
  openaiImageModel: 'gpt-image-2',
  openaiImageSize: '1024x1024',
  openaiImageQuality: 'medium',
  aliyunImageModel: 'wanx2.1-t2i-turbo',
  aliyunImageSize: '1024x1024',
}

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem('xhs_settings')
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch { return DEFAULT_SETTINGS }
}

export default function ToolPage() {
  const [tab, setTab] = useState<'creator' | 'ops'>('creator')
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())

  function handleSettingsChange(s: AppSettings) {
    setSettings(s)
    if (typeof window !== 'undefined') {
      localStorage.setItem('xhs_settings', JSON.stringify(s))
    }
  }

  return (
    <div className="tool-page">
      <Settings settings={settings} onChange={handleSettingsChange} />

      <div className="tool-shell">
        <div className="tool-shell-copy">
          <div className="tool-shell-kicker">Creator Workspace</div>
          <h1>小红书图文创作与运营助手</h1>
          <p>把主题、图片和语气整理成可发布的 A/B 图文方案，再用轻量数据看板复盘下一次灵感。</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <Link href="/" className="back-btn">← 返回首页</Link>
      </div>

      <div className="tabs-list">
        <button className={`tab-btn${tab === 'creator' ? ' active' : ''}`} onClick={() => setTab('creator')}>创作发布包</button>
        <button className={`tab-btn${tab === 'ops' ? ' active' : ''}`} onClick={() => setTab('ops')}>运营数据复盘</button>
      </div>

      {tab === 'creator' && <CreatorTab settings={settings} />}
      {tab === 'ops' && <OperationsTab />}
    </div>
  )
}
