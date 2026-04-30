import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { normalizeOpenAIImageModel } from '@/lib/image_services'

export async function POST(req: NextRequest) {
  try {
    const { prompt, model, size, quality, apiKey } = await req.json()
    const key = apiKey || process.env.OPENAI_API_KEY
    if (!key) return NextResponse.json({ error: '未提供 OpenAI API 密钥' }, { status: 400 })
    if (!prompt) return NextResponse.json({ error: '缺少生图提示词' }, { status: 400 })

    const client = new OpenAI({ apiKey: key })
    const response = await client.images.generate({
      model: normalizeOpenAIImageModel(model ?? 'gpt-image-2'),
      prompt,
      size: size ?? '1024x1024',
      quality: quality ?? 'medium',
      n: 1,
      response_format: 'b64_json',
    })
    const b64 = response.data[0].b64_json
    return NextResponse.json({ b64 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
