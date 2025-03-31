const {
    Sparky,
    setData,
    getData
} = require('../lib');
const {getString} = require('./pluginsCore');
const lang = getString('group');

// Sparky({
//     name: "antidemote",
//     fromMe: true,
//     desc: "manage",
//     category: "manage",
// },
// async ( { args, m }) => {
//     if (!m.isGroup) return await m.reply(lang.NOT_GROUP);
//     const { antidemote } = await getData(m.jid);
//     if (!args) return await m.reply(`_*Antidemote manager*_\n_Current status: ${antidemote.status}_\n_Use antidemote on/off_`);
//     if (args != 'on' && args != 'off') return m.reply('_antidemote on_');
//     if (args === 'on') {
//         if (antidemote && antidemote.status == 'true') return m.reply('_Already activated_');
//         await setData(m.jid, "active", "true", "antidemote");
//         return await m.reply('_activated_');
//     } else if (args === 'off') {
//         if (antidemote && antidemote.status == 'false') return m.reply('_Already Deactivated_');
//         await setData(m.jid, "disactive", "false", "antidemote");
//         return await m.reply('_deactivated_')
//     }
// }
// )