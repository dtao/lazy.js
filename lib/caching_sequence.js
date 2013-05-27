/**
 * A CachingSequence is a {@link Sequence} that (probably) must fully evaluate
 * the underlying sequence when {@link each} is called. For this reason, it
 * provides a {@link cache} method to fully populate an array that can then be
 * referenced internally.
 *
 * Frankly, I question the wisdom in this sequence type and think I will
 * probably refactor this out in the near future. Most likely I will replace it
 * with something like an 'IteratingSequence' which must expose a 'getIterator'
 * and not provide {@link get} or {@link length} at all. But we'll see.
 *
 * @constructor
 */
function CachingSequence() {}

CachingSequence.prototype = new Sequence();

/**
 * Create a new constructor function for a type inheriting from Sequence.
 *
 * @param {Function} ctor The constructor function.
 * @return {Function} A constructor for a new type inheriting from Sequence.
 */
CachingSequence.inherit = function(ctor) {
  ctor.prototype = new CachingSequence();
  return ctor;
};

/**
 * Fully evaluates the sequence and returns a cached result.
 *
 * @return {Array} The cached array, fully populated with the elements in this
 *     sequence.
 */
CachingSequence.prototype.cache = function() {
  if (!this.cached) {
    this.cached = this.toArray();
  }
  return this.cached;
};

/**
 * For internal use only.
 */
CachingSequence.prototype.get = function(i) {
  return this.cache()[i];
};

/**
 * For internal use only.
 */
CachingSequence.prototype.length = function() {
  return this.cache().length;
};
