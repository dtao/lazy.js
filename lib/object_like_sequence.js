/**
 * The ObjectLikeSequence object represents a sequence of key/value pairs.
 *
 * @constructor
 */
function ObjectLikeSequence() {}

ObjectLikeSequence.prototype = new Sequence();

ObjectLikeSequence.prototype.filter = function(filterFn) {
  return new FilteredObjectLikeSequence(this, filterFn);
};

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

ObjectLikeSequence.prototype.methods = ObjectLikeSequence.prototype.functions;

ObjectLikeSequence.prototype.pick = function(properties) {
  return this.filter(function(value, key) {
    return contains(properties, key);
  });
};

ObjectLikeSequence.prototype.omit = function(properties) {
  return this.filter(function(value, key) {
    return !contains(properties, key);
  });
};

ObjectLikeSequence.prototype.toArray = function() {
  return this.map(function(v, k) { return [k, v]; }).toArray();
};

ObjectLikeSequence.prototype.pairs = ObjectLikeSequence.prototype.toArray;

ObjectLikeSequence.prototype.toObject = function() {
  return this.map(function(v, k) { return [k, v]; }).toObject();
};
