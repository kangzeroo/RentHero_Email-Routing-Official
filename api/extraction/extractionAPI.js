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
