const assert = require("assert");
const expect = require("chai").expect;
const fs = require("fs");
const request = require("supertest");
const validator = require("validator");
const app = require("../../app/app");

describe('GET /api/hello', () => {

  it('should return 200 status', () => {
    return request(app)
      .get('/api/hello')
      .then((response) => {
        expect(response.status).to.eql(200)
      })
  });

  it('should return json response', () => {
    return request(app)
      .get('/api/hello')
      .then((response) => {
        expect(response.body).to.eql({"hello": "world"});
        expect(response.headers['content-type']).to.include('application/json');
      })
  });

});

describe('GET /api/docs/', () => {

  it('should return 200 status for existing file', () => {
    return request(app)
      .get('/api/docs/swagger.json')
      .then((response) => {
        expect(response.status).to.eql(200)
      })
  });

  it('should return 404 status for non-existing file', () => {
    return request(app)
      .get('/api/docs/doesnexist.json')
      .then((response) => {
        expect(response.status).to.eql(404)
      })
  });

});

describe('ALL /api/echo/:status?', () => {

  it('should return 200 status', () => {
    return request(app)
      .get('/api/echo')
      .then((response) => {
        expect(response.status).to.eql(200)
      })
  });

  it('should return request headers in echo-headers object, downcased keys', () => {
    return request(app)
      .get('/api/echo')
      .set('Custom-Echo-Header', 'Random-Value-123')
      .set('Another-Echo-Header', 'My value 456')
      .then((response) => {
        expect(response.body['echo-headers']['custom-echo-header']).to.eql('Random-Value-123');
        expect(response.body['echo-headers']['another-echo-header']).to.eql('My value 456');
      })
  });

  it('should return json response', () => {
    return request(app)
      .get('/api/echo')
      .then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
      })
  });

  it('should return query strings in echo-qs object', () => {
    return request(app)
      .get('/api/echo?abc=def&ghi=jkl')
      .then((response) => {
        expect(response.body['echo-qs']['abc']).to.eql('def');
        expect(response.body['echo-qs']['ghi']).to.eql('jkl');
      })
  });

  it('should return orignal url in echo-originalurl property', () => {
    return request(app)
      .get('/api/echo?abc=def&ghi=jkl')
      .then((response) => {
        expect(response.body['echo-originalurl']).to.eql('/api/echo?abc=def&ghi=jkl');
      })
  });

  ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'].forEach((method) => {
    it('should return ' + method + ' method in echo-method key', () => {
      return request(app)
        [method.toLowerCase()]('/api/echo')
        .then((response) => {
          expect(response.body['echo-method']).to.eql(method);
        })
    });
  });

  it('should return json request body in echo-body object', () => {
    return request(app)
      .post('/api/echo')
      .set('Content-Type', 'application/json')
      .send({'key1': 'value1', 'key2': 'value2'})
      .then((response) => {
        expect(response.body['echo-body-content-type']).to.include('application/json');
        expect(response.body['echo-body']).to.eql({'key1': 'value1', 'key2': 'value2'});
      })
  });

  it('should return 400 status for malformed json request body', () => {
    return request(app)
      .post('/api/echo')
      .set('Content-Type', 'application/json')
      .send('{"key1":}')
      .then((response) => {
        expect(response.body['error']['body']).to.eql('{\"key1\":}');
      })
  });

  [200, 400, 401, 403, 404, 405, 410, 500, 502, 503, 504].forEach((status) => {
    it('should return ' + status + ' status if supplied in route parameter', () => {
      return request(app)
        .post('/api/echo/' + status.toString())
        .then((response) => {
          expect(response.status).to.eql(status);
        })
    });
  });
});

