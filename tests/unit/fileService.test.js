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

    fileService.service();

    expect(AWS.S3.calledWithNew(connectionInfo)).to.eql(true);

  });

  it('getFile retrieves file from S3 and returns json', async () => {
    const buffer = fs.readFileSync('tests/fixtures/callbackpayload.json');
    const args = {
      Bucket: 'bucket012',
      Key: 'path123.json'
    }
    service = sinon.stub();
    service.getObject = sinon.stub().returns({
      promise: sinon.stub().returns({
        Body: buffer
      })
    });

    const content = await fileService.getFileAsJson(service, 'path123.json');

    expect(service.getObject.calledWith(args)).to.eql(true);
    expect(content).to.eql(JSON.parse(buffer));
  });

  it('getFile returns error object if failing to parse file from S3', async () => {
    const buffer = fs.readFileSync('tests/fixtures/callbackpayloadinvalid.json');
    const args = {
      Bucket: 'bucket012',
      Key: 'path123.json'
    }

    const errorObject = {
      error: 'Could not retrieve and/or parse file from S3: ',
      bucket: 'bucket012',
      key: 'path123.json'
    }
    service = sinon.stub();
    service.getObject = sinon.stub().returns({
      promise: sinon.stub().returns({
        Body: buffer
      })
    });

    const content = await fileService.getFileAsJson(service, 'path123.json');

    expect(service.getObject.calledWith(args)).to.eql(true);
    expect(content.error).to.include(errorObject.error);
    expect(content.bucket).to.eql(errorObject.bucket);
    expect(content.key).to.eql(errorObject.key);
  });

  it('saveJson saves json object into S3', async () => {
    const content = JSON.parse(fs.readFileSync('tests/fixtures/callbackpayload.json'));
    const args = {
      Bucket: 'bucket012',
      Key: 'path123.json',
      Body: JSON.stringify(content),
      ContentType: 'application/json'
    }
    service = sinon.stub();
    service.putObject = sinon.stub().returns({
      promise: sinon.stub().returns({
        Expiration: 'expiry-date="xxx", rule-id="yyy"',
        ETag: '"zzz"'
      })
    });

    const result = await fileService.saveJsonAsFile(service, 'path123.json', content);

    expect(service.putObject.calledWith(args)).to.eql(true);
  });

});
