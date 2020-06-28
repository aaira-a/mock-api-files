const AWS = require('aws-sdk');


exports.service = () => {
  return new AWS.S3({
    accessKeyId: process.env.MOCK_API_S3_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MOCK_API_S3_AWS_SECRET_ACCESS_KEY,
    region: process.env.MOCK_API_S3_REGION
  });  
}


exports.getFileAsJson = async (service, key) => {

  try {

    const params = {
      Bucket: process.env.MOCK_API_S3_BUCKET_NAME,
      Key: key
    };

  const data = await service.getObject(params).promise();

  return JSON.parse(data.Body.toString('utf-8'));

  } catch (e) {
    return {
      'error': `Could not retrieve and/or parse file from S3: ${e.message}`,
      'bucket': process.env.MOCK_API_S3_BUCKET_NAME,
      'key': key
    };
  }

}

exports.saveJsonAsFile = async (service, key, content) => {

  try {

    const params = {
      Bucket: process.env.MOCK_API_S3_BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(content),
      ContentType: 'application/json'
    };

  return await service.putObject(params).promise();

  } catch (e) {
    throw new Error(`Could not save file to S3: ${e.message}`)
  }

}
