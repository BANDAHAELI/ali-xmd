const database = require("./personal");

async function setData(jid, message, status, name) {
  try {
    let data = [];
    const results = await database.findAll({ where: { jid: jid, name: name } });
    if (results && results.length > 0) {
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        result.message = message;
        result.status = status;
        await result.save();
        data.push(result);
      }
    } else {
      const newRecord = await database.create({ jid, message, name, status }); 
      data.push(newRecord);
    }
    return data;
  } catch (error) {
    console.error("Error occurred while setting message and messageId:", error);
    return false;
  }
};

async function getData(jid) {
  try {
    const result = await database.findAll({
      where: {
        jid: jid
      }
    });
    if (!result) return null;
    const statusObject = {};
    result.forEach(greeting => {
      statusObject[greeting.name] = { message: greeting.message, jid: greeting.jid, status: greeting.status };
    });

    return statusObject;
  } catch (error) {
    console.error("Error occurred while getting greetings by jid:", error);
    return false;
  }
};

module.exports = {
    setData,
    getData
}