describe('ALL /api/echo-from-text/:status?', () => {

  it('should return 200 status', () => {
    return request(app)
      .get('/api/echo-from-text')
      .then((response) => {
        expect(response.status).to.eql(200)
      })
  });

  it('should return request headers in echo-headers object, downcased keys', () => {
    return request(app)
      .get('/api/echo-from-text')
      .set('Custom-Echo-Header', 'Random-Value-123')
      .set('Another-Echo-Header', 'My value 456')
      .then((response) => {
        expect(response.body['echo-headers']['custom-echo-header']).to.eql('Random-Value-123');
        expect(response.body['echo-headers']['another-echo-header']).to.eql('My value 456');
      })
  });

  it('should return json response', () => {
    return request(app)
      .get('/api/echo-from-text')
      .then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
      })
  });

  it('should return query strings in echo-qs object', () => {
    return request(app)
      .get('/api/echo-from-text?abc=def&ghi=jkl')
      .then((response) => {
        expect(response.body['echo-qs']['abc']).to.eql('def');
        expect(response.body['echo-qs']['ghi']).to.eql('jkl');
      })
  });

  ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'].forEach((method) => {
    it('should return ' + method + ' method in echo-method key', () => {
      return request(app)
        [method.toLowerCase()]('/api/echo-from-text')
        .then((response) => {
          expect(response.body['echo-method']).to.eql(method);
        })
    });
  });

  it('should return text request body in echo-body-text property', () => {
    return request(app)
      .post('/api/echo-from-text')
      .set('Content-Type', 'text/plain')
      .send('this is a text')
      .then((response) => {
        expect(response.body['echo-body-text']).to.eql('this is a text');
      })
  });

  it('should convert text request body to json and return in body', () => {
    return request(app)
      .post('/api/echo-from-text')
      .set('Content-Type', 'text/plain')
      .send('{"key1": "value1", "key2": "value2"}')
      .then((response) => {
        expect(response.body).to.include({'key1': 'value1', 'key2': 'value2'});
      })
  });

  it('should convert escaped text request body to json and return in body', () => {
    return request(app)
      .post('/api/echo-from-text')
      .set('Content-Type', 'text/plain')
      .send("\"{\\\"abc\\\": true, \\\"def\\\": 123, \\\"message\\\": \\\"message1\\\"}\"")
      .then((response) => {
        expect(response.body).to.include({'abc': true, 'def': 123, 'message': 'message1'});
      })
  });

  [200, 400, 401, 403, 404, 405, 410, 500, 502, 503, 504].forEach((status) => {
    it('should return ' + status + ' status if supplied in route parameter', () => {
      return request(app)
        .post('/api/echo-from-text/' + status.toString())
        .then((response) => {
          expect(response.status).to.eql(status);
        })
    });
  });
});

describe('GET /api/files/errors/:status', () => {
  [200, 400, 401, 403, 404, 405, 410, 500, 502, 503, 504].forEach((status) => {
    it('should return ' + status + ' status supplied in route parameter', () => {
      return request(app)
        .get('/api/files/errors/' + status.toString())
        .then((response) => {
          expect(response.status).to.eql(status);
        })
    });
  });
});

describe('GET /api/files/download/base64', () => {
  it('should return file in response', () => {
    const file = fs.readFileSync('app/files/publicdomain.png');
    const content = file.toString('base64');

    return request(app)
      .get('/api/files/download/base64')
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.headers['content-disposition']).to.eql('attachment; filename="publicdomain.png"');
        expect(response.body['fileContent']).to.eql(content);
        expect(response.body['originalName']).to.eql('publicdomain.png');
        expect(response.body['mimeType']).to.eql('image/png');
        expect(response.body['md5']).to.eql('c9469b266705cf08cfa37f0cf834d11f');
        expect(response.body['size']).to.eql(6592);
      })
  });
});

describe('GET /api/files/download/base64/multi', () => {
  it('should return file in response', () => {
    const file1 = fs.readFileSync('app/files/publicdomain.png');
    const file2 = fs.readFileSync('app/files/creativecommons.png');
    const content1 = file1.toString('base64');
    const content2 = file2.toString('base64');

    return request(app)
      .get('/api/files/download/base64/multi')
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['count']).to.eql(2);
        expect(response.body['files'][0]['fileContent']).to.eql(content1);
        expect(response.body['files'][0]['originalName']).to.eql('publicdomain.png');
        expect(response.body['files'][0]['mimeType']).to.eql('image/png');
        expect(response.body['files'][0]['md5']).to.eql('c9469b266705cf08cfa37f0cf834d11f');
        expect(response.body['files'][0]['size']).to.eql(6592);
        expect(response.body['files'][1]['fileContent']).to.eql(content2);
        expect(response.body['files'][1]['originalName']).to.eql('creativecommons.png');
        expect(response.body['files'][1]['mimeType']).to.eql('image/png');
        expect(response.body['files'][1]['md5']).to.eql('64bb88afbfcfe03145d176001d413154');
        expect(response.body['files'][1]['size']).to.eql(6413);
      })
  });
});


describe('POST /api/files/upload/base64', () => {
  it('should return uploaded file information in response', () => {
    const file = fs.readFileSync('tests/fixtures/nasilemak.jpg');
    const content = file.toString('base64');

    return request(app)
      .post('/api/files/upload/base64')
      .set('Content-Type', 'application/json')
      .send({'fileContent': content, 'customName': 'nasilemak1.jpg'})
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['customName']).to.eql('nasilemak1.jpg');
        expect(response.body['mimeType']).to.eql('image/jpeg');
        expect(response.body['md5']).to.eql('e1a74395061dfe923b30546105fca578');
        expect(response.body['size']).to.eql(3884192);
      })
  });
});

