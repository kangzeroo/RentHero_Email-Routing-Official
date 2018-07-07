'use strict';
const proxyRouter = require('./fn/proxyRouter')
const aliasRouter = require('./fn/aliasRouter')
const agentRouter = require('./fn/agentRouter')

module.exports.proxyRouter = (event, context, callback) => {
  proxyRouter(event, context, callback)
};

module.exports.aliasRouter = (event, context, callback) => {
  aliasRouter(event, context, callback)
};

module.exports.agentRouter = (event, context, callback) => {
  agentRouter(event, context, callback)
};
