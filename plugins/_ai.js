const {
  Sparky,
  isPublic
} = require("../lib");
const {getString} = require('./pluginsCore');
const fetch = require('node-fetch');
const lang = getString('ai');

Sparky({
   name: "ai",
   fromMe: isPublic,
   category: "ai",
   desc: "Ask questions to Gemini AI"
}, async ({ m, client, args }) => {
  if (!args) return await m.reply(lang.NEED_Q);
  
  try {
    const apiUrl = `https://apis.giftedtech.web.id/api/ai/geminiaipro?apikey=gifted&q=${encodeURIComponent(args)}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (data.success && data.result) {
      return await m.reply(`*Gemini AI Response:*\n\n${data.result}`);
    } else {
      return await m.reply(lang.ERROR);
    }
  } catch (error) {
    console.error(error);
    return await m.reply(lang.ERROR);
  }
});
