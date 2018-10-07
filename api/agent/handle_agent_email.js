const sesAPI = require('../ses/ses_api')
const mailcomposer = require('mailcomposer')

module.exports.handleAgentEmail = function(agent_email, proxy_email, lead_email, participants, extractedS3Email) {
  const p = new Promise((res, rej) => {
    console.log('------ HANDLING AGENT EMAIL ------')
    const params = {
      from: agent_email,
      replyTo: agent_email,
      to: [proxy_email, lead_email],
      cc: participants.cc,
      subject: `AI RESPONSE: ${extractedS3Email.subject}`,
      text: `Hello ${lead_email}, this is the RentHero AI (${agent_email}) responding behind the proxy ${proxy_email}. We got your message and generated this response. Everything is good!`,
      html: `<p>Hello ${lead_email}, this is the RentHero AI (${agent_email}) responding behind the proxy ${proxy_email}. We got your message and generated this response. Everything is good!</p>`,
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
    console.log('------ SENDING OUT AGENT GENERATED EMAIL ------')
    sesAPI.sendForthEmails(mail)
          .then((data) => {
            console.log('------ SUCCESSFULLY HANDLED AGENT EMAIL RESPONSE ------')
            res(data)
          })
          .catch((err) => {
            console.log('------ FAILED TO HANDLE AGENT EMAIL RESPONSE ------')
            rej(err)
          })
  })
  return p
}
