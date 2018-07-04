'use strict';
const emailRouter = require('./fn/emailRouter')
const ccRouter = require('./fn/ccRouter')

module.exports.emailRouter = (event, context, callback) => {
  emailRouter(event, context, callback)
};

module.exports.ccRouter = (event, context, callback) => {
  ccRouter(event, context, callback)
};
