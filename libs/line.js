var axios = require("axios");
const qs = require("qs");

const line_token = process.env.line_token;

module.exports.sendLineNotify = async function sendLineNotify(message) {
  await sendChatNoReplyNotify(message);
}

async function sendChatNoReplyNotify(message) {
  var data = qs.stringify({
    'message': message
  });
  var config = {
    method: 'post',
    url: 'https://notify-api.line.me/api/notify',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': line_token
    },
    data: data
  };

  return await axios(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.log(error);
      return null;
    });
}