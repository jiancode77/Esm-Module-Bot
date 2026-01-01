import { unlinkSync, existsSync } from 'fs';
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

const filename = args[0];

if (!filename) {
return bot.sendMessage(chatId, '<blockquote>❌ Please specify plugin filename!</blockquote>\n\n<b>Usage:</b>\n<code>/delplugin start.js</code>', { parse_mode: 'HTML' });
}

if (!filename.endsWith('.js')) {
return bot.sendMessage(chatId, '<blockquote>❌ Filename must end with .js</blockquote>', { parse_mode: 'HTML' });
}

const protectedFiles = ['delplugin.js', 'listplugin.js', 'addplugin.js'];
if (protectedFiles.includes(filename)) {
return bot.sendMessage(chatId, '<blockquote>⚠️ Cannot delete protected plugin!</blockquote>', { parse_mode: 'HTML' });
}

const pluginPath = join(__dirname, filename);

if (!existsSync(pluginPath)) {
return bot.sendMessage(chatId, '<blockquote>❌ Plugin not found!</blockquote>', { parse_mode: 'HTML' });
}

try {
unlinkSync(pluginPath);

await bot.sendMessage(chatId, `<blockquote>✅ Plugin deleted successfully!</blockquote>\n\n<b>📁 File:</b> <code>${filename}</code>\n<b>📦 Location:</b> <code>plugins/${filename}</code>\n\n⚡ <i>Reloading bot...</i>`, { parse_mode: 'HTML' });

setTimeout(() => {
process.exit(0);
}, 1000);

} catch (error) {
await bot.sendMessage(chatId, `<blockquote>❌ Error: ${error.message}</blockquote>`, { parse_mode: 'HTML' });
}
}

export default {
handler,
help: ['delplugin'],
command: ['/delplugin', 'delplugin'],
tags: ['owner']
};
