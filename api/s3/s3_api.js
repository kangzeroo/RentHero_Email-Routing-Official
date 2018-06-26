const AWS = require('aws-sdk')

module.exports.grabEmail = function(bucket, key){
  console.log(`------ GRABBING EMAIL FROM S3 at Bucket:${bucket} and Key:${key} ------`)
  const p = new Promise((res, rej) => {
    const s3 = new AWS.S3()
    var params = {
      Bucket: bucket,
      Key: key
    }
    s3.getObject(params, function(err, data) {
       if (err) {
         console.log(`------ Failed GET/${bucket}:${key} ------`)
         console.log(err, err.stack)
         rej(err)
       } else {
         console.log(`------ Successful GET/${bucket}:${key} ------`)
         console.log(data)
         res(data)
       }
    })
  })
  return p
}
