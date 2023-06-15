import { Telegraf, Markup, session } from 'telegraf';
import { message } from 'telegraf/filters';
import { code } from 'telegraf/format';
import config from 'config';
import { ogg } from './ogg.js';
import { openai } from './openai.js';
import { removeFile } from './utils.js';
import { initCommand, initCommandNew, processTextToChat, INITIAL_SESSION } from './logic.js';


const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

bot.use(session());

bot.command('new', initCommandNew);
bot.command('start', initCommand);

bot.on(message('voice'), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    await ctx.reply(code('Сообщение принял. Жду ответ от сервера...'));
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const userId = String(ctx.message.from.id);
    const oggPath = await ogg.create(link.href, userId);
    const mp3Path = await ogg.toMp3(oggPath, userId);

    removeFile(oggPath);

    const text = await openai.transcription(mp3Path);
    await ctx.reply(code(`Ваш запрос: ${text}`));

    await processTextToChat(ctx, text);


  } catch (e) {
    console.log(`Error while voice message`, e.message);
  }
});

bot.on('text', async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    await ctx.reply(code('Сообщение принял. Жду ответ от сервера...'));
    await processTextToChat(ctx, ctx.message.text);
    await ctx.reply('Что вы хотите сделать дальше?', Markup.inlineKeyboard([
      [Markup.button.callback('Продолжить', 'continue', false)],
      [Markup.button.callback('Новый вопрос', 'new', false)]
    ]));
  } catch (e) {
    console.log('Error while voice message', e.message);
  }
});

bot.action('continue', async (ctx) => {
  // Обработка действия "Продолжить"
  // Например, вы можете продолжить диалог или выполнить другие действия
  await ctx.reply('Чем я ещё могу вам помочь?')
});

bot.action('new', async (ctx) => {
  // Обработка действия "Новый вопрос"
  // Например, вызвать команду "new" или выполнить другие действия
  ctx.session = { ...INITIAL_SESSION }
  await ctx.reply('Задай мне вопрос в текстовом или голосовом формате')
});

bot.command('menu', async (ctx) => {
  const keyboard = Markup.keyboard([
    ['/new', '/start'],
  ]).oneTime().resize();

  await ctx.reply('Выберите команду:', keyboard);
});

// Обработчик первого запуска бота
bot.use(async (ctx, next) => {
  if (ctx.session.isFirstRun) {
    // Отправляем сообщение с картинкой и текстом
    await ctx.replyWithPhoto({ source: './startphoto.jpg' }, { caption: 'Привет! Я бот. Выберите команду из меню.' });
    ctx.session.isFirstRun = false; // Устанавливаем флаг первого запуска в false
  }
  await next();
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
