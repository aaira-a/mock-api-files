const express = require("express");

const axios = require("axios");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const fileType = require("file-type");
const fs = require("fs");
const jsonfile = require("jsonfile");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({storage: storage});
const path = require("path");

const app = express();

const asyncCallbackRoute = require("./routes/asyncCallback");
const sleepRoute = require("./routes/sleep");

const octetStreamParser = bodyParser.raw({type: 'application/octet-stream', limit: '50mb'});

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded());

app.use((req, res, next) => {
  if (req.headers.hasOwnProperty("x-apigateway-event")) {
    delete req.headers["x-apigateway-event"];
  }
  next();
});

app.get("/api/hello", (req, res) => {
  res.json({
    "hello": "world"
  })
});

app.get('/api/docs/:requestPath', (req, res) => {
  let requestPath = req.params.requestPath;
  let file = path.join(__dirname + '/docs/' + requestPath);

  jsonfile.readFile(file, (err, obj) => {
    if(err) {
      res.status(404);
    }
    res.json(obj);
  });
});

app.all('/api/echo/:status?', (req, res) => {
  let response = {};

  response["echo-method"] = req.method;
  response["echo-headers"] = req.headers;
  response["echo-qs"] = req.query;

  if (req.headers.hasOwnProperty("content-type")) {
    response["echo-body-content-type"] = req.headers["content-type"]
  }

  if (req.hasOwnProperty("body")) {
    response["echo-body"] = req.body;
  }

  if (req.params.status !== undefined) {
    res.status(req.params.status).json(response);
  }
  res.json(response);
})

app.get('/api/files/errors/:status', (req, res) => {
  res.status(req.params.status).send();
});

app.get('/api/files/download/base64', (req, res) => {
  const filepath = path.join(__dirname, 'files', 'publicdomain.png');
  const file = fs.readFileSync(filepath);

  const content = file.toString('base64');
  const hash = crypto.createHash('md5').update(file).digest("hex");

  let response = {
    "fileContent": content,
    "originalName": "publicdomain.png",
    "mimeType": "image/png",
    "md5": hash,
    "size": Buffer.byteLength(file)
  };

  res.json(response);
});

app.post('/api/files/upload/base64', async (req, res) => {

  const buffer = Buffer.from(req.body["fileContent"], 'base64');
  const mimeInfo = await fileType.fromBuffer(buffer);
  const hash = crypto.createHash('md5').update(buffer).digest("hex");

  let response = {
    "customName": req.body["customName"],
    "mimeType": mimeInfo["mime"],
    "md5": hash,
    "size": Buffer.byteLength(buffer, 'base64')
  };

  res.json(response);
});

app.post('/api/files/upload/form-data', upload.single('file1'), async (req, res) => {

  const buffer = Buffer.from(req.file.buffer, 'binary');
  const mimeInfo = await fileType.fromBuffer(buffer);
  const hash = crypto.createHash('md5').update(buffer).digest("hex");

  let response = {
    "originalName": req.file.originalname,
    "customName": req.body["customName"],
    "mimeType": mimeInfo["mime"],
    "md5": hash,
    "size": req.file.size
  };

  res.json(response);
});

app.post('/api/files/upload/octet-stream', octetStreamParser, async (req, res) => {

  const hash = crypto.createHash('md5').update(req.body).digest("hex");
  const mimeInfo = await fileType.fromBuffer(req.body)
    .then((result) => {

      let response = {
        "originalName": req.headers["content-disposition"].split("filename=")[1],
        "customName": req.headers["custom-name"],
        "mimeType": result["mime"],
        "md5": hash,
        "size": Buffer.byteLength(req.body)
      };

      res.json(response);

    });

});

app.get('/api/files/download/uri', (req, res) => {

  let response = {
    "uri": 'https://azamstatic.blob.core.windows.net/static/publicdomain.png',
    "originalName": "publicdomain.png",
    "mimeType": "image/png",
    "md5": 'c9469b266705cf08cfa37f0cf834d11f',
    "size": 6592
  };

  res.json(response);
});

