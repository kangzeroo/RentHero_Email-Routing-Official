const rdsAPI = require('../rds/rds_api')
const sesAPI = require('../ses/ses_api')
const s3API = require('../s3/s3_api')
const leadAPI = require('../leads/lead_api')
const dynAPI = require('../dyn/dyn_api')
const mailcomposer = require('mailcomposer')

// reroute email from lead to agent
module.exports.sendOutAgentEmail = function(meta, extractedS3Email, participants, proxyEmail, aliasPairs) {
  console.log('------ REROUTING AN EMAIL FROM LEAD-->AGENT ------')
  const p = new Promise((res, rej) => {
    console.log('meta: ', meta)
    console.log('extractedS3Email: ', extractedS3Email)

    console.log('participants: ', participants)
    console.log('proxyEmail: ', proxyEmail)
    console.log('aliasPairs: ', aliasPairs)
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

    let starterPoint
    let agent_email
    if (meta.fromKnownLandlord) {
      // we can assume that this is a message forwarded to the proxy, and thus should reroute accordingly (find proof of FWD in Body and set to:address as the fwd.history[0].from)
      console.log('------ THIS EMAIL WAS SENT FROM A KNOWN LANDLORD STAFF EMAIL. WE WILL TREAT IT AS A FORWARDED INQUIRY. CHECK THE FWD BODY FOR A TO:ADDRESS TO AUTO-RESPOND TO ------')
      console.log('------ NOTE THAT WE HANDLE THAT LOGIC ON THE RECEIVING AGENT EMAIL ------')
      starterPoint = Promise.resolve()
    } else {
      // the actual email rerouting, when the message is not from a known landlord (we can find the to:address in the headers, rather than in the FWD body like in the above case)
      console.log('------ THIS EMAIL WAS NOT SENT FROM A KNOWN LANDLORD STAFF EMAIL. WE WILL TREAT IT AS A REGULAR INQUIRY ------')
      console.log('------ NOTE THAT WE HANDLE THAT LOGIC ON THE RECEIVING AGENT EMAIL ------')
      starterPoint = Promise.resolve()
    }
    starterPoint.then(() => {
      console.log('------ GRABBING THE APPROPRIATE AGENT EMAIL FOR THIS AD_ID ------')
      return rdsAPI.get_agent_for_ad(meta.targetAd)
    })
    .then((data) => {
      console.log('------ FOUND THE APPROPRIATE AGENT EMAIL ------')
      if (data && data.email) {
        agent_email = data.email
      } else {
        agent_email = 'support.d15e264b-28cb-40e0-a166-d8ce1ca607e9@renthero.tech'
      }
      console.log(agent_email)
      const params = {}
      // --> LEAD EMAIL (SENDER)
      const x_from = participants.from.map((from) => {
        return loopFindPair(from, aliasPairs)
      })
      const leadEmailDuplicate = x_from[0]
      // FROM
      params.from = proxyEmail
      // CC
      const x_cc = participants.cc.map((cc) => {
        return loopFindPair(cc, aliasPairs)
      })
      if (x_cc && x_cc.length > 0) {
        params.cc = x_cc
      }
      // REPLY TO
      // we have 2 replyTos for our AI so that we can preserve the lead's email upon reply, using a simple `TAG___`
      params.replyTo = [proxyEmail].concat(leadEmailDuplicate ? [`TAG___${leadEmailDuplicate}`] : [])

      // TO
      params.to = [agent_email].concat(leadEmailDuplicate ? [`TAG___${leadEmailDuplicate}`] : [])
      // const x_to = [agent_email].concat(participants.to.filter((to) => {
      //   return to !== proxyEmail
      // }).map((to) => {
      //   return loopFindPair(to, aliasPairs)
      // }))
      // if (x_to && x_to.length > 0) {
      //   params.to = x_to
      // }
      // The rest
      params.subject = extractedS3Email.subject,
      params.text = extractedS3Email.text,
      params.html = extractedS3Email.textAsHtml || extractedS3Email.html,
      params.attachments = extractedS3Email.attachments.map((attc) => {
        const name = attc.filename.split('/')
        return {
          filename: name[name.length - 1].replace('%', ' '),
          content: attc.content,
          location: attc.filename
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
      console.log('extractedS3Email: ', extractedS3Email)
      return leadAPI.handleIncomingLead(meta, participants, proxyEmail, agent_email, extractedS3Email.attachments)
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

module.exports.selectIntelligenceGroupEmailsAndSendOut = function(meta, extractedS3Email, participants, proxyEmail, aliasPairs) {
  const p = new Promise((res, rej) => {
    console.log('------ REROUTING A LEAD --> INTELLIGENCE GROUP EMAIL ------')
    console.log('meta: ', meta)
    console.log('extractedS3Email: ', JSON.stringify(extractedS3Email))
    console.log('participants: ', participants)
    console.log('proxyEmail: ', proxyEmail)
    console.log('aliasPairs: ', aliasPairs)
    let starterPoint
    let agent_email, operator_emails
    if (meta.fromKnownLandlord) {
      // we can assume that this is a message forwarded to the proxy, and thus should reroute accordingly (find proof of FWD in Body and set to:address as the fwd.history[0].from)
      console.log('------ THIS EMAIL WAS SENT FROM A KNOWN LANDLORD STAFF EMAIL. WE WILL TREAT IT AS A FORWARDED INQUIRY. CHECK THE FWD BODY FOR A TO:ADDRESS TO AUTO-RESPOND TO ------')
      console.log('------ NOTE THAT WE HANDLE THAT LOGIC ON THE RECEIVING AGENT EMAIL ------')
      starterPoint = Promise.resolve()
    } else {
      // The actual email rerouting, when the message is not from a known landlord (we can find the to:address in the headers, rather than in the FWD body like in the above case)
      console.log('------ THIS EMAIL WAS NOT SENT FROM A KNOWN LANDLORD STAFF EMAIL. WE WILL TREAT IT AS A REGULAR INQUIRY ------')
      console.log('------ NOTE THAT WE HANDLE THAT LOGIC ON THE RECEIVING AGENT EMAIL ------')
      starterPoint = Promise.resolve()
    }
    console.log('------ GRABBING THE INTELLIGENCE GROUP EMAIL FOR THIS PROXY_EMAIL ------')
    console.log(`PROXY EMAIL: ${proxyEmail}`)
    starterPoint.then(() => {
      return rdsAPI.getDefaultAgentEmailForProxy(proxyEmail)
    })
    .then((data) => {
      // data: agent (obj), operators (array of objs)
      console.log('--- DATA: ', JSON.stringify(data))
      agent_email = data.agent.email
      operator_emails = data.operators.map(op => op.email)
      console.log(`AGENT EMAIL: ${agent_email}`)
      console.log(`OPERATOR EMAILS: ${JSON.stringify(operator_emails)}`)
      console.log('------ FOUND THE INTELLIGENCE GROUP EMAIL FOR THIS AD_ID ------')
      console.log('intelligence_group_email: ', agent_email)
      // CC (will also duplicate the from:address, with a `TAG___`)
      const leadEmailDuplicate = participants.from.map((from) => {
                                  return loopFindPair(from, aliasPairs)
                                })[0]
      const params = {
        // from: participants.from.map((from) => {
        //         return loopFindPair(from, aliasPairs)
        //       }),
        from: proxyEmail,
        replyTo: [proxyEmail].concat(leadEmailDuplicate ? [`TAG___${leadEmailDuplicate}`] : []),
        to: [agent_email].concat(leadEmailDuplicate ? [`TAG___${leadEmailDuplicate}`] : [], operator_emails),
            // [agent_email].concat(participants.to.filter((to) => {
            //   return to !== proxyEmail
            // }).map((to) => {
            //   return loopFindPair(to, aliasPairs)
            // })),
        cc: participants.cc.map((cc) => {
              return loopFindPair(cc, aliasPairs)
            }),
        subject: extractedS3Email.subject,
        text: extractedS3Email.text,
        html: extractedS3Email.textAsHtml || extractedS3Email.html,
        attachments: extractedS3Email.attachments ? extractedS3Email.attachments.map((attc) => {
          const name = attc.filename.split('/')
          return {
            filename: name[name.length - 1].replace('%', ' '),
            content: attc.content,
            location: attc.filename
          }
        }) : []
      }
      const mail = mailcomposer(params)
      console.log('------ CREATED THE RAW LEAD->INTELLIGENCE GROUP EMAIL TO BE SENT OUT ------')
      console.log(params)
      console.log(mail)
      return sesAPI.sendForthEmails(mail)
    })
    .then((data) => {
      return leadAPI.handleIncomingLead(meta, participants, proxyEmail, agent_email, extractedS3Email.attachments)
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
module.exports.sendOutFallbackProxyEmail = function(meta, extractedS3Email, participants, proxyEmail, aliasPairs) {
  const p = new Promise((res, rej) => {
    console.log('------ REROUTING A LEAD --> FALLBACK AGENT EMAIL ------')
    console.log('meta: ', meta)
    console.log('extractedS3Email: ', JSON.stringify(extractedS3Email))
    console.log('participants: ', participants)
    console.log('proxyEmail: ', proxyEmail)
    console.log('aliasPairs: ', aliasPairs)
    let starterPoint
    let fallback_agent_email
    if (meta.fromKnownLandlord) {
      // we can assume that this is a message forwarded to the proxy, and thus should reroute accordingly (find proof of FWD in Body and set to:address as the fwd.history[0].from)
      console.log('------ THIS EMAIL WAS SENT FROM A KNOWN LANDLORD STAFF EMAIL. WE WILL TREAT IT AS A FORWARDED INQUIRY. CHECK THE FWD BODY FOR A TO:ADDRESS TO AUTO-RESPOND TO ------')
      console.log('------ NOTE THAT WE HANDLE THAT LOGIC ON THE RECEIVING AGENT EMAIL ------')
      starterPoint = Promise.resolve()
    } else {
      // The actual email rerouting, when the message is not from a known landlord (we can find the to:address in the headers, rather than in the FWD body like in the above case)
      console.log('------ THIS EMAIL WAS NOT SENT FROM A KNOWN LANDLORD STAFF EMAIL. WE WILL TREAT IT AS A REGULAR INQUIRY ------')
      console.log('------ NOTE THAT WE HANDLE THAT LOGIC ON THE RECEIVING AGENT EMAIL ------')
      starterPoint = Promise.resolve()
    }
    console.log('------ GRABBING THE FALLBACK AGENT EMAIL FOR THIS PROXY_EMAIL ------')
    starterPoint.then(() => {
      return rdsAPI.getDefaultFallbackAgentEmailForProxy(proxyEmail)
    })
    .then((agent_email) => {
      fallback_agent_email = agent_email
      console.log('------ FOUND THE FALLBACK AGENT EMAIL FOR THIS AD_ID ------')
      console.log('fallback_agent_email: ', fallback_agent_email)
      // CC (will also duplicate the from:address, with a `TAG___`)
      const leadEmailDuplicate = participants.from.map((from) => {
                                  return loopFindPair(from, aliasPairs)
                                })[0]
      const params = {
        // from: participants.from.map((from) => {
        //         return loopFindPair(from, aliasPairs)
        //       }),
        from: proxyEmail,
        replyTo: [proxyEmail].concat(leadEmailDuplicate ? [`TAG___${leadEmailDuplicate}`] : []),
        to: [fallback_agent_email].concat(leadEmailDuplicate ? [`TAG___${leadEmailDuplicate}`] : []),
            // [fallback_agent_email].concat(participants.to.filter((to) => {
            //   return to !== proxyEmail
            // }).map((to) => {
            //   return loopFindPair(to, aliasPairs)
            // })),
        cc: participants.cc.map((cc) => {
              return loopFindPair(cc, aliasPairs)
            }),
        subject: extractedS3Email.subject,
        text: extractedS3Email.text,
        html: extractedS3Email.textAsHtml || extractedS3Email.html,
        attachments: extractedS3Email.attachments ? extractedS3Email.attachments.map((attc) => {
          const name = attc.filename.split('/')
          return {
            filename: name[name.length - 1].replace('%', ' '),
            content: attc.content,
            location: attc.filename
          }
        }) : []
      }
      const mail = mailcomposer(params)
      console.log('------ CREATED THE RAW LEAD->FALLBACK AGENT EMAIL TO BE SENT OUT ------')
      console.log(params)
      console.log(mail)
      return sesAPI.sendForthEmails(mail)
    })
    .then((data) => {
      return leadAPI.handleIncomingLead(meta, participants, proxyEmail, fallback_agent_email)
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

 // jimmehguoo.5721470c-6a41-4e1d-a044-d633a3a7b6d9@renthero.tech

// for agent --> lead email forwarding
module.exports.sendOutLeadEmail = function(meta, extractedS3Email, supervision_settings, participants, proxyEmail, sesEmail) {
  const p = new Promise((res, rej) => {
    console.log('------ REROUTING AN AGENT --> LEAD EMAIL ------')
    console.log('extractedS3Email: ', JSON.stringify(extractedS3Email))
    console.log('participants: ', participants)
    console.log('proxyEmail: ', proxyEmail)
    console.log('SESEMAIL: ', sesEmail)
    const agentEmail = participants.from[0]
    const alias_emails = []
    participants.to.filter((to) => {
      return to.toLowerCase().indexOf(process.env.ALIAS_EMAIL) > -1 && to.indexOf('TAG___') === -1
    }).forEach((to) => {
      alias_emails.push(to)
    })
    console.log('alias_emails: ', alias_emails)
    participants.from.filter((from) => {
      return from.toLowerCase().indexOf(process.env.ALIAS_EMAIL) > -1
    }).forEach((from) => {
      alias_emails.push(from)
    })
    console.log('alias_emails: ', alias_emails)
    participants.cc.filter((cc) => {
      return cc.toLowerCase().indexOf(process.env.ALIAS_EMAIL) > -1 && cc.indexOf('TAG___') === -1
    }).forEach((cc) => {
      alias_emails.push(cc)
    })
    console.log('alias_emails: ', alias_emails)
    // participants.to has [heffe@renthero.ai, TAG___leadXYZ@renthero.cc]
    const receipient = participants.to.filter((to) => {
      // return to.indexOf('TAG___') > -1 && to.toLowerCase().indexOf(process.env.ALIAS_EMAIL) > -1
      return to.indexOf('TAG___') > -1 && (to.toLowerCase().indexOf(process.env.ALIAS_EMAIL) > -1 || to.toLowerCase().indexOf(process.env.AGENT_EMAIL) > -1)
    })[0]
    console.log('receipient')
    console.log(receipient)
    console.log('cut off')
    console.log('TAG___'.length)
    console.log(receipient.slice('TAG___'.length))
    let lead_email
    if (receipient){
      lead_email = receipient.slice('TAG___'.length)
      alias_emails.push(lead_email)
    }
    console.log('<-------- experiemnt -------->')
    console.log(receipient.slice(0))
    console.log(receipient.slice(1))
    console.log(receipient.slice(2))
    console.log(receipient.slice(3))
    console.log(receipient.slice(4))
    console.log(receipient.slice(5))
    console.log(receipient.slice(6))
    console.log(receipient.slice(7))
    console.log(receipient.slice(8))
    console.log(receipient.slice(9))
    console.log(receipient.slice(10))
    console.log('Lead Email: ', lead_email)
    console.log('------ GRABBING THE ORIGINAL EMAILS FOR THESE ALIAS EMAILS ------')
    console.log('Alias Emails: ', alias_emails)
    let aliasPairs
    let attachments = extractedS3Email.attachments ? extractedS3Email.attachments.map((attc) => {
      const name = attc.filename.split('/')
      return {
        filename: name[name.length - 1].replace('%', ' '),
        content: attc.content,
        location: attc.filename
      }
    }) : []
    rdsAPI.grab_original_emails(alias_emails)
          .then((apairs) => {
            aliasPairs = apairs
            console.log('------ GOT THE ORIGINAL EMAILS FOR THESE ALIAS EMAILS ------')
            console.log(aliasPairs)
            console.log(loopFindPair(lead_email, aliasPairs))
            const params = {
              from: proxyEmail,
              replyTo: supervision_settings.reviewer_emails && supervision_settings.reviewer_emails.length > 0
                       ?
                       loopFindPair(lead_email, aliasPairs)
                       :
                       proxyEmail,
              to: supervision_settings.reviewer_emails && supervision_settings.reviewer_emails.length > 0
                  ?
                  supervision_settings.reviewer_emails
                  :
                  loopFindPair(lead_email, aliasPairs),
              cc: supervision_settings.cc_emails && supervision_settings.cc_emails.length > 0
                  ?
                  supervision_settings.cc_emails.map((cc) => {
                    return loopFindPair(cc, aliasPairs)
                  })
                  :
                  participants.cc.map((cc) => {
                    return loopFindPair(cc, aliasPairs)
                  }),
              subject: extractedS3Email.subject,
              text: extractedS3Email.text,
              html: extractedS3Email.textAsHtml || extractedS3Email.html,
              attachments: attachments
            }
            const mail = mailcomposer(params)
            console.log('------ CREATED THE RAW AGENT->LEAD EMAIL TO BE SENT OUT ------')
            console.log(params)
            console.log(mail)
            return sesAPI.sendForthEmails(mail)
          })
          .then((data) => {
            console.log('==============> participants')
            console.log(participants)
            const original_participants = {
              to: participants.to.map(a => loopFindPair(a, aliasPairs)),
              from: participants.from.map(a => loopFindPair(a, aliasPairs)),
              cc: participants.cc.map(a => loopFindPair(a, aliasPairs)),
              inReplyTo: participants.inReplyTo.map(a => loopFindPair(a, aliasPairs)),
              returnPath: participants.returnPath.map(a => loopFindPair(a, aliasPairs)),
              messageID: participants.messageID
            }
            return dynAPI.saveKnowledgeHistory(sesEmail, meta, original_participants, proxyEmail)
          })
          .then((data) => {
            console.log('AGENTEMAIL=====>', agentEmail)
            return leadAPI.saveAgentResponseToDB(meta, loopFindPair(lead_email, aliasPairs), proxyEmail, agentEmail, attachments.map((item) => { return { filename: item.filename, location: item.location }}))
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

// for when a fallback agent responds to proxy, and proxy forwards it to the lead
module.exports.sendOutFallbackLeadEmail = function(meta, extractedS3Email, participants, proxyEmail, sesEmail) {
  const p = new Promise((res, rej) => {
    console.log('------ REROUTING A FALLBACK AGENT --> LEAD EMAIL ------')
    console.log('extractedS3Email: ', JSON.stringify(extractedS3Email))
    console.log('participants: ', participants)
    console.log('proxyEmail: ', proxyEmail)
    const agentEmail = participants.from[0]
    const alias_emails = []
    participants.to.filter((to) => {
      return to.toLowerCase().indexOf(process.env.ALIAS_EMAIL) > -1 && to.indexOf('TAG___') === -1
    }).forEach((to) => {
      alias_emails.push(to)
    })
    console.log('alias_emails: ', alias_emails)
    participants.from.filter((from) => {
      return from.toLowerCase().indexOf(process.env.ALIAS_EMAIL) > -1
    }).forEach((from) => {
      alias_emails.push(from)
    })
    console.log('alias_emails: ', alias_emails)
    participants.cc.filter((cc) => {
      return cc.toLowerCase().indexOf(process.env.ALIAS_EMAIL) > -1 && cc.indexOf('TAG___') === -1
    }).forEach((cc) => {
      alias_emails.push(cc)
    })
    console.log('alias_emails: ', alias_emails)
    // participants.to has [heffe@renthero.ai, TAG___leadXYZ@renthero.cc]
    const receipient = participants.to.filter((to) => {
      return to.indexOf('TAG___') > -1 && to.toLowerCase().indexOf(process.env.ALIAS_EMAIL) > -1
    })[0]
    console.log('receipient')
    console.log(receipient)
    console.log('cut off')
    console.log('TAG___'.length)
    console.log(receipient.slice('TAG___'.length))
    let lead_email
    if (receipient){
      lead_email = receipient.slice('TAG___'.length)
      alias_emails.push(lead_email)
    }
    console.log('Lead Email: ', lead_email)
    console.log('------ GRABBING THE ORIGINAL EMAILS FOR THESE ALIAS EMAILS ------')
    console.log('Alias Emails: ', alias_emails)
    let aliasPairs
    let attachments = extractedS3Email.attachments ? extractedS3Email.attachments.map((attc) => {
      const name = attc.filename.split('/')
      return {
        filename: name[name.length - 1].replace('%', ' '),
        content: attc.content,
        location: attc.filename
      }
    }) : []
    rdsAPI.grab_original_emails(alias_emails)
          .then((apairs) => {
            aliasPairs = apairs
            console.log('------ GOT THE ORIGINAL EMAILS FOR THESE ALIAS EMAILS ------')
            console.log(aliasPairs)
            console.log(loopFindPair(lead_email, aliasPairs))
            const params = {
              from: proxyEmail,
              replyTo: proxyEmail,
              to: loopFindPair(lead_email, aliasPairs),
              cc: participants.cc.map((cc) => {
                    return loopFindPair(cc, aliasPairs)
                  }),
              subject: extractedS3Email.subject,
              text: extractedS3Email.text,
              html: extractedS3Email.textAsHtml || extractedS3Email.html,
              attachments: attachments
            }
            const mail = mailcomposer(params)
            console.log('------ CREATED THE RAW FALLBACK AGENT->LEAD EMAIL TO BE SENT OUT ------')
            console.log(params)
            console.log(mail)
            return sesAPI.sendForthEmails(mail)
          })
          .then((data) => {
            console.log('==============> participants')
            console.log(participants)
            const original_participants = {
              to: participants.to.map(a => loopFindPair(a, aliasPairs)),
              from: participants.from.map(a => loopFindPair(a, aliasPairs)),
              cc: participants.cc.map(a => loopFindPair(a, aliasPairs)),
              inReplyTo: participants.inReplyTo.map(a => loopFindPair(a, aliasPairs)),
              returnPath: participants.returnPath.map(a => loopFindPair(a, aliasPairs)),
              messageID: participants.messageID
            }
            return dynAPI.saveKnowledgeHistory(sesEmail, meta, original_participants, proxyEmail)
          })
          .then((data) => {
            return leadAPI.saveAgentResponseToDB(meta, loopFindPair(lead_email, aliasPairs), proxyEmail, agentEmail, attachments.map((item) => { return { filename: item.filename, location: item.location }}))
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

const loopFindPair = (email, aliasPairs) => {
  let pair = email
  aliasPairs.forEach((prx) => {
    if (prx.original_email === email) {
      pair = prx.alias_email
    }
    if (prx.alias_email === email) {
      pair = prx.original_email
    }
  })
  return pair
}
