import axios from 'axios';
import * as cheerio from 'cheerio';

async function handler(bot, msg, args, config) {
const chatId = msg.chat.id;
const text = args.join(' ');

if (!text) {
return bot.sendMessage(chatId, '<blockquote>📹 Kirim perintah dengan URL Facebook</blockquote>\n\n<b>Contoh:</b>\n<code>/facebook https://facebook.com/...</code>', { parse_mode: 'HTML' });
}

const waitMsg = await bot.sendMessage(chatId, '<blockquote>⏳ Memproses video...</blockquote>', { parse_mode: 'HTML' });

try {
await bot.editMessageText('<blockquote>🔍 Mengambil informasi video...</blockquote>', {
chat_id: chatId,
message_id: waitMsg.message_id,
parse_mode: 'HTML'
});

const r = await axios.post('https://v3.fdownloader.net/api/ajaxSearch',
new URLSearchParams({
q: text,
lang: 'en',
web: 'fdownloader.net',
v: 'v2',
w: ''
}).toString(),
{
headers: {
'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
origin: 'https://fdownloader.net',
referer: 'https://fdownloader.net/',
'user-agent': 'Mozilla/5.0 (Linux; Android 10)'
}
}
);

const $ = cheerio.load(r.data.data);

const duration = $('.content p').first().text().trim() || 'Unknown';
const thumbnail = $('.thumbnail img').attr('src') || null;
const videos = $('.download-link-fb').map((_, el) => ({
quality: $(el).attr('title')?.replace('Download ', '') || '',
url: $(el).attr('href')
})).get();

if (!videos || videos.length === 0) {
throw new Error('Tidak ada video ditemukan');
}

const selectedVideo = videos.find(v => v.quality.includes('720p')) || videos[0];

await bot.editMessageText('<blockquote>📥 Mendownload video...</blockquote>', {
chat_id: chatId,
message_id: waitMsg.message_id,
parse_mode: 'HTML'
});

await bot.editMessageText('<blockquote>📤 Mengirim video...</blockquote>', {
chat_id: chatId,
message_id: waitMsg.message_id,
parse_mode: 'HTML'
});

await bot.sendVideo(chatId, selectedVideo.url, {
caption: `<blockquote>✅ Download berhasil!</blockquote>\n\n<b>📹 Durasi:</b> ${duration}\n<b>📊 Kualitas:</b> ${selectedVideo.quality}`,
parse_mode: 'HTML'
});

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
help: ['facebook', 'fbdl', 'fb'],
command: ['/facebook', 'facebook', '/fbdl', 'fbdl', '/fb', 'fb'],
tags: ['downloader']
};
