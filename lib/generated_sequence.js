/**
 * A GeneratedSequence does not wrap an in-memory colllection but rather
 * determines its elements on-the-fly during iteration according to a generator
 * function.
 *
 * @constructor
 * @param {function(number, *):*} generatorFn A function which accepts an index
 *     and returns a value for the element at that position in the sequence.
 * @param {number=} length The length of the sequence. If this argument is
 *     omitted, the sequence will go on forever.
 */
function GeneratedSequence(generatorFn, length) {
  this.get = generatorFn;
  this.fixedLength = length;
}

GeneratedSequence.prototype = new Sequence();

/**
 * Returns the length of this sequence.
 *
 * @return {number} The length, or `undefined` if this is an indefinite
 *     sequence.
 */
GeneratedSequence.prototype.length = function() {
  return this.fixedLength;
};

/**
 * See {@link Sequence#each}.
 */
GeneratedSequence.prototype.each = function(fn) {
  var generatorFn = this.get,
      length = this.fixedLength,
      i = 0;
  while (typeof length === "undefined" || i < length) {
    if (fn(generatorFn(i++)) === false) {
      break;
    }
  }
};
