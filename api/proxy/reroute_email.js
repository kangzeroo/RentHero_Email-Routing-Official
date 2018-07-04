const rdsAPI = require('../rds/rds_api')
const sesAPI = require('../ses/ses_api')
const s3API = require('../s3/s3_api')
const mailcomposer = require('mailcomposer')

// reroute email from lead to agent
module.exports.sendOutAgentEmail = function(meta, extractedS3Email, participants, proxyEmail, proxyPairs) {
  console.log('------ REROUTING AN EMAIL FROM LEAD-->AGENT ------')
  const p = new Promise((res, rej) => {
    console.log('meta: ', meta)
    console.log('extractedS3Email: ', extractedS3Email)
    console.log('participants: ', participants)
    console.log('proxyEmail: ', proxyEmail)
    console.log('proxyPairs: ', proxyPairs)
    // Now with all the data, we can do proper routing
    // These following scenerios are already covered by emailRouter.js
    //     - multiple renthero proxies not allowed (eg. To:heffe@renthero.ai, CC:steve@renthero.ai)
    //     - agent-->lead response is a simple redirect with all participants intact and directly converted to original emails
    //     - lead-->agent response is a simple redirect with all participants intact and directly converted to proxy emails
    //
    // These are currently known scenerios to be handled here in reroute_email.js
    //     0. All scenerios
    //            - check if this email has been handled already (For now we skip)
    //            - save to dynamodb KNOWLEDGE_HISTORY the emails and roles of all participants
    //            - switch out original/alias emails and redirect outwards
    //            - send out the email to the right people (aliases + to:Address from ad_id)
    //     1. supervision_settings - requires that some emails be CC'd or placed as the To:receipient. However this is really only done on agent-->lead emails rather than lead-->agent emails as seen here (For now we skip)
    //     2. lead_channel - requires that some emails be sent to a custom REST endpoint for processing. These REST endpoints differ per lead_channel. (For now we skip)

    if (meta.fromKnownLandlord) {
      // we can assume that this is a message forwarded to the proxy, and thus should reroute accordingly (find proof of FWD in Body and set to:address as the fwd.history[0].from)
      console.log('------ THIS EMAIL WAS SENT FROM A KNOWN LANDLORD STAFF EMAIL. WE WILL TREAT IT AS A FORWARDED INQUIRY. CHECK THE FWD BODY FOR A TO:ADDRESS TO AUTO-RESPOND TO ------')
      console.log('------ NOTE THAT WE HANDLE THAT LOGIC ON THE RECEIVING AGENT EMAIL ------')
    } else {
      // the actual email rerouting, when the message is not from a known landlord (we can find the to:address in the headers, rather than in the FWD body like in the above case)
      console.log('------ THIS EMAIL WAS NOT SENT FROM A KNOWN LANDLORD STAFF EMAIL. WE WILL TREAT IT AS A REGULAR INQUIRY ------')
      console.log('------ NOTE THAT WE HANDLE THAT LOGIC ON THE RECEIVING AGENT EMAIL ------')
    }
    console.log('------ GRABBING THE APPROPRIATE AGENT EMAIL FOR THIS AD_ID ------')
    rdsAPI.get_agent_for_ad(meta.targetAd)
          .then((data) => {
            console.log('------ FOUND THE APPROPRIATE AGENT EMAIL ------')
            const agent_email = data.agent_email
            console.log(agent_email)
            const params = {}
            // FROM
            const x_from = participants.from.map((from) => {
              return loopFindPair(from, proxyPairs)
            })
            if (x_from && x_from.length > 0) {
              params.from = x_from
            }
            // CC (will also duplicate the from:address, with a `TAG___`)
            const leadEmailDuplicate = x_from[0]
            const x_cc = participants.cc.map((cc) => {
              return loopFindPair(cc, proxyPairs)
            }).concat(leadEmailDuplicate ? [`TAG___${leadEmailDuplicate}`] : [])
            if (x_cc && x_cc.length > 0) {
              params.cc = x_cc
            }
            // REPLY TO
            const x_replyTo = proxyEmail
            if (x_replyTo) {
              params.replyTo = proxyEmail
            }
            // TO
            const x_to = [agent_email].concat(participants.to.filter((to) => {
              return to !== proxyEmail
            }).map((to) => {
              return loopFindPair(to, proxyPairs)
            }))
            if (x_to && x_to.length > 0) {
              params.to = x_to
            }
            // The rest
            params.subject = extractedS3Email.subject,
            params.text = extractedS3Email.text,
            params.html = extractedS3Email.textAsHtml,
            params.attachments = extractedS3Email.attachments.map((attc) => {
              return {
                filename: attc.filename,
                content: attc.content
              }
            })
            const mail = mailcomposer(params)
            console.log('------ CREATED THE RAW LEAD->AGENT EMAIL TO BE SENT OUT ------')
            console.log(params)
            console.log(mail)
            console.log(mail._headers)
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

// lead to agent, could not find an ad_id, goes to this fallback
module.exports.sendOutFallbackAgentEmail = function(meta, extractedS3Email, participants, proxyEmail, proxyPairs) {
  const p = new Promise((res, rej) => {
    console.log('------ REROUTING A LEAD --> FALLBACK AGENT EMAIL ------')
    console.log('meta: ', meta)
    console.log('extractedS3Email: ', extractedS3Email)
    console.log('participants: ', participants)
    console.log('proxyEmail: ', proxyEmail)
    console.log('proxyPairs: ', proxyPairs)
    if (meta.fromKnownLandlord) {
      // we can assume that this is a message forwarded to the proxy, and thus should reroute accordingly (find proof of FWD in Body and set to:address as the fwd.history[0].from)
      console.log('------ THIS EMAIL WAS SENT FROM A KNOWN LANDLORD STAFF EMAIL. WE WILL TREAT IT AS A FORWARDED INQUIRY. CHECK THE FWD BODY FOR A TO:ADDRESS TO AUTO-RESPOND TO ------')
      console.log('------ NOTE THAT WE HANDLE THAT LOGIC ON THE RECEIVING AGENT EMAIL ------')
    } else {
      // The actual email rerouting, when the message is not from a known landlord (we can find the to:address in the headers, rather than in the FWD body like in the above case)
      console.log('------ THIS EMAIL WAS NOT SENT FROM A KNOWN LANDLORD STAFF EMAIL. WE WILL TREAT IT AS A REGULAR INQUIRY ------')
      console.log('------ NOTE THAT WE HANDLE THAT LOGIC ON THE RECEIVING AGENT EMAIL ------')
    }
    console.log('------ GRABBING THE FALLBACK AGENT EMAIL FOR THIS PROXY_EMAIL ------')
    rdsAPI.getFallbackAgentEmailForProxy(extractedS3Email, proxyEmail)
          .then((fallback_agent_email) => {
            console.log('------ FOUND THE FALLBACK AGENT EMAIL FOR THIS AD_ID ------')
            console.log('fallback_agent_email: ', fallback_agent_email)
            // CC (will also duplicate the from:address, with a `TAG___`)
            const leadEmailDuplicate = participants.from.map((from) => {
                                        return loopFindPair(from, proxyPairs)
                                      })[0]
            const params = {
              from: participants.from.map((from) => {
                      return loopFindPair(from, proxyPairs)
                    }),
              replyTo: proxyEmail,
              to: [fallback_agent_email].concat(participants.to.filter((to) => {
                    return to !== proxyEmail
                  }).map((to) => {
                    return loopFindPair(to, proxyPairs)
                  })),
              cc: participants.cc.map((cc) => {
                    return loopFindPair(cc, proxyPairs)
                  }).concat(leadEmailDuplicate ? [`TAG___${leadEmailDuplicate}`] : []),
              subject: extractedS3Email.subject,
              text: extractedS3Email.text,
              html: extractedS3Email.textAsHtml,
              attachments: extractedS3Email.attachments.map((attc) => {
                return {
                  filename: attc.filename,
                  content: attc.content
                }
              })
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

// for agent --> lead email forwarding
module.exports.sendOutLeadEmail = function(extractedS3Email, supervision_settings, participants, proxyEmail) {
  const p = new Promise((res, rej) => {
    console.log('------ REROUTING AN AGENT --> LEAD EMAIL ------')
    console.log('extractedS3Email: ', extractedS3Email)
    console.log('participants: ', participants)
    console.log('proxyEmail: ', proxyEmail)
    const alias_emails = []
    participants.to.filter((to) => {
      return to.toLowerCase().indexOf(process.env.ALIAS_EMAIL) > -1
    }).forEach((to) => {
      alias_emails.push(to)
    })
    participants.from.filter((from) => {
      return from.toLowerCase().indexOf(process.env.ALIAS_EMAIL) > -1
    }).forEach((from) => {
      alias_emails.push(from)
    })
    participants.returnPath.filter((cc) => {
      return cc.toLowerCase().indexOf(process.env.ALIAS_EMAIL) > -1
    }).forEach((returnPath) => {
      alias_emails.push(returnPath)
    })
    participants.cc.filter((cc) => {
      return cc.toLowerCase().indexOf(process.env.ALIAS_EMAIL) > -1 && cc.indexOf('TAG___') === -1
    }).forEach((cc) => {
      alias_emails.push(cc)
    })
    const receipient = participants.cc.filter((cc) => {
      return cc.indexOf('TAG___') > -1
    })[0]
    let lead_email
    if (receipient){
      lead_email = receipient.slice('TAG___'.length)
      alias_emails.push(lead_email)
    }
    console.log('------ GRABBING THE ORIGINAL EMAILS FOR THESE ALIAS EMAILS ------')
    console.log('Alias Emails: ', alias_emails)
    rdsAPI.grab_original_emails(alias_emails)
          .then((proxyPairs) => {
            console.log('------ GOT THE ORIGINAL EMAILS FOR THESE ALIAS EMAILS ------')

            const params = {
              from: proxyEmail,
              replyTo: proxyEmail,
              to: supervision_settings.reviewer_emails && supervision_settings.reviewer_emails.length > 0
                  ?
                  supervision_settings.reviewer_emails
                  :
                  participants.from.filter((from) => {
                    return from !== proxyEmail
                  }).concat(lead_email ? [lead_email] : []).map((from) => {
                    return loopFindPair(from, proxyPairs)
                  }),
              cc: supervision_settings.cc_emails && supervision_settings.cc_emails.length > 0
                  ?
                  supervision_settings.cc_emails.concat(participants.cc.filter((cc) => {
                    // remove any lead TAG___s from the public eye
                    return cc.indexOf('TAG___') === -1
                  }).map((cc) => {
                    return loopFindPair(cc, proxyPairs)
                  }))
                  :
                  participants.cc.filter((cc) => {
                    // remove any lead TAG___s from the public eye
                    return cc.indexOf('TAG___') === -1
                  }).map((cc) => {
                    // but keep any existing public CCs
                    return loopFindPair(cc, proxyPairs)
                  }),
              subject: extractedS3Email.subject,
              text: extractedS3Email.text,
              html: extractedS3Email.textAsHtml,
              attachments: extractedS3Email.attachments.map((attc) => {
                return {
                  filename: attc.filename,
                  content: attc.content
                }
              })
            }
            const mail = mailcomposer(params)
            console.log('------ CREATED THE RAW AGENT->LEAD EMAIL TO BE SENT OUT ------')
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

const loopFindPair = (email, proxyPairs) => {
  let pair = ''
  proxyPairs.forEach((prx) => {
    if (prx.original_email === email) {
      pair = prx.alias_email
    }
    if (prx.alias_email === email) {
      pair = prx.original_email
    }
  })
  return pair
}
