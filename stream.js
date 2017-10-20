'use strict';
const http = require('http');
const MjpegCamera = require('mjpeg-camera');
const WriteStream = require('stream').Writable;
const unpipe = require('unpipe');

// Create a new MjpegCamera object
const camera = new MjpegCamera({
  user: 'admin',
  password: 'pass',
  url: 'http://10.0.1.21/getimage',
  name: 'Matt Camera'
});
camera.start();

const boundary = '--boundandrebound';
http.createServer(function(req, res) {
  // A request to http://localhost/stream returns an unending sequence of jpegs
  // Listen for a disconnect from the client to properly unpipe the jpeg stream
  if (/stream/.test(req.url)) {
    res.writeHead(200, {'Content-Type': 'multipart/x-mixed-replace; boundary=' + boundary});
    var ws = new WriteStream({objectMode: true});
    ws._write = function(chunk, enc, next) {
      var jpeg = chunk.data;
      res.write(boundary + '\nContent-Type: image/jpeg\nContent-Length: '+ jpeg.length + '\n\n');
      res.write(jpeg);
      next();
    };
    camera.pipe(ws);
    res.on('close', function() {
      unpipe(camera);
    });
  } 
  // A request to http://localhost/frame returns a single frame as a jpeg
  else if (/frame/.test(req.url)) {
    res.writeHead(200, {'Content-Type': 'image/jpeg'});
    res.end(camera.frame);
  } 
  // A request to http://localhost returns a simple webpage that will render
  // a livestream of jpegs from the camera
  else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<!doctype html>\
              <html>\
                <head>\
                  <title>'+camera.name+'</title>\
                </head>\
                <body style="background:#000;">\
                  <img src="/stream" style="width:100%;height:auto;">\
                </body>\
              </html>');
  }
}).listen(5000);