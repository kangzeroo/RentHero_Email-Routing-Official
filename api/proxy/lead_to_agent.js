const rdsAPI = require('../rds/rds_api')
const sesAPI = require('../ses/ses_api')
const s3API = require('../s3/s3_api')
const dynAPI = require('../dyn/dyn_api')
const extractionAPI = require('../extraction/extractionAPI')

module.exports.fn = function(rel, email, toAddress, fromAddress) {
  const p = new Promise((res, rej) => {
    console.log(`------ LEAD INQUIRY ------`)
    let relationship
    let formattedEmail
    rdsAPI.saveLeadRelationship(fromAddress, rel.proxy_email, rel.ai_email)
              .then((x) => {
                relationship = x
                return s3API.grabEmail(process.env.S3_BUCKET, `emails/${email.messageId}`)
              })
              .then((s3Email) => {
                return extractionAPI.extractEmail(s3Email)
              })
              .then((parsedEmail) => {
                formattedEmail = parsedEmail
                return sesAPI.forwardToAI(relationship, formattedEmail, toAddress)
              })
              .then((status) => {
                return dynAPI.saveMessage(
                  status.MessageId,      // sesFwdEmailID
                  email.messageId,                        // originalEmailID
                  email.timestamp,                        // originalEmailReceivedTime
                  `https://s3.amazonaws.com/${process.env.S3_BUCKET}/emails/${email.messageId}`, // s3FileURL
                  `emails/${email.messageId}`             // s3FileKeyname
                )
              })
              .then((data) => {
                console.log(`------ FINISHED SAVING THE DYN REFERENCE ------`)
                res(data)
              })
              .catch((err) => {
                console.log(`------ FAILED SOMEWHERE ALONG THE WAY (lead_to_agent.js) ------`)
                rej(err)
              })
  })
  return p
}
