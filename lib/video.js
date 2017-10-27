'use strict';
const fs = require('fs');
const exec = require('child_process').exec;
const ffmpeg = require('fluent-ffmpeg');
const glob = require("glob");

const createFromImages = function(videoID, callback) {

  glob(`./videos/${videoID}-*`, function(err, files) {
    if (err) return callback(err);
    if (files.length <= 5) return callback(new Error('not enough image files to create video'));
    let video = new ffmpeg({ source: `./videos/${videoID}-1%04d.jpg`, nolog: true })
    .withFps(10)
    .withVideoCodec('libx264')
    .withSize('720x480')
    .addOption('-crf', '25')
    .addOption('-pix_fmt', 'yuv420p')
    .on('error', function(err) {
      return callback(err);
    })
    .on('end', function() {
      return callback();
    })
    .save(`./videos/${videoID}.mp4`);
  })
  
  // ffmpeg -r 10 -f image2 -s 720x480 -i 1508836361721-1%04d.jpg -vcodec libx264 -crf 25  -pix_fmt yuv420p test.mp4
}

module.exports = {
  createFromImages: createFromImages
}