describe('POST /api/files/upload/base64/multi', () => {
  it('should return uploaded file information in response', () => {
    const file1 = fs.readFileSync('tests/fixtures/nasilemak.jpg');
    const file2 = fs.readFileSync('tests/fixtures/eggs.jpg');
    const content1 = file1.toString('base64');
    const content2 = file2.toString('base64');

    return request(app)
      .post('/api/files/upload/base64/multi')
      .set('Content-Type', 'application/json')
      .send([
        {'fileContent': content1, 'customName': 'nasilemak1.jpg'},
        {'fileContent': content2, 'customName': 'eggs1.jpg'}
      ])
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['count']).to.eql(2);
        expect(response.body['files'][0]['customName']).to.eql('nasilemak1.jpg');
        expect(response.body['files'][0]['mimeType']).to.eql('image/jpeg');
        expect(response.body['files'][0]['md5']).to.eql('e1a74395061dfe923b30546105fca578');
        expect(response.body['files'][0]['size']).to.eql(3884192);
        expect(response.body['files'][1]['customName']).to.eql('eggs1.jpg');
        expect(response.body['files'][1]['mimeType']).to.eql('image/jpeg');
        expect(response.body['files'][1]['md5']).to.eql('9dc143a1ca18375c3e1d0bb7f64e6f80');
        expect(response.body['files'][1]['size']).to.eql(1754544);
      })
  });
});

describe('POST /api/files/upload/form-data', () => {
  it('should support part with image content type', () => {
    return request(app)
      .post('/api/files/upload/form-data')
      .set('Content-Type', 'multipart/form-data')
      .field('customName', 'nasilemak1.jpg')
      .attach(
        'file1',
        'tests/fixtures/nasilemak.jpg',
        {contentType: 'image/jpeg', filename: 'nasilemak.jpg'}
      )
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['originalName']).to.eql('nasilemak.jpg');
        expect(response.body['customName']).to.eql('nasilemak1.jpg');
        expect(response.body['mimeType']).to.eql('image/jpeg');
        expect(response.body['md5']).to.eql('e1a74395061dfe923b30546105fca578');
        expect(response.body['size']).to.eql(3884192);
      })
  });

  it('should support part with octet-stream content type', () => {
    return request(app)
      .post('/api/files/upload/form-data')
      .set('Content-Type', 'multipart/form-data')
      .field('customName', 'nasilemak1.jpg')
      .attach(
        'file1',
        'tests/fixtures/nasilemak.jpg',
        {contentType: 'application/octet-stream', filename: 'nasilemak.jpg'}
      )
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['originalName']).to.eql('nasilemak.jpg');
        expect(response.body['customName']).to.eql('nasilemak1.jpg');
        expect(response.body['mimeType']).to.eql('image/jpeg');
        expect(response.body['md5']).to.eql('e1a74395061dfe923b30546105fca578');
        expect(response.body['size']).to.eql(3884192);
      })
  });
});

describe('POST /api/files/download/octet-stream', () => {
  it('should return file in response', () => {

    const file = fs.readFileSync('tests/fixtures/publicdomain.png');

    return request(app)
      .get('/api/files/download/octet-stream')
      .expect(200)
      .expect('content-disposition', 'attachment; filename="publicdomain.png"')
      .expect(file)
      .expect('content-type', 'application/octet-stream')
      .expect('originalName', 'publicdomain.png')
      .expect('mimeType', 'image/png')
      .expect('md5', 'c9469b266705cf08cfa37f0cf834d11f')
      .expect('size', '6592')     
  });
});

describe('POST /api/files/upload/octet-stream', () => {
  it('should return uploaded file information in response', (done) => {
    const req = request(app)
      .post('/api/files/upload/octet-stream')
      .set('Content-Type', 'application/octet-stream')
      .set('Custom-Name', 'publicdomain1.jpg')
      
    const fileStream = fs.createReadStream('tests/fixtures/publicdomain.png');
    fileStream.on('end', () => {
      req.end((err, response) => {
        expect(response.status).to.eql(200);
        expect(response.body['customName']).to.eql('publicdomain1.jpg');
        expect(response.body['mimeType']).to.eql('image/png');
        expect(response.body['md5']).to.eql('c9469b266705cf08cfa37f0cf834d11f');
        expect(response.body['size']).to.eql(6592);
        done();
      });
    });

    fileStream.pipe(req, {end: false});
  });
});

describe('GET /api/files/download/uri', () => {
  it('should return file uri in response', () => {
    const fileUri = 'https://azamstatic.blob.core.windows.net/static/publicdomain.png';
    return request(app)
      .get('/api/files/download/uri')
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.headers['content-disposition']).to.eql('attachment; filename="publicdomain.png"');
        expect(response.body['uri']).to.eql(fileUri);
        expect(response.body['originalName']).to.eql('publicdomain.png');
        expect(response.body['mimeType']).to.eql('image/png');
        expect(response.body['md5']).to.eql('c9469b266705cf08cfa37f0cf834d11f');
        expect(response.body['size']).to.eql(6592);
      })
  });
});

