const axios = require('axios')
const RDS_MS = require('../API_URLS').RDS_MS

// DEPRECATED CODE
module.exports.checkLandlordRelationships = function(proxy_email){
  const headers = {
    headers: {
      Authorization: `Bearer xxxx`
    }
  }
  const p = new Promise((res, rej) => {
    axios.post(`${RDS_MS}/check_landlord_relationship`, { proxy_email: proxy_email }, headers)
      .then((data) => {
        console.log(`------ Successful POST/check_landlord_relationship ------`)
        console.log(data.data)
        res({
          landlord_emails: data.data.content.landlord_emails,
          proxy_email: data.data.content.proxy_email,
          ai_email: data.data.content.ai_email
        })
      })
      .catch((err) => {
        console.log('------> Failed POST/check_landlord_relationship')
        console.log(err)
        rej(err)
      })
  })
  return p
}

// checks if any of the from_emails are from a landlord staff account that is known for this proxy
module.exports.checkIfKnownLandlordStaff = function(from_emails) {
  // from_emails = [emailA, emailB]
  const headers = {
    headers: {
      Authorization: `Bearer xxxx`
    }
  }
  const p = new Promise((res, rej) => {
    // axios.post(`${RDS_MS}/check_known_staffs`, { from_emails: from_emails }, headers)
    //   .then((data) => {
    //     console.log(`------ Successful POST/check_known_staffs ------`)
    //     console.log(data.data)
    //     res({
    //       from_emails: '<PLACEHOLDER=from_emails>',
    //       known: true || false
    //     })
    //   })
    //   .catch((err) => {
    //     console.log('------> Failed POST/check_known_staffs')
    //     console.log(err)
    //     rej(err)
    //   })
    res({
      from_emails: [],
      known: false
    })
  })
  return p
}