app.post('/api/files/upload/uri', async (req, res) => {
  let sourceUri = req.body["fileUri"];

  axios({
    method: 'get',
    url: sourceUri,
    responseType: 'arraybuffer'
  })
  .then(async (downloaded) => {
    const buffer = Buffer.from(downloaded.data, 'base64');
    const mimeInfo = await fileType.fromBuffer(buffer);
    const hash = crypto.createHash('md5').update(buffer).digest("hex");

    let response = {
      "customName": req.body["customName"],
      "mimeType": mimeInfo["mime"],
      "md5": hash,
      "size": Buffer.byteLength(buffer, 'base64')
    };
    
    res.json(response);
  });

});

app.post('/api/all-types', (req, res) => {
  let response = {};

  response["inputs"] = {};
  response["inputs"]["headers"] = req.headers;
  response["inputs"]["body"] = req.body

  response["outputs"] = {};

  if (req.hasOwnProperty("body") && req["body"].hasOwnProperty("allTypesInputs")) {
    if (req.body["allTypesInputs"].hasOwnProperty("textInput")) {
      response["outputs"]["textOutput"] = req.body["allTypesInputs"]["textInput"];
    }

    if (req.body["allTypesInputs"].hasOwnProperty("decimalInput")) {
      response["outputs"]["decimalOutput"] = req.body["allTypesInputs"]["decimalInput"];
    }

    if (req.body["allTypesInputs"].hasOwnProperty("integerInput")) {
      response["outputs"]["integerOutput"] = req.body["allTypesInputs"]["integerInput"];
    }

    if (req.body["allTypesInputs"].hasOwnProperty("booleanInput")) {
      if (typeof req.body["allTypesInputs"]["booleanInput"] === 'boolean') {
        response["outputs"]["booleanOutput"] = req.body["allTypesInputs"]["booleanInput"];
      }
      else {
        response["outputs"]["booleanOutput"] = null;
      }
    }

    if (req.body["allTypesInputs"].hasOwnProperty("datetimeInput")) {
      response["outputs"]["datetimeOutput"] = req.body["allTypesInputs"]["datetimeInput"];
    }

    if (req.body["allTypesInputs"].hasOwnProperty("collectionInput")) {
      if (req.body["allTypesInputs"]["collectionInput"] instanceof Array) {
        response["outputs"]["collectionOutput"] = req.body["allTypesInputs"]["collectionInput"];
      }
      else {
        response["outputs"]["collectionOutput"] = null;
      }
    }
  }
  res.json(response);
});

app.get('/api/all-types/object', (req, res) => {
  let response = {};

  response["inputs"] = {};
  response["inputs"]["headers"] = req.headers;
  response["inputs"]["body"] = req.body;
  response["inputs"]["qs"] = req.query;

  response["outputs"] = {};


  response["outputs"]["object"] = {};

  hardcodedValid = {
      "text": "text1",
      "decimal": 123.546,
      "integer": 42,
      "boolean": true,
      "datetime": "2017-07-21T17:32:28Z",
      "collection": ["text2", -543.21, 24, true, "2020-12-31T17:56:57Z"],
      "object": {"key1": "value1", "key2": {"key3": "value3"}}
  };

  if (req.query.hasOwnProperty("expected")) {
    switch (req.query["expected"]) {
      case '':
        response["outputs"]["object"]["asObject"] = hardcodedValid;
        response["outputs"]["object"]["asString"] = hardcodedValid;
        break;
      case 'empty':
        response["outputs"]["object"]["asObject"] = {};
        response["outputs"]["object"]["asString"] = {};
        break;
      case 'plaintext':
        res.send(200, 'this is a plaintext');
      default:
        response["outputs"]["object"]["asObject"] = hardcodedValid;
        response["outputs"]["object"]["asString"] = hardcodedValid;
    }
  }
  else {
    response["outputs"]["object"]["asObject"] = hardcodedValid;
    response["outputs"]["object"]["asString"] = hardcodedValid;
  }

  res.json(response);
});

