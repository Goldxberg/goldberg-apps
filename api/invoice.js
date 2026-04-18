// Creates a Telegram Stars invoice link (XTR currency).
const TOKEN = process.env.BOT_TOKEN;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { title, description, payload, amount } = req.body || {};
    if (!title || !amount) return res.status(400).json({ ok: false, error: 'missing fields' });

    const r = await fetch(`https://api.telegram.org/bot${TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description: description || '',
        payload: payload || `brain_${Date.now()}`,
        currency: 'XTR',
        prices: [{ label: title, amount }]
      })
    });
    const data = await r.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
}
