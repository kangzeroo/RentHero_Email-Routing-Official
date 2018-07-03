const rdsAPI = require('../rds/rds_api')
const sesAPI = require('../ses/ses_api')
const s3API = require('../s3/s3_api')
const dynAPI = require('../dyn/dyn_api')
const extractionAPI = require('../extraction/extraction_api')

// agent to lead
module.exports.fn = function(rel, email, toAddress, fromAddress) {
  const p = new Promise((res, rej) => {
    console.log('========> AI replying...')
    let formattedEmail
    s3API.grabEmail(process.env.S3_BUCKET, `emails/${email.messageId}`)
              .then((s3Email) => {
                return extractionAPI.extractEmail(s3Email)
              })
              .then((extractedEmail) => {
                formattedEmail = extractedEmail
                return dynAPI.getEmailReference(formattedEmail, fromAddress)
              })
              .then((email_ref) => {
                return sesAPI.forwardToLead(email_ref, formattedEmail, toAddress)
              })
              .then((status) => {
                return dynAPI.saveEmailReferences(
                  status.MessageId,                       // sesFwdEmailID
                  email.messageId,                        // originalEmailID
                  extractionAPI.extractReplyToID(formattedEmail),                         // repliedEmailID
                  fromAddress,                            // senderEmail
                  email.timestamp                        // originalEmailReceivedTime
                )
              })
              .then((data) => {
                console.log(`------ FINISHED SAVING THE DYN REFERENCE ------`)
                res(data)
              })
              .catch((err) => {
                console.log(`------ FAILED SOMEWHERE ALONG THE WAY (agent_to_lead.js) ------`)
                rej(err)
              })
  })
  return p
}