describe('GET /api/files/download/uri/multi', () => {
  it('should return file uri in response', () => {
    const fileUri1 = 'https://azamstatic.blob.core.windows.net/static/publicdomain.png';
    const fileUri2 = 'https://azamstatic.blob.core.windows.net/static/creativecommons.png';
    return request(app)
      .get('/api/files/download/uri/multi')
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['count']).to.eql(2);
        expect(response.body['files'][0]['uri']).to.eql(fileUri1);
        expect(response.body['files'][0]['originalName']).to.eql('publicdomain.png');
        expect(response.body['files'][0]['mimeType']).to.eql('image/png');
        expect(response.body['files'][0]['md5']).to.eql('c9469b266705cf08cfa37f0cf834d11f');
        expect(response.body['files'][0]['size']).to.eql(6592);
        expect(response.body['files'][1]['uri']).to.eql(fileUri2);
        expect(response.body['files'][1]['originalName']).to.eql('creativecommons.png');
        expect(response.body['files'][1]['mimeType']).to.eql('image/png');
        expect(response.body['files'][1]['md5']).to.eql('64bb88afbfcfe03145d176001d413154');
        expect(response.body['files'][1]['size']).to.eql(6413);
      })
  });
});

describe('POST /api/files/upload/uri', () => {
  it('should return uploaded file information in response', () => {
    const fileUri = 'https://azamstatic.blob.core.windows.net/static/publicdomain.png';
    return request(app)
      .post('/api/files/upload/uri')
      .set('Content-Type', 'application/json')
      .send({'fileUri': fileUri, 'customName': 'publicdomain1.png'})
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['customName']).to.eql('publicdomain1.png');
        expect(response.body['mimeType']).to.eql('image/png');
        expect(response.body['md5']).to.eql('c9469b266705cf08cfa37f0cf834d11f');
        expect(response.body['size']).to.eql(6592);
      })
  });
});

describe('POST /api/files/upload/uri/multi', () => {
  it('should return uploaded file information in response', () => {
    const fileUri1 = 'https://azamstatic.blob.core.windows.net/static/publicdomain.png';
    const fileUri2 = 'https://azamstatic.blob.core.windows.net/static/creativecommons.png';    
    return request(app)
      .post('/api/files/upload/uri/multi')
      .set('Content-Type', 'application/json')
      .send([
        {'fileUri': fileUri1, 'customName': 'publicdomain1.png'},
        {'fileUri': fileUri2, 'customName': 'creativecommons1.png'}
      ])
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['count']).to.eql(2);
        expect(response.body['files'][0]['customName']).to.eql('publicdomain1.png');
        expect(response.body['files'][0]['mimeType']).to.eql('image/png');
        expect(response.body['files'][0]['md5']).to.eql('c9469b266705cf08cfa37f0cf834d11f');
        expect(response.body['files'][0]['size']).to.eql(6592);
        expect(response.body['files'][1]['customName']).to.eql('creativecommons1.png');
        expect(response.body['files'][1]['mimeType']).to.eql('image/png');
        expect(response.body['files'][1]['md5']).to.eql('64bb88afbfcfe03145d176001d413154');
        expect(response.body['files'][1]['size']).to.eql(6413);
      })
  });
});

