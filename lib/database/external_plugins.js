const config = require('../../config');
const {
	DataTypes
} = require('sequelize');

const externalPlugins = config.DATABASE.define('externalPlugin', {
	name: {
		type: DataTypes.STRING,
		allowNull: false
	},
	url: {
		type: DataTypes.TEXT,
		allowNull: false
	}
});

externalPlugins.sync();

async function installExternalPlugins(adres, file) {
	const existingPlugin = await externalPlugins.findOne({
		where: {
			name: file
		}
	});
	if (existingPlugin) {
		return false;
	} else {
		return await externalPlugins.create({
			url: adres,
			name: file
		});
	}
}

module.exports = {
	externalPlugins,
	installExternalPlugins
};
