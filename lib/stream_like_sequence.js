/**
 * A StreamLikeSequence comprises a sequence of 'chunks' of data, which are
 * typically multiline strings.
 *
 * @constructor
 */
function StreamLikeSequence() {}

StreamLikeSequence.prototype = new Sequence();

StreamLikeSequence.prototype.lines = function() {
  return new LinesSequence(this);
};

/**
 * A sequence of lines (segments of a larger string or string-like sequence
 * delimited by line breaks).
 *
 * @constructor
 */
function LinesSequence(parent) {
  this.parent = parent;
};

LinesSequence.prototype = new Sequence();

LinesSequence.prototype.each = function(fn) {
  var done = false;
  this.parent.each(function(chunk) {
    Lazy(chunk).split("\n").each(function(line) {
      if (fn(line) === false) {
        done = true;
        return false;
      }
    });

    return !done;
  });
};

/**
 * A StreamingHttpSequence is a `StreamLikeSequence` comprising the chunks of
 * data that are streamed in response to an HTTP request.
 *
 * @param {string} url The URL of the HTTP request.
 * @constructor
 */
function StreamingHttpSequence(url) {
  this.url = url;
};

StreamingHttpSequence.prototype = new StreamLikeSequence();

StreamingHttpSequence.prototype.each = function(fn) {
  var request = new XMLHttpRequest(),
      index   = 0,
      aborted = false;

  request.open("GET", this.url);

  var listener = function(data) {
    if (!aborted) {
      data = request.responseText.substring(index);
      if (fn(data) === false) {
        request.removeEventListener("progress", listener);
        request.abort();
        aborted = true;
      }
      index += data.length;
    }
  };

  request.addEventListener("progress", listener);

  request.send();
};
