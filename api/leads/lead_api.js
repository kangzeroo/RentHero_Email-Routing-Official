const moment = require('moment')
const rdsAPI = require('../rds/rds_api')
const dynAPI = require('../dyn/dyn_api')
const axios = require('axios')
const PARSE_EMAIL_API = require('../API_URLS').PARSE_EMAIL_API

module.exports.handleIncomingLead = function(meta, participants, proxyEmail, agentEmail) {
  const p = new Promise((res, rej) => {
    rdsAPI.save_lead_to_db(participants.from[0], proxyEmail, meta.leadChannel)
        .then((lead_id) => {
          return module.exports.saveLeadMessageToDB(meta.email_id, lead_id, participants[0], proxyEmail, agentEmail)
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

module.exports.saveLeadMessageToDB = function(email_id, lead_id, lead_email, proxyEmail, agentEmail) {
  const p = new Promise((res, rej) => {
    let convo
    let proxy_id
    let agent_id
    module.exports.parse_email_convo(`proxy_emails/${email_id}`)
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
        const message = convo.data[0] && convo.data[0].message && convo.data[0].message.length > 0 ? convo.data[0].message.join(' ') : ''
        return dynAPI.save_cleaned_convo({
          SES_MESSAGE_ID: email_id,
          SENDER_ID: lead_id,
          SENDER_CONTACT: lead_email,
          SENDER_TYPE: 'LEAD_ID',
          RECEIVER_ID: proxy_id,
          RECEIVER_CONTACT: proxyEmail,
          RECEIVER_TYPE: 'PROXY_ID',
          TIMESTAMP: moment().toISOString(),
          MEDIUM: 'EMAIL',
          SAID_BY: 'LEAD',
          MESSAGE: message

         'SES_MESSAGE_ID': 'DSAFJLSDFJLSD',
         'SENDER_ID': 'adsfsdf-43ifhsdf-sdfho',
         'SENDER_CONTACT': 'agent@renthero.tech' || '5194673367',
         'SENDER_TYPE': 'AGENT_ID',
         'RECEIVER_ID': 'ljasdf-43g-dfgfs-sf',
         'RECEIVER_CONTACT': 'jlasjdf@kts.kijiji.ca' || '5194675467',
         'RECEIVER_TYPE': 'LEAD_ID',
         'TIMESTAMP': 'moment().toISOString()',
         'MEDIUM': 'EMAIL' || 'SMS',
         'PROXY_ID': 1,
         'PROXY_CONTACT': 'alsdjfl@flexximail.org',
         'MESSAGE': 'hello, this is the message'
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

module.exports.saveAgentResponseToDB = function(meta, original_lead_email, proxyEmail, agentEmail) {
  const p = new Promise((res, rej) => {
    let convo
    let lead_id
    rdsAPI.get_lead_id_from_db(original_lead_email, proxyEmail)
      .then((found_lead_id) => {
        let lead_id = found_lead_id
        return module.exports.parse_email_convo(`proxy_emails/${meta.email_id}`)
      })
      .then((clean_convo) => {
        convo = clean_convo
        return rdsAPI.get_proxy_id(proxyEmail)
      })
      .then((proxy_id) => {
        const message = convo.data[0] && convo.data[0].message && convo.data[0].message.length > 0 ? convo.data[0].message.join(' ') : ''
        return dynAPI.save_cleaned_convo({
          SES_MESSAGE_ID: meta.email_id,
          SENDER_ID: proxy_id,
          SENDER_CONTACT: proxyEmail,
          RECEIVER_ID: lead_id,
          RECEIVER_CONTACT: original_lead_email,
          TIMESTAMP: moment().toISOString(),
          MEDIUM: 'EMAIL',
          SAID_BY: 'AGENT',
          MESSAGE: message
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

module.exports.parse_email_convo = function(email_location) {
  const headers = {
    headers: {
      Authorization: `Bearer xxxx`
    }
  }
  const p = new Promise((res, rej) => {
    axios.post(`${PARSE_EMAIL_API}`, { message_location: email_location }, headers)
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
