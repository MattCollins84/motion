'use strict';
const argv = require('optimist').argv;

const express = require('express');
const app = express();

const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');

// controllers
const uploadReferenceImage = require('./controllers/reference').uploadReferenceImage;
const compareImages = require('./controllers/compare').compareImages;
const mjpegStream = require('./controllers/stream').mjpegStream;

// app config
app.set('port', argv.port || 5000);

// middleware
app.use(fileUpload());
app.use(bodyParser());
app.use(express.static('public'));

// routes
app.get('/stream', mjpegStream);
app.post('/reference', uploadReferenceImage);
app.post('/compare', compareImages);

// listen
app.listen(app.get('port'), function () {
  console.log(`Example app listening on port ${app.get('port')}!`)
})