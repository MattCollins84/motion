'use strict';
const glob = require('glob');
const async = require('async');
const fs = require('fs');

const deleteFromGlob = function(pattern, callback) {
  glob(pattern, function(err, files) {
    if (err) return callback(err);
    const actions = [];
    files.forEach(function(file) {
      actions.push(function(callback) {
        fs.unlink(file, function(err) {
          return callback(null, { file: file, unlinked: err ? false : true, error: err ? new Error(err) : null });
        });
      });
    });

    async.parallel(actions, function(err, result) {
      return callback(result);
    })
  });
}

module.exports = {
  deleteFromGlob: deleteFromGlob
}