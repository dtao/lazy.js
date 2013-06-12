/**
 * The ObjectLikeSequence object represents a sequence of key/value pairs.
 *
 * @constructor
 */
function ObjectLikeSequence() {}

ObjectLikeSequence.prototype = new Sequence();

ObjectLikeSequence.prototype.toArray = function() {
  return this.map(function(v, k) { return [k, v]; }).toArray();
};

ObjectLikeSequence.prototype.toObject = function() {
  return this.map(function(v, k) { return [k, v]; }).toObject();
};
