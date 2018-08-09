const twilio_client = require('../../twilio_setup').generate_twilio_client()

module.exports.lookup_number = (number) => {
  const p = new Promise((res, rej) => {
    twilio_client.lookups.phoneNumbers(number)
              .fetch()
              .then((numberObj) => {
                console.log(numberObj)
                res({
                  success: true,
                  original_phone_input: number,
                  twilio_phone_output: numberObj.phoneNumber
                })
              })
              .catch((err) => {
                console.log(err)
                res({
                  success: false,
                  original_phone_input: number
                })
              })
  })
  return p
}
