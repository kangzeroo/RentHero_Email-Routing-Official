const rdsAPI = require('../rds/rds_api')
const sesAPI = require('../ses/ses_api')
const s3API = require('../s3/s3_api')
const dynAPI = require('../dyn/dyn_api')
const extractionAPI = require('../extraction/extraction_api')

// reroute email
module.exports.fn = function(meta, extractedS3Email, participants) {
  console.log('------ REROUTING AN EMAIL FROM LEAD-->AGENT ------')
  const p = new Promise((res, rej) => {
    console.log('meta')
    console.log(meta)
    console.log('extractedS3Email')
    console.log(extractedS3Email)
    console.log('participants')
    console.log(participants)
    res('SUCCESSFULLY REROUTED EMAIL FROM LEAD-->AGENT')
  })
  return p
}
