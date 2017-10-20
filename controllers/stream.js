'use strict';
const unpipe = require('unpipe');
const WriteStream = require('stream').Writable;
const MjpegCamera = require('mjpeg-camera');
const cv = require('opencv');
const image = require('../lib/image');

// Create a new MjpegCamera object
// TODO: Abstract away, and control when to stop/start the feed
const camera = new MjpegCamera({
  user: 'admin',
  password: 'pass',
  url: 'http://10.0.1.21/getimage',
  name: 'Camera'
});
camera.start();

/**
 * Handler for GET /stream
 * @param {*} req 
 * @param {*} res 
 */
const mjpegStream = function(req, res) {

  // define the stream boundary and a new WriteStream
  const boundary = '--mystreamboundary';
  const ws = new WriteStream({objectMode: true});
  
  // Set some headers, including the boundary
  res.writeHead(200, { 
    'Content-Type': `multipart/x-mixed-replace; boundary=${boundary}`
  });
  
  // Our reference frame and the current frame ID
  let ref = null;
  let frameId = 0;

  // When we write to the WriteStream (i.e. each frame)
  ws._write = function(chunk, enc, next) {
    
    // capture the data and increment the frameID
    const jpeg = chunk.data;
    frameId++;

    // read the data into OpenCV
    cv.readImage(jpeg, function(err, frame) {

      // if we have a reference frame, detect the differences between this frame and the reference frame
      const differences = ref !== null ? image.detectDifferences(ref, frame) : [];
      
      // update the reference frame every 5 frames
      if (frameId % 5 === 0) {
        frameId = 0;
        ref = frame.copy();
      }
      
      // detect any faces in the frame
      image.detectFaces(frame, function(err, faces) {
        
        // combine the detected differences and faces and draw the boxes
        let boxes = differences.concat(faces);
        const outputFrame = image.drawBoxes(frame, boxes);

        // convert the outputFrame to a buffer and write to the response stream
        let buff = outputFrame.toBuffer();
        res.write(boundary + '\nContent-Type: image/jpeg\nContent-Length: '+ buff.length + '\n\n');
        res.write(buff);
        next();

      });

    });
    
  };

  // pipe data from the camera to the WriteStream
  camera.pipe(ws);

  // stop the piping when client closes
  res.on('close', function() {
    unpipe(camera);
  });

}

module.exports = {
  mjpegStream: mjpegStream
}