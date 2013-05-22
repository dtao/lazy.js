var fs = require("fs");

var StreamedSequence = global.Lazy.Sequence.inherit(function(path, encoding) {
  this.path = path;
  this.encoding = encoding;
});

StreamedSequence.prototype.each = function(fn) {
  var stream = fs.createReadStream(this.path);
  stream.setEncoding(this.encoding);

  var listener = function(e) {
    if (fn(e) === false) {
      stream.removeListener("data", listener);
    }
  };

  stream.on("data", listener);
};

global.Lazy.stream = function(path, encoding) {
  return new StreamedSequence(path, encoding);
};