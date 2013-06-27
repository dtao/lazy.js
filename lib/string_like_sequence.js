/**
 * A `StringLikeSequence` represents a sequence of characters.
 *
 * TODO: The idea for this prototype is to be able to do things like represent
 * "substrings" without actually allocating new strings. Right now that
 * isn't implemented at all, though (every method assumes an actual string as
 * `source`).
 *
 * @constructor
 */
function StringLikeSequence() {}

StringLikeSequence.prototype = new ArrayLikeSequence();

StringLikeSequence.prototype.getIterator = function() {
  return new CharIterator(this.source);
};

StringLikeSequence.prototype.charAt = function(i) {
  return this.get(i);
};

StringLikeSequence.prototype.each = function(fn) {
  var source = this.source,
      length = source.length,
      i = -1;

  while (++i < length) {
    if (fn(source.charAt(i)) === false) {
      break;
    }
  }
};

/**
 * Creates a {@link Sequence} comprising all of the matches for the specified
 * pattern in the underlying string.
 *
 * @param {RegExp} pattern The pattern to match.
 * @return {Sequence} A sequence of all the matches.
 */
StringLikeSequence.prototype.match = function(pattern) {
  return new StringMatchSequence(this.source, pattern);
};

/**
 * Creates a {@link Sequence} comprising all of the substrings of this string
 * separated by the given delimiter, which can be either a string or a regular
 * expression.
 *
 * @param {string|RegExp} delimiter The delimiter to use for recognizing
 *     substrings.
 * @return {Sequence} A sequence of all the substrings separated by the given
 *     delimiter.
 */
StringLikeSequence.prototype.split = function(delimiter) {
  return new SplitStringSequence(this.source, delimiter);
};

var StringMatchSequence = Sequence.inherit(function(source, pattern) {
  this.source = source;
  this.pattern = pattern;
});

StringMatchSequence.prototype.each = function(fn) {
  var iterator = this.getIterator();
  while (iterator.moveNext()) {
    if (fn(iterator.current()) === false) {
      return;
    }
  }
};

StringMatchSequence.prototype.getIterator = function() {
  return new StringMatchIterator(this.source, this.pattern);
};

var SplitStringSequence = Sequence.inherit(function(source, pattern) {
  this.source = source;
  this.pattern = pattern;
});

SplitStringSequence.prototype.each = function(fn) {
  var iterator = this.getIterator();
  while (iterator.moveNext()) {
    if (fn(iterator.current()) === false) {
      break;
    }
  }
};

SplitStringSequence.prototype.getIterator = function() {
  if (this.pattern instanceof RegExp) {
    if (this.pattern.source === "" || this.pattern.source === "(?:)") {
      return new CharIterator(this.source);
    } else {
      return new SplitWithRegExpIterator(this.source, this.pattern);
    }
  } else if (this.pattern === "") {
    return new CharIterator(this.source);
  } else {
    return new SplitWithStringIterator(this.source, this.pattern);
  }
};

/**
 * Wraps a string exposing {@link #match} and {@link #split} methods that return
 * {@link Sequence} objects instead of arrays, improving on the efficiency of
 * JavaScript's built-in `String#split` and `String.match` methods and
 * supporting asynchronous iteration.
 *
 * @param {string} source The string to wrap.
 * @constructor
 */
function StringWrapper(source) {
  this.source = source;
}

StringWrapper.prototype = new StringLikeSequence();

StringWrapper.prototype.get = function(i) {
  return this.source.charAt(i);
};

StringWrapper.prototype.length = function() {
  return this.source.length;
};
