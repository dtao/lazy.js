// This file is used by the promises-aplus-tests library.

var Lazy = require('../lazy');

module.exports = {
  deferred: function() {
    var handle = new Lazy.AsyncHandle();

    return {
      promise: handle,
      resolve: function(value) { handle._resolve(value); },
      reject: function(reason) { handle._reject(reason); }
    };
  }
};
