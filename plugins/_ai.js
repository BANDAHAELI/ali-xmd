const { Sparky, isPublic } = require("../lib/"); const axios = require("axios");

Sparky({ name: "ai", fromMe: isPublic, category: "misc", desc: "Gets a response from the Gemini AI API." }, async ({ m, text }) => { if (!text) return await m.reply("Please provide a query for the AI.");

const query = encodeURIComponent(text);
const url = `https://apis.giftedtech.web.id/api/ai/geminiaipro?apikey=gifted&q=${query}`;

try {
    const { data } = await axios.get(url);
    if (data.success && data.result) {
        return await m.reply(data.result);
    } else {
        return await m.reply("_Failed to fetch response from AI API._");
    }
} catch (error) {
    return await m.reply("_Error connecting to AI API._");
}

});

