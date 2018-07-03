const Fuse = require('fuse.js')

module.exports.searchAddresses = function(found_addresses, real_addresses) {
  /*
    found_addresses = ["34 Marshall", "40 monthly", "3333 chestnuts"]
    real_addresses = [
      {
          "proxy_email": "heffe@myrenthelper.com",
          "ad_id": "3e6601d9-643d-405e-85f7-5f3dbb92efc0",
          "street_code": "3333",
          "street_name": "Chestnut Street",
          "formatted_address": "3333 Chestnut St, Philadelphia, PA 19104, USA"
      }
    ]
  */
  const options = {
    shouldSort: true,
    includeScore: true,
    threshold: 0.4,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 2,
    keys: [
      "short_address",
      "formatted_address"
    ]
  }
  const items = real_addresses.map((addr) => {
    addr.short_address = `${addr.street_code} ${addr.street_name}`
    return addr
  })
  const fuse = new Fuse(items, options)
  const arrayOfArrayMatches = found_addresses.map((found) => {
    return fuse.search(found)
  })
  let all_matches_wDupl = []
  arrayOfArrayMatches.forEach((arrayMatch) => {
    all_matches_wDupl = all_matches_wDupl.concat(arrayMatch)
  })
  const unique_matches = []
  all_matches_wDupl.forEach((match) => {
    let exists = false
    unique_matches.forEach((u) => {
      if (u.ad_id === match.item.ad_id) {
        exists = true
      }
    })
    if (!exists) {
      unique_matches.push({
        formatted_address: match.item.formatted_address,
        short_address: match.item.short_address,
        ad_id: match.item.ad_id,
        score: match.score
      })
    }
  })
  return unique_matches
}

module.exports.searchURLs = function(found_urls, real_urls) {
  /*
    found_urls = [
      "https://www.kijiji.ca/v-room-rental-roommate/kitchener-waterloo/250-keats-way-comfortable-living-rental/235783846",
      "https://www.padmapper.com/apartments/31279384/4-bedroom-2-bath-apartment-at-250-keats-way-waterloo-on-n2l-6j5",
      "https://www.zumper.com/apartments-for-rent/31279382/3-bedroom-downtown-waterloo-waterloo-on",
      "http://kingstreettowers.ca/",
      "https://ant.design/components/list/"
    ]
    real_urls = [
      {
          "proxy_email": "heffe@myrenthelper.com",
          "ad_id": "e505189f-63bf-4fe9-abba-b4e9f7809190",
          "link": "https://www.kijiji.ca/v-room-rental-roommate/kitchener-waterloo/250-keats-way-comfortable-living-rental/1358588467"
      }
    ]
  */
  const options = {
    shouldSort: true,
    includeScore: true,
    threshold: 0.4,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 2,
    keys: [
      "link"
    ]
  }
  const fuse = new Fuse(real_urls, options)
  const arrayOfArrayMatches = found_urls.map((url) => {
    return fuse.search(url)
  })
  let all_matches_wDupl = []
  arrayOfArrayMatches.forEach((arrayMatch) => {
    all_matches_wDupl = all_matches_wDupl.concat(arrayMatch)
  })
  const unique_matches = []
  all_matches_wDupl.forEach((match) => {
    let exists = false
    unique_matches.forEach((u) => {
      if (u.ad_id === match.item.ad_id) {
        exists = true
      }
    })
    if (!exists) {
      unique_matches.push({
        url: match.item.link,
        ad_id: match.item.ad_id,
        score: match.score
      })
    }
  })
  return unique_matches
}
