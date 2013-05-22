var fs = require("fs");

var Lazy = global.Lazy;

var StreamedSequence = Lazy.Sequence.inherit(function(path, encoding) {
  this.path = path;
  this.encoding = encoding;
});

StreamedSequence.prototype.each = function(fn) {
  var stream = fs.createReadStream(this.path, {
    encoding: this.encoding,
    autoClose: true
  });

  var listener = function(e) {
    if (fn(e) === false) {
      stream.removeListener("data", listener);
    }
  };

  stream.on("data", listener);
};

var StreamedLineSequence = Lazy.Sequence.inherit(function(parent) {
  this.parent = parent;
});

StreamedLineSequence.prototype.each = function(fn) {
  this.parent.each(function(data) {
    var finished = false;

    // TODO: I'm pretty sure there's a bug here: if/when the buffer ends in the
    // middle of a line, this will artificially split that line in two. I'll
    // come back to this later.
    Lazy(data).split("\n").each(function(line) {
      if (fn(line) === false) {
        finished = true;
        return false;
      }
    });
    if (finished) {
      return false;
    }
  });
};

StreamedSequence.prototype.lines = function() {
  return new StreamedLineSequence(this);
};

Lazy.stream = function(path, encoding) {
  return new StreamedSequence(path, encoding);
};