const config = require('../../config');
const {
	DataTypes
} = require('sequelize');

const warnDB = config.DATABASE.define('warn', {
	jid: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true
	},
	warnCount: {
		type: DataTypes.INTEGER,
		defaultValue: config.WARN_COUNT
	}
});

warnDB.sync();

module.exports = {
	warnDB
};
