const axios = require('axios')
const AWS = require('aws-sdk')
const extractionAPI = require('../extraction/extraction_api')


// [TODO]: Implement below function
module.exports.forwardToLead = function(meta, extractedS3Email, participants, proxyPairs){
  console.log('------ ABOUT TO FORWARD THE EMAIL OFF TO THE LEADS ------')
  console.log('meta: ', meta)
  console.log('extractedS3Email: ', extractedS3Email)
  console.log('participants: ', participants)
  console.log('proxyPairs: ', proxyPairs)
  // const ses = new AWS.SES()
  // const p = new Promise((res, rej) => {
  //   const params = {
  //     Destination: {
  //      BccAddresses: [],
  //      CcAddresses: formattedEmail.cc && formattedEmail.cc.value[0] ? [formattedEmail.cc.value[0].address] : [],
  //      ToAddresses: [email_ref.SENDER_EMAIL_ADDR]
  //     },
  //     Message: {
  //      Body: {
  //       Html: {
  //        Charset: 'UTF-8',
  //        Data: formattedEmail.textAsHtml
  //       },
  //       Text: {
  //        Charset: 'UTF-8',
  //        Data: formattedEmail.text
  //       }
  //      },
  //      Subject: {
  //       Charset: 'UTF-8',
  //       Data: formattedEmail.subject
  //      }
  //     },
  //     ReplyToAddresses: [proxyEmail],
  //     Source: proxyEmail
  //   }
  //   console.log(`------ SES Email Params ------`)
  //   console.log(params)
  //   ses.sendEmail(params, function(err, data) {
  //     if (err) {
  //       console.log(`------ Failed POST/ses.sendEmail ------`)
  //       console.log(err, err.stack)
  //       rej(err)
  //     } else {
  //       console.log(`------ Successful POST/ses.sendEmail ------`)
  //       console.log(data);
  //       res(data)
  //     }
  //   })
  // })
  // return p
}

// [TODO]: Implement below function
module.exports.forwardToAI = function(relationship, formattedEmail, proxyEmail, originalMessageId){
  console.log(`------ FORWARDING EMAIL TO AGENT ------`)
  console.log(relationship)
  console.log(formattedEmail)
  console.log(proxyEmail)
  const unique_subject_thread = extractionAPI.extractReplyToID(formattedEmail) === 'none' ? ` --- ${originalMessageId}` : ''
  console.log(`------ ABOUT TO FORWARD OUT EMAIL ------`)
  const ses = new AWS.SES()
  const p = new Promise((res, rej) => {
    const params = {
      Destination: {
       BccAddresses: [],
       CcAddresses: formattedEmail.cc && formattedEmail.cc.value[0] ? [formattedEmail.cc.value[0].address] : [],
       ToAddresses: [relationship.ai_email]
      },
      Message: {
       Body: {
        Html: {
         Charset: 'UTF-8',
         Data: formattedEmail.textAsHtml
        },
        Text: {
         Charset: 'UTF-8',
         Data: formattedEmail.text
        }
       },
       Subject: {
        Charset: 'UTF-8',
        Data: `${formattedEmail.subject}${unique_subject_thread}`
       }
      },
      ReplyToAddresses: [proxyEmail],
      Source: proxyEmail
    }
    console.log(`------ SES Email Params ------`)
    console.log(params)
    ses.sendEmail(params, function(err, data) {
      if (err) {
        console.log(`------ Failed POST/ses.sendEmail ------`)
        console.log(err, err.stack)
        rej(err)
      } else {
        console.log(`------ Successful POST/ses.sendEmail ------`)
        console.log(data);
        res(data)
      }
    })
  })
  return p
}
