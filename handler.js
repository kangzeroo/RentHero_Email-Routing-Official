'use strict';
const emailProxy = require('./fn/emailProxy')
const emailRouter = require('./fn/emailRouter')

module.exports.emailProxy = (event, context, callback) => {
  emailProxy(event, context, callback)
};

module.exports.emailRouter = (event, context, callback) => {
  emailRouter(event, context, callback)
};