describe('POST /api/all-types', () => {

  it('should return request headers in inputs object, downcased keys', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .set('Custom-Echo-Header', 'Random-Value-123')
      .set('Another-Echo-Header', 'My value 456')
      .then((response) => {
        expect(response.body['inputs']['headers']['custom-echo-header']).to.eql('Random-Value-123');
        expect(response.body['inputs']['headers']['another-echo-header']).to.eql('My value 456');
      })
  });

  it('should return request body in outputs object', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'any': {'key1': 'value1'}})
      .then((response) => {
        expect(response.body['inputs']['body']).to.eql({'any': {'key1': 'value1'}});
      })
  });

  it('should return json response', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send()
      .then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
      })
  });  

  it('should return text output', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'textInput': 'abc'}})
      .then((response) => {
        expect(response.body['outputs']['textOutput']).to.eql('abc')
      })
  });

  it('should return empty string for empty text input', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'textInput': ''}})
      .then((response) => {
        expect(response.body['outputs']['textOutput']).to.eql('')
      })
  });

  it('should return null for null text input', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'textInput': null}})
      .then((response) => {
        expect(response.body['outputs']['textOutput']).to.eql(null)
      })
  });

  it('should return decimal output', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'decimalInput': 123.45}})
      .then((response) => {
        expect(response.body['outputs']['decimalOutput']).to.eql(123.45)
      })
  });

  it('should not add decimal points for round decimal input', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'decimalInput': 42}})
      .then((response) => {
        expect(response.body['outputs']['decimalOutput']).to.eql(42)
      })
  });

  it('should return null for null decimal input', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'decimalInput': null}})
      .then((response) => {
        expect(response.body['outputs']['decimalOutput']).to.eql(null)
      })
  });

  it('should return integer output', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'integerInput': -789}})
      .then((response) => {
        expect(response.body['outputs']['integerOutput']).to.eql(-789)
      })
  });

  it('should preserve decimals if sent for integer input', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'integerInput': 67.89}})
      .then((response) => {
        expect(response.body['outputs']['integerOutput']).to.eql(67.89)
      })
  });

  it('should return null for null integer input', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'integerInput': null}})
      .then((response) => {
        expect(response.body['outputs']['integerOutput']).to.eql(null)
      })
  });

  it('should return true boolean output', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'booleanInput': true}})
      .then((response) => {
        expect(response.body['outputs']['booleanOutput']).to.eql(true)
      })
  });

  it('should return false boolean output', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'booleanInput': false}})
      .then((response) => {
        expect(response.body['outputs']['booleanOutput']).to.eql(false)
      })
  });

  it('should return null for null boolean input', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'booleanInput': null}})
      .then((response) => {
        expect(response.body['outputs']['booleanOutput']).to.eql(null)
      })
  });

  it('should return null for incorrect boolean input', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'booleanInput': 'true'}})
      .then((response) => {
        expect(response.body['outputs']['booleanOutput']).to.eql(null)
      })
  });

  it('should return datetime output with ISO 8601 Z format', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'datetimeInput': '2017-07-21T17:32:28Z'}})
      .then((response) => {
        expect(response.body['outputs']['datetimeOutput']).to.eql('2017-07-21T17:32:28Z')
      })
  });

  it('should return datetime output with ISO 8601 and time offset format', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'datetimeInput': '2017-07-21T17:32:28+0800'}})
      .then((response) => {
        expect(response.body['outputs']['datetimeOutput']).to.eql('2017-07-21T17:32:28+0800')
      })
  });

  it('should return null for null datetime input', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'datetimeInput': null}})
      .then((response) => {
        expect(response.body['outputs']['datetimeOutput']).to.eql(null)
      })
  });

  it('should return collection output', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'collectionInput': ['abc', 'def', 'ghi']}})
      .then((response) => {
        expect(response.body['outputs']['collectionOutput']).to.eql(['abc', 'def', 'ghi'])
      })
  });

  it('should return empty collection for empty collection input', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'collectionInput': []}})
      .then((response) => {
        expect(response.body['outputs']['collectionOutput']).to.eql([])
      })
  });

  it('should return null for non-collection input', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'collectionInput': 'abc'}})
      .then((response) => {
        expect(response.body['outputs']['collectionOutput']).to.eql(null)
      })
  });
});

describe('GET /api/all-types/object', () => {

  beforeEach(() => {
    this.hardcoded = {
      "text": "text1",
      "decimal": 123.546,
      "integer": 42,
      "boolean": true,
      "datetime": "2017-07-21T17:32:28Z",
      "collection": ["text2", -543.21, 24, true, "2020-12-31T17:56:57Z"],
      "object": {"key1": "value1", "key2": {"key3": "value3"}}
    };
  });

  it('should return request headers in inputs object, downcased keys', () => {
    return request(app)
      .get('/api/all-types/object')
      .set('Content-Type', 'application/json')
      .set('Custom-Echo-Header', 'Random-Value-123')
      .set('Another-Echo-Header', 'My value 456')
      .then((response) => {
        expect(response.body['inputs']['headers']['custom-echo-header']).to.eql('Random-Value-123');
        expect(response.body['inputs']['headers']['another-echo-header']).to.eql('My value 456');
      })
  });

  it('should return json response', () => {
    return request(app)
      .get('/api/all-types/object')
      .set('Content-Type', 'application/json')
      .send()
      .then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
      })
  });  

  it('should return hardcoded body in asObject', () => {
    return request(app)
      .get('/api/all-types/object')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asObject']).to.eql(this.hardcoded);
      })
  });

  it('should return hardcoded body in asString', () => {
    return request(app)
      .get('/api/all-types/object')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asString']).to.eql(this.hardcoded);
      })
  });

  it('should return hardcoded body in asObject if querystring is body', () => {
    return request(app)
      .get('/api/all-types/object?expected=body')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asObject']).to.eql(this.hardcoded);
      })
  });

  it('should return hardcoded body in asString if querystring is body', () => {
    return request(app)
      .get('/api/all-types/object?expected=body')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asString']).to.eql(this.hardcoded);
      })
  });

  it('should return empty object in asObject if querystring is literal "empty"', () => {
    return request(app)
      .get('/api/all-types/object?expected=empty')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asObject']).to.eql({});
      })
  });

  it('should return empty object in asString if querystring is literal "empty"', () => {
    return request(app)
      .get('/api/all-types/object?expected=empty')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asString']).to.eql({});
      })
  });

  it('should return hardcoded body in asObject if querystring is "" empty string', () => {
    return request(app)
      .get('/api/all-types/object?expected=')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asObject']).to.eql(this.hardcoded);
      })
  });

  it('should return hardcoded body in asString if querystring is "" empty string', () => {
    return request(app)
      .get('/api/all-types/object?expected=')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asString']).to.eql(this.hardcoded);
      })
  });

  it('should return hardcoded plaintext if requested in querystring', () => {
      return request(app)
      .get('/api/all-types/object?expected=plaintext')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.text).to.eql('this is a plaintext');
      })
  });

  it('should return hardcoded body in asObject if querystring not matching', () => {
    return request(app)
      .get('/api/all-types/object?expected=doesntexist')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asObject']).to.eql(this.hardcoded);
      })
  });

  it('should return hardcoded body in asString if querystring not matching', () => {
    return request(app)
      .get('/api/all-types/object?expected=doesntexist')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asString']).to.eql(this.hardcoded);
      })
  });
});

