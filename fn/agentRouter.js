const rdsAPI = require('../api/rds/rds_api')
const sesAPI = require('../api/ses/ses_api')
const rerouteEmail = require('../api/proxy/reroute_email')
const s3API = require('../api/s3/s3_api')
const dynAPI = require('../api/dyn/dyn_api')
const extractionAPI = require('../api/extraction/extraction_api')
const agentEmail = require('../api/agent/handle_agent_email')
const fallbackEmail = require('../api/agent/handle_fallback_email')

const headers = {
  headers: {
    Authorization: `Bearer xxxxx`
  }
}

module.exports = function(event, context, callback){
  console.log('------ AGENT ROUTER LAMBDA ------')
  /*
      STEPS:

  */

  // ---------------------------------------------------------------
  //                    INITIAL INFO GRABBING
  // ---------------------------------------------------------------
  console.log('------ LAMBDA EVENT OBJECT ------')
  console.log(event)
  console.log('------ LAMBDA CONTEXT OBJECT ------')
  console.log(context)
  console.log('------ SES EMAIL OBJECT ------')
  const sesEmail = event.Records[0].ses.mail
  console.log(sesEmail)
  console.log('------ EMAIL PARTICIPANTS ------')
  const participants = extractionAPI.extractParticipants(sesEmail)
  console.log(participants)
  /*
    participants = {
      to: toAddresses,
      from: fromAddresses,
      cc: ccAddresses,
      inReplyTo: inReplyToAddresses,
      returnPath: returnAddresses,
      messageID: messageIDAddress
    }
  */
  console.log('------ FYI: THERE SHOULD NOT BE MULTIPLE AGENTS RECEIVING THIS EMAIL ------')
  console.log('------ THIS CODE DOES NOT CHECK FOR MULTIPLE AGENTS, IT JUST ASSUMES ONLY 1 AGENT IS HERE ------')
  // extractionAPI.determineWhatTypeOfAgent(participants.to)
  //   .then((typeOfAgent) => {
  //     if (typeOfAgent === 'agent') {
  //       return agentEmail.handleAgentEmail()
  //     } else if (typeOfAgent === 'fallback') {
  //       return fallbackEmail.handleFallbackEmail()
  //     } else {
  //       return Promise.reject(`Unknown agent type: ${typeOfAgent}`)
  //     }
  //   })
  //   .then((data) => {
      const response = {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Received an email to @renthero.tech',
          data: data
        })
      }
      console.log('------ LAMBDA RESPONSE ------')
      console.log(response)
      console.log('------ DONE ------')
      callback(null, response)
    // })
    // .catch((err) => {
    //   console.log('------ A FATAL ERROR OCCURRED ------')
    //   callback(null, err)
    // })
}
