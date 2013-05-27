var fs = require("fs");

var Lazy = global.Lazy;

function StreamedSequence(path, encoding) {
  this.path = path;
  this.encoding = encoding;
}

StreamedSequence.prototype = new Lazy.Sequence();

/**
 * Handles every chunk of data in this sequence.
 *
 * @param {function(string):*} fn The function to call on each chunk of data as
 *     it's read from the stream. Return false from the function to stop reading
 *     the stream.
 */
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

function StreamedLineSequence(parent) {
  this.parent = parent;
}

StreamedLineSequence.prototype = new Sequence();

/**
 * Handles every line of data in the underlying file.
 *
 * @param {function(string):*} fn The function to call on each line of data as
 *     it's read from the file. Return false from the function to stop reading
 *     the file.
 */
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

/**
 * Creates a {@link Sequence} of lines as they are read from a file.
 *
 * @return {Sequence} A sequence comprising the lines in the underlying file, as
 *     they are read.
 */
StreamedSequence.prototype.lines = function() {
  return new StreamedLineSequence(this);
};

/**
 * Creates a {@link Sequence} from a file stream, whose elements are chunks of
 * data as the stream is read. This sequence works asynchronously, so
 * synchronous methods such as {@code indexOf}, {@code any}, and {@code toArray}
 * won't work.
 *
 * @param {string} path A path to a file.
 * @param {string} encoding The text encoding of the file (e.g., "utf-8").
 * @return {Sequence} The streamed sequence.
 */
Lazy.stream = function(path, encoding) {
  return new StreamedSequence(path, encoding);
};
