const rdsAPI = require('../rds/rds_api')
const sesAPI = require('../ses/ses_api')
const s3API = require('../s3/s3_api')
const extractionAPI = require('../extraction/extraction_api')

// reroute email
module.exports.fn = function(sesEmail, meta, extractedS3Email, participants, proxyEmail, proxyPairs) {
  console.log('------ REROUTING AN EMAIL FROM LEAD-->AGENT ------')
  const p = new Promise((res, rej) => {
    console.log('meta')
    console.log(meta)
    console.log('extractedS3Email')
    console.log(extractedS3Email)
    console.log('participants')
    console.log(participants)
    // Now with all the data, we can do proper routing
    // These following scenerios are already covered by emailRouter.js
    //     - multiple renthero proxies not allowed (eg. To:heffe@renthero.ai, CC:steve@renthero.ai)
    //     - agent-->lead response is a simple redirect with all participants intact and directly converted to original emails
    //     - lead-->agent response is a simple redirect with all participants intact and directly converted to proxy emails
    //     - agent-->lead interest is also a timesink
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
      // [TODO]: we can assume that this is a message forwarded to the proxy, and thus should reroute accordingly (find proof of FWD in Body and set to:address as the fwd.history[0].from)
      console.log('------ THIS EMAIL WAS SENT FROM A KNOWN LANDLORD STAFF EMAIL. WE WILL TREAT IT AS A FORWARDED INQUIRY. CHECK THE FWD BODY FOR A TO:ADDRESS TO AUTO-RESPOND TO ------')
      // sesAPI.forwardToLead(sesEmail, meta, extractedS3Email, participants, proxyEmail, proxyPairs)
      //       .then((data) => {
      //         res(data)
      //       })
      //       .catch((err) => {
      //         rej(err)
      //       })
      res()
    } else {
      // [TODO]: The actual email rerouting, when the message is not from a known landlord (we can find the to:address in the headers, rather than in the FWD body like in the above case)
      console.log('------ THIS EMAIL WAS NOT SENT FROM A KNOWN LANDLORD STAFF EMAIL. WE WILL TREAT IT AS A REGULAR INQUIRY ------')
      // sesAPI.forwardToLead(sesEmail, meta, extractedS3Email, participants, proxyEmail, proxyPairs)
      //       .then((data) => {
      //         res(data)
      //       })
      //       .catch((err) => {
      //         rej(err)
      //       })
      res()
    }
  })
  return p
}

// could not find an ad_id, goes to this fallback
module.exports.fallback = function(sesEmail, meta, extractedS3Email, participants, proxyEmail, proxyPairs) {
  const p = new Promise((res, rej) => {
    console.log('------ REROUTING A LEAD-->AGENT EMAIL TO FALLBACK ------')
    // [TODO]: SENTIMENT ANALYSIS as fallback
    // custom NLP layer that detects if this lead is: ['unknown_ad', 'open_to_suggestions', 'angry']
    // this is powerful because it lets us customize what the AI does in each wildcard scenerio
    // the landlord can choose to do things for each scenerio (eg. if the person is angry, the AI will not reply and the landlord should take over)
    if (meta.fromKnownLandlord) {
      // [TODO]: we can assume that this is a message forwarded to the proxy, and thus should reroute accordingly (find proof of FWD in Body and set to:address as the fwd.history[0].from)
      console.log('------ THIS EMAIL WAS SENT FROM A KNOWN LANDLORD STAFF EMAIL. WE WILL TREAT IT AS A FORWARDED INQUIRY. CHECK THE FWD BODY FOR A TO:ADDRESS TO AUTO-RESPOND TO ------')
      res()
    } else {
      // [TODO]: The actual email rerouting, when the message is not from a known landlord (we can find the to:address in the headers, rather than in the FWD body like in the above case)
      console.log('------ THIS EMAIL WAS NOT SENT FROM A KNOWN LANDLORD STAFF EMAIL. WE WILL TREAT IT AS A REGULAR INQUIRY ------')
      res()
    }
  })
  return p
}