describe('GET /api/all-types/array', () => {

  beforeEach(() => {
    this.hardcoded = [
      "text1",
      123.546,
      42,
      true,
      "2017-07-21T17:32:28Z",
      {"key1": "value1", "key2": {"key3": "value3"}}
    ];
  });

  it('should return request headers in inputs object, downcased keys', () => {
    return request(app)
      .get('/api/all-types/array')
      .set('Content-Type', 'application/json')
      .set('Custom-Echo-Header', 'Random-Value-123')
      .set('Another-Echo-Header', 'My value 456')
      .then((response) => {
        expect(response.body['inputs']['headers']['custom-echo-header']).to.eql('Random-Value-123');
        expect(response.body['inputs']['headers']['another-echo-header']).to.eql('My value 456');
      })
  });

  it('should return json response', () => {
    return request(app)
      .get('/api/all-types/array')
      .set('Content-Type', 'application/json')
      .send()
      .then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
      })
  });  

  it('should return hardcoded body in asArray', () => {
    return request(app)
      .get('/api/all-types/array')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asArray']).to.eql(this.hardcoded);
      })
  });

  it('should return hardcoded body in asString', () => {
    return request(app)
      .get('/api/all-types/array')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asString']).to.eql(this.hardcoded);
      })
  });

  it('should return hardcoded body in asArray if querystring is body', () => {
    return request(app)
      .get('/api/all-types/array?expected=body')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asArray']).to.eql(this.hardcoded);
      })
  });

  it('should return hardcoded body in asString if querystring is body', () => {
    return request(app)
      .get('/api/all-types/array?expected=body')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asString']).to.eql(this.hardcoded);
      })
  });

  it('should return empty object in asArray if querystring is literal "empty"', () => {
    return request(app)
      .get('/api/all-types/array?expected=empty')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asArray']).to.eql({});
      })
  });

  it('should return empty object in asString if querystring is literal "empty"', () => {
    return request(app)
      .get('/api/all-types/array?expected=empty')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asString']).to.eql({});
      })
  });

  it('should return hardcoded body in asArray if querystring is "" empty string', () => {
    return request(app)
      .get('/api/all-types/array?expected=')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asArray']).to.eql(this.hardcoded);
      })
  });

  it('should return hardcoded body in asString if querystring is "" empty string', () => {
    return request(app)
      .get('/api/all-types/array?expected=')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asString']).to.eql(this.hardcoded);
      })
  });

  it('should return hardcoded plaintext if requested in querystring', () => {
      return request(app)
      .get('/api/all-types/array?expected=plaintext')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.text).to.eql('this is a plaintext');
      })
  });

  it('should return hardcoded body in asArray if querystring not matching', () => {
    return request(app)
      .get('/api/all-types/array?expected=doesntexist')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asArray']).to.eql(this.hardcoded);
      })
  });

  it('should return hardcoded body in asString if querystring not matching', () => {
    return request(app)
      .get('/api/all-types/array?expected=doesntexist')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asString']).to.eql(this.hardcoded);
      })
  });
});

