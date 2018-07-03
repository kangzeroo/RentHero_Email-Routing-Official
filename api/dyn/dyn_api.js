const axios = require('axios')
const DYN_MS = require('../API_URLS').DYN_MS
const moment = require('moment')
const extractionAPI = require('../extraction/extraction_api')

module.exports.saveEmailReferences = function(sesFwdEmailID, originalEmailID, repliedEmailID, senderEmail, originalEmailReceivedTime){
  console.log(`------ SAVING MESSAGE REFERENCE TO DYNAMODB ------`)
  console.log(sesFwdEmailID)
  console.log(originalEmailID)
  console.log(repliedEmailID)
  console.log(senderEmail)
  console.log(originalEmailReceivedTime)
  const forSaves = [
    {
      'EMAIL_ID': originalEmailID,
      'REPLIED_EMAIL_ID': repliedEmailID,
      'SENDER_EMAIL_ADDR': senderEmail,
      'TIMESTAMP': originalEmailReceivedTime
    },
    {
      'EMAIL_ID': sesFwdEmailID,
      'REPLIED_EMAIL_ID': originalEmailID,
      'SENDER_EMAIL_ADDR': senderEmail,
      'TIMESTAMP': moment().toISOString()
    }
  ]
  console.log(`------ ABOUT TO SAVE TO DYN ------`)
  console.log(forSaves)
  const headers = {
    headers: {
      Authorization: `Bearer xxxx`
    }
  }
  const p = new Promise((res, rej) => {
    axios.post(`${DYN_MS}/saveEmailReferences`, { forSaves: forSaves }, headers)
      .then((data) => {
        console.log(`------ Successful POST/saveEmailReferences ------`)
        console.log(data.data)
        res()
      })
      .catch((err) => {
        console.log('------> Failed POST/saveEmailReferences')
        console.log(err)
        rej(err)
      })
  })
  return p
}

module.exports.getEmailReference = function(formattedEmail, sender_email) {
  console.log(`------ ABOUT TO GET EMAIL REFERENCE FROM DYN ------`)
  const email_id = extractionAPI.extractReplyToID(formattedEmail)
  console.log(email_id)
  const headers = {
    headers: {
      Authorization: `Bearer xxxx`
    }
  }
  const p = new Promise((res, rej) => {
    axios.post(`${DYN_MS}/getEmailReference`, { email_id: email_id, sender_email: sender_email }, headers)
      .then((data) => {
        console.log(`------ Successful POST/getEmailReference ------`)
        console.log(data.data)
        res(data.data)
      })
      .catch((err) => {
        console.log('------> Failed POST/getEmailReference')
        console.log(err)
        rej(err)
      })
  })
  return p
}
