const AWS = require('aws-sdk');


exports.client = () => {
  return new AWS.S3({
    accessKeyId: process.env.MOCK_API_S3_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MOCK_API_S3_AWS_SECRET_ACCESS_KEY,
    region: process.env.MOCK_API_S3_REGION
  });  
}


exports.getFileAsJson = async (client, key) => {

  try {

    const params = {
      Bucket: process.env.MOCK_API_S3_BUCKET_NAME,
      Key: key
    };

  const data = await client.getObject(params).promise();

  return JSON.parse(data.Body.toString('utf-8'));

  } catch (e) {
    return {
      'Error': `Could not retrieve and/or parse file from S3: ${e.message}`,
      'Bucket': process.env.MOCK_API_S3_BUCKET_NAME,
      'Key': key
    };
  }

}

exports.saveJsonAsFile = async (client, key, content) => {

  try {

    const params = {
      Bucket: process.env.MOCK_API_S3_BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(content),
      ContentType: 'application/json'
    };

  return await client.putObject(params).promise();

  } catch (e) {
    throw new Error(`Could not save file to S3: ${e.message}`)
  }

}

exports.listFilesWithPrefix = async (client, prefix) => {

  try {

    const params = {
      Bucket: process.env.MOCK_API_S3_BUCKET_NAME,
      Prefix: prefix
    };

  const data = await client.listObjectsV2(params).promise();

  return data;

  } catch (e) {
    return {
      'Error': `Could not retrieve file list from S3: ${e.message}`,
      'Name': process.env.MOCK_API_S3_BUCKET_NAME,
      'Prefix': prefix,
      'Contents': [],
      'KeyCount': 0
    };
  }

}
