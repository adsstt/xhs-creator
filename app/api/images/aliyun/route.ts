import { NextRequest, NextResponse } from 'next/server'
import { normalizeAliyunImageSize } from '@/lib/image_services'

const ALIYUN_IMAGE_ENDPOINT = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis'
const ALIYUN_TASK_ENDPOINT = 'https://dashscope.aliyuncs.com/api/v1/tasks'

async function safeJson(res: Response) {
  try { return await res.json() } catch { return null }
}

function extractError(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '接口返回格式异常'
  const p = payload as Record<string, unknown>
  return String(p.message ?? p.msg ?? p.code ?? p.request_id ?? '请求失败')
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, model, size, apiKey } = await req.json()
    const key = apiKey || process.env.DASHSCOPE_API_KEY
    if (!key) return NextResponse.json({ error: '未提供阿里万相 DashScope API 密钥' }, { status: 400 })
    if (!prompt) return NextResponse.json({ error: '缺少生图提示词' }, { status: 400 })

    const submitRes = await fetch(ALIYUN_IMAGE_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable',
      },
      body: JSON.stringify({
        model: model ?? 'wanx2.1-t2i-turbo',
        input: { prompt },
        parameters: { size: normalizeAliyunImageSize(size ?? '1024x1024'), n: 1 },
      }),
    })
    const submitData = await safeJson(submitRes)
    if (submitRes.status >= 400) return NextResponse.json({ error: `阿里万相请求失败：${extractError(submitData)}` }, { status: 502 })
    const output = (submitData as Record<string, unknown>)?.output as Record<string, unknown> | undefined
    const taskId = output?.task_id ?? (submitData as Record<string, unknown>)?.task_id
    if (!taskId) return NextResponse.json({ error: `阿里万相未返回任务 ID：${extractError(submitData)}` }, { status: 502 })

    const deadline = Date.now() + 180_000
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2000))
      const taskRes = await fetch(`${ALIYUN_TASK_ENDPOINT}/${taskId}`, {
        headers: { Authorization: `Bearer ${key}` },
      })
      const taskData = await safeJson(taskRes) as Record<string, unknown>
      if (taskRes.status >= 400) return NextResponse.json({ error: `任务查询失败：${extractError(taskData)}` }, { status: 502 })
      const taskOutput = taskData?.output as Record<string, unknown> | undefined
      const status = String(taskOutput?.task_status ?? taskOutput?.status ?? '').toUpperCase()
      if (status === 'SUCCEEDED' || status === 'SUCCESS') {
        const results = taskOutput?.results as Array<Record<string, string>> | undefined
        if (!results?.length) return NextResponse.json({ error: '任务成功但未返回图片结果' }, { status: 502 })
        const imageUrl = results[0].url
        if (!imageUrl) return NextResponse.json({ error: '未找到图片链接' }, { status: 502 })
        const imgRes = await fetch(imageUrl)
        const arrayBuf = await imgRes.arrayBuffer()
        const b64 = Buffer.from(arrayBuf).toString('base64')
        return NextResponse.json({ b64 })
      }
      if (['FAILED', 'FAIL', 'CANCELED'].includes(status)) {
        return NextResponse.json({ error: `生成失败：${extractError(taskData)}` }, { status: 502 })
      }
    }
    return NextResponse.json({ error: '阿里万相生成超时' }, { status: 504 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
