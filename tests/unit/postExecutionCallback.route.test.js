const expect = require("chai").expect;
const sinon = require("sinon");

const AWS = require('aws-sdk');

const fileService = require("../../app/services/fileService");
const postExecutionCallback = require("../../app/routes/postExecutionCallback");


describe('POST /api/callback route', () => {

  before(() => {
    clock = sinon.useFakeTimers();
  });

  after(() => {
    clock.restore();
  }); 

  it('service function should instantiate file service', () => {
    fileService.client = sinon.stub();

    postExecutionCallback.service();

    expect(fileService.client.called).to.eql(true);
  });

  it('constructPath function should create path from instance id and current datetime', () => {
    const result = postExecutionCallback.constructPath('instance-001-abc');
    expect(result).to.eql('instance-001-abc/instance-001-abc_1970-01-01T00_00_00_000Z.json');
  });

  it('upload function should call file service save file function', () => {
    const path = 'prefix/timestamp.json';
    const payload = {
      'headers': {'header1': 'value1', 'header2': 'value2'},
      'body': {'key1': 'value1', 'key2': 'value2'}
    }

    client = sinon.stub();
    fileService.saveJsonAsFile = sinon.stub();

    postExecutionCallback.upload(client, path, payload);

    expect(fileService.saveJsonAsFile.calledOnceWith(client, path, payload)).to.eql(true);
  });

  it('download function should call file service get file function', () => {
    const path = 'prefix/timestamp.json';
    const content = {
      'headers': {'header1': 'value1', 'header2': 'value2'},
      'body': {'key1': 'value1', 'key2': 'value2'}
    }

    client = sinon.stub();
    fileService.getFileAsJson = sinon.stub().returns(content);

    result = postExecutionCallback.download(client, path);

    expect(fileService.getFileAsJson.calledWith(client, path)).to.eql(true);
    expect(result).to.eql(content);
  });

  it('query records function should call file service list files function', () => {
    const prefix = 'prefix0';
    const matches = {
      Contents: [
        {Key: 'prefix0/item1.json'},
        {Key: 'prefix0/item2.json'}
      ],
        KeyCount: 2
    }

    client = sinon.stub();
    fileService.listFilesWithPrefix = sinon.stub().returns(matches);

    result = postExecutionCallback.queryRecords(client, prefix);

    expect(fileService.listFilesWithPrefix.calledWith(client, prefix)).to.eql(true);
    expect(result).to.eql(matches);
  });

});