describe('POST /api/all-parameter-types/:string_path/:integer_path/:boolean_path', () => {
  
  it('should return all parameters in output', () => {
    return request(app)
      .post('/api/all-parameter-types/something/777/true?string_query=mystringquery&integer_query=666&boolean_query=true')
      .set('Content-Type', 'application/json')
      .set('string_header', 'this is a string header')
      .set('integer_header', '555')
      .set('boolean_header', 'true')
      .send({'string_body': 'this is a string property'})
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['allParameterTypesOutput']["querystring"])
          .to.eql({'string_query': 'mystringquery', 'integer_query': '666', 'boolean_query': 'true'});
        expect(response.body['allParameterTypesOutput']["headers"]["string_header"])
          .to.eql('this is a string header');
        expect(response.body['allParameterTypesOutput']["headers"]["integer_header"])
          .to.eql('555');
        expect(response.body['allParameterTypesOutput']["headers"]["boolean_header"])
          .to.eql('true');
        expect(response.body['allParameterTypesOutput']["path"]["string-path"])
          .to.eql('something');
        expect(response.body['allParameterTypesOutput']["path"]["integer-path"])
          .to.eql('777');
        expect(response.body['allParameterTypesOutput']["path"]["boolean-path"])
          .to.eql('true');
        expect(response.body['allParameterTypesOutput']['body']['string_body'])
          .to.eql('this is a string property');
      })
  });
});

describe('POST /api/path-encoding/:text', () => {
  
  it('should return spaces encoded as %20', () => {
    return request(app)
      .post('/api/path-encoding/text%20with%20spaces')
      .set('Content-Type', 'application/json')
      .send({})
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['path']).to.eql('text%20with%20spaces')
      })
  });

  it('should return spaces encoded as +', () => {
    return request(app)
      .post('/api/path-encoding/text+with+spaces')
      .set('Content-Type', 'application/json')
      .send({})
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['path']).to.eql('text+with+spaces')
      })
  });

  it('should return encoded special characters', () => {
    return request(app)
      .post("/api/path-encoding/%3A%2F%3F%23%5B%5D%40%21%24%26%27%28%29%2A%2B%2C%3B%3D%25%20")
      .set('Content-Type', 'application/json')
      .send({})
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['path']).to.eql('%3A%2F%3F%23%5B%5D%40%21%24%26%27%28%29%2A%2B%2C%3B%3D%25%20')
      })
  });

});

describe('POST /api/query-encoding', () => {
  
  it('should return spaces encoded as %20', () => {
    return request(app)
      .post('/api/query-encoding?string_query=text%20with%20spaces')
      .set('Content-Type', 'application/json')
      .set('x-original-url', '/api/query-encoding?string_query=text%20with%20spaces')
      .send({})
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['query']).to.eql('text%20with%20spaces')
      })
  });

  it('should return spaces encoded as +', () => {
    return request(app)
      .post('/api/query-encoding?string_query=text+with+spaces')
      .set('Content-Type', 'application/json')
      .set('x-original-url', '/api/query-encoding?string_query=text+with+spaces')
      .send({})
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['query']).to.eql('text+with+spaces')
      })
  });

  it('should return encoded special characters', () => {
    return request(app)
      .post("/api/query-encoding?string_query=%3A%2F%3F%23%5B%5D%40%21%24%26%27%28%29%2A%2B%2C%3B%3D%25%20")
      .set('Content-Type', 'application/json')
      .set('x-original-url', "/api/query-encoding?string_query=%3A%2F%3F%23%5B%5D%40%21%24%26%27%28%29%2A%2B%2C%3B%3D%25%20")
      .send({})
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['query']).to.eql('%3A%2F%3F%23%5B%5D%40%21%24%26%27%28%29%2A%2B%2C%3B%3D%25%20')
      })
  });

});

describe('POST /api/form-urlencoded/', () => {

  it('should return true for urlencoded content type', () => {
    return request(app)
      .post('/api/form-urlencoded/mytext/parsed')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send()
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['inputs']['x-www-form-urlencoded']).to.eql(true);
      })
  });

  it('should return false for application/json content type', () => {
    return request(app)
      .post('/api/form-urlencoded/mytext/parsed')
      .set('Content-Type', 'application/json')
      .send()
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['inputs']['x-www-form-urlencoded']).to.eql(false);
      })
  });

  it('should return parsed data', () => {
    return request(app)
      .post('/api/form-urlencoded/mytext/parsed')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('string=abc&decimal=0.1&integer=23&boolean=true&datetime=2017-12-23T12:34:56Z')
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['outputs']['textPathOutput']).to.eql('mytext');
        expect(response.body['outputs']['textOutput']).to.eql('abc');
        expect(response.body['outputs']['decimalOutput']).to.eql(0.1);
        expect(response.body['outputs']['integerOutput']).to.eql(23);
        expect(response.body['outputs']['booleanOutput']).to.eql(true);
        expect(response.body['outputs']['datetimeOutput']).to.eql('2017-12-23T12:34:56Z');
      })
  });

})

