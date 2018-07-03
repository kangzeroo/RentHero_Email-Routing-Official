const simpleParser = require('mailparser').simpleParser
const rdsAPI = require('../rds/rds_api')
const LEAD_CHANNELS = require(`../../creds/${process.env.NODE_ENV}/lead_channels`).lead_channels
const EMAIL_CLIENTS = require(`../../creds/${process.env.NODE_ENV}/email_clients`).email_clients

// Grab the email saved to S3
module.exports.extractEmail = function(S3Email){
  const p = new Promise((res, rej) => {
    console.log(`------ EXTRACTING EMAIL FROM S3 BASE64 ENCODING ------`)
    const em = S3Email.Body.toString('utf8')
    simpleParser(em)
      .then((data) => {
        console.log(`------ PARSING EMAIL INTO READABLE FORMAT ------`)
        console.log(data)
        res(data)
      })
      .catch((err) => {
        console.log(`------ Failed to parse email into readable format ------`)
        console.log(err)
        rej(err)
      })
  })
  return p
}

// Extract emails from headers such as '"Junior Heffe" <juniorheffe@gmail.com>'
module.exports.extractPeoples = function(headerValue) {
  console.log(`------ EXTRACTING PEOPLE FROM EMAIL HEADERS ------`)
  let ppl = []
  if (headerValue.indexOf('<') > -1) {
    ppl = headerValue.split(',').map((text) => {
      return text.slice(text.indexOf('<')+1, text.indexOf('>'))
    })
  } else {
    ppl = headerValue.split(',')
  }
  console.log(ppl)
  return ppl
}

// Extract all the participants in an email (to, from, cc, inReplyTo, returnPath, messageID)
module.exports.extractParticipants = function(sesEmail) {
  console.log(`------ EXTRACTING PARTICIPANTS FROM THIS EMAIL ------`)
  // -------- TO ADDRESS -------- //
  const toAddresses = sesEmail.headers.filter((header) => {
    return header.name.toLowerCase() === 'to'
  }).map((header) => {
    return module.exports.extractPeoples(header.value)
  })[0] || []
  console.log('toAddresses: ', toAddresses)
  // -------- FROM ADDRESS -------- //
  const fromAddresses = sesEmail.headers.filter((header) => {
    return header.name.toLowerCase() === 'from'
  }).map((header) => {
    return module.exports.extractPeoples(header.value)
  })[0] || []
  console.log('fromAddresses: ', fromAddresses)
  // -------- CC ADDRESS -------- //
  const ccAddresses = sesEmail.headers.filter((header) => {
    return header.name.toLowerCase() === 'cc'
  }).map((header) => {
    return module.exports.extractPeoples(header.value)
  })[0] || []
  console.log('ccAddresses: ', ccAddresses)
  // -------- IN REPLY TO ADDRESS -------- //
  const inReplyToAddresses = sesEmail.headers.filter((header) => {
    return header.name.toLowerCase() === 'in-reply-to'
  }).map((header) => {
    return module.exports.extractPeoples(header.value)
  })[0] || []
  console.log('inReplyToAddresses: ', inReplyToAddresses)
  // -------- RETURN ADDRESS -------- //
  const returnAddresses = sesEmail.headers.filter((header) => {
    return header.name.toLowerCase() === 'return-path'
  }).map((header) => {
    return module.exports.extractPeoples(header.value)
  })[0] || []
  console.log('returnAddresses: ', returnAddresses)
  // -------- MESSAGE ID ADDRESS -------- //
  const messageIDAddress = sesEmail.headers.filter((header) => {
    return header.name.toLowerCase() === 'message-id'
  }).map((header) => {
    return module.exports.extractPeoples(header.value)
  })[0] || []
  console.log('messageIDAddress: ', messageIDAddress)
  // -------- SUMMARY OF ADDRESSES -------- //
  console.log(`------ SUCCESSFULLY EXTRACTED ALL PARTICIPANTS FROM THIS EMAIL ------`)
  const participants = {
    to: toAddresses,
    from: fromAddresses,
    cc: ccAddresses,
    inReplyTo: inReplyToAddresses,
    returnPath: returnAddresses,
    messageID: messageIDAddress
  }
  console.log(participants)
  return participants
}

