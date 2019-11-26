const {resolve} = require('path');
const {argv} = require('yargs');
const {assign} = require('lodash');
const baseConfig = require('./config');

let {config} = argv;

if (config) {
  config = require(resolve(process.cwd(), config));
}

config = assign(config, baseConfig);

module.exports = config;