describe('POST /api/async-callback', () => {

  it('should return 202 if initialStatusCode parameter is absent', () => {
    return request(app)
      .post('/api/async-callback')
      .set('Content-Type', 'application/json')
      .send({})
      .then((response) => {
        expect(response.status).to.eql(202);
      })
  });

  it('should return 202 if initialStatusCode parameter is null', () => {
    return request(app)
      .post('/api/async-callback')
      .set('Content-Type', 'application/json')
      .send({'initialStatusCode': null})
      .then((response) => {
        expect(response.status).to.eql(202);
      })
  });

  [200, 400, 401, 403, 404, 405, 410, 500, 502, 503, 504].forEach((status) => {
    it('should return ' +  status + ' if supplied in initialStatusCode parameter ', () => {
      return request(app)
        .post('/api/async-callback')
        .set('Content-Type', 'application/json')
        .send({'initialStatusCode': status})
        .then((response) => {
          expect(response.status).to.eql(status);
        })
    });
  });

  it('should return random uuid as receipt id', () => {
    return request(app)
      .post('/api/async-callback')
      .set('Content-Type', 'application/json')
      .send({})
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(validator.isUUID(response.body['receiptId'])).to.eql(true)
      })
  });

  it('should return input callbackUrl', () => {
    return request(app)
      .post('/api/async-callback?callbackUrl=something')
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(response.body['inputs']['callbackUrl']).to.eql('something')
      })
  });

  it('should return urldecoded output callbackUrl without status', () => {
    return request(app)
      .post('/api/async-callback?callbackUrl=https%3A%2F%2Fsub.domain.tld%2Fpath1%2Fpath2%2Foperation%3Fqs%3Dabc')
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(response.body['outputs']['callbackUrl']).to.eql('https://sub.domain.tld/path1/path2/operation?qs=abc')
      })
  });

  it('should return urldecoded output callbackUrl with status', () => {
    return request(app)
      .post('/api/async-callback?callbackUrl=https%3A%2F%2Fsub.domain.tld%2Fpath1%2Fpath2%2Foperation%3Fqs%3Dabc')
      .set('Content-Type', 'application/json')
      .send({'resultStatus': 'mystatus'})
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(response.body['outputs']['callbackUrl']).to.eql('https://sub.domain.tld/path1/path2/operation?qs=abc&status=mystatus')
      })
  });

  it('should return urldecoded output callbackUrl without status if status is empty string', () => {
    return request(app)
      .post('/api/async-callback?callbackUrl=https%3A%2F%2Fsub.domain.tld%2Fpath1%2Fpath2%2Foperation%3Fqs%3Dabc')
      .set('Content-Type', 'application/json')
      .send({'resultStatus': ''})
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(response.body['outputs']['callbackUrl']).to.eql('https://sub.domain.tld/path1/path2/operation?qs=abc')
      })
  });

  it('should return text output', () => {
    return request(app)
      .post('/api/async-callback')
      .set('Content-Type', 'application/json')
      .send({'textInput': 'xyz'})
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(response.body['outputs']['textOutput']).to.eql('xyz')
      })
  });

  it('should return result status if supplied in request', () => {
    return request(app)
      .post('/api/async-callback')
      .set('Content-Type', 'application/json')
      .send({'resultStatus': 'something'})
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(response.body['outputs']['actualResultStatus']).to.eql('something')
      })
  });

  it('should return null result status if parameter is absent', () => {
    return request(app)
      .post('/api/async-callback')
      .set('Content-Type', 'application/json')
      .send({})
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(response.body['outputs']['actualResultStatus']).to.eql(null)
      })
  });

  it('should return null result status if input is empty string', () => {
    return request(app)
      .post('/api/async-callback')
      .set('Content-Type', 'application/json')
      .send({'resultStatus': ''})
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(response.body['outputs']['actualResultStatus']).to.eql(null)
      })
  });

  it('should return error message if supplied in request', () => {
    return request(app)
      .post('/api/async-callback')
      .set('Content-Type', 'application/json')
      .send({'errorMessage': 'this is an error message'})
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(response.body['error']).to.eql('this is an error message')
      })
  });

  it('should not return error message if input is empty string', () => {
    return request(app)
      .post('/api/async-callback')
      .set('Content-Type', 'application/json')
      .send({'errorMessage': ''})
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(response.body['error']).to.eql(undefined)
      })
  });

  it('should not return null error message if parameter is absent', () => {
    return request(app)
      .post('/api/async-callback')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(response.body['error']).to.eql(undefined)
      })
  });

});

describe('GET /api/data/array/integer', () => {
  it('should return counter elements in array of integers', () => {
    return request(app)
      .get('/api/data/array/integer?elements=10')
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body).to.eql([1,2,3,4,5,6,7,8,9,10]);
      })
  });  
});
