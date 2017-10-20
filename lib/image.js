'use strict';
const cv = require('opencv');
const async = require('async');
const fs = require('fs');

/**
 * Compare two images to detect if there are differences and/or faces
 * @param {*} cameraId - the cameraId that these images belongs to
 * @param {*} callback
 */
const compare = function(cameraId, callback) {
  
  // load images by cameraId reference
  // TODO: make this file extention agnostic
  const referencePath = `./images/${cameraId}-reference.jpeg`;
  const comparisonPath = `./images/${cameraId}-comparison.jpeg`;
  
  const actions = {
    loadReferenceImage: function(callback) {
      cv.readImage(referencePath, callback)
    },
    loadComparisonImage: function(callback) {
      cv.readImage(comparisonPath, callback)
    }
  };

  // after images are loaded
  async.parallel(actions, function(err, images) {
    
    // detect differences between the images
    const differences = detectDifferences(images.loadReferenceImage, images.loadComparisonImage);
    
    // detect any faces in the image
    detectFaces(images.loadComparisonImage, function(err, faces) {
      if (err) return callback(err);
      
      // callback with difference=<boolean>, faces=<number>
      return callback(null, {
        difference: !!differences.length,
        faces: faces.length || 0
      })
    });

  });
}

/**
 * Small wrapper around saving image (Not sure if needed)
 * @param {*} image - Image data
 * @param {*} path - Path to save to
 * @param {*} callback 
 */
const save = function(image, path, callback) {
  image.mv(path, function(err) {
    if (err) return callback(err);
    return callback();
  });
}

/**
 * Detect differences between two openCV images
 * @param {*} ref - the reference image
 * @param {*} frame - the comparison frame
 * @param {*} options - configuration (optional)
 */
const detectDifferences = function(ref, frame, options) {
  
  // create a copy of both frames
  const comparisonFrame = frame.copy();
  const referenceFrame = ref.copy();

  // create our options object from supplied options and defaults
  const opts = Object.assign({},
  {
    lineThickness: 1,
    lineColour: [0, 255, 0],
    minArea: 3500
  }, options || {});

  // greyscale and blur
  referenceFrame.convertGrayscale();
  referenceFrame.gaussianBlur([21,21]);

  comparisonFrame.convertGrayscale();
  comparisonFrame.gaussianBlur([21,21]);

  // find the differences between the two frames
  // TODO: make this configurable (tolerance etc...)
  const delta = new cv.Matrix(referenceFrame.height(), referenceFrame.width());
  delta.absDiff(referenceFrame, comparisonFrame);
  delta.canny(0, 60);
  delta.dilate(2);

  // determine the differences we would like to record and record them
  const contours = delta.findContours();
  let differences = [];

  for(let i = 0; i < contours.size(); i++) {
    
    // minArea and maxArea refer to pixel size
    // TODO: make this more configurable
    let minArea = opts.minArea;
    let maxArea = (referenceFrame.width() * referenceFrame.height()) * 0.75; // 917604
    let validSize = (contours.area(i) > minArea && contours.area(i) < maxArea);
    
    if (validSize) {
      let rect = contours.boundingRect(i);
      differences.push({
        points: [rect.x, rect.y], 
        dimensions: [rect.width, rect.height], 
        lineColour: opts.lineColour, 
        lineThickness: opts.lineThickness
      });
    }

  }

  return differences;

}

/**
 * Detect faces in an openCV image
 * @param {*} frame - the frame to detect faces in
 * @param {*} options - configuration (optional)
 * @param {*} callback 
 */
const detectFaces = function(frame, options, callback) {

  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  
  // create our options object from supplied options and defaults
  const opts = Object.assign({},
    {
      lineThickness: 1,
      lineColour: [0, 0, 255],
    }, options || {});
  
  // detect and record faces
  let detectedFaces = [];
  frame.detectObject(cv.FACE_CASCADE, {}, function(err, faces) {
    if (err) return callback(err);
    
    for (let i = 0; i < faces.length; i++) {
      const face = faces[i];
      detectedFaces.push({
        points: [face.x, face.y], 
        dimensions: [face.width, face.height], 
        lineColour: opts.lineColour, 
        lineThickness: opts.lineThickness
      });
    }
    
    return callback(null, detectedFaces);

  });
}

/**
 * Draw boxes onto an openCV frame
 * @param {*} frame - the frame to draw on
 * @param {*} boxes - the boxes array describing the boxes to draw
 */
const drawBoxes = function(frame, boxes) {
  boxes.forEach(function(box) {
    frame.rectangle(box.points, box.dimensions, box.lineColour, box.lineThickness)
  });
  return frame;
}

module.exports = {
  save: save,
  compare: compare,
  detectDifferences: detectDifferences,
  detectFaces: detectFaces,
  drawBoxes: drawBoxes
}