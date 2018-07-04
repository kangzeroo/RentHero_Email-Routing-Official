
module.exports = function(event, context, callback){
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Received an email to @renthero.cc'
    })
  }
  callback(null, response)
}
