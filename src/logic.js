import { openai } from './openai.js';
import { Markup } from 'telegraf';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

export const INITIAL_SESSION = {
  messages: [],
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const imagePath = join(__dirname, './startphoto.jpg');

export async function initCommand(ctx) {
  ctx.session = { ...INITIAL_SESSION };


  // Отправка фотографии, текстового сообщения и кнопки в одном сообщении
  await ctx.replyWithPhoto(
    { source: imagePath },
    {
      caption: 'Привет, это ChatGPT & в твоём Telegram!🤖\nТеперь я понимаю голосовые сообщения!🗣\n\n• Общайтесь с ассистентом, который понимает текстовые и голосовые сообщения.\n• Получайте быстрые и информативные ответы на ваши вопросы.\n• Попросите ассистента помочь вам с креативными задачами, написанием текстов и многое другое.\n\nМогу помочь с любой задачей и вопросом только не забывай использовать промты при общении со мной. Чтобы узнать что это, и как их применять, можешь использовать просторы интернета или просто обратиться ко мне🤫',

    }
  );
  const keyboard = Markup.inlineKeyboard([
    Markup.button.callback('Задать вопрос', 'button_clicked'),
  ]);
  await ctx.reply('Чтобы начать общение, нажмите на кнопку ниже😉', keyboard);
}


export async function initCommandNew(ctx) {
  ctx.session = { ...INITIAL_SESSION }
  await ctx.reply('Задай мне вопрос в текстовом или голосовом формате')
}


export async function processTextToChat(ctx, content) {
  try {
    ctx.session.messages.push({ role: openai.roles.USER, content });

    const response = await openai.chat(ctx.session.messages);

    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response.content,
    });

    await ctx.reply(response.content);
  } catch (e) {
    console.log('Error while proccesing text to gpt', e.message);
  }
}
