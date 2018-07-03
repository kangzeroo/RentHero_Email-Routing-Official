const axios = require('axios')
const RDS_MS = require('../API_URLS').RDS_MS
const Fuzzy = require('../fuzzysearch/fuzzysearch_api')
const Regexr = require('../extraction/regex_api')

// checks if any of the from_emails are from a landlord staff account that is known for this proxy
module.exports.checkIfKnownLandlordStaff = function(from_emails, proxy_email) {
  // from_emails = [emailA, emailB]
  const headers = {
    headers: {
      Authorization: `Bearer xxxx`
    }
  }
  const p = new Promise((res, rej) => {
    axios.post(`${RDS_MS}/all_staffs_for_proxy`, { proxy_email: proxy_email }, headers)
      .then((data) => {
        console.log(`------ Successful POST/all_staffs_for_proxy ------`)
        console.log(data.data)
        const staff_emails = data.data.results.map(r => r.staff_email)
        let match = false
        from_emails.forEach((email) => {
          staff_emails.forEach((staff) => {
            if (email === staff) {
              match = true
            }
          })
        })
        res({
          title: 'checkIfKnownLandlordStaff',
          from_emails: staff_emails,
          known: match
        })
      })
      .catch((err) => {
        console.log('------> Failed POST/all_staffs_for_proxy')
        console.log(err)
        rej(err)
      })
  })
  return p
}

// grab alias_emails from original_emails, and add to db if not exists
module.exports.grab_alias_emails = function(original_emails) {
  // from_emails = [emailA, emailB]
  const headers = {
    headers: {
      Authorization: `Bearer xxxx`
    }
  }
  const p = new Promise((res, rej) => {
    axios.post(`${RDS_MS}/grab_alias_emails`, { original_emails: original_emails }, headers)
      .then((data) => {
        console.log(`------ Successful POST/grab_alias_emails ------`)
        console.log(data.data)
        res(data.data.pairs)
      })
      .catch((err) => {
        console.log('------> Failed POST/grab_alias_emails')
        console.log(err)
        rej(err)
      })
  })
  return p
}

// grab original_emails from alias_emails
module.exports.grab_original_emails = function(alias_emails) {
  // from_emails = [emailA, emailB]
  const headers = {
    headers: {
      Authorization: `Bearer xxxx`
    }
  }
  const p = new Promise((res, rej) => {
    axios.post(`${RDS_MS}/grab_original_emails`, { alias_emails: alias_emails }, headers)
      .then((data) => {
        console.log(`------ Successful POST/grab_original_emails ------`)
        console.log(data.data)
        res(data.data.pairs)
      })
      .catch((err) => {
        console.log('------> Failed POST/grab_original_emails')
        console.log(err)
        rej(err)
      })
  })
  return p
}

// using just the proxy_email and some URLS from the incoming email, query for similar URL links on the advertisement_links table
module.exports.fuzzysearch_ad_urls = function(proxy_email, extractedS3Email) {
  // from_emails = [emailA, emailB]
  const headers = {
    headers: {
      Authorization: `Bearer xxxx`
    }
  }
  const p = new Promise((res, rej) => {
    axios.post(`${RDS_MS}/fuzzysearch_ad_urls`, { proxy_email: proxy_email }, headers)
      .then((data) => {
        console.log(`------ Successful POST/fuzzysearch_ad_urls ------`)
        const found_urls = Regexr.findAddresses(extractedS3Email.textAsHtml)
        const real_urls = data.data.data
        console.log('found_urls: ', found_urls)
        console.log('real_urls: ', real_urls)
        const unique_matches = Fuzzy.searchURLs(found_urls, real_urls)
        res({
          title: 'fuzzysearch_ad_urls',
          unique_matches: unique_matches
        })
      })
      .catch((err) => {
        console.log('------> Failed POST/fuzzysearch_ad_urls')
        console.log(err)
        rej(err)
      })
  })
  return p
}

// using just the proxy_email and some parsed addresses from the incoming email, query for similar URL links on the advertisement_links table
module.exports.fuzzysearch_ad_addresses = function(proxy_email, extractedS3Email) {
  // from_emails = [emailA, emailB]
  const headers = {
    headers: {
      Authorization: `Bearer xxxx`
    }
  }
  const p = new Promise((res, rej) => {
    axios.post(`${RDS_MS}/fuzzysearch_ad_addresses`, { proxy_email: proxy_email }, headers)
      .then((data) => {
        console.log(`------ Successful POST/fuzzysearch_ad_addresses ------`)
        const found_addresses = Regexr.findAddresses(extractedS3Email.textAsHtml)
        const real_addresses = data.data.data
        console.log('found_addresses: ', found_addresses)
        console.log('real_addresses: ', real_addresses)
        const unique_matches = Fuzzy.searchAddresses(found_addresses, real_addresses)
        res({
          title: 'fuzzysearch_ad_addresses',
          unique_matches: unique_matches
        })
      })
      .catch((err) => {
        console.log('------> Failed POST/fuzzysearch_ad_addresses')
        console.log(err)
        rej(err)
      })
  })
  return p
}


// grab the supervision_settings for this ad
module.exports.get_supervision_settings = function(ad_id) {
  const headers = {
    headers: {
      Authorization: `Bearer xxxx`
    }
  }
  const p = new Promise((res, rej) => {
    axios.post(`${RDS_MS}/get_supervision_settings`, { ad_id: ad_id }, headers)
      .then((data) => {
        console.log(`------ Successful POST/get_supervision_settings ------`)
        console.log(data.data)
        res(data.data)
      })
      .catch((err) => {
        console.log('------> Failed POST/get_supervision_settings')
        console.log(err)
        rej(err)
      })
  })
  return p
}
