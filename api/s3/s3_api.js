const AWS = require('aws-sdk')
const path = require('path')
const pathToAWSConfig = path.join(__dirname, '../..', 'creds', process.env.NODE_ENV, 'aws_config.json')
const aws_config = require(pathToAWSConfig)
AWS.config.update(aws_config)

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


module.exports.batchUploadFilesToS3 = function(files, convo_id) {
  const p = new Promise((res, rej) => {
    if (files && files.length > 0) {
      const S3 = new AWS.S3()

      const arrayOfPromises = files.map((file) => {
        return module.exports.uploadFileToS3(file, convo_id)
      })

      Promise.all(arrayOfPromises)
        .then((data) => {
          console.log(data)

          res(data)
        })
        .catch((err) => {
          console.log(err)
          rej(err)
        })
    } else {
      res(null)
    }
  })
  return p
}


// S3 upload function
// the prefixes are very important for S3 folder structure
// we group S3 assets from folders such as so:
// corporation > building > main_photos > img.png
// corporation > corporation_assets > thumbnail > img.png
module.exports.uploadFileToS3 = function(file, convo_id) {
	const p = new Promise((res, rej) => {
		const S3 = new AWS.S3()
		console.log(file)

		// S3 Folder-File syntax: corporation_id/building_id/asset_type/file_name.png
    // const key = convo_id + file.name
    const key = convo_id + '/' + file.filename

		S3.upload({
				Bucket: 'renthero-email-attachments',
		    Key: key,
		    Body: file.content,
		    ACL: 'public-read'
		}, (err, S3Object) => {
		    if (err) {
					console.log(err)
	      	const msg = `There was an error uploading your file: ${err.message}`
	      	// console.log(msg)
	      	rej(msg)
	      	return
		    }
				const msg = `Successfully uploaded original file ${file.filename}`
				res(Object.assign({}, S3Object, { filename: file.filename, }))
		})
	})
	return p
}
