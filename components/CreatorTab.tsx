'use client'
import { useState, useRef } from 'react'
import { parsePublishPackages, allPackagesToText, type PublishPackage, type ParseResult } from '@/lib/content_planner'
import { buildOpenAIImagePrompt } from '@/lib/image_services'
import type { AppSettings } from './Settings'

const DEFAULT_HOT_TOPICS = ['穿搭', '美妆', '旅行', '美食', '健身', '职场', '情感', '家居']

interface Props { settings: AppSettings }

function PackageCard({ pkg }: { pkg: PublishPackage }) {
  return (
    <div className="package">
      <h3>{pkg.name}</h3>
      {pkg.title_options.length > 0 && (
        <>
          <div className="package-section-title">标题纸条</div>
          {pkg.title_options.map((t, i) => (
            <span key={i} className="title-slip">{i + 1}. {t}</span>
          ))}
        </>
      )}
      {pkg.body && (
        <>
          <div className="package-section-title">正文</div>
          <div className="copy-sheet">{pkg.body}</div>
        </>
      )}
      {pkg.tags.length > 0 && (
        <>
          <div className="package-section-title">标签印章</div>
          <div className="stamp-row">
            {pkg.tags.map((tag, i) => <span key={i} className="stamp">{tag}</span>)}
          </div>
        </>
      )}
      {pkg.cover_text && (
        <>
          <div className="package-section-title">封面字</div>
          <p style={{ margin: 0, color: '#4e423b' }}>{pkg.cover_text}</p>
        </>
      )}
      {(['image_order', 'retouching_tips', 'publish_checklist'] as const).map((key) => {
        const labels: Record<string, string> = { image_order: '配图顺序建议', retouching_tips: '修图/风格化建议', publish_checklist: '发布检查清单' }
        const arr = pkg[key]
        if (!arr.length) return null
        return (
          <div key={key}>
            <div className="package-section-title">{labels[key]}</div>
            <ul className="craft-list">{arr.map((item, i) => <li key={i}>{item}</li>)}</ul>
          </div>
        )
      })}
    </div>
  )
}

