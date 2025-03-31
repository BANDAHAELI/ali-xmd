const {Sparky} = require('../lib');
const {getString} = require('./pluginsCore');
const appClient = require('./pluginsCore/app.js');
const app = new appClient();
const simpleGit = require('simple-git');
const git = simpleGit();
const {exec} = require("child_process");
const config = require("../config")
const lang = getString('app');


Sparky({
      name: "update",
      fromMe: true,
      desc: "Update",
      category: "app",
  },
  async ( { args, m }) => {
      await git.fetch();
      var commits = await git.log(['main' + "..origin/" + 'main']);
      let message = "*_New updates available!_*\n\n";
      commits["all"].map((e, i) =>
          message += "```" + `${i + 1}. ${e.message}\n[${e.date.substring(0, 10)}]\n` + "```"
      );

      if (args) {
            switch (args) {
                        case 'now': {
                              if(commits.total === 0) return await m.reply("```Bot is up-to-date!```");
                              await m.reply('_*Updating...*_');
          await app.update();
            const interval = setInterval(async () => {
                  const status = await app.deploymentInfo()
                  if(status === 'STARTING') {
                        await m.reply("_*Bot updated!*_\n_Restarting..._");
                        clearInterval(interval);
                  }
            }, 5000)
                              break;
                        }
            default: {
                  
            }
            }
            return;
      }
        return await m.reply(commits.total !== 0 ? message + `\n_Use '${m.prefix}update now' to update the bot._` : "```Bot is up-to-date!```");
  }
);


Sparky({
      name: "restart",
      fromMe: true,
      desc: lang.RESTART_DESC,
      category: "app",
  },
  async ( {
        m
  }) => {
      await m.reply(lang.RESTARTING);
      exec("pm2 restart X-BOT-MD", async (error, stdout, stderr) => {
      if (error) {
            return await m.reply(`Error: ${error}`);
      } 
      return;
    });
 });


Sparky({
		name: "setvar",
		fromMe: true,
		desc: lang.SETVAR_DESC,
		category: "app",
	},
	async ({
		m,
		args
	}) => {
		if (!args) return await m.reply(lang.SETVAR_ALERT.replace("{}", m.prefix));
		const [key, value] = args.split("=");
		const setVariable = await app.setVar(key.trim().toUpperCase(), value.trim());
		return await m.reply(setVariable ? lang.SETVAR_SUCCESS.replace("{}", key.trim().toUpperCase()).replace("{}", value.trim()) : lang.SETVAR_FAILED);
	});


Sparky({
		name: "delvar",
		fromMe: true,
		desc: lang.DELVAR_DESC,
		category: "app",
	},
	async ({
		m,
		args
	}) => {
		if (!args) return await m.reply(lang.DELVAR_ALERT.replace("{}", m.prefix));
		const delVariable = await app.deleteVar(args.trim().toUpperCase());
		return await m.reply(delVariable ? lang.DELVAR_SUCCESS.replace("{}", args.trim().toUpperCase()) : lang.DELVAR_NOTFOUND.replace("{}", args.trim().toUpperCase()));
	});


Sparky({
		name: "getvar",
		fromMe: true,
		desc: lang.GETVAR_DESC,
		category: "app",
	},
	async ({
		m,
		args
	}) => {
		if (!args) return await m.reply(lang.GETVAR_ALERT.replace("{}", m.prefix));
		const getVariables = await app.getVars();
		const vars = getVariables.find(i => i.key === args.toUpperCase());
		return await m.reply(`_${vars.key}: ${vars.value}_`);
	});
	
	
Sparky({
		name: "getallvars",
		fromMe: true,
		desc: lang.GETALLVARS_DESC,
		category: "app",
	},
	async ({
		m
	}) => {
		const getVariables = await app.getVars();
		const vars = getVariables.map((e, i)=> `\`\`\`${i + 1}. ${e.key}: ${e.value}\`\`\``).join('\n');
		return await m.reply(vars);
	});


Sparky({
	name: "mode",
	fromMe: true,
	desc: "hu",
	category: "app",
},
async ( {
	  m, args
}) => {
	if (args?.toLowerCase() == "public" || args?.toLowerCase() == "private"){
		return await app.setVar("WORK_TYPE",args,m)
		m.reply(`_Mode Sucessfuly Changed To: ${args}_`);
	} else {
		return await m.reply(`_*Mode manager*_\n_Current mode: ${config.WORK_TYPE}_\n_Use .mode public/private_`)
}
}
);


const settingsMenu = [
    { title: "Auto read all messages", env_var: "READ_MESSAGES" },
    { title: "Auto status react", env_var: "STATUS_REACTION" },
    { title: "Auto read status updates", env_var: "AUTO_STATUS_VIEW" },
    { title: "Auto reject calls", env_var: "REJECT_CALL" },
    { title: "Always online", env_var: "ALWAYS_ONLINE" },
    { title: "Disable bot in PM", env_var: "DISABLE_PM" },
    { title: "PM Auto blocker", env_var: "PM_BLOCK" },
    { title: "Bot Work type", env_var: "WORK_TYPE" }
];

let settingsContext = {};

Sparky({
    name: "settings",
    fromMe: true,
    desc: "Settings Configuration",
    category: "downloader",
}, async ({ m }) => {
    const menu = settingsMenu.map((e, i) => `_${i + 1}. ${e.title}_`).join("\n");
    await m.reply(`*_Settings Configuration Menu_*\n\n${menu}\n\n_Reply with a number to continue._`);
});

Sparky({
    on: "text",
    fromMe: true,
  }, async ({ client, m }) => {
    if (m.quoted && typeof m.quoted.text === "string" && m.quoted.text.includes("Settings Configuration Menu")) {
      const selected = settingsMenu[parseInt(m.text) - 1];
      if (!selected) return;
  
      const currentStatus = config[selected.env_var] ? "on" : "off";
      const statusOptions = ["on", "off"].map((s, i) => `_${i + 1}. ${s}_`).join("\n");
  
      await m.reply(`*_${selected.title}_*\n\n_Current status: ${currentStatus}_\n\n_Reply with a number to update the status._\n\n${statusOptions}`);
      settingsContext = { sender: m.sender, title: selected.title, env_var: selected.env_var };
    }
  
    if (settingsContext.sender === m.sender && m.quoted && typeof m.quoted.text === "string" && m.quoted.text.includes(settingsContext.title)) {
      const status = ["on", "off"][parseInt(m.text) - 1];
      if (!status) return;
  
      await app.setVar(settingsContext.env_var, status === "on" ? "true" : "false");
      delete settingsContext;
  
      return await m.reply(`_${settingsContext.title} ${status === "on" ? "enabled." : "disabled."}_`);
    }
  });
