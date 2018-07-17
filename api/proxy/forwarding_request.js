const sesAPI = require('../ses/ses_api')
const mailcomposer = require('mailcomposer')
const s3API = require('../s3/s3_api')
const extractionAPI = require('../extraction/extraction_api')
const EMAIL_CLIENTS = require(`../../creds/${process.env.NODE_ENV}/email_clients`).email_clients

module.exports.forwarding_request = function(participants) {
  const sender = participants.from[0] || ''
  let isFwding = false
  console.log(EMAIL_CLIENTS().email_clients)
  console.log(sender)
  if (sender) {
    EMAIL_CLIENTS().email_clients.forEach((client) => {
      client.client_fwd_requests.forEach((re) => {
        if (sender === re) {
          isFwding = true
        }
      })
    })
  }
  return isFwding
}

module.exports.send_forwarding_request_email = function(s3_email_location, proxyEmail) {
  const p = new Promise((res, rej) => {
    console.log('------ SENDING OUT THE FORWARDING EMAIL ------')
    s3API.grabEmail(process.env.S3_BUCKET, s3_email_location)
        .then((s3Email) => {
          return extractionAPI.extractEmail(s3Email)
        })
        .then((extractedS3Email) => {
          const params = {
            // from: participants.from.map((from) => {
            //         return loopFindPair(from, aliasPairs)
            //       }),
            from: proxyEmail,
            replyTo: [proxyEmail],
            to: 'admin@renthero.com',
            cc: [],
            subject: extractedS3Email.subject,
            text: extractedS3Email.text,
            html: extractedS3Email.textAsHtml,
            attachments: extractedS3Email.attachments ? extractedS3Email.attachments.map((attc) => {
              return {
                filename: attc.filename,
                content: attc.content
              }
            }) : []
          }
          const mail = mailcomposer(params)
          console.log('------ CREATED THE RAW LEAD->FALLBACK AGENT EMAIL TO BE SENT OUT ------')
          console.log(params)
          console.log(mail)
          return sesAPI.sendForthEmails(mail)
        })
        .then((data) => {
          res(data)
        })
        .catch((err) => {
          rej(err)
        })
  })
  return p
}