export default function CreatorTab({ settings }: Props) {
  const [prompt, setPrompt] = useState('')
  const [selectedTopic, setSelectedTopic] = useState(DEFAULT_HOT_TOPICS[0])
  const [customTopic, setCustomTopic] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ParseResult | null>(null)
  const [latestPrompt, setLatestPrompt] = useState('')
  const [imagePrompt, setImagePrompt] = useState('')
  const [generatedImageB64, setGeneratedImageB64] = useState('')
  const [imageProvider, setImageProvider] = useState('')
  const [imageLoading, setImageLoading] = useState(false)
  const [imageError, setImageError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const effectiveTopic = customTopic || selectedTopic
  const canGenerate = !!settings.apiKey && !!prompt.trim()

  function handleFiles(files: FileList | null) {
    if (!files) return
    const arr = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 9)
    previewUrls.forEach((url) => URL.revokeObjectURL(url))
    setUploadedFiles(arr)
    setPreviewUrls(arr.map(f => URL.createObjectURL(f)))
  }

  function handleRemoveFile(index: number) {
    URL.revokeObjectURL(previewUrls[index])
    const nextFiles = uploadedFiles.filter((_, i) => i !== index)
    const nextUrls = previewUrls.filter((_, i) => i !== index)
    setUploadedFiles(nextFiles)
    setPreviewUrls(nextUrls)
    if (!nextFiles.length && fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleGenerate() {
    if (!canGenerate) return
    setLoading(true)
    setError('')
    setResult(null)
    setImagePrompt('')
    setGeneratedImageB64('')
    setImageProvider('')

    let finalPrompt = prompt.trim()
    if (effectiveTopic && effectiveTopic !== '自定义输入' && !finalPrompt.includes(effectiveTopic)) {
      finalPrompt += `\n\n内容方向：${effectiveTopic}`
    }
    setLatestPrompt(finalPrompt)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt, imageCount: uploadedFiles.length, apiKey: settings.apiKey }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      const parsed = parsePublishPackages(data.content)
      setResult(parsed)
      if (settings.enableThemeImage && parsed.packages.length) {
        setImagePrompt(buildOpenAIImagePrompt(finalPrompt, parsed.packages[0]))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  async function handleImageGen(provider: 'openai' | 'aliyun') {
    if (!imagePrompt) return
    setImageLoading(true)
    setImageError('')
    setGeneratedImageB64('')
    try {
      const endpoint = provider === 'openai' ? '/api/images/openai' : '/api/images/aliyun'
      const body = provider === 'openai'
        ? { prompt: imagePrompt, model: settings.openaiImageModel, size: settings.openaiImageSize, quality: settings.openaiImageQuality, apiKey: settings.openaiImageApiKey }
        : { prompt: imagePrompt, model: settings.aliyunImageModel, size: settings.aliyunImageSize, apiKey: settings.aliyunImageApiKey }
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (data.error) { setImageError(data.error); return }
      setGeneratedImageB64(`data:image/png;base64,${data.b64}`)
      setImageProvider(provider === 'openai' ? 'OpenAI API' : '阿里万相')
    } catch (e) {
      setImageError(e instanceof Error ? e.message : '生图失败')
    } finally {
      setImageLoading(false)
    }
  }

  function handleCopyImagePrompt() {
    navigator.clipboard.writeText(imagePrompt).catch(() => {
      const ta = document.createElement('textarea')
      ta.value = imagePrompt
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    })
  }

  const copyText = result ? allPackagesToText(result.packages, result.raw) : ''

  return (
    <div>
      <div className="craft-flow">
        {[['素材', '上传参考图或只输入主题。图片会用于配图顺序、封面建议和视觉风格提示。'],
          ['文案', '根据主题生成 A/B 发布包，包含标题备选、正文、标签、封面字和发布检查清单。'],
          ['图片', '生成发布包后会提供三种选择：ChatGPT 网页版免费手动生成、OpenAI API 付费自动生成、阿里万相付费备用生成。']
        ].map(([label, tip], i) => (
          <div key={i} className="craft-step" title={tip}>
            <span className="craft-step-num">{i + 1}</span>
            <b>{label}</b>
          </div>
        ))}
      </div>

      <div className="two-col">
        {/* Left: upload */}
        <div className="tray-card">
          <div className="module-label">素材区</div>
          <label className="file-upload-label">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
            />
            {uploadedFiles.length ? `已选择 ${uploadedFiles.length} 张图片` : '点击上传图片（最多 9 张）'}
          </label>
          {previewUrls.length > 0 && (
            <>
              <div className="image-sticker-row">
                {previewUrls.map((url, i) => (
                  <div key={i} className="image-sticker">
                    <div className="image-sticker-caption">
                      <span>贴片 {i + 1}</span>
                      <button type="button" className="image-remove-btn" onClick={() => handleRemoveFile(i)} aria-label={`删除贴片 ${i + 1}`}>删除</button>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`preview ${i + 1}`} />
                  </div>
                ))}
              </div>
              <p className="ops-subtle" style={{ marginTop: 8 }}>已选择 {uploadedFiles.length} 张图片，可单独删除不需要的素材。</p>
            </>
          )}
          {!uploadedFiles.length && (
            <p className="ops-subtle" style={{ marginTop: 8 }}>可以只输入主题，也可以上传图片作为配图上下文。</p>
          )}
        </div>

        {/* Right: input */}
        <div className="clay-pad">
          <div className="input-stack">
            <div className="module-label topic-module-label">主题区</div>
            <div className="form-group">
              <label>输入主题、问题或图片描述</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="例如：春日咖啡店探店，想写得自然一点，适合日常分享，图片里有门头、拿铁和甜品。"
              />
            </div>
            <div className="form-group">
              <label>内容方向</label>
              <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}>
                {[...DEFAULT_HOT_TOPICS, '自定义输入'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            {selectedTopic === '自定义输入' && (
              <div className="form-group">
                <label>自定义内容方向</label>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="例如：非遗手作、宠物日常、考研经验、婚礼筹备"
                />
              </div>
            )}
            {!settings.apiKey && (
              <div className="alert-warning">未检测到 DeepSeek API 密钥，请先在右上角设置中配置后再生成。</div>
            )}
            <div className="compressor-wrap">
              <button
                className="btn-primary"
                onClick={handleGenerate}
                disabled={!canGenerate || loading}
              >
                {loading ? '正在生成 A/B 发布包...' : '生成 A/B 发布包'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="kiln-card">
        <div className="kiln-head">
          <div>
            <h2>出炉作品板</h2>
            <p>A/B 发布包会像两张手作稿纸一样摆在这里，方便对比、复制和下载。</p>
          </div>
          <div className="bench-chip">成品区</div>
        </div>

        {loading && (
          <div className="spinner-wrap">
            <div className="spinner-icon" />
            正在生成 A/B 发布包，请稍候…
          </div>
        )}

        {error && <div className="alert-error">生成过程中出错：{error}</div>}

        {!loading && !result && !error && (
          <p className="small-note">这里会显示 A/B 发布包。先输入主题或上传图片，然后点击生成。</p>
        )}

        {result && (
          <>
            {latestPrompt && (
              <div className="alert-info">本次输入：{latestPrompt}</div>
            )}
            {result.packages.length > 0 && (
              <div className="package-grid">
                {result.packages.map((pkg, i) => <PackageCard key={i} pkg={pkg} />)}
              </div>
            )}

            {/* Image generation */}
            {settings.enableThemeImage && imagePrompt && (
              <>
                <h3 style={{ marginBottom: 8 }}>选择生成方式</h3>
                <p className="ops-subtle">推荐先用 ChatGPT 网页版免费手动生成；如果想在当前工具内自动出图，再选择付费 API。</p>
                <div className="image-choice-grid">
                  <div className="image-choice-card recommended">
                    <span className="image-choice-kicker">推荐免费方式</span>
                    <h3>ChatGPT 网页版生成</h3>
                    <p>完全免费，适合个人用户。点击后会自动复制提示词并打开 ChatGPT，你可以直接粘贴生成。</p>
                  </div>
                  <div className="image-choice-card paid">
                    <span className="image-choice-kicker">高质量自动生成</span>
                    <h3>OpenAI API 生成（付费）</h3>
                    <p>需要 OpenAI API Key 和账户余额。生成会按 OpenAI API 图片模型价格计费。</p>
                  </div>
                  <div className="image-choice-card backup">
                    <span className="image-choice-kicker">备用生成</span>
                    <h3>阿里万相生成（付费）</h3>
                    <p>国内访问更稳定，需配置 DashScope API Key。常用模型约 0.04-0.25 元/张。</p>
                  </div>
                </div>
                <div className="image-gen-actions">
                  <button className="chatgpt-btn" onClick={() => {
                    handleCopyImagePrompt()
                    window.open('https://chat.openai.com', '_blank', 'noopener,noreferrer')
                  }}>打开 ChatGPT 生成图片</button>
                  <button className="btn-secondary" onClick={() => handleImageGen('openai')} disabled={imageLoading}>
                    {imageLoading && imageProvider !== '阿里万相' ? '生成中…' : '使用 OpenAI 生成'}
                  </button>
                  <button className="btn-secondary" onClick={() => handleImageGen('aliyun')} disabled={imageLoading}>
                    {imageLoading && imageProvider === '阿里万相' ? '生成中…' : '使用 阿里万相 生成'}
                  </button>
                </div>
                {imageLoading && (
                  <div className="spinner-wrap"><div className="spinner-icon" />正在生成主题配图，请稍候（阿里万相可能需要 30-60 秒）…</div>
                )}
                {imageError && <div className="alert-error">{imageError}</div>}
                {generatedImageB64 && (
                  <div style={{ marginBottom: 16 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={generatedImageB64} alt="主题配图" style={{ borderRadius: 18, maxWidth: '100%', border: '1px solid rgba(90,64,52,.16)' }} />
                    <p className="ops-subtle">{imageProvider} 主题配图</p>
                  </div>
                )}
                <details style={{ marginTop: 8 }}>
                  <summary className="ops-subtle" style={{ cursor: 'pointer' }}>查看、编辑或手动复制生图提示词</summary>
                  <textarea
                    className="image-prompt-editor"
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    style={{ marginTop: 8, minHeight: 160 }}
                  />
                </details>
              </>
            )}

            {/* Copy + download */}
            <div className="copy-area-wrap">
              <label>复制文本</label>
              <textarea value={copyText} readOnly />
            </div>
            <div className="download-row" style={{ marginTop: 12 }}>
              <a
                className="btn-download"
                href={`data:text/plain;charset=utf-8,${encodeURIComponent(copyText)}`}
                download="小红书AB发布包.txt"
              >下载发布包文本</a>
              {generatedImageB64 && (
                <a className="btn-download" href={generatedImageB64} download="主题配图.png">下载主题配图</a>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
