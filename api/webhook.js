// Telegram Bot webhook — handles /start, web_app_data (sendData), Stars payments
const TOKEN = process.env.BOT_TOKEN;
const APP_URL = process.env.APP_URL || 'https://goldberg2-habits.vercel.app';
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

  // /start, /help
  if (u.message?.text) {
    const chat_id = u.message.chat.id;
    const text = u.message.text.split(' ')[0];
    if (text === '/start' || text === '/brain') {
      await tg('sendMessage', {
        chat_id,
        text: '🧠 *Your Brain*\n\nA gentle, ADHD‑first focus companion. Tap below to open.',
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '🧠 Open Brain', web_app: { url: APP_URL } }]]
        }
      });
    } else if (text === '/pro') {
      // Create Stars invoice and send as button
      const inv = await tg('createInvoiceLink', {
        title: 'Brain Pro',
        description: 'Unlimited scenarios, sleep soundscapes, biometric journal',
        payload: `pro_${u.message.from.id}_${Date.now()}`,
        currency: 'XTR',
        prices: [{ label: 'Brain Pro (lifetime)', amount: 150 }]
      });
      if (inv?.ok) {
        await tg('sendMessage', {
          chat_id,
          text: 'Unlock Brain Pro — 150 ⭐',
          reply_markup: { inline_keyboard: [[{ text: '⭐ Pay 150 Stars', url: inv.result }]] }
        });
      }
    }
  }

  // Mini app sendData (session log)
  if (u.message?.web_app_data) {
    const chat_id = u.message.chat.id;
    try {
      const d = JSON.parse(u.message.web_app_data.data || '{}');
      if (d.event === 'session_complete') {
        const mins = Math.round((d.duration || 0) / 60);
        await tg('sendMessage', {
          chat_id,
          text: `✅ *${d.mode || 'Focus'}* session · ${mins} min\n_Logged to your brain._`,
          parse_mode: 'Markdown'
        });
      } else if (d.event === 'journal') {
        await tg('sendMessage', {
          chat_id,
          text: `📓 Journal saved (${(d.words || 0)} words).`
        });
      }
    } catch {}
  }

  // Stars payment pre-checkout (must answer within 10s)
  if (u.pre_checkout_query) {
    await tg('answerPreCheckoutQuery', {
      pre_checkout_query_id: u.pre_checkout_query.id,
      ok: true
    });
  }

  // Successful payment
  if (u.message?.successful_payment) {
    const chat_id = u.message.chat.id;
    await tg('sendMessage', {
      chat_id,
      text: '⭐ *Brain Pro unlocked.* Sleep soundscapes + unlimited scenarios are yours.\n\nOpen the app to use them.',
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '🧠 Open Brain', web_app: { url: APP_URL } }]]
      }
    });
    // Set an emoji status on the user for 24h (v8+)
    try {
      await tg('setUserEmojiStatus', {
        user_id: u.message.from.id,
        emoji_status_custom_emoji_id: '5368324170671202286',
        emoji_status_expiration_date: Math.floor(Date.now() / 1000) + 86400
      });
    } catch {}
  }

  res.status(200).json({ ok: true });
}
