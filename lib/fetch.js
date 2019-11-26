const axios = require('axios');

module.exports = function (url) {
  return axios.get(url);
};
