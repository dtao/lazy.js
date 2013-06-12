/**
 * @constructor
 */
function ObjectWrapper(source) {
  this.source = source;
}

ObjectWrapper.prototype = new ObjectLikeSequence();

ObjectWrapper.prototype.get = function(key) {
  return this.source[key];
};

ObjectWrapper.prototype.each = function(fn) {
  var source = this.source,
      k;
  for (k in source) {
    if (fn(source[k], k) === false) {
      return;
    }
  }
};

ObjectWrapper.prototype.keys = function() {
  return this.map(function(v, k) { return k; });
};

ObjectWrapper.prototype.values = function() {
  return this.map(function(v, k) { return v; });
};

ObjectWrapper.prototype.assign = function(other) {
  return new AssignSequence(this, other);
};
