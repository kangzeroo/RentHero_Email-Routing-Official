const rdsAPI = require('../rds/rds_api')
const sesAPI = require('../ses/ses_api')
const s3API = require('../s3/s3_api')
const dynAPI = require('../dyn/dyn_api')
const extractionAPI = require('../extraction/extractionAPI')

module.exports.fn = function(rel, email, toAddress, fromAddress) {
  const p = new Promise((res, rej) => {
    console.log('========> AI replying...')
    s3API.grabEmail(process.env.S3_BUCKET, `emails/${email.messageId}`)
              .then((s3Email) => {
                return extractionAPI.extractEmail(s3Email)
              })
              .then((data) => {
                return dynAPI.getMessage('PREVIOUS_MESSAGE_ID___grab_from_field:inReplyTo')
              })
              .then((data) => {
                return sesAPI.forwardToLead(relationship, email)
              })
              .then((data) => {
                return dynAPI.saveMessage(
                  // sesFwdEmailID
                  // originalEmailID
                  // originalEmailReceivedTime
                  // s3FileURL
                  // s3FileKeyname
                )
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
