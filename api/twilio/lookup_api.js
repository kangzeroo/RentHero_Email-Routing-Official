const twilio_client = require('../../twilio_setup').generate_twilio_client()

exports.lookup_number = (number) => {
  const p = new Promise((res, rej) => {
    twilio_client.lookups.phoneNumbers(number)
              .fetch()
              .then((numberObj) => {
                // console.log(numberObj)
                res(numberObj)
              })
              .catch((err) => {
                console.log(err)
                rej(err)
              })
  })
  return p
}
