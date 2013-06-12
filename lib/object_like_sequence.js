/**
 * The ObjectLikeSequence object represents a sequence of key/value pairs.
 *
 * @constructor
 */
function ObjectLikeSequence() {}

ObjectLikeSequence.prototype = new Sequence();

/*
 * You know what I just realized? These methods don't belong here at all --
 * they should go directly on Sequence!
 *
 * Scratch that. I actually need to create an "ObjectLike-" version of every
 * specialized sequence for this to work right. Crap!
 */

ObjectLikeSequence.prototype.keys = function() {
  return this.map(function(v, k) { return k; });
};

ObjectLikeSequence.prototype.values = function() {
  return this.map(function(v, k) { return v; });
};

ObjectLikeSequence.prototype.assign = function(other) {
  return new AssignSequence(this, other);
};

ObjectLikeSequence.prototype.extend = ObjectLikeSequence.prototype.assign;

ObjectLikeSequence.prototype.invert = function() {
  return new InvertedSequence(this);
};

ObjectLikeSequence.prototype.functions = function() {
  return this
    .filter(function(v, k) { return typeof(v) === "function"; })
    .map(function(v, k) { return k; });
};

ObjectLikeSequence.prototype.toArray = function() {
  return this.map(function(v, k) { return [k, v]; }).toArray();
};

ObjectLikeSequence.prototype.toObject = function() {
  return this.map(function(v, k) { return [k, v]; }).toObject();
};
