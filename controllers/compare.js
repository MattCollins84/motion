'use strict';
const image = require('../lib/image');
const mime = require('mime-types');

/**
 * Handler for POST /compare
 * @param {*} req 
 * @param {*} res 
 */
const compareImages = function(req, res) {
  
  // parameter validation
  if (!req.body || !req.body.cameraId) return res.status(400).send({
    success: false,
    error: 'No cameraId provided'
  })
  
  if (!req.files || !req.files.comparisonImage) return res.status(400).send({
    success: false,
    error: 'No comparisonImage provided'
  });

  // save the image as <cameraId>-comparison.<extension>
  let comparisonImage = req.files.comparisonImage;
  let ext = mime.extension(comparisonImage.mimetype)
  image.save(comparisonImage, `./images/${req.body.cameraId}-comparison.${ext}`, function(err) {
    
    if (err) return res.status(500).send({
      success: false,
      err: err
    });

    // compare the two images
    image.compare(req.body.cameraId, function(err, data) {
      
      if (err) return res.status().send({
        success: false,
        error: err
      });

      return res.send(Object.assign({
        success: true
      }, data));

    });
  });
}

module.exports = {
  compareImages: compareImages
}