// Determine which email client sent this message
module.exports.determineEmailClient = function(sesEmail) {
  console.log(`------ DETERMINING WHICH EMAIL CLIENT SENT THIS EMAIL ------`)
  console.log('Email Clients: ', EMAIL_CLIENTS().email_clients)
  // sesEmail.headers = [..., { name: 'Received', value: 'from CAN01-QB1-obe.outbound.protection.outlook.com (mail-eopbgr660050.outbound.protection.outlook.com [40.107.66.50]) by inbound-smtp.us-east-1.amazonaws.com with SMTP id t25a4r3fkm2fr7fabopev87v7rfoeljpg3b48ug1 for heffe@myrenthelper.com; Tue, 03 Jul 2018 06:46:57 +0000 (UTC)' }]
  const p = new Promise((res, rej) => {
    let client = 'unknown'
    const relevantHeaders = sesEmail.headers.filter((header) => {
      return header.name.toLowerCase() === 'received'
    })
    EMAIL_CLIENTS().email_clients.forEach((knownClient) => {
      relevantHeaders.forEach((header) => {
        const beg = header.value.toLowerCase().indexOf('from')
        const end = header.value.toLowerCase().indexOf('(')
        knownClient.client_email_domains.forEach((domain) => {
          if (header.value.toLowerCase().slice(beg, end).indexOf(domain.toLowerCase()) > -1) {
            client = knownClient
          }
        })
      })
    })
    console.log(`------ FINISHED ESTIMATING WHICH EMAIL CLIENT SENT THIS EMAIL ------`)
    console.log(client)
    res(client)
  })
  return p
}

// Determine if this email is from lead-->agent or from agent-->lead
module.exports.determineMessageDirection = function(from_emails, proxy_email) {
  const p = new Promise((res, rej) => {
    let direction = 'leadToAgent'
    from_emails.forEach((from) => {
      if (from === proxy_email) {
        direction = 'agentToLead'
      }
    })
    console.log(`------ DETERMINING THE DIRECTION OF THIS EMAIL ------`)
    console.log(direction)
    res(direction)
  })
  return p
}

// Determine which lead channel this email is coming from (eg. kijiji, direct_tenant..etc)
module.exports.determineLeadChannel = function(extractedS3Email, participants) {
  const p = new Promise((res, rej) => {
    console.log(`------ DETERMINING WHICH CHANNEL GENERATED THIS LEAD ------`)
    // our estimated LEAD_CHANNEL
    let estimated_channel = {
      channel_name: 'unknown',
      score: 0
    }
    console.log('Lead Channels: ', LEAD_CHANNELS().lead_channels)
    // check every lead channel and set a score for how likely the lead is from this channel. the highest score is our estimate
    // this function is unaffected by duplicate from-headers because the duplicated scores will be applied to all LEAD_CHANNELS, thus negating the effects of duplicate from-headers
    // this function can handle most false positives (eg. A zumper lead where the tenant says 'kijiji') as each LEAD_CHANNEL is ranked against eachother. Thus the zumper score will be much higher than the kijiji score
    LEAD_CHANNELS().lead_channels.forEach((lead_channel) => {
      console.log(`---> Checking for ${lead_channel.channel_name}`)
      let current_score = 0
      // PART 1: By Email
      // score on `process.env.LEAD_CHANNELS[0].channel_email_domains`
      // current_score increases by 5 for each mention of a known `channel_email_domain`
      participants.from.forEach((from) => {
        lead_channel.channel_email_domains.forEach((ced) => {
          if (from.toLowerCase().indexOf(ced.toLowerCase()) > -1) {
            current_score += 5
          }
        })
      })
      // PART 2: By Hint Word
      // score on `process.env.LEAD_CHANNELS[0].channel_hints`
      // current_score increases by 1 for each mention of a hint word
      lead_channel.channel_hints.forEach((hint_word) => {
        let regex = new RegExp(hint_word, 'ig')
        let matches = extractedS3Email.textAsHtml.match(regex) || []
        if (matches && matches.length > 0) {
          current_score += matches.length
        }
      })
      // PART 3: By Hint Phrase
      // score on `process.env.LEAD_CHANNELS[0].channel_phrases`
      // current_score increases by 5 for each mention of a hint phrase
      lead_channel.channel_phrases.forEach((channel_phrase) => {
        let regex = new RegExp(channel_phrase, 'ig')
        let matches = extractedS3Email.textAsHtml.match(regex) || []
        if (matches && matches.length > 0) {
          current_score += (matches.length*5)
        }
      })
      // PART 4: Rank Against Estimate
      // we replace the estimated_channel only if this LEAD_CHANNEL's current_score is higher than estimated_channel.score
      console.log(`${lead_channel.channel_name} scored: ${current_score}`)
      if (current_score >= estimated_channel.score) {
        estimated_channel = {
          channel_name: lead_channel.channel_name,
          score: current_score
        }
      }
    })
    console.log(`------ FINISHED ESTIMATING CHANNEL ------`)
    console.log(estimated_channel)
    res(estimated_channel)
  })
  return p
}