app.get('/api/all-types/array', (req, res) => {
  let response = {};

  response["inputs"] = {};
  response["inputs"]["headers"] = req.headers;
  response["inputs"]["body"] = req.body;
  response["inputs"]["qs"] = req.query;

  response["outputs"] = {};


  response["outputs"]["object"] = {};

  hardcodedValid = [
    "text1",
    123.546,
    42,
    true,
    "2017-07-21T17:32:28Z",
    {"key1": "value1", "key2": {"key3": "value3"}}
  ];

  if (req.query.hasOwnProperty("expected")) {
    switch (req.query["expected"]) {
      case '':
        response["outputs"]["object"]["asArray"] = hardcodedValid;
        response["outputs"]["object"]["asString"] = hardcodedValid;
        break;
      case 'empty':
        response["outputs"]["object"]["asArray"] = {};
        response["outputs"]["object"]["asString"] = {};
        break;
      case 'plaintext':
        res.send(200, 'this is a plaintext');
      default:
        response["outputs"]["object"]["asArray"] = hardcodedValid;
        response["outputs"]["object"]["asString"] = hardcodedValid;
    }
  }
  else {
    response["outputs"]["object"]["asArray"] = hardcodedValid;
    response["outputs"]["object"]["asString"] = hardcodedValid;
  }

  res.json(response);
});

app.post('/api/all-parameter-types/:string_path/:integer_path/:boolean_path', (req, res) => {
  let response = {};

  response["inputs"] = {};
  response["inputs"]["headers"] = req.headers;
  response["inputs"]["querystring"] = req.query;
  response["inputs"]["body"] = req.body;

  response["allParameterTypesOutput"] = {};
  response["allParameterTypesOutput"]["headers"] = {
    "string_header": req.headers["string_header"],
    "integer_header": req.headers["integer_header"],
    "boolean_header": req.headers["boolean_header"]
  }

  response["allParameterTypesOutput"]["path"] = {
    "string-path": req.params.string_path,
    "integer-path": req.params.integer_path,
    "boolean-path": req.params.boolean_path
  }

  response["allParameterTypesOutput"]["querystring"] = req.query;

  response["allParameterTypesOutput"]["body"] = req.body;  

  res.json(response);
});

app.post('/api/path-encoding/:text', (req, res) => {
  let response = {};

  response["inputs"] = {};
  response["inputs"]["originalUrl"] = req.originalUrl;
  response["inputs"]["headers"] = req.headers;
  response["inputs"]["body"] = req.body;

  response["path"] = req.originalUrl.replace(/.*\/api\/path-encoding\//g, '');
  res.json(response);
});

app.post('/api/query-encoding', (req, res) => {
  let response = {};

  response["inputs"] = {};
  response["inputs"]["originalUrl"] = req.originalUrl;
  response["inputs"]["headers"] = req.headers;
  response["inputs"]["body"] = req.body;

  response["query"] = req.headers["x-original-url"].replace(/.*\/api\/query-encoding\?string_query=/g, '');
  res.json(response);
});

app.post('/api/form-urlencoded/:string_path/parsed', (req, res) => {
  let response = {};

  response["inputs"] = {};
  response["inputs"]["originalUrl"] = req.originalUrl;
  response["inputs"]["headers"] = req.headers;
  response["inputs"]["body"] = req.body;

  if (req.headers.hasOwnProperty("content-type") 
      && req.headers["content-type"] === 'application/x-www-form-urlencoded') {
        response["inputs"]["x-www-form-urlencoded"] = true;
  }
  else {
    response["inputs"]["x-www-form-urlencoded"] = false;
  }

  response["outputs"] = {};
  response["outputs"]["textPathOutput"] = req.params.string_path;
  response["outputs"]["textOutput"] = req.body.string;
  response["outputs"]["decimalOutput"] = parseFloat(req.body.decimal);
  response["outputs"]["integerOutput"] = parseInt(req.body.integer);

  if (req.body.boolean === 'true') {
    response["outputs"]["booleanOutput"] = true;
  }

  else if (req.body.boolean === 'false') {
    response["outputs"]["booleanOutput"] = false;
  }

  else {
    response["outputs"]["booleanOutput"] = 'error'
  }

  response["outputs"]["datetimeOutput"] = req.body.datetime;


  res.json(response);
});

app.post('/api/async-callback', asyncCallbackRoute.post);

app.use('/api/sleep', sleepRoute.getSleep);

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError) {
    let response = {};
    response['error'] = err;
    res.status(400).json(response);
  } else {
    next();
  }
});

module.exports = app;
