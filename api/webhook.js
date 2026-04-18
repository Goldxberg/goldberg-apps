// Telegram Bot webhook — @Goldberg2bot
const TOKEN = process.env.BOT_TOKEN;
const APP_URL = process.env.APP_URL || 'https://goldberg2-habits.vercel.app';
const LEXA_URL = APP_URL;
const TG = `https://api.telegram.org/bot${TOKEN}`;

const tg = (method, body) =>
  fetch(`${TG}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(r => r.json()).catch(() => ({ ok: false }));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });
  const u = req.body || {};

  if (u.message?.text) {
    const chat_id = u.message.chat.id;
    const cmd = u.message.text.split(' ')[0];

    if (cmd === '/start' || cmd === '/lexa' || cmd === '/learn') {
      await tg('sendMessage', {
        chat_id,
        text: '📚 *lexa.*\n\nA vocabulary companion. Tap below to open.',
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '📚 Open lexa.', web_app: { url: LEXA_URL } }]]
        }
      });
    } else if (cmd === '/gallery') {
      await tg('sendMessage', {
        chat_id,
        text: '🎨 *App gallery*\n\nAll versions preserved. Pick any design.',
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '🎨 Open gallery', web_app: { url: APP_URL } }]]
        }
      });
    } else if (cmd === '/pro') {
      const inv = await tg('createInvoiceLink', {
        title: 'lexa. Pro',
        description: 'Unlimited collections, AI coach, offline packs',
        payload: `lexa_pro_${u.message.from.id}_${Date.now()}`,
        currency: 'XTR',
        prices: [{ label: 'lexa. Pro (lifetime)', amount: 150 }]
      });
      if (inv?.ok) {
        await tg('sendMessage', {
          chat_id,
          text: 'Unlock lexa. Pro — 150 ⭐',
          reply_markup: { inline_keyboard: [[{ text: '⭐ Pay 150 Stars', url: inv.result }]] }
        });
      }
    }
  }

  if (u.message?.web_app_data) {
    const chat_id = u.message.chat.id;
    try {
      const d = JSON.parse(u.message.web_app_data.data || '{}');
      if (d.event === 'collection_complete') {
        await tg('sendMessage', {
          chat_id,
          text: `✅ *${d.collection}* — ${d.words} words learned.\n_Logged to your vocabulary._`,
          parse_mode: 'Markdown'
        });
      } else if (d.event === 'session_complete') {
        const mins = Math.round((d.duration || 0) / 60);
        await tg('sendMessage', {
          chat_id,
          text: `✅ ${d.mode || 'Session'} · ${mins} min`
        });
      }
    } catch {}
  }

  if (u.pre_checkout_query) {
    await tg('answerPreCheckoutQuery', {
      pre_checkout_query_id: u.pre_checkout_query.id,
      ok: true
    });
  }

  if (u.message?.successful_payment) {
    const chat_id = u.message.chat.id;
    await tg('sendMessage', {
      chat_id,
      text: '⭐ *lexa. Pro unlocked.* Unlimited collections + AI coach are yours.',
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '📚 Open lexa.', web_app: { url: LEXA_URL } }]]
      }
    });
  }

  res.status(200).json({ ok: true });
}
