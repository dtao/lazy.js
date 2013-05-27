/**
 * An IndexedSequence is a {@link Sequence} that provides random access to its
 * elements. This extends the API for iterating with the additional methods
 * `get` and `length`, allowing a sequence to act as a "view" into a collection
 * or other indexed data source.
 *
 * @constructor
 */
function IndexedSequence() {}

IndexedSequence.prototype = new Sequence();

/**
 * Create a new constructor function for a type inheriting from
 * {@link IndexedSequence}.
 *
 * @param {Function} ctor The constructor function.
 * @return {Function} A constructor for a new type inheriting from
 *     {@link IndexedSequence}.
 */
IndexedSequence.inherit = function(ctor) {
  ctor.prototype = new IndexedSequence();
  return ctor;
};

/**
 * Returns the element at the specified index.
 *
 * @param {number} i The index to access.
 * @return {*} The element.
 */
IndexedSequence.prototype.get = function(i) {
  return this.parent.get(i);
};

/**
 * Returns the length of the sequence.
 *
 * @return {number} The length.
 */
IndexedSequence.prototype.length = function() {
  return this.parent.length();
};

/**
 * An optimized version of {@link Sequence.each}.
 */
IndexedSequence.prototype.each = function(fn) {
  var length = this.length(),
      i = -1;
  while (++i < length) {
    if (fn(this.get(i), i) === false) {
      break;
    }
  }
};

/**
 * An optimized version of {@link Sequence.map}, which creates an
 * {@link IndexedSequence} so that the result still provides random access.
 */
IndexedSequence.prototype.map =
IndexedSequence.prototype.collect = function(mapFn) {
  return new IndexedMappedSequence(this, mapFn);
};

/**
 * An optimized version of {@link Sequence.filter}.
 */
IndexedSequence.prototype.filter =
IndexedSequence.prototype.select = function(filterFn) {
  return new IndexedFilteredSequence(this, filterFn);
};

/**
 * An optimized version of {@link Sequence.reverse}, which creates an
 * {@link IndexedSequence} so that the result still provides random access.
 */
IndexedSequence.prototype.reverse = function() {
  return new IndexedReversedSequence(this);
};

/**
 * An optimized version of {@link Sequence.first}, which creates an
 * {@link IndexedSequence} so that the result still provides random access.
 *
 * @param {number=} count
 */
IndexedSequence.prototype.first = function(count) {
  if (typeof count === "undefined") {
    return this.get(0);
  }

  return new IndexedTakeSequence(this, count);
};

IndexedSequence.prototype.head =
IndexedSequence.prototype.take =
IndexedSequence.prototype.first;

/**
 * An optimized version of {@link Sequence.rest}, which creates an
 * {@link IndexedSequence} so that the result still provides random access.
 *
 * @param {number=} count
 */
IndexedSequence.prototype.rest = function(count) {
  return new IndexedDropSequence(this, count);
};

IndexedSequence.prototype.tail =
IndexedSequence.prototype.drop = IndexedSequence.prototype.rest;
