const axios = require('axios')
const mailcomposer = require('mailcomposer')
const path = require('path')
const pathToAWSConfig = path.join(__dirname, '../..', 'creds', process.env.NODE_ENV, 'aws_config.json')
const aws_config = require(pathToAWSConfig)
const AWS = require('aws-sdk')
AWS.config.update(aws_config)


// From Agent to Lead
module.exports.sendForthEmails = function(mail){
  console.log('------ SENDING OUT THE EMAILS ------')
  const ses = new AWS.SES()
  const p = new Promise((res, rej) => {
    mail.build((err, message) => {
      if (err) {
        rej({ message: `Error creating raw email with mailcomposer: ${err}`, err: err })
      }
      const params = { RawMessage: { Data: message }}
      console.log('params: ', params)
      ses.sendRawEmail(params, function(err, data) {
        if (err) {
          rej({ message: `Error sending raw email with SES: ${err}`, err: err })
          return
        }
        console.log(`------ SES SUCCESSFULLY SENT FORTH EMAIL ------`)
        console.log(data)
        res(data)
      })
    })
  })
  return p
}

module.exports.cannotHaveMultipleRentHeroProxies = function(participants) {
  console.log(`------ SENDING OUT EMAIL ABOUT NO MULTIPLE RENTHERO PROXIES ------`)
  const p = new Promise((res, rej) => {
    const ses = new AWS.SES()
    const mail = mailcomposer({
      from: `no-reply${process.env.PROXY_EMAIL}`,
      replyTo: `no-reply${process.env.PROXY_EMAIL}`,
      to: participants.from,
      subject: 'Cannot have multiple RentHero Assistants in same email',
      text: 'You are receiving this message because you have attempted to include multiple RentHero assistants in the same email. Please resend your message with only 1 RentHero assistant max.'
    })
    mail.build((err, message) => {
      if (err) {
        rej({ message: `Error creating raw email with mailcomposer: ${err}`, err: err })
        return
      }
      const params = { RawMessage: { Data: message }}
      console.log('params: ', params)
      ses.sendRawEmail(params, function(err, data) {
        if (err) {
          rej({ message: `Error sending raw email with SES: ${err}`, err: err })
        }
        console.log(`------ SES SUCCESSFULLY SENT WARNING EMAIL ------`)
        console.log(data)
        res(data)
      })
    })
  })
  return p
}

module.exports.sendErrorReportEmail = function(err, context) {
  console.log(`------ SENDING OUT ERROR REPORT EMAIL ------`)
  const p = new Promise((res, rej) => {
    const ses = new AWS.SES()
    const mail = mailcomposer({
      from: `no-reply${process.env.PROXY_EMAIL}`,
      replyTo: `no-reply${process.env.PROXY_EMAIL}`,
      to: `admin@renthero.com`,
      subject: `Error in Proxy Router - See Cloudwatch RequestID: ${context.awsRequestId} and LogStreamName: ${context.logStreamName}`,
      text: JSON.stringify(err)
    })
    mail.build((err, message) => {
      if (err) {
        rej({ message: `Error creating raw email with mailcomposer: ${err}`, err: err })
        return
      }
      const params = { RawMessage: { Data: message }}
      console.log('params: ', params)
      ses.sendRawEmail(params, function(err, data) {
        if (err) {
          rej({ message: `Error sending raw email with SES: ${err}`, err: err })
        }
        console.log(`------ SES SUCCESSFULLY SENT ERROR REPORT EMAIL ------`)
        console.log(data)
        res(data)
      })
    })
  })
  return p
}
