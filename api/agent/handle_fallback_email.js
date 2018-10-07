const sesAPI = require('../ses/ses_api')
const mailcomposer = require('mailcomposer')

module.exports.handleAdFallbackEmail = function(agent_email, proxy_email, lead_email, participants, extractedS3Email) {
  const p = new Promise((res, rej) => {
    console.log('------ HANDLING AD FALLBACK EMAIL ------')
    const params = {
      from: agent_email,
      replyTo: agent_email,
      to: [proxy_email, lead_email],
      cc: participants.cc,
      subject: `AD FALLBACK RESPONSE: ${extractedS3Email.subject}`,
      text: `Hello ${lead_email}, this is the RentHero Ad Fallback AI (${agent_email}) responding behind the proxy ${proxy_email}. We got your message and identified the AD_ID but could not generate a response. This fallback response was made for this ad instead.`,
      html: `<p>Hello ${lead_email}, this is the RentHero AI (${agent_email}) responding behind the proxy ${proxy_email}. We got your message and identified the AD_ID but could not generate a response. This fallback response was made for this ad instead.</p>`,
      attachments: extractedS3Email.attachments.map((attc) => {
        const name = attc.filename.split('/')
        return {
          filename: name[name.length - 1].replace('%', ' '),
          content: attc.content,
          location: attc.filename
        }
      })
    }
    console.log(params)
    const mail = mailcomposer(params)
    console.log('------ SENDING OUT AD FALLBACK GENERATED EMAIL ------')
    sesAPI.sendForthEmails(mail)
          .then((data) => {
            console.log('------ SUCCESSFULLY HANDLED AD FALLBACK EMAIL RESPONSE ------')
            res(data)
          })
          .catch((err) => {
            console.log('------ FAILED TO HANDLE AD FALLBACK EMAIL RESPONSE ------')
            rej(err)
          })
  })
  return p
}

module.exports.handleProxyFallbackEmail = function(agent_email, proxy_email, lead_email, participants, extractedS3Email) {
  const p = new Promise((res, rej) => {
    console.log('------ HANDLING PROXY FALLBACK EMAIL ------')
    const params = {
      from: agent_email,
      replyTo: agent_email,
      to: [proxy_email, lead_email],
      cc: participants.cc,
      subject: `PROXY FALLBACK RESPONSE: ${extractedS3Email.subject}`,
      text: `Hello ${lead_email}, this is the RentHero Proxy AI (${agent_email}) responding behind the proxy ${proxy_email}. We got your message and but could not identify the AD_ID, and had to fall back to a general proxy fallback instead. This is the proxy fallback email.`,
      html: `<p>Hello ${lead_email}, this is the RentHero AI (${agent_email}) responding behind the proxy ${proxy_email}. We got your message and but could not identify the AD_ID, and had to fall back to a general proxy fallback instead. This is the proxy fallback email.`,
      attachments: extractedS3Email.attachments.map((attc) => {
        const name = attc.filename.split('/')
        return {
          filename: name[name.length - 1].replace('%', ' '),
          content: attc.content,
          location: attc.filename
        }
      })
    }
    console.log(params)
    const mail = mailcomposer(params)
    console.log('------ SENDING OUT PROXY FALLBACK GENERATED EMAIL ------')
    sesAPI.sendForthEmails(mail)
          .then((data) => {
            console.log('------ SUCCESSFULLY HANDLED PROXY FALLBACK EMAIL RESPONSE ------')
            res(data)
          })
          .catch((err) => {
            console.log('------ FAILED TO HANDLE PROXY FALLBACK EMAIL RESPONSE ------')
            rej(err)
          })
  })
  return p
}
