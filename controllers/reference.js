'use strict';
const image = require('../lib/image');
const mime = require('mime-types');

/**
 * Handler for POST /reference
 * @param {*} req 
 * @param {*} res 
 */
const uploadReferenceImage = function(req, res) {
  
  
  // paramter validation
  if (!req.body || !req.body.cameraId) return res.status(400).send({
    success: false,
    error: 'No cameraId provided'
  })
  
  if (!req.files || !req.files.referenceImage) return res.status(400).send({
    success: false,
    error: 'No referenceImage provided'
  });

  // save the image as <cameraId>-reference.<extension>
  let referenceImage = req.files.referenceImage;
  let ext = mime.extension(referenceImage.mimetype)
  image.save(referenceImage, `./images/${req.body.cameraId}-reference.${ext}`, function(err) {
    if (err) return res.status(500).send({
      success: false,
      err: err
    });

    return res.send({
      success: true
    });
  });
}

module.exports = {
  uploadReferenceImage: uploadReferenceImage
}