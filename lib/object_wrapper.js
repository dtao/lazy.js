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
