const AWS = require('aws-sdk');


exports.service = () => {
  return new AWS.S3({
    accessKeyId: process.env.MOCK_API_S3_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MOCK_API_S3_AWS_SECRET_ACCESS_KEY,
    region: process.env.MOCK_API_S3_REGION
  });  
}


exports.getFile = async (service, key) => {
  try {

    const params = {
      Bucket: process.env.MOCK_API_S3_BUCKET_NAME,
      Key: key
    };

  const data = await service.getObject(params).promise();

  return data.Body.toString('utf-8');

  } catch (e) {
    throw new Error(`Could not retrieve file from S3: ${e.message}`)
  }

}
