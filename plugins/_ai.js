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
   desc: "Ask questions to Gemini AI",
   usage: "ask your question"
}, async ({ m, client, args }) => {
  if (!args) return await m.reply(`*Example:* .ai What is quantum computing?\n\n${lang.NEED_Q}`);    
  
  try {
    const apiUrl = `https://apis.giftedtech.web.id/api/ai/geminiaipro?apikey=gifted&q=${encodeURIComponent(args)}`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
    
    const data = await response.json();
    
    if (data.success && data.result) {
      const cleanResponse = data.result.replace(/\n/g, '\n'); // Format new lines
      return await m.reply(`*🤖 Gemini AI Response:*\n\n${cleanResponse}\n\n*🔎 Question:* ${args}`);
    } else {
      throw new Error('Invalid API response');
    }
  } catch (error) {
    console.error('AI Command Error:', error);
    return await m.reply(`${lang.ERROR}\n\nPlease try again later.`);
  }
});
