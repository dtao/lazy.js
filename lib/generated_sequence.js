/**
 * A GeneratedSequence does not wrap an in-memory colllection but rather
 * determines its elements on-the-fly during iteration according to a generator
 * function.
 *
 * @constructor
 * @param {function(number):*} generatorFn A function which accepts an index
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

/**
 * See {@link Sequence#getIterator}
 */
GeneratedSequence.prototype.getIterator = function() {
  return new GeneratedIterator(this);
};

/**
 * Iterates over a generated sequence. (This allows generated sequences to be
 * iterated asynchronously.)
 *
 * @param {GeneratedSequence} sequence The generated sequence to iterate over.
 * @constructor
 */
function GeneratedIterator(sequence) {
  this.sequence     = sequence;
  this.index        = 0;
  this.currentValue = null;
}

GeneratedIterator.prototype.current = function() {
  return this.currentValue;
};

GeneratedIterator.prototype.moveNext = function() {
  var sequence = this.sequence;

  if (typeof sequence.fixedLength === "number" && this.index >= sequence.fixedLength) {
    return false;
  }

  this.currentValue = sequence.get(this.index++);
  return true;
};
