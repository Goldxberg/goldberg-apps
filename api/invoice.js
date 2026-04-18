// Creates a Telegram Stars invoice link for Иврит PRO (XTR currency).
const TOKEN = process.env.BOT_TOKEN;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const body = req.body || {};
    const title = body.title || 'Иврит PRO';
    const description = body.description || 'Все уровни · офлайн · озвучка носителя · без рекламы';
    const amount = body.amount || 150;
    const payload = body.payload || `hebrew_pro_${body.user_id || 'anon'}_${Date.now()}`;

    const r = await fetch(`https://api.telegram.org/bot${TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        payload,
        currency: 'XTR',
        prices: [{ label: title, amount }]
      })
    });
    const data = await r.json();
    res.status(200).json({ ok: data.ok, invoice_url: data.result });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
}
