# EMAIL ROUTING OFFICIAL

## TO UPDATE FOR PROD
- copy over API_URLs, lead_channels_extractors.js and twilio_config.json to '/creds/production/'


## TO TEST FOR PROD
- forward a kijiji post and see if the lead name and phone gets extracted
- forward a padmapper or zumper post and see if the lead name and phone gets extracted
- check that leads arent overwriting names every time the repeated contents of lead email is received (eg. when duplicated in fwd history)
