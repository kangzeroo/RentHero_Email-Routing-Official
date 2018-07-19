const rdsAPI = require('../api/rds/rds_api')
const sesAPI = require('../api/ses/ses_api')
const rerouteEmail = require('../api/proxy/reroute_email')
const s3API = require('../api/s3/s3_api')
const dynAPI = require('../api/dyn/dyn_api')
const FwdRequest = require('../api/proxy/forwarding_request')
const extractionAPI = require('../api/extraction/extraction_api')

const headers = {
  headers: {
    Authorization: `Bearer xxxxx`
  }
}

module.exports = function(event, context, callback){
  console.log('------ PROXY ROUTER LAMBDA ------')
  /*
      STEPS:
      1. Determine if this email is from a known landlord's staff account (tells us if this is a fwd email from landlord, or direct email from kijiji)
            - Make note because if it is forwarded from landlord, then our reply-to will differ
            - `meta.fromKnownLandlord = true || false`
      2. Determine which email client is sending this (eg. Gmail, Outlook, Yahoo, QQ, other)
            - Make note because this may affect headers and other MIME attributes
            - `meta.emailClient = 'UNKNOWN' || 'gmail' || 'outlook' || 'qq' || 'yahoo'`
      3. Determine if this email is a lead-->agent (CASE A) or agent-->lead (CASE B)
            - `meta.messageDirection = 'UNKNOWN' || 'leadToAgent' || 'agentToLead'`
      4. Determine where this lead is from (eg. Kijiji, Padmapper, Zumper, landlord forward, raw direct from tenant)
            - Make note because we can extract any URLs for hints on which ad the email is referring to
            - `meta.leadChannel = 'kijiji' || 'padmapper' || 'zumper' || 'mls' || 'direct_tenant' || 'landlord_forward'`
      5. Guess which ad this email is referring to (eg. known, UNKNOWN, open_to_suggestions)
            - Make note because this determines what kind of info we reply with, or whether they are open to suggestions
            - `meta.targetAd = '<AD_ID>' || 'UNKNOWN' || 'open_to_suggestions'`
      6. Check the 'Supervision Settings' for this ad to determine how we should respond
            - Eg. Should we send the message to the landlord for review, or should we directly reply and simply CC the landlord? Or maybe we can go full-auto and directly reply with CCing
            - `meta.supervisionSettings = {
                                            ad_id: 'UNKNOWN' || 'open_to_suggestions' || '<AD_ID>',
                                            reviewer_emails: [emailA, emailB],
                                            cc_emails: [emailA, emailB]
                                          }`
      7. Extract all the participants to this email and note their original email. Save those original emails and exchange them for alias emails (create a new alias if not already existing)
            - `meta.participants = participants` --> extracted from `extractionAPI.extractParticipants(sesEmail)`
      8. Check that we haven't already sent out SES emails for this given messageID (Gmail may send duplicate emails if you have multiple CCs, but hotmail wont)
            - `meta.alreadyHandled = false || true`

      CASE A (lead-->agent):
      9. Send out an exact copy of the received email with attachments, but using the alias emails
      10. Kaushika or the AI will receive the new email, and can respond accordingly. Keep all alias emails intact. From Kaushika's POV, she is only talking to aliasXYZ@renthero.cc

      CASE B (agent-->lead):
      9. Send out an exact copy of the received email with attachments, but replace the alias emails with the original emails. Add any 'Supervision Settings' for this ad if applicable.
      10. Leads will receive the new email and can respond accordingly. From the leads' POV, they are only talking to 'proxy@renthero.ai'

      EDGE CASES AND LIMITATIONS:
      - [EDGECASE - CannotDeterminePrimaryRecipient]
            - Unfortunetely we cannot reliably determine if an email with multiple to:address is intented for whom
            - eg. A lead uses hotmail to send an email to:heffe@renthero.ai,steve@renthero.ai --> we only get 1 email for both proxies (heffe, steve)
            - When we receive the SES email, hotmail does not tell us whether it is for heffe or steve. Thus we have to either guess or reply as both (heffe AND steve)
      - [LIMITATION - DoNothingOnCC]
            - When the renthero proxy email (heffe@renthero.ai) is CC'd instead of To/Fwd, we will do nothing
            - This is because the purpose of CCing is to keep the person in the loop, not necessarily to get a response from them
      - [LIMITATION - RespondToFirstFWDContact]
            - Unfortunetely when a landlord forwards a lead email directly to the renthero proxy email (heffe@renthero.ai), the AI will respond to the first email shown in the FWD history
            - This is because we cannot reliably determine who we should respond to from the headers, as the original lead email does not exist in the headers
            - However, the original lead email (from, to, date, subject) can be found in the Body of the email under `---------- Forwarded message ----------`, hence why we assume that the first person in the FWD history is who we respond to
      - [EDGECASE - CannotHaveMultipleProxies]
            - Unfortunetely we cannot process emails with multiple proxies (heffe@renthero.ai, steve@renthero.ai)
            - This is because it gets too damn messy and its not needed for MVP
            - We simply reply with "Unfortunetely you cannot send to multiple RentHero assistants in the same email thread. Please resend your email with only 1 RentHero Assistant"
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
  console.log('------ TO RENTHERO PROXY ------')
  const toProxies = participants.to.filter((p) => {
    return p.indexOf(process.env.PROXY_EMAIL) > -1
  })
  console.log(toProxies)
  console.log('------ CC RENTHERO PROXY ------')
  const ccProxies = participants.cc.filter((p) => {
    return p.indexOf(process.env.PROXY_EMAIL) > -1
  })
  console.log(ccProxies)
  console.log('------ INITIAL CUSTOM META DATA ABOUT EMAIL ------')
  const meta = {
    email_id: sesEmail.messageId,
    fromKnownLandlord: false, // or true
    emailClient: 'UNKNOWN' || 'gmail' || 'outlook' || 'qq' || 'yahoo',
    messageDirection: 'UNKNOWN' || 'leadToAgent' || 'agentToLead',
    leadChannel: 'kijiji' || 'padmapper' || 'zumper' || 'mls' || 'direct_tenant' || 'landlord_forward',
    targetAd: 'UNKNOWN' || 'open_to_suggestions' || '<AD_ID>',
    supervisionSettings: {
      ad_id: 'UNKNOWN' || 'open_to_suggestions' || '<AD_ID>',
      reviewer_emails: [],
      cc_emails: [],
    },
    participants: participants,
    alreadyHandled: false    // or true
  }
  console.log(meta)
  console.log('------ PROXY, ALIAS, AGENT ------')
  console.log(process.env.PROXY_EMAIL)
  console.log(process.env.ALIAS_EMAIL)
  console.log(process.env.AGENT_EMAIL)
  // ---------------------------------------------------------------



  // ---------------------------------------------------------------
  //                    THE MAIN LAMBDA FUNCTION
  // ---------------------------------------------------------------
  console.log('------ CHECKING IF THIS INCOMING EMAIL IS A REQUEST FOR EMAIL FORWARDING ------')
  if (FwdRequest.forwarding_request(participants)) {
    // redirect the email forwarding requests to admin@renthero.com
    FwdRequest.send_forwarding_request_email(`proxy_emails/${sesEmail.messageId}`, toProxies[0])
      .then((data) => {
        const response = {
          statusCode: 200,
          body: JSON.stringify({
            message: 'Successfully sent the forwarding request to our admin email',
            data: data,
          })
        }
        callback(null, response)
      })
      .catch((err) => {
        reportIssue(callback, err, context)
      })
  } else {
    console.log('------ CHECKING IF THERE ARE MULTIPLE RENTHERO PROXIES IN THIS EMAIL ------')
    // [EDGECASE - CannotHaveMultipleProxies]
    if ((toProxies && toProxies[0] && toProxies.length > 1) || (ccProxies && ccProxies[0] && ccProxies.length > 1)) {
      console.log('------ MULTIPLE RENTHERO PROXIES FOUND ------')
      console.log('TO: ', toProxies)
      console.log('CC: ', ccProxies)
      console.log('------ SENDING OUT THE ERROR EMAIL TO ORIGINAL SENDER ------')
      // Bad, we have multiple RentHero proxy emails in the same email thread (eg. heffe@renthero.ai, steve@renthero.ai)
      // Send back SES email to original sender with "Unfortunetely you cannot have multiple RentHero assistants in the same email thread. Please resend your email with only 1 RentHero Assistant"
      sesAPI.cannotHaveMultipleRentHeroProxies(participants)
            .then((data) => {
              const response = {
                statusCode: 200,
                body: JSON.stringify({
                  message: 'Successfully sent ERROR EMAIL to sender. Cannot have multiple RentHero proxy emails in the same thread.',
                  data: data,
                })
              }
              callback(null, response)
            })
            .catch((err) => {
              reportIssue(callback, err, context)
            })
    } else {
      console.log('------ AS EXPECTED, THERE ARE NOT MULTIPLE RENTHERO PROXIES IN THIS EMAIL ------')
      const proxyEmail = toProxies[0]
      // Good, we only have 1 RentHero proxy involved in this email thread
      // Yes the proxy@renthero.ai email exists in [to:address]
      console.log('------ CHECKING IF RENTHERO PROXY IS EVER MENTIONED IN THE [TO:ADDRESS] OR [CC:ADDRESS] ------')
      if (toProxies && toProxies[0] && toProxies.length === 1) {
        console.log('------ YES THE RENTHERO PROXY WAS FOUND IN THE [TO:ADDRESS] ------')
        // Check which direction the email is being sent. If its lead-->agent then we need to do lots of logic. If its agent-->lead then we simply reroute the email out
        // Note that it is implied that any `supervision_settings` have already been applied to a lead-->agent email and thus when agent replies, the appropriate [to:address] and [cc:address] have been applied
        extractionAPI.determineMessageDirection(participants.from, proxyEmail)
          .then((direction) => {
            meta.messageDirection = direction
            if (direction === 'leadToAgent') {
              console.log('------ HANDLING A LEAD --> AGENT EMAIL ------')
              return s3API.grabEmail(process.env.S3_BUCKET, `proxy_emails/${sesEmail.messageId}`)
                          .then((s3Email) => {
                            return extractionAPI.extractEmail(s3Email)
                          })
                          .then((extractedS3Email) => {
                                const checklist = [
                                  // results[0] - Is this a fwd from landlord or a completely seperate lead
                                  rdsAPI.checkIfKnownLandlordStaff(participants.from, proxyEmail),
                                  // results[1] - Is the lead's email client `gmail` or `outlook` ..etc
                                  extractionAPI.determineEmailClient(sesEmail),
                                  // results[2] - Where did this lead come from (eg. kijiji, zumper, direct_tenant)
                                  extractionAPI.determineLeadChannel(extractedS3Email, participants),
                                  // results[3] - which ad_id is this email referring to, and what are its supervision_settings?
                                  extractionAPI.determineTargetAdAndSupervisionSettings(extractedS3Email, participants, proxyEmail)
                                ]
                                return Promise.all(checklist)
                                              .then((results) => {
                                                console.log('------ GOT LATEST CUSTOM META DATA ABOUT EMAIL ------')
                                                meta.fromKnownLandlord = results[0].known
                                                meta.emailClient = results[1]
                                                meta.leadChannel = results[2].channel.channel_name
                                                meta.targetAd = results[3].found ? results[3].ad_id : 'UNKNOWN'
                                                meta.supervisionSettings = results[3].supervision_settings
                                                console.log(meta)
                                                // save the knowledge history of every participant to dynamodb
                                                return dynAPI.saveKnowledgeHistory(sesEmail, meta, participants, proxyEmail)
                                              })
                                              .then((data) => {
                                                console.log('------ SUCCESSFULLY SAVED KNOWLEDGE HISTORY OF PARTICIPANTS ------')
                                                console.log('------ GRABBING ALL THE ORIGINAL EMAILS OF PARTICIPANTS ------')
                                                // collect the original_emails to trade in for alias_emails
                                                const original_emails = []
                                                participants.to.forEach((to) => {
                                                  original_emails.push(to)
                                                })
                                                participants.from.forEach((from) => {
                                                  original_emails.push(from)
                                                })
                                                participants.cc.forEach((cc) => {
                                                  original_emails.push(cc)
                                                })
                                                participants.returnPath.forEach((returnPath) => {
                                                  original_emails.push(returnPath)
                                                })
                                                console.log('Original Emails: ', original_emails)
                                                // exchange original_emails for alias_emails
                                                return rdsAPI.grab_alias_emails(original_emails)
                                              })
                                              .then((aliasPairs) => {
                                                console.log('------ SUCCESSFULLY SWITCHED OUT ORIGINAL EMAILS FOR PROXY EMAILS ------')
                                                console.log(aliasPairs)
                                                if (meta.targetAd && meta.targetAd.toLowerCase() === 'UNKNOWN'.toLowerCase()) {
                                                  console.log('------ COULD NOT FIND A MATCHING AD_ID IN LEAD TO AGENT, NOW REROUTING EMAIL TO FALLBACK FLOW ------')
                                                  return rerouteEmail.sendOutFallbackProxyEmail(meta, extractedS3Email, participants, proxyEmail, aliasPairs)
                                                } else if (meta.targetAd) {
                                                  console.log('------ SUCCESSFULLY FOUND A MATCHING AD_ID, NOW REROUTING EMAIL TO NORMAL FLOW ------')
                                                  return rerouteEmail.sendOutAgentEmail(meta, extractedS3Email, participants, proxyEmail, aliasPairs)
                                                } else {
                                                  console.log('------ TARGET AD (AD_ID) IS UNDEFINED OR NULL ------')
                                                  return Promise.reject('meta.targetAd (aka ad_id) is null or undefined for this lead to agent email')
                                                }
                                              })
                                              .then((data) => {
                                                return Promise.resolve(data)
                                              })
                                              .catch((err) => {
                                                console.log('------ OH NO, AN ERROR OCCURRED (1) ------')
                                                console.log(err)
                                                return Promise.reject(err)
                                              })
                          })
                          .catch((err) => {
                            console.log('------ OH NO, AN ERROR OCCURRED (2) ------')
                            console.log(err)
                            return Promise.reject(err)
                          })
            } else if (direction === 'agentToLead') {
              console.log('------ HANDLING AN AGENT-->LEAD EMAIL ------')
              console.log('------ AGENT EMAIL BEING REROUTED TO ORIGINAL RECIPIENTS ------')
              // Forward this email back to all original recipients
              // should also check supervision_settings before actually sending out to leads
              let extractedS3Email
              return s3API.grabEmail(process.env.S3_BUCKET, `proxy_emails/${sesEmail.messageId}`)
                          .then((s3Email) => {
                            return extractionAPI.extractEmail(s3Email)
                          })
                          .then((s3Email) => {
                            extractedS3Email = s3Email
                            return extractionAPI.determineTargetAdAndSupervisionSettings(extractedS3Email, participants, proxyEmail)
                          })
                          .then((data) => {
                            meta.targetAd = data.found ? data.ad_id : 'UNKNOWN'
                            meta.supervisionSettings = data.supervision_settings
                            if (meta.targetAd && meta.targetAd.toLowerCase() === 'UNKNOWN'.toLowerCase()) {
                              console.log('------ COULD NOT FIND A MATCHING AD_ID IN AGENT TO LEAD, LETTING THIS AGENT EMAIL BE FORWARDED ------')
                              return rerouteEmail.sendOutLeadEmail(meta, extractedS3Email, data.supervision_settings, participants, proxyEmail)
                            } else if (meta.targetAd) {
                              console.log('------ SUCCESSFULLY FOUND A MATCHING AD_ID, NOW REROUTING EMAIL TO NORMAL FLOW ------')
                              return rerouteEmail.sendOutLeadEmail(meta, extractedS3Email, data.supervision_settings, participants, proxyEmail)
                            } else {
                              console.log('------ TARGET AD (AD_ID) IS UNDEFINED OR NULL ------')
                              return Promise.reject('meta.targetAd (aka ad_id) is null or undefined for this agent to lead email')
                            }
                          })
                          .then((data) => {
                            const response = {
                              statusCode: 200,
                              body: JSON.stringify({
                                message: 'Email was successfully routed from agent to lead',
                                data: data,
                              })
                            }
                            callback(null, response)
                          })
                          .catch((err) => {
                            reportIssue(callback, err, context)
                          })
            } else if (direction === 'fallbackAgentToLead') {
              console.log('------ HANDLING A FALLBACK AGENT-->LEAD EMAIL ------')
              console.log('------ FALLBACK AGENT EMAIL BEING REROUTED TO INTENDED RECIPIENTS ------')
              let extractedS3Email
              return s3API.grabEmail(process.env.S3_BUCKET, `proxy_emails/${sesEmail.messageId}`)
                          .then((s3Email) => {
                            return extractionAPI.extractEmail(s3Email)
                          })
                          .then((s3Email) => {
                            extractedS3Email = s3Email
                            return rerouteEmail.sendOutFallbackLeadEmail(meta, extractedS3Email, participants, proxyEmail)
                          })
                          .catch((err) => {
                            return Promise.reject(err)
                          })
            } else {
              console.log('------ CRITICAL FAILURE: COULD NOT DETERMINE THE DIRECTION OF THE EMAIL ------')
              return Promise.reject('Could not determine which direction this email was going')
            }
          })
          .then((results) => {
            console.log('------ SUCCESS: DONE EVERYTHING ------')
            const response = {
              statusCode: 200,
              body: JSON.stringify({
                message: 'Successfully sent out all emails',
                data: results,
              }),
            }
            callback(null, response)
          })
          .catch((err) => {
            console.log('------ OH NO, AN ERROR OCCURRED (3) ------')
            console.log(err)
            const response = {
              statusCode: 500,
              body: JSON.stringify({
                message: 'An error occurred!',
                data: err.data ? err.data : `An error occurred. Check AWS Cloudwatch with RequestID: ${context.awsRequestId} and LogStreamName: ${context.logStreamName}`,
              }),
            }
            reportIssue(callback, response, context)
          })
      } else if (ccProxies && ccProxies[0] && ccProxies.length > 1) {
        console.log('------ YES THE RENTHERO PROXY WAS FOUND IN THE [CC:ADDRESS] ------')
        console.log('------ SAVING THIS EMAIL TO KNOWLEDGE HISTORY BUT NOT DOING ANYTHING ELSE WITH IT ------')
        // No the proxy@renthero.ai email does not exist in [to:address] but does exist in [cc:address]
        // Simply save this email in the proxy's knowledge history
        s3API.grabEmail(process.env.S3_BUCKET, `proxy_emails/${sesEmail.messageId}`)
              .then((s3Email) => {
                return extractionAPI.extractEmail(s3Email)
              })
              .then((extractedS3Email) => {
                return extractionAPI.determineTargetAdAndSupervisionSettings(extractedS3Email, participants, proxyEmail)
              })
              .then((data) => {
                meta.targetAd = data.found ? data.ad_id : 'UNKNOWN'
                return dynAPI.saveKnowledgeHistory(sesEmail, meta, participants, proxyEmail)
              })
              .then((data) => {
                const response = {
                  statusCode: 200,
                  body: JSON.stringify({
                    message: 'Successfully saved knowledge history for this CCd proxy',
                    data: data,
                  })
                }
                callback(null, response)
              })
              .catch((err) => {
                reportIssue(callback, err, context)
              })
      } else {
        console.log('------ NO THE RENTHERO PROXY WAS NOT FOUND IN THE [TO:ADDRESS] OR [CC:ADDRESS] ------')
        reportIssue(callback, 'No Matching Proxy [to:address] or [cc:address] found', context)
      }
    }
  }
}

const reportIssue = (callback, err, context) => {
  console.log('------ REPORTING AN ISSUE... ------')
  sesAPI.sendErrorReportEmail(err, context)
    .then((data) => {
      callback(null, err)
    })
    .catch((fail) => {
      console.log('------ COULD NOT REPORT AN ISSUE... ------')
      console.log(fail)
      callback(null, fail)
    })
}
