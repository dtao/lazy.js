var fs     = require("fs");
var http   = require("http");
var os     = require("os");
var Stream = require("stream");
var URL    = require("url");

// The starting point is everything that works in any environment (browser OR
// Node.js)
var Lazy = require("./lazy.js");

/**
 * @constructor
 */
function StreamedSequence(stream) {
  this.stream = stream;
}

StreamedSequence.prototype = new Lazy.Sequence();

StreamedSequence.prototype.openStream = function(callback) {
  this.stream.resume();
  callback(this.stream);
};

/**
 * Handles every chunk of data in this sequence.
 *
 * @param {function(string):*} fn The function to call on each chunk of data as
 *     it's read from the stream. Return false from the function to stop reading
 *     the stream.
 */
StreamedSequence.prototype.each = function(fn) {
  var encoding = this.encoding || "utf-8";

  this.openStream(function(stream) {
    var listener = function(e) {
      if (fn(e) === false) {
        stream.removeListener("data", listener);
      }
    };

    stream.setEncoding(encoding);
    stream.on("data", listener);
  });
};

function StreamedLineSequence(parent) {
  this.parent = parent;
}

StreamedLineSequence.prototype = new Lazy.Sequence();

/**
 * Handles every line of data in the underlying file.
 *
 * @param {function(string):*} fn The function to call on each line of data as
 *     it's read from the file. Return false from the function to stop reading
 *     the file.
 */
StreamedLineSequence.prototype.each = function(fn) {
  var i = 0;

  this.parent.each(function(data) {
    var finished = false;

    // TODO: I'm pretty sure there's a bug here: if/when the buffer ends in the
    // middle of a line, this will artificially split that line in two. I'll
    // come back to this later.
    Lazy(data).split(os.EOL || "\n").each(function(line) {
      if (fn(line, i++) === false) {
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

function FileStreamSequence(path, encoding) {
  this.path = path;
  this.encoding = encoding;
}

FileStreamSequence.prototype = new StreamedSequence();

FileStreamSequence.prototype.openStream = function(callback) {
  var stream = fs.createReadStream(this.path, { autoClose: true });
  callback(stream);
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
Lazy.readFile = function(path, encoding) {
  return new FileStreamSequence(path, encoding);
};

function HttpStreamSequence(url, encoding) {
  this.url = url;
  this.encoding = encoding;
}

HttpStreamSequence.prototype = new StreamedSequence();

HttpStreamSequence.prototype.openStream = function(callback) {
  http.get(URL.parse(this.url), callback);
};

/**
 * Creates a {@link Sequence} from an HTTP stream, whose elements are chunks of
 * data as the stream is read. This sequence works asynchronously, so
 * synchronous methods such as {@code indexOf}, {@code any}, and {@code toArray}
 * won't work.
 *
 * @param {string} url The URL for the HTTP request.
 * @return {Sequence} The streamed sequence.
 */
Lazy.makeHttpRequest = function(url) {
  return new HttpStreamSequence(url);
};

/*
 * Assuming someone does:
 * var Lazy = require("lazy.js");
 *
 * Then they should be able to write:
 * Lazy(source)
 *
 * Where `source` can be a:
 * - Array
 * - Object
 * - String
 * - Stream
 *
 * This function provides the last one, and then falls back to the original
 * 'Lazy' which provides the first three.
 */
module.exports = function(source) {
  if (source instanceof Stream) {
    return new StreamedSequence(source);
  } else {
    return Lazy(source);
  }
};

/*
 * Attach all of the same properties that Lazy already had.
 *
 * TODO: Think of a better approach here. This is really hacky.
 */
for (var prop in Lazy) {
  if (Lazy.hasOwnProperty(prop)) {
    module.exports[prop] = Lazy[prop];
  }
}
