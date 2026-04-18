// Hebrew TTS proxy → OpenAI text-to-speech.
// Returns MP3 audio so the client can drive the blob's Web Audio analyser.

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ ok: false, error: 'missing OPENAI_API_KEY' });

  const { text = '', voice = 'nova', speed = 0.92 } = req.body || {};
  if (!text.trim()) return res.status(400).json({ ok: false, error: 'empty text' });

  try {
    const r = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        voice,
        input: text.slice(0, 1500),
        response_format: 'mp3',
        speed
      })
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(500).json({ ok: false, error: t.slice(0, 400) });
    }

    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(buf);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
}
