// Telegram Bot webhook — @Goldberg2bot · Иврит для русскоязычных
const TOKEN = process.env.BOT_TOKEN;
const APP_URL = process.env.APP_URL || 'https://goldberg2-habits.vercel.app';
const HEBREW_URL = APP_URL;
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
    const first = u.message.from?.first_name || 'друг';
    const cmd = u.message.text.split(' ')[0];

    if (cmd === '/start' || cmd === '/hebrew' || cmd === '/ivrit' || cmd === '/learn' || cmd === '/talk') {
      await tg('sendMessage', {
        chat_id,
        text: `שָׁלוֹם, ${first}!\n\n*Иврит · живой разговор*\n\nНажмите микрофон — говорите свободно на русском или иврите.\nИИ отвечает живым ивритом с переводом, транслитерацией и подсказкой.\n\nБлоб реагирует на ваш голос. Уровень A1–A2.`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🗣 Начать разговор', web_app: { url: HEBREW_URL } }],
            [{ text: '⭐ PRO (безлимит · 150 ⭐)', callback_data: 'pro' }, { text: '👥 Позвать друга', switch_inline_query: `Говорю на иврите с ИИ через @Goldberg2bot — присоединяйся!` }]
          ]
        }
      });
    } else if (cmd === '/gallery') {
      await tg('sendMessage', {
        chat_id,
        text: '🎨 *Галерея дизайнов*\n\nВсе версии приложения.',
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '🎨 Открыть галерею', web_app: { url: APP_URL + '/gallery' } }]]
        }
      });
    } else if (cmd === '/help') {
      await tg('sendMessage', {
        chat_id,
        text: '*Команды*\n\n/start — открыть приложение\n/hebrew — то же самое\n/pro — разблокировать PRO\n/streak — твоя серия\n/gallery — галерея версий\n/reset — сбросить прогресс',
        parse_mode: 'Markdown'
      });
    } else if (cmd === '/streak') {
      await tg('sendMessage', {
        chat_id,
        text: '🔥 Проверь свою серию в приложении.',
        reply_markup: { inline_keyboard: [[{ text: '🇮🇱 Открыть', web_app: { url: HEBREW_URL } }]] }
      });
    } else if (cmd === '/pro') {
      const inv = await tg('createInvoiceLink', {
        title: 'Иврит PRO',
        description: 'Все уровни (A1→C2) · офлайн-пакеты · озвучка носителя · без рекламы',
        payload: `hebrew_pro_${u.message.from.id}_${Date.now()}`,
        currency: 'XTR',
        prices: [{ label: 'Иврит PRO (навсегда)', amount: 150 }]
      });
      if (inv?.ok) {
        await tg('sendMessage', {
          chat_id,
          text: '⭐ *Иврит PRO*\n\nВсе уровни · офлайн · озвучка носителя.\n150 ⭐ — навсегда.',
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '⭐ Купить за 150 Stars', url: inv.result }]] }
        });
      }
    } else if (cmd === '/reset') {
      await tg('sendMessage', {
        chat_id,
        text: 'Чтобы сбросить прогресс, откройте приложение → Профиль → Сбросить.',
        reply_markup: { inline_keyboard: [[{ text: '🇮🇱 Открыть', web_app: { url: HEBREW_URL } }]] }
      });
    }
  }

  if (u.callback_query) {
    const cb = u.callback_query;
    const chat_id = cb.message?.chat?.id;
    await tg('answerCallbackQuery', { callback_query_id: cb.id });
    if (cb.data === 'pro' && chat_id) {
      const inv = await tg('createInvoiceLink', {
        title: 'Иврит PRO',
        description: 'Все уровни · офлайн · озвучка носителя',
        payload: `hebrew_pro_${cb.from.id}_${Date.now()}`,
        currency: 'XTR',
        prices: [{ label: 'Иврит PRO (навсегда)', amount: 150 }]
      });
      if (inv?.ok) {
        await tg('sendMessage', {
          chat_id,
          text: '⭐ *Иврит PRO* — 150 ⭐',
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '⭐ Купить', url: inv.result }]] }
        });
      }
    }
  }

  if (u.message?.web_app_data) {
    const chat_id = u.message.chat.id;
    try {
      const d = JSON.parse(u.message.web_app_data.data || '{}');
      if (d.event === 'session_complete') {
        const mins = Math.round((d.duration || 0) / 60);
        await tg('sendMessage', {
          chat_id,
          text: `✅ Урок пройден · ${d.mode || 'сессия'} · ${mins} мин 🔥`
        });
      } else if (d.event === 'xp') {
        // silent — don't spam
      } else if (d.event === 'pro_intent') {
        // noop
      } else if (d.event === 'enable_reminders') {
        await tg('sendMessage', {
          chat_id,
          text: '🔔 Напоминания включены. Буду стучаться каждый день в удобное время.'
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
      text: '⭐ *Иврит PRO активирован!*\nВсе уровни и офлайн-пакеты разблокированы.',
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '🇮🇱 Открыть', web_app: { url: HEBREW_URL } }]]
      }
    });
  }

  res.status(200).json({ ok: true });
}
