import axios from 'axios';

async function getNpmPackageInfo(packageName) {
try {
const { data } = await axios.get(`https://registry.npmjs.com/${encodeURIComponent(packageName)}`, {
timeout: 15000
});

if (!data || !data.versions) {
throw new Error('Package tidak ditemukan');
}

const latestVersion = data['dist-tags']?.latest || Object.keys(data.versions).pop();
const versionData = data.versions[latestVersion];

return {
name: data.name,
description: data.description || 'Tidak ada deskripsi',
version: latestVersion,
license: versionData.license || 'Tidak ada info lisensi',
author: data.author?.name || versionData.author?.name || 'Unknown',
homepage: data.homepage || `https://www.npmjs.com/package/${data.name}`,
repository: data.repository?.url || 'Tidak ada info repository',
tarballUrl: versionData.dist.tarball,
size: versionData.dist.unpackedSize || versionData.dist.size || 0,
dependencies: versionData.dependencies || {},
devDependencies: versionData.devDependencies || {}
};
} catch (error) {
if (error.response?.status === 404) {
throw new Error('Package tidak ditemukan di NPM Registry');
}
throw new Error(error.message);
}
}

async function downloadNpmPackage(tarballUrl) {
try {
const { data } = await axios({
method: 'GET',
url: tarballUrl,
responseType: 'arraybuffer',
timeout: 30000
});

return Buffer.from(data);
} catch (error) {
throw new Error('Gagal mendownload package: ' + error.message);
}
}

async function handler(bot, msg, args, config) {
const chatId = msg.chat.id;
const text = args.join(' ');

if (!text) {
return bot.sendMessage(chatId, '<blockquote>📦 Kirim perintah dengan nama package NPM</blockquote>\n\n<b>Contoh:</b>\n<code>/npm axios</code>\n<code>/npm express</code>\n<code>/npm https://www.npmjs.com/package/baileys</code>', { parse_mode: 'HTML' });
}

const waitMsg = await bot.sendMessage(chatId, '<blockquote>🔎 Mencari package di NPM Registry...</blockquote>', { parse_mode: 'HTML' });

try {
let packageName = text.trim();

const urlPattern = /(?:https?:\/\/)?(?:www\.)?npmjs\.com\/package\/([^\/\?#]+)/i;
const urlMatch = packageName.match(urlPattern);

if (urlMatch) {
packageName = urlMatch[1];
}

await bot.editMessageText('<blockquote>📋 Mengambil informasi package...</blockquote>', {
chat_id: chatId,
message_id: waitMsg.message_id,
parse_mode: 'HTML'
});

const packageInfo = await getNpmPackageInfo(packageName);

const formatSize = (bytes) => {
if (bytes === 0) return '0 Bytes';
const k = 1024;
const sizes = ['Bytes', 'KB', 'MB', 'GB'];
const i = Math.floor(Math.log(bytes) / Math.log(k));
return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

let infoText = '<blockquote>📦 NPM Package Info</blockquote>\n\n';
infoText += `<b>∘ Name:</b> ${packageInfo.name}\n`;
infoText += `<b>∘ Version:</b> ${packageInfo.version}\n`;
infoText += `<b>∘ License:</b> ${packageInfo.license}\n`;
infoText += `<b>∘ Author:</b> ${packageInfo.author}\n`;
infoText += `<b>∘ Size:</b> ${formatSize(packageInfo.size)}\n`;
infoText += `<b>∘ Description:</b> ${packageInfo.description}\n\n`;
infoText += `<b>∘ Homepage:</b> ${packageInfo.homepage}\n\n`;

const depsCount = Object.keys(packageInfo.dependencies).length;
const devDepsCount = Object.keys(packageInfo.devDependencies).length;

if (depsCount > 0) {
infoText += `<b>∘ Dependencies:</b> ${depsCount} packages\n`;
}
if (devDepsCount > 0) {
infoText += `<b>∘ Dev Dependencies:</b> ${devDepsCount} packages\n`;
}

await bot.editMessageText(infoText, {
chat_id: chatId,
message_id: waitMsg.message_id,
parse_mode: 'HTML',
disable_web_page_preview: true
});

await bot.sendMessage(chatId, '<blockquote>📥 Mendownload package...</blockquote>', { parse_mode: 'HTML' });

const packageBuffer = await downloadNpmPackage(packageInfo.tarballUrl);

await bot.sendMessage(chatId, '<blockquote>📤 Mengirim file...</blockquote>', { parse_mode: 'HTML' });

await bot.sendDocument(chatId, packageBuffer, {
caption: `<blockquote>✅ Download berhasil!</blockquote>\n\n<b>📦 Package:</b> ${packageInfo.name}\n<b>🔖 Version:</b> ${packageInfo.version}`,
parse_mode: 'HTML'
}, {
filename: `${packageInfo.name}-${packageInfo.version}.tgz`
});

} catch (e) {
console.error('Error:', e.message);
await bot.editMessageText(`<blockquote>❌ Error: ${e.message}</blockquote>\n\n<i>Silakan coba lagi dengan nama package yang valid.</i>`, {
chat_id: chatId,
message_id: waitMsg.message_id,
parse_mode: 'HTML'
});
}
}

export default {
handler,
help: ['npm', 'npmjs', 'npmdl'],
command: ['/npm', 'npm', '/npmjs', 'npmjs', '/npmdl', 'npmdl'],
tags: ['downloader']
};
