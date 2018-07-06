const extractionAPI = require('../api/extraction/extraction_api')

module.exports = function(event, context, callback){
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
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Received an email to @renthero.cc'
    })
  }
  console.log('------ EMAIL PARTICIPANTS ------')
  console.log(response)
  console.log('------ DONE ------')
  callback(null, response)
}
