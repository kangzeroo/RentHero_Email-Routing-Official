const axios = require('axios')
const DYN_MS = require('../API_URLS').DYN_MS

module.exports.saveMessage = function(sesFwdEmailID, originalEmailID, originalEmailReceivedTime, s3FileURL, s3FileKeyname){
  console.log(`------ SAVING MESSAGE REFERENCE TO DYNAMODB ------`)
  console.log(sesFwdEmailID)
  console.log(originalEmailID)
  console.log(originalEmailReceivedTime)
  console.log(s3FileURL)
  console.log(s3FileKeyname)
  return Promise.resolve()
}
