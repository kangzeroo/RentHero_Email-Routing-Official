'use strict';
const emailProxy = require('./fn/emailProxy')

module.exports.emailProxy = (event, context, callback) => {
  emailProxy(event, context, callback)
};
