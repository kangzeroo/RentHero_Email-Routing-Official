const axios = require('axios')
const DYN_MS = require('../API_URLS').DYN_MS
const moment = require('moment')
const extractionAPI = require('../extraction/extraction_api')

// [TODO]: Implement below function
module.exports.saveKnowledgeHistory = function() {
  const headers = {
    headers: {
      Authorization: `Bearer xxxx`
    }
  }
  const p = new Promise((res, rej) => {
    axios.post(`${DYN_MS}/endpoint`, { }, headers)
      .then((data) => {
        console.log(`------ Successful POST/endpoint ------`)
        console.log(data.data)
        res(data.data)
      })
      .catch((err) => {
        console.log('------> Failed POST/endpoint')
        console.log(err)
        rej(err)
      })
  })
  return p
}

// [TODO]: Implement below function
module.exports.collectKnowledgeHistory = function() {
  const p = new Promise((res, rej) => {
    res({
      title: 'collectKnowledgeHistory',
      history: []
    })
  })
  return p
}
