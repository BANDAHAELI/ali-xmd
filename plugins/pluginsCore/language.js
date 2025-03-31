const config = require('../../config');
const {existsSync,readFileSync} = require('fs');

var json = existsSync(__dirname+'/language/' + config.LANGUAGE + '.json') ? JSON.parse(readFileSync(__dirname+'/language/' + config.LANGUAGE + '.json')) : JSON.parse(readFileSync(__dirname+'/language/english.json'));

function getString(file) {
    return json['STRINGS'][file]; 
}

module.exports = {
    language: json,
    getString: getString
}
