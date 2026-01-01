import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function handler(bot, msg, args, config) {
const chatId = msg.chat.id;
const userId = msg.from.id;

if (userId !== config.adminId) {
return bot.sendMessage(chatId, '<blockquote>⚠️ This command is only for owner!</blockquote>', { parse_mode: 'HTML' });
}

try {
const pluginDir = __dirname;
const files = readdirSync(pluginDir).filter(f => f.endsWith('.js'));

const pluginList = [];
let totalCommands = 0;

for (const file of files) {
const plugin = await import(`./${file}`);
const mod = plugin.default;

if (mod.command) {
pluginList.push({
file: file,
commands: mod.command,
tags: mod.tags || ['general']
});
totalCommands += mod.command.length;
}
}

let message = '<blockquote>📦 PLUGIN LIST</blockquote>\n\n';
message += `<b>📊 Total Plugins:</b> ${files.length}\n`;
message += `<b>⚡ Total Commands:</b> ${totalCommands}\n\n`;

const groupedByTag = {};
pluginList.forEach(p => {
const tag = p.tags[0];
if (!groupedByTag[tag]) groupedByTag[tag] = [];
groupedByTag[tag].push(p);
});

for (const [tag, plugins] of Object.entries(groupedByTag)) {
message += `<b>┌─ 📁 ${tag.toUpperCase()}</b>\n`;
plugins.forEach((p, i) => {
const isLast = i === plugins.length - 1;
const prefix = isLast ? '└' : '├';
message += `<b>${prefix}─</b> <code>${p.file}</code>\n`;
message += `   <b>└─</b> ${p.commands.join(', ')}\n`;
});
message += '\n';
}

await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });

} catch (error) {
await bot.sendMessage(chatId, `<blockquote>❌ Error: ${error.message}</blockquote>`, { parse_mode: 'HTML' });
}
}

export default {
handler,
help: ['listplugin', 'plugins'],
command: ['/listplugin', 'listplugin', '/plugins', 'plugins'],
tags: ['owner']
};
