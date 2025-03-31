const {
	Sparky,
	installExternalPlugins,
	externalPlugins
} = require('../lib');
const axios = require('axios');
const fs = require("fs");


Sparky({
	name: 'plugin',
	fromMe: true,
	category: 'sudo',
	desc: 'Install external plugins.'
}, async ({
	m,
	args
}) => {
	args = args || m?.quoted?.text;
	if (!args) return await m.reply('_Send a plugin URL or list to install._');
	const urls = (args.match(/https?:\/\/[^\s]+/g) || []).map(url => url.includes('gist.github.com') ? url.replace('gist.github.com', 'gist.githubusercontent.com') + '/raw' : url);
	if (!urls.length) return await m.reply('_Invalid url._');
	const installed = [];
	for (const url of urls) {
		try {
			const {
				data,
				status
			} = await axios.get(url);
			if (status !== 200) continue;
			const name = (data.match(/(?<=name:) ["'](.*?)["']/)?.[1]?.split(' ')[0]) || `plugin_${Date.now()}`;
			const path = `${__dirname}/${name}.js`;
			fs.writeFileSync(path, data);
			try {
				require(`./${name}`);
				await installExternalPlugins(url, name);
				installed.push(name);
			} catch (err) {
				fs.unlinkSync(path);
				console.error(`Invalid plugin (${name}):`, err.message);
			}
		} catch (err) {
			console.error(`Failed to fetch plugin (${url}):`, err.message);
		}
	}
	return await m.reply(installed.length ? `_New plugin installed: ${installed.join(', ')}_` : '_No plugins installed._');
});


Sparky({
	name: 'remove',
	fromMe: true,
	category: 'sudo',
	desc: 'Remove external plugins.'
}, async ({
	m,
	args
}) => {
	if (!args) return m.reply("_Enter the plugin name to remove, or use 'all' to remove all plugins._");
	const plugins = args.toLowerCase() === 'all' ? await externalPlugins.findAll() : await externalPlugins.findAll({
		where: {
			name: args
		}
	});
	if (!plugins.length) return m.reply(args.toLowerCase() === 'all' ? "_No plugins found to remove._" : `_Plugin '${args}' not found._`);
	const uninstalled = [];
	for (const plugin of plugins) {
		try {
			delete require.cache[require.resolve(`./${plugin.name}.js`)];
			fs.unlinkSync(`${__dirname}/${plugin.name}.js`);
			await plugin.destroy();
			uninstalled.push(plugin.name);
		} catch (err) {
			console.error(`Failed to remove plugin '${plugin.name}':`, err.message);
		}
	}
	return await m.reply(uninstalled.length ? `_Plugins uninstalled: ${uninstalled.join(', ')}_` : "_No plugins were uninstalled._");
});


Sparky({
		name: 'plugins',
		fromMe: true,
		category: 'sudo',
		desc: 'Lists all installed external plugins'
	},
	async ({
		m
	}) => {
		const plugins = await externalPlugins.findAll();
		if (plugins.length < 1) {
			return await m.reply("_No external plugins installed_");
		}
		const message = plugins.map((plugin, index) => `_${index + 1}. ${plugin.dataValues.name}: ${plugin.dataValues.url}_`).join("\n");
		return await m.reply(message);
	});
