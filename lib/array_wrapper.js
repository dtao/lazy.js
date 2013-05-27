/**
 * ArrayWrapper is the most basic {@link Sequence}. It directly wraps an array
 * and implements the same methods as {@link IndexedSequence}, but more
 * efficiently.
 *
 * @constructor
 */
function ArrayWrapper(source) {
  this.source = source;
}

ArrayWrapper.prototype = new IndexedSequence();

/**
 * Returns the element at the specified index in the source array.
 *
 * @param {number} i The index to access.
 * @return {*} The element.
 */
ArrayWrapper.prototype.get = function(i) {
  return this.source[i];
};

/**
 * Returns the length of the source array.
 *
 * @return {number} The length.
 */
ArrayWrapper.prototype.length = function() {
  return this.source.length;
};

/**
 * An optimized version of {@link Sequence.each}.
 */
ArrayWrapper.prototype.each = function(fn) {
  var i = -1;
  while (++i < this.source.length) {
    if (fn(this.source[i], i) === false) {
      break;
    }
  }
};

/**
 * An optimized version of {@link Sequence.map}.
 */
ArrayWrapper.prototype.map = function(mapFn) {
  return new MappedArrayWrapper(this.source, mapFn);
};

/**
 * An optimized version of {@link Sequence.uniq}.
 */
ArrayWrapper.prototype.uniq =
ArrayWrapper.prototype.unique = function() {
  return new UniqueArrayWrapper(this);
};

/**
 * An optimized version of {@link Sequence.toArray}.
 */
ArrayWrapper.prototype.toArray = function() {
  return this.source.slice(0);
};
