import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function handler(bot, msg, args, config) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  if (userId !== config.adminId) {
    return bot.sendMessage(chatId, '⚠️ This command is only for owner!');
  }
  
  if (!msg.reply_to_message) {
    return bot.sendMessage(chatId, '<blockquote>❌ Please reply to a message!</blockquote>\n\n<b>Usage:</b>\n• Reply to .js file: <code>/addplugin</code>\n• Reply to code with filename: <code>/addplugin start.js</code>', { parse_mode: 'HTML' });
  }
  
  if (msg.reply_to_message.document) {
    const document = msg.reply_to_message.document;
    
    if (!document.file_name.endsWith('.js')) {
      return bot.sendMessage(chatId, '<blockquote>❌ File must be a .js file!</blockquote>', { parse_mode: 'HTML' });
    }
    
    try {
      const file = await bot.getFile(document.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${config.token}/${file.file_path}`;
      
      const response = await fetch(fileUrl);
      const code = await response.text();
      
      const pluginPath = join(__dirname, document.file_name);
      writeFileSync(pluginPath, code);
      
      await bot.sendMessage(chatId, `<blockquote>✅ Plugin added successfully!</blockquote>\n\n<b>📁 File:</b> <code>${document.file_name}</code>\n<b>📦 Location:</b> <code>plugins/${document.file_name}</code>\n\n⚡ <i>Reloading bot...</i>`, { parse_mode: 'HTML' });
      
      setTimeout(() => {
        process.exit(0);
      }, 1000);
      
    } catch (error) {
      await bot.sendMessage(chatId, `<blockquote>❌ Error: ${error.message}</blockquote>`, { parse_mode: 'HTML' });
    }
  } else if (msg.reply_to_message.text) {
    const filename = args[0];
    
    if (!filename || !filename.endsWith('.js')) {
      return bot.sendMessage(chatId, '<blockquote>❌ Please specify filename!</blockquote>\n\n<b>Example:</b> <code>/addplugin start.js</code>', { parse_mode: 'HTML' });
    }
    
    const code = msg.reply_to_message.text;
    
    try {
      const pluginPath = join(__dirname, filename);
      writeFileSync(pluginPath, code);
      
      await bot.sendMessage(chatId, `<blockquote>✅ Plugin created successfully!</blockquote>\n\n<b>📁 File:</b> <code>${filename}</code>\n<b>📦 Location:</b> <code>plugins/${filename}</code>\n<b>📝 Lines:</b> <code>${code.split('\n').length}</code>\n\n⚡ <i>Reloading bot...</i>`, { parse_mode: 'HTML' });
      
      setTimeout(() => {
        process.exit(0);
      }, 1000);
      
    } catch (error) {
      await bot.sendMessage(chatId, `<blockquote>❌ Error: ${error.message}</blockquote>`, { parse_mode: 'HTML' });
    }
  } else {
    return bot.sendMessage(chatId, '<blockquote>❌ Invalid reply!</blockquote>\n\n<b>Please reply to:</b>\n• .js document file\n• Text/code message with filename', { parse_mode: 'HTML' });
  }
}

export default {
  handler,
  help: ['addplugin'],
  command: ['/addplugin', 'addplugin'],
  tags: ['owner']
};
