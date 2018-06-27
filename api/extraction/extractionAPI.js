const simpleParser = require('mailparser').simpleParser

module.exports.extractEmail = function(S3Email){
  const p = new Promise((res, rej) => {
    console.log(`------ EXTRACTING EMAIL FROM S3 BASE64 ENCODING ------`)
    const em = S3Email.Body.toString('utf8')
    simpleParser(em)
      .then((data) => {
        console.log(`------ PARSING EMAIL INTO READABLE FORMAT ------`)
        console.log(data)
        res(data)
      })
      .catch((err) => {
        console.log(`------ Failed to parse email into readable format ------`)
        console.log(err)
        rej(err)
      })
  })
  return p
}

module.exports.extractReplyToID = function(formattedEmail){
  console.log(`------ EXTRACTING THE REPLY TO EMAIL IDS ------`)
  console.log(formattedEmail.references)
  if (typeof formattedEmail.references === 'object') {
    const references = formattedEmail.references.filter((ref) => {
      return ref.indexOf('@email.amazonses.com') > 1
    })
    if (references && references[0]) {
      return references[0].slice(
        1,
        references[0].indexOf('@')
      )
    } else {
      return 'none'
    }
  } else if (typeof formattedEmail.references === 'string') {
    return formattedEmail.references.slice(
      1,
      formattedEmail.references.indexOf('@')
    )
  } else {
    return 'none'
  }
}
