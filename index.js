import TelegramBot from 'node-telegram-bot-api';
import config from './config.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bot = new TelegramBot(config.token, { polling: true });

const plugins = new Map();

const loadPlugins = async () => {
  const pluginDir = join(__dirname, 'plugins');
  const files = readdirSync(pluginDir).filter(f => f.endsWith('.js'));
  
  console.log(chalk.cyan('┌─────────────────────────────────────┐'));
  console.log(chalk.cyan('│') + chalk.bold.white(' Loading Plugins...                  ') + chalk.cyan('│'));
  console.log(chalk.cyan('└─────────────────────────────────────┘'));
  
  for (const file of files) {
    const plugin = await import(`./plugins/${file}`);
    const mod = plugin.default;
    
    if (mod.command && mod.handler) {
      for (const cmd of mod.command) {
        plugins.set(cmd, mod);
      }
      console.log(chalk.green('✓') + chalk.gray(' Plugin: ') + chalk.yellow(file) + chalk.gray(' → ') + chalk.magenta(`[${mod.command.join(', ')}]`));
    }
  }
  
  console.log(chalk.cyan('┌─────────────────────────────────────┐'));
  console.log(chalk.cyan('│') + chalk.bold.green(' Bot Started Successfully! 🚀        ') + chalk.cyan('│'));
  console.log(chalk.cyan('└─────────────────────────────────────┘'));
};

bot.on('message', async (msg) => {
  if (!msg.text) return;
  
  const text = msg.text.trim();
  const [cmd, ...args] = text.split(' ');
  const command = cmd.toLowerCase();
  
  if (plugins.has(command)) {
    const plugin = plugins.get(command);
    try {
      await plugin.handler(bot, msg, args, config);
    } catch (error) {
      console.error(chalk.red('✗ Error in plugin ') + chalk.yellow(command) + chalk.red(': ') + chalk.gray(error.message));
    }
  }
});

bot.on('polling_error', (error) => {
  console.log(chalk.red('✗ Polling error: ') + chalk.gray(error.message));
});

loadPlugins().then(() => {
  console.log(chalk.blue('\n⚡ Listening for messages...\n'));
});
