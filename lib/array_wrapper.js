/**
 * @constructor
 */
function ArrayWrapper(source) {
  this.source = source;
}

ArrayWrapper.prototype = new IndexedSequence();

ArrayWrapper.prototype.get = function(i) {
  return this.source[i];
};

ArrayWrapper.prototype.length = function() {
  return this.source.length;
};

ArrayWrapper.prototype.each = function(fn) {
  var i = -1;
  while (++i < this.source.length) {
    if (fn(this.source[i], i) === false) {
      break;
    }
  }
};

ArrayWrapper.prototype.map = function(mapFn) {
  return new MappedArrayWrapper(this.source, mapFn);
};

ArrayWrapper.prototype.toArray = function() {
  return this.source.slice(0);
};
