# EMAIL ROUTING OFFICIAL

## TO FINISH IN DEV
- allow for landlord staff to initiate outbound emails (eg. when first contact is a phone call and staff needs to send email)

## TO UPDATE FOR PROD
- copy over API_URLs, lead_channels_extractors.js and twilio_config.json to '/creds/production/'
- change the error message email for dev and prod, stop spamming admin@renthero.com
- deploy serverless
- prod db stuff

## TO TEST FOR PROD
- forward a kijiji post and see if the lead name and phone gets extracted
- forward a padmapper or zumper post and see if the lead name and phone gets extracted
- check that leads arent overwriting names every time the repeated contents of lead email is received (eg. when duplicated in fwd history)


## BASIC COMMANDS
- invoke function in handler `serverless invoke --stage development --function proxyRouter`
- deploy to development `serverless deploy --stage development`