// Determine which ad_id this email is referring to, and grab its `supervision_settings`
// This is a dynamically changing value, so we must prioritize our estimate confidences
module.exports.determineTargetAdAndSupervisionSettings = function(extractedS3Email, participants, proxy_email) {
  console.log(`------ DETERMINING WHICH AD_ID IS THE TARGET AD FOR THIS EMAIL ------`)
  // Highest Confidence: KNOWN_AD_URLS
  // In the html of the initial inquiry email (including initial fwd email if applicable) there will be links to your ad (assuming the inquiry email is from a known LEAD_CHANNEL)
  // We can thus check if any html urls are similar to those provided by the landlord (provided on ad creation)
  // If matching URLs are found, then it is highly likely our estimate is correct
  // However, if subsequent emails mention other properties than the target ad for this conversation may likely have changed

  // Medium Confidence: KNOWN_AD_ADDRESSES
  // In any email thread depth, we can check for KNOWN_AD_ADDRESSES such as '345 Bay St'
  // If this ad_ids obtained from KNOWN_AD_ADDRESSES matches ad_ids obtained from KNOWLEDGE_HISTORY, we are more confident in our estimate
  // But if the ad_ids from KNOWN_AD_ADDRESSES do not match ad_ids from KNOWLEDGE_HISTORY, we cannot be certain

  // Lowest Confidence: KNOWLEDGE_HISTORY
  // In any email thread depth, we can check KNOWLEDGE_HISTORY with query conditions: (KNOWLEDGE_HISTORY.USER_CONTACT === [participants.from] && KNOWLEDGE_HISTORY.ROLE === 'from' && KNOWLEDGE_HISTORY.TO_PROXY === proxy_email)
  // With those KNOWLEDGE_HISTORY results, we can assume the target ad is the one most recently replied to
  // This method is low confidence because it is easily skewed when a lead is talking to multiple RentHero proxies, or previous target ad estimates were wrong but still saved to KNOWLEDGE_HISTORY

  const p = new Promise((res, rej) => {
    /*
      POSSIBLE_RESPONSES = [
        {
          ad_id: 'xxxx-xxxx-xxxx',
          supervision_settings: {
            ad_id: 'xxxx-xxxx-xxxx',
            reviewer_emails: ['cautiousLandlord@gmail.com'],
            cc_emails: []
          }
        },
        {
          ad_id: 'xxxx-xxxx-xxxx',
          supervision_settings: {
            ad_id: 'xxxx-xxxx-xxxx',
            reviewer_emails: [],
            cc_emails: ['cautiousLandlord@gmail.com', 'propertyManager@gmail.com']
          }
        },
        {
          ad_id: 'xxxx-xxxx-xxxx',
          supervision_settings: {
            ad_id: 'xxxx-xxxx-xxxx',
            reviewer_emails: ['pmSecretary@gmail.com'],
            cc_emails: ['cautiousLandlord@gmail.com', 'propertyManager@gmail.com']
          }
        },
        {
          ad_id: 'xxxx-xxxx-xxxx',
          supervision_settings: {
            ad_id: 'xxxx-xxxx-xxxx',
            reviewer_emails: [],
            cc_emails: []
          }
        }
      ]

      POSSIBLE_AD_IDS = [
        <ACTUAL_AD_ID>,
        <CORP_ID+'_UNKNOWN'>,
        <CORP_ID+'_OPEN_TO_SUGGESTIONS'>
      ]
    */
    // [TODO]: Implement this function
    const estimated_ad = {
      ad_id: 'xxxx-xxxx-xxxx',
      supervision_settings: {
        ad_id: 'xxxx-xxxx-xxxx',
        reviewer_emails: [],
        cc_emails: []
      }
    }
    console.log(`------ FINISHED DETERMINING WHICH AD_ID IS THE TARGET AD FOR THIS EMAIL ------`)
    console.log(estimated_ad)
    res(estimated_ad)
  })
  return p
}
