// Hebrew conversation proxy → OpenAI chat completions.
// Keeps OPENAI_API_KEY server-side only.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ ok: false, error: 'missing OPENAI_API_KEY' });

  const { messages = [], level = 'A1' } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ ok: false, error: 'bad messages' });
  }

  const system = `Ты — тёплый, весёлый и терпеливый учитель иврита для русскоязычного ученика уровня ${level}.

ФОРМАТ ОТВЕТА — строго JSON, никакого markdown:
{"he":"...","niqqud":"...","tr":"...","ru":"...","hint":"..."}

Поля:
- he: твой ответ на иврите БЕЗ огласовок (натуральный живой разговорный язык)
- niqqud: тот же ответ С полными огласовками (никуд)
- tr: кириллическая транслитерация с ударениями (например: "шало́м, ма нишма́")
- ru: перевод на русский
- hint: короткий (до 100 симв.) совет на русском — грамматика, культурный момент, или мягкая правка ошибки ученика. Может быть "".

ПОВЕДЕНИЕ:
- Короткие тёплые реплики (1-2 предложения), как живой собеседник.
- Если ученик пишет на русском — отвечай на иврите как будто он уже это сказал.
- Если на иврите с ошибкой — принимай смысл, отвечай по теме, поправку клади в hint.
- Всегда задавай встречный вопрос чтобы поддержать диалог.
- Уровень ${level}: подбирай лексику соответственно.
- Никогда не отвечай одним словом — всегда полноценная реплика.`;

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: system }, ...messages.slice(-14)],
        response_format: { type: 'json_object' },
        temperature: 0.8,
        max_tokens: 400
      })
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(500).json({ ok: false, error: t.slice(0, 400) });
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content || '{}';
    let parsed = {};
    try { parsed = JSON.parse(content); } catch { parsed = { he: '', ru: content }; }

    res.status(200).json({
      ok: true,
      he: parsed.he || '',
      niqqud: parsed.niqqud || parsed.he || '',
      tr: parsed.tr || '',
      ru: parsed.ru || '',
      hint: parsed.hint || ''
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
}
