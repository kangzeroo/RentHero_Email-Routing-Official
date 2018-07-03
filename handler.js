'use strict';
const emailRouter = require('./fn/emailRouter')

module.exports.emailRouter = (event, context, callback) => {
  emailRouter(event, context, callback)
};
