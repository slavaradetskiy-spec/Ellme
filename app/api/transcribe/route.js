import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

// In-memory rate limit: 30 transcriptions / hour / IP. The Whisper call
// costs us money, and 30 voice messages in an hour is a lot — anyone
// past that is probably spamming or buggy.
const rlMap = new Map();
function rateOk(ip, maxPerHour = 30) {
  const now = Date.now();
  const cutoff = now - 3600000;
  const entries = (rlMap.get(ip) || []).filter(t => t > cutoff);
  if (entries.length >= maxPerHour) return false;
  entries.push(now);
  rlMap.set(ip, entries);
  if (rlMap.size > 10000) {
    for (const [k, v] of rlMap) if (v.every(t => t <= cutoff)) rlMap.delete(k);
  }
  return true;
}

export async function POST(req) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Расшифровка пока не настроена. Свяжитесь с поддержкой.' },
      { status: 503 }
    );
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateOk(ip)) {
    return NextResponse.json({ error: 'Слишком много запросов. Попробуйте позже.' }, { status: 429 });
  }
  let url;
  try {
    const body = await req.json();
    url = body?.url;
  } catch (e) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'missing url' }, { status: 400 });
  }
  // Only allow http(s) URLs to avoid SSRF into internal networks
  let parsed;
  try { parsed = new URL(url); } catch (e) { return NextResponse.json({ error: 'bad url' }, { status: 400 }); }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'bad protocol' }, { status: 400 });
  }
  try {
    const audioRes = await fetch(url);
    if (!audioRes.ok) {
      return NextResponse.json({ error: 'Не удалось скачать аудио' }, { status: 502 });
    }
    const contentType = audioRes.headers.get('content-type') || 'audio/webm';
    const contentLen = Number(audioRes.headers.get('content-length') || 0);
    // Whisper caps at 25 MB; reject anything suspiciously large to
    // avoid surprise bills and long hangs.
    if (contentLen && contentLen > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Слишком длинное сообщение' }, { status: 413 });
    }
    const arr = await audioRes.arrayBuffer();
    if (arr.byteLength > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Слишком длинное сообщение' }, { status: 413 });
    }
    // Pick a filename/extension that matches the mime so Whisper's
    // container detection doesn't complain (audio/mp4 from Safari,
    // audio/webm from Chrome, etc.).
    const ext = (() => {
      if (contentType.includes('mp4')) return 'mp4';
      if (contentType.includes('mpeg')) return 'mp3';
      if (contentType.includes('wav')) return 'wav';
      if (contentType.includes('ogg')) return 'ogg';
      return 'webm';
    })();
    const blob = new Blob([arr], { type: contentType });
    const form = new FormData();
    form.append('file', blob, `voice.${ext}`);
    form.append('model', 'whisper-1');
    form.append('language', 'ru');
    form.append('response_format', 'text');
    const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: form,
    });
    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      console.error('whisper error:', r.status, errText);
      return NextResponse.json({ error: 'Сервис расшифровки временно недоступен' }, { status: 502 });
    }
    const text = (await r.text()).trim();
    return NextResponse.json({ text });
  } catch (e) {
    console.error('transcribe error:', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
