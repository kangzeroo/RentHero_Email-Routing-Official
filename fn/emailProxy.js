const rdsAPI = require('../api/rds/rds_api')
const leadToAgent = require('../api/proxy/lead_to_agent')
const agentToLead = require('../api/proxy/agent_to_lead')

const headers = {
  headers: {
    Authorization: `Bearer xxxxx`
  }
}

module.exports = function(event, context, callback){
  /*
    1. Parse open the received email that was saved to S3
    2. Grab the LANDLORD_PROXY_TABLE for this proxy_email and check if this email's lead_email == ai_email
          2a. If so, then it must be ai_email replying to the proxy_email (aka forward to lead_email)
          2b. If not, then it must be a lead_email messaging the proxy_email (aka forward to ai_email)
    3. Save the email relationship to RDS
          3a. If lead_email --> proxy_email, then query RDS for the matching ai_email for this proxy_email. Save this 3 way relationship to RDS
          3b. If ai_email --> proxy_email, then skip this step (a record in RDS already exists for this relationship)
    4. Forward the email to the appropriate receipient
          3a. If lead_email --> proxy_email, then forward to the appropriate ai_email
          3b. If ai_email --> proxy_email, then send to the appropriate lead_email
    5. Save a reference to this email with the originalEmailID and the sesFwdEmailID that was provided by SES (it will be used later to find the correct lead for a given AI reply)
    6. If there is missing info, ai_email can use the kaushika_crm to message the landlord requesting info

    ----------------------------------------------

    There are 3 tables (2 RDS + 1 DYN) that store our email relationships
    A. LEAD_PROXY_TABLE (RDS) = lead_email + proxy_email + ai_email
          - Use this table for steps 2, 3 and 4
    B. LANDLORD_PROXY_TABLE (RDS) = landlord_email + proxy_email + ai_email
          - Use this table for step 6
    C. EMAILS_FORWARDED_TABLE (DYN) = originalEmailID + timestamp + sesFwdEmailID + s3FileURL
  */
  console.log('------ LAMBDA EVENT OBJECT ------')
  console.log(event)
  console.log('------ LAMBDA CONTEXT OBJECT ------')
  console.log(context)
  console.log('------ SES EMAIL OBJECT ------')
  const email = event.Records[0].ses.mail
  console.log(email)
  const toAddresses = email.destination.filter((to) => {
    return to.indexOf(process.env.PROXY_EMAIL) > -1
  })
  console.log(toAddresses)
  console.log('------ EMAIL TO: ------')
  // console.log(toAddresses[0])
  if (toAddresses && toAddresses[0]) {
    // let email
    const allReceipientPromises = toAddresses.slice(0,1).map((to) => {
      console.log(`------ Checking landlord email relationships for this proxy email: ${to} ------`)
      return rdsAPI.checkLandlordRelationship(to)
                    .then((rel) => {
                      console.log(`------ Landlord Email Relationship Found ------`)
                      console.log(rel)
                      const fromAddress = email.commonHeaders.returnPath
                      console.log(`------ EMAIL FROM: ------`)
                      console.log(fromAddress)
                      if (rel.ai_email === fromAddress) {
                        // must be ai/kaushika replying to a lead, so forward to that lead_email
                        console.log(`------ This email was an agent responding back to a lead ------`)
                        return agentToLead.fn(rel, email, to, fromAddress)
                      } else {
                        // must be a lead messaging the ai/kaushika
                        // save the lead_email --> ai_email relationship, then forward to ai_email
                        console.log(`------ This email was a lead inquiring to an agent ------`)
                        return leadToAgent.fn(rel, email, to, fromAddress)
                      }
                    })
                    .then((data) => {
                      console.log(`------ SUCCESSFULLY PROCESSED THIS EMAIL ------`)
                      console.log(`------ DONE ------`)
                      return Promise.resolve(data)
                    })
                    .catch((err) => {
                      console.log(`------ FAILED ------`)
                      console.log(err)
                      return Promise.reject(err)
                    })
    })
    Promise.all(allReceipientPromises)
            .then((results) => {
              console.log(`------ SUCCESS: FORWARDED EMAILS TO ALL RECEIPIENTS ------`)
              console.log(results)
              // RESPONSE
              const response = {
                statusCode: 200,
                body: JSON.stringify({
                  message: 'The messages were successfully forwarded!',
                  input: event,
                }),
              }
              callback(null, response)
            })
            .catch((err) => {
              console.log(`------ FAILURE: COULD NOT FORWARD EMAILS TO ALL RECEIPIENTS ------`)
              console.log(err)
              // RESPONSE
              const response = {
                statusCode: 500,
                body: JSON.stringify({
                  message: 'An error occurred!',
                  input: err,
                }),
              }
              callback(null, response)
            })
  } else {
    console.log('------ ERROR: No matching proxy to:address found ------')
    callback(null, 'No Matching Proxy To:Address found')
  }
}
