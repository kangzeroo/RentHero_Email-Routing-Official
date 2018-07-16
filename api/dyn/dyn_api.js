const axios = require('axios')
const DYN_MS = require('../API_URLS').DYN_MS
const moment = require('moment')
const uuid = require('uuid')
const extractionAPI = require('../extraction/extraction_api')

const EMAIL_ROLES = {
  TO: 'to',
  FROM: 'from',
  CC: 'cc',
  IN_REPLY_TO: 'inReplyTo',
  RETURN_PATH: 'returnPath'
}

// Save participant memories to DYN
module.exports.saveKnowledgeHistory = function(sesEmail, meta, participants, proxyEmail) {
  console.log('------ SAVING KNOWLEDGE HISTORY OF PARTICIPANTS ------')
  const headers = {
    headers: {
      Authorization: `Bearer xxxx`
    }
  }
  const memories = []
  participants.to.forEach((to) => {
    memories.push({
      'USER_EMAIL': to,
      'HISTORY_ID': uuid.v4(),
      'REGULAR_MESSAGE_ID': participants.messageID[0],
      'SES_MESSAGE_ID': sesEmail.messageId,
      'AD_ID': meta.targetAd,
      'ROLE': EMAIL_ROLES.TO,
      'TIMESTAMP': moment().toISOString(),
      'PROXY_EMAIL': proxyEmail
    })
  })
  participants.from.forEach((from) => {
    memories.push({
      'USER_EMAIL': from,
      'HISTORY_ID': uuid.v4(),
      'REGULAR_MESSAGE_ID': participants.messageID[0],
      'SES_MESSAGE_ID': sesEmail.messageId,
      'AD_ID': meta.targetAd,
      'ROLE': EMAIL_ROLES.FROM,
      'TIMESTAMP': moment().toISOString(),
      'PROXY_EMAIL': proxyEmail
    })
  })
  participants.cc.forEach((cc) => {
    memories.push({
      'USER_EMAIL': cc,
      'HISTORY_ID': uuid.v4(),
      'REGULAR_MESSAGE_ID': participants.messageID[0],
      'SES_MESSAGE_ID': sesEmail.messageId,
      'AD_ID': meta.targetAd,
      'ROLE': EMAIL_ROLES.CC,
      'TIMESTAMP': moment().toISOString(),
      'PROXY_EMAIL': proxyEmail
    })
  })
  participants.inReplyTo.forEach((inReply) => {
    memories.push({
      'USER_EMAIL': inReply,
      'HISTORY_ID': uuid.v4(),
      'REGULAR_MESSAGE_ID': participants.messageID[0],
      'SES_MESSAGE_ID': sesEmail.messageId,
      'AD_ID': meta.targetAd,
      'ROLE': EMAIL_ROLES.IN_REPLY_TO,
      'TIMESTAMP': moment().toISOString(),
      'PROXY_EMAIL': proxyEmail
    })
  })
  participants.returnPath.forEach((retP) => {
    memories.push({
      'USER_EMAIL': retP,
      'HISTORY_ID': uuid.v4(),
      'REGULAR_MESSAGE_ID': participants.messageID[0],
      'SES_MESSAGE_ID': sesEmail.messageId,
      'AD_ID': meta.targetAd,
      'ROLE': EMAIL_ROLES.RETURN_PATH,
      'TIMESTAMP': moment().toISOString(),
      'PROXY_EMAIL': proxyEmail
    })
  })
  console.log(memories)
  const p = new Promise((res, rej) => {
    axios.post(`${DYN_MS}/insert_knowledge_history`, { ses_email_id: sesEmail.messageId, memories: memories }, headers)
      .then((data) => {
        console.log(`------ Successful POST/insert_knowledge_history ------`)
        console.log(data.data)
        res(data.data)
      })
      .catch((err) => {
        console.log('------> Failed POST/insert_knowledge_history')
        console.log(err)
        rej(err)
      })
  })
  return p
}


module.exports.collectKnowledgeHistory = function() {
  console.log(`------ COLLECTING KNOWLEDGE HISTORY FROM DYNAMODB ------`)
  const p = new Promise((res, rej) => {
    console.log(`------ FINISHED COLLECTING KNOWLEDGE HISTORY FROM DYNAMODB (Skipped for now) ------`)
    res({
      title: 'collectKnowledgeHistory',
      history: []
    })
  })
  return p
}

module.exports.save_cleaned_convo = function(item) {
  const headers = {
    headers: {
      Authorization: `Bearer xxxx`
    }
  }
  const p = new Promise((res, rej) => {
    axios.post(`${DYN_MS}/save_cleaned_convo`, item, headers)
      .then((data) => {
        console.log(`------ Successful POST/save_cleaned_convo ------`)
        console.log(data.data)
        res(data.data)
      })
      .catch((err) => {
        console.log('------> Failed POST/save_cleaned_convo')
        console.log(err)
        rej(err)
      })
  })
  return p
}
