const expect = require("chai").expect;
const fs = require("fs");
const sinon = require("sinon");

const AWS = require('aws-sdk');

const fileService = require("../../app/services/fileService");


describe('fileService', () => {

  const env = Object.assign({}, process.env);

  before(() => {
    process.env.MOCK_API_S3_AWS_ACCESS_KEY_ID = 'accessKeyId123';
    process.env.MOCK_API_S3_AWS_SECRET_ACCESS_KEY = 'secretAccessKey456';
    process.env.MOCK_API_S3_REGION = 'region789';
    process.env.MOCK_API_S3_BUCKET_NAME = 'bucket012';
  });

  after(() => {
    process.env = env;
  }); 

  it('should instantiate S3 client with environment variables', () => {
    const connectionInfo = {
      accessKeyId: 'accessKeyId123',
      secretAccessKey: 'secretAccessKey456',
      region: 'region789'      
    }
    AWS.S3 = sinon.stub();

    fileService.client();

    expect(AWS.S3.calledWithNew(connectionInfo)).to.eql(true);

  });

  it('getFile retrieves file from S3 and returns json', async () => {
    const buffer = fs.readFileSync('tests/fixtures/callbackpayload.json');
    const args = {
      Bucket: 'bucket012',
      Key: 'path123.json'
    }
    client = sinon.stub();
    client.getObject = sinon.stub().returns({
      promise: sinon.stub().returns({
        Body: buffer
      })
    });

    const content = await fileService.getFileAsJson(client, 'path123.json');

    expect(client.getObject.calledWith(args)).to.eql(true);
    expect(content).to.eql(JSON.parse(buffer));
  });

  it('getFile returns error object if failing to retrieve file from S3', async () => {
    const args = {
      Bucket: 'bucket012',
      Key: 'path123.json'
    }

    const errorObject = {
      Error: 'Could not retrieve and/or parse file from S3: error1',
      Bucket: 'bucket012',
      Key: 'path123.json'
    }
    client = sinon.stub();
    client.getObject = sinon.stub().returns({
      promise: sinon.stub().returns(
        Promise.reject({message: 'error1'})
      )
    });

    const content = await fileService.getFileAsJson(client, 'path123.json');

    expect(client.getObject.calledWith(args)).to.eql(true);
    expect(content).to.eql(errorObject);
  });

  it('getFile returns error object if failing to parse file from S3', async () => {
    const buffer = fs.readFileSync('tests/fixtures/callbackpayloadinvalid.json');
    const args = {
      Bucket: 'bucket012',
      Key: 'path123.json'
    }

    const errorObject = {
      Error: 'Could not retrieve and/or parse file from S3: Unexpected token o in JSON at position 1',
      Bucket: 'bucket012',
      Key: 'path123.json'
    }
    client = sinon.stub();
    client.getObject = sinon.stub().returns({
      promise: sinon.stub().returns({
        Body: buffer
      })
    });

    const content = await fileService.getFileAsJson(client, 'path123.json');

    expect(client.getObject.calledWith(args)).to.eql(true);
    expect(content).to.eql(errorObject);
  });

  it('saveJson saves json object into S3', async () => {
    const content = JSON.parse(fs.readFileSync('tests/fixtures/callbackpayload.json'));
    const args = {
      Bucket: 'bucket012',
      Key: 'path123.json',
      Body: JSON.stringify(content),
      ContentType: 'application/json'
    }
    client = sinon.stub();
    client.putObject = sinon.stub().returns({
      promise: sinon.stub().returns({
        Expiration: 'expiry-date="xxx", rule-id="yyy"',
        ETag: '"zzz"'
      })
    });

    const result = await fileService.saveJsonAsFile(client, 'path123.json', content);

    expect(client.putObject.calledWith(args)).to.eql(true);
  });

  it('listFiles retrieves files list from S3 and returns keys', async () => {
    const args = {
      Bucket: 'bucket012',
      Prefix: 'prefix1/'
    }

    const expected = {
      Contents: [
        {Key: 'prefix1/item1.json'},
        {Key: 'prefix1/item2.json'}
      ],
        Name: 'bucket012',
        Prefix: 'prefix1/',
        KeyCount: 2
    }
    client = sinon.stub();
    client.listObjectsV2 = sinon.stub().returns({
      promise: sinon.stub().returns(
        expected
      )
    });

    const result = await fileService.listFilesWithPrefix(client, 'prefix1/');

    expect(client.listObjectsV2.calledWith(args)).to.eql(true);
    expect(result).to.eql(expected);
  });

  it('listFiles returns empty result when failing to retrieve files list from S3', async () => {
    const args = {
      Bucket: 'bucket012',
      Prefix: 'prefix1/'
    }

    const errorObject = {
      Error: 'Could not retrieve file list from S3: error2',
      Contents: [],
      Name: 'bucket012',
      Prefix: 'prefix1/',
      KeyCount: 0
    }

    client = sinon.stub();
    client.listObjectsV2 = sinon.stub().returns({
      promise: sinon.stub().returns(
        Promise.reject({message: 'error2'})
      )
    });

    const result = await fileService.listFilesWithPrefix(client, 'prefix1/');

    expect(client.listObjectsV2.calledWith(args)).to.eql(true);
    expect(result).to.eql(errorObject);
  });

  it('listFiles returns empty result when receiving empty files list from S3', async () => {
    const args = {
      Bucket: 'bucket012',
      Prefix: 'prefix1/'
    }

    const expected = {
      Contents: [],
        Name: 'bucket012',
        Prefix: 'prefix1/',
        KeyCount: 0
    }
    client = sinon.stub();
    client.listObjectsV2 = sinon.stub().returns({
      promise: sinon.stub().returns(
        expected
      )
    });

    const result = await fileService.listFilesWithPrefix(client, 'prefix1/');

    expect(client.listObjectsV2.calledWith(args)).to.eql(true);
    expect(result).to.eql(expected);
  });

});
