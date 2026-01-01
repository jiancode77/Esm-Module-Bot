import axios from 'axios';
import * as cheerio from 'cheerio';

async function indown(url) {
try {
const get = await axios.get('https://indown.io/en1');

const kukis = get.headers['set-cookie']
.map(v => v.split(';')[0])
.join('; ');

const t = cheerio.load(get.data)('input[name="_token"]').val();
const dl = await axios.post('https://indown.io/download',
new URLSearchParams({
referer: 'https://indown.io/en1',
locale: 'en',
_token: t,
link: url,
p: 'i'
}).toString(),
{
headers: {
'content-type': 'application/x-www-form-urlencoded',
origin: 'https://indown.io',
referer: 'https://indown.io/en1',
cookie: kukis,
'user-agent': 'Mozilla/5.0'
}
}
);

const $ = cheerio.load(dl.data);
const u = $('video source[src], a[href]')
.map(function(_, e) {
let v = $(e).attr('src') || $(e).attr('href');
if (v && v.includes('indown.io/fetch'))
v = decodeURIComponent(new URL(v).searchParams.get('url'));
if (!/cdninstagram\.com|fbcdn\.net/.test(v)) return null;
return v.replace(/&dl=1$/, '');
})
.get()
.filter(function(v, i, a) {
return v && a.indexOf(v) === i;
})[0];

return { url: u || null };

} catch (e) {
return { status: 'error', msg: e.message };
}
}

async function handler(bot, msg, args, config) {
const chatId = msg.chat.id;
const text = args.join(' ');

if (!text) {
return bot.sendMessage(chatId, '<blockquote>📸 Kirim perintah dengan URL Instagram</blockquote>\n\n<b>Contoh:</b>\n<code>/instagram https://www.instagram.com/reel/...</code>\n<code>/ig https://www.instagram.com/p/...</code>', { parse_mode: 'HTML' });
}

if (!/instagram\.com\/(p|reel|tv)\//.test(text)) {
return bot.sendMessage(chatId, '<blockquote>❌ URL harus dari Instagram</blockquote>', { parse_mode: 'HTML' });
}

const waitMsg = await bot.sendMessage(chatId, '<blockquote>⏳ Memproses URL...</blockquote>', { parse_mode: 'HTML' });

try {
await bot.editMessageText('<blockquote>🔍 Mengambil informasi media...</blockquote>', {
chat_id: chatId,
message_id: waitMsg.message_id,
parse_mode: 'HTML'
});

const result = await indown(text);

if (!result.url) {
throw new Error('Media tidak ditemukan atau private');
}

await bot.editMessageText('<blockquote>📥 Mendownload media...</blockquote>', {
chat_id: chatId,
message_id: waitMsg.message_id,
parse_mode: 'HTML'
});

await bot.editMessageText('<blockquote>📤 Mengirim media...</blockquote>', {
chat_id: chatId,
message_id: waitMsg.message_id,
parse_mode: 'HTML'
});

if (result.url.includes('.mp4')) {
await bot.sendVideo(chatId, result.url, {
caption: '<blockquote>✅ Download berhasil!</blockquote>\n\n<b>📹 Instagram Video</b>',
parse_mode: 'HTML'
});
} else {
await bot.sendPhoto(chatId, result.url, {
caption: '<blockquote>✅ Download berhasil!</blockquote>\n\n<b>📸 Instagram Photo</b>',
parse_mode: 'HTML'
});
}

await bot.deleteMessage(chatId, waitMsg.message_id);

} catch (e) {
console.error('Error:', e.message);
await bot.editMessageText(`<blockquote>❌ Error: ${e.message}</blockquote>`, {
chat_id: chatId,
message_id: waitMsg.message_id,
parse_mode: 'HTML'
});
}
}

export default {
handler,
help: ['instagram', 'ig', 'igdl'],
command: ['/instagram', 'instagram', '/ig', 'ig', '/igdl', 'igdl'],
tags: ['downloader']
};
