const axios = require('axios')
const RDS_MS = require('../API_URLS').RDS_MS

module.exports.checkLandlordRelationship = function(proxy_email){
  const headers = {
    headers: {
      Authorization: `Bearer xxxx`
    }
  }
  const p = new Promise((res, rej) => {
    axios.post(`${RDS_MS}/checkLandlordRelationship`, { proxy_email: proxy_email }, headers)
      .then((data) => {
        console.log(`------ Successful POST/checkLandlordRelationship ------`)
        console.log(data.data)
        res({
          landlord_email: data.data.content.landlord_email,
          proxy_email: data.data.content.proxy_email,
          ai_email: data.data.content.ai_email
        })
      })
      .catch((err) => {
        console.log('------> Failed POST/checkLandlordRelationship')
        console.log(err)
        rej(err)
      })
  })
  return p
}

module.exports.saveLeadRelationship = function(lead_email, proxy_email, ai_email) {
  console.log(`------ SAVING A LEAD RELATIONSHIP between: ${lead_email} > ${proxy_email} > ${ai_email} ------`)
  const headers = {
    headers: {
      Authorization: `Bearer xxxxx`
    }
  }
  const p = new Promise((res, rej) => {
    axios.post(`${RDS_MS}/saveLeadRelationship`, {
      lead_email: lead_email,
      proxy_email: proxy_email,
      ai_email: ai_email
    }, headers)
    .then((data) => {
      console.log(`------ Successful POST/saveLeadRelationship ------`)
      console.log(data.data)
      res(data.data.content)
    })
    .catch((err) => {
      console.log(`------ Failed POST/saveLeadRelationship ------`)
      console.log(err)
      rej(err)
    })
  })
  return p
}
