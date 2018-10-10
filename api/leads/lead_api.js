const moment = require('moment')
const rdsAPI = require('../rds/rds_api')
const dynAPI = require('../dyn/dyn_api')
const s3API = require('../s3/s3_api')
const axios = require('axios')
const PARSE_EMAIL_API = require(`../../creds/${process.env.NODE_ENV}/API_URLS`).PARSE_EMAIL_API

module.exports.handleIncomingLead = function(meta, participants, proxyEmail, agentEmail, attachments) {
  console.log('====handleIncomingLead')
  const p = new Promise((res, rej) => {
      // checking is done in the backend
      rdsAPI.save_lead_to_db(participants.from[0], proxyEmail, meta.leadChannel, meta.about_lead)
        .then((data) => {
          console.log(data)
          let convo_id = data.convo_id
            console.log('CONVO ID: ', convo_id)
          if (attachments) {
            console.log('ATTACHMENTS EXIST: ', attachments)
            return s3API.batchUploadFilesToS3(attachments, convo_id)
                    .then((fileData) => {
                      console.log('fileData: ', fileData)
                      return module.exports.saveLeadMessageToDB(meta.email_id, data.lead_id, participants.from[0], proxyEmail, agentEmail, meta.leadChannel, fileData)
                    })
          } else {
            return module.exports.saveLeadMessageToDB(meta.email_id, data.lead_id, participants.from[0], proxyEmail, agentEmail, meta.leadChannel)
          }
        })
        .then(() => {
          res()
        })
        .catch((err) => {
          rej(err)
        })
  })
  return p
}

module.exports.saveLeadMessageToDB = function(email_id, lead_id, lead_email, proxyEmail, agentEmail, leadChannel, attachments) {
  const p = new Promise((res, rej) => {
    let convo
    let proxy_id
    let agent_id
    module.exports.parse_email_convo(`proxy_emails/${email_id}`, leadChannel)
      .then((clean_convo) => {
        convo = clean_convo
        return rdsAPI.get_proxy_id(proxyEmail)
      })
      .then((pid) => {
        proxy_id = pid
        return rdsAPI.get_agent_id(agentEmail)
      })
      .then((aid) => {
        agent_id = aid
        const message = convo.data[0] && convo.data[0].message && convo.data[0].message.length > 0 ? convo.data[0].message.join(' \n\r ') : ''
        return dynAPI.save_cleaned_convo({
          SES_MESSAGE_ID: email_id || 'MISSING',
          SENDER_ID: lead_id || 'MISSING',
          SENDER_CONTACT: lead_email || 'MISSING',
          SENDER_TYPE: 'LEAD_ID' || 'MISSING',
          RECEIVER_ID: agent_id || 'MISSING',
          RECEIVER_CONTACT: agentEmail || 'MISSING',
          RECEIVER_TYPE: 'AGENT_ID',
          TIMESTAMP: moment().toISOString(),
          MEDIUM: 'EMAIL',
          URL: `https://s3.amazonaws.com/${process.env.S3_BUCKET}/proxy_emails/${email_id}`,
          PROXY_ID: proxy_id || 'MISSING',
          PROXY_CONTACT: proxyEmail || 'MISSING',
          MESSAGE: message || 'MISSING',
          SEEN: '1969-12-31T19:00:00-05:00',
          HANDLED: false,
          ATTACHMENTS: attachments && attachments.length > 0 ? attachments : 'NONE'
        })
      })
      .then(() => {
        res()
      })
      .catch((err) => {
        rej(err)
      })
  })
  return p
}

module.exports.saveAgentResponseToDB = function(meta, original_lead_email, proxyEmail, agentEmail, attachments) {
  const p = new Promise((res, rej) => {
    console.log(agentEmail)
    let convo
    let lead_id
    let proxy_id
    let agent_id
    rdsAPI.get_lead_id_from_db(original_lead_email, proxyEmail)
      .then((found_lead_id) => {
        lead_id = found_lead_id
        return module.exports.parse_email_convo(`proxy_emails/${meta.email_id}`, meta.leadChannel)
      })
      .then((clean_convo) => {
        convo = clean_convo
        return rdsAPI.get_proxy_id(proxyEmail)
      })
      .then((pid) => {
        proxy_id = pid
        return rdsAPI.get_agent_or_operator(agentEmail)
      })
      .then((data) => {
        // agent_id = data.agent_id
        console.log('----------- DATA YO')
        console.log(convo)
        const message = convo.data[0] && convo.data[0].message && convo.data[0].message.length > 0 ? convo.data[0].message.join(' \n\r ') : ''
        console.log({
          SES_MESSAGE_ID: meta.email_id,
          SENDER_ID: data.agent_id || data.operator_id,
          SENDER_CONTACT: agentEmail,
          SENDER_TYPE: data.type,
          RECEIVER_ID: lead_id,
          RECEIVER_CONTACT: original_lead_email,
          RECEIVER_TYPE: 'LEAD_ID',
          TIMESTAMP: moment().toISOString(),
          MEDIUM: 'EMAIL',
          URL: `https://s3.amazonaws.com/${process.env.S3_BUCKET}/proxy_emails/${meta.email_id}`,
          PROXY_ID: proxy_id,
          PROXY_CONTACT: proxyEmail,
          MESSAGE: message,
          SEEN: '1969-12-31T19:00:00-05:00',
          HANDLED: false,
          ATTACHMENTS: attachments && attachments.length > 0 ? attachments : 'NONE'
        })
        return dynAPI.save_cleaned_convo({
          SES_MESSAGE_ID: meta.email_id,
          SENDER_ID: data.agent_id || data.operator_id,
          SENDER_CONTACT: agentEmail,
          SENDER_TYPE: data.type,
          RECEIVER_ID: lead_id,
          RECEIVER_CONTACT: original_lead_email,
          RECEIVER_TYPE: 'LEAD_ID',
          TIMESTAMP: moment().toISOString(),
          MEDIUM: 'EMAIL',
          URL: `https://s3.amazonaws.com/${process.env.S3_BUCKET}/proxy_emails/${meta.email_id}`,
          PROXY_ID: proxy_id,
          PROXY_CONTACT: proxyEmail,
          MESSAGE: message,
          SEEN: '1969-12-31T19:00:00-05:00',
          HANDLED: false,
          ATTACHMENTS: attachments && attachments.length > 0 ? attachments : 'NONE'
        })
      })
      .then(() => {
        res()
      })
      .catch((err) => {
        rej(err)
      })
  })
  return p
}

module.exports.parse_email_convo = function(email_location, leadChannel) {
  const headers = {
    headers: {
      Authorization: `Bearer xxxx`
    }
  }
  const p = new Promise((res, rej) => {
    axios.post(`${PARSE_EMAIL_API}`, { message_location: email_location, lead_channel: leadChannel.channel_name }, headers)
      .then((data) => {
        console.log(`------ Successful POST/${PARSE_EMAIL_API} ------`)
        console.log(data.data)
        res(data.data)
      })
      .catch((err) => {
        console.log(`------> Failed POST/${PARSE_EMAIL_API}`)
        console.log(err)
        rej(err)
      })
  })
  return p
}
