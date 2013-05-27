/**
 * Wraps a string exposing {@link match} and {@link split} methods that return
 * {@link Sequence} objects instead of arrays, improving on the efficiency of
 * JavaScript's built-in {@link String.split} and {@link String.match} methods
 * and supporting asynchronous iteration.
 *
 * @param {string} source The string to wrap.
 * @constructor
 */
function StringWrapper(source) {
  this.source = source;
}

/**
 * Creates a sequence comprising all of the matches for the specified pattern
 * in the underlying string.
 *
 * @param {RegExp} pattern The pattern to match.
 * @return {Sequence} A sequence of all the matches.
 */
StringWrapper.prototype.match = function(pattern) {
  return new StringMatchSequence(this.source, pattern);
};

/**
 * Creates a sequence comprising all of the substrings of this string separated
 * by the given delimiter, which can be either a string or a regular expression.
 *
 * @param {string|RegExp} delimiter The delimiter to use for recognizing
 *     substrings.
 * @return {Sequence} A sequence of all the substrings separated by the given
 *     delimiter.
 */
StringWrapper.prototype.split = function(delimiter) {
  return new SplitStringSequence(this.source, delimiter);
};
