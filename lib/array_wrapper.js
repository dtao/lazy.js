var ArrayWrapper = IndexedSequence.inherit(function(source) {
  this.source = source;
});

ArrayWrapper.prototype.get = function(i) {
  return this.source[i];
};

ArrayWrapper.prototype.length = function() {
  return this.source.length;
};

ArrayWrapper.prototype.each = function(fn) {
  var i = -1;
  while (++i < this.source.length) {
    if (fn(this.source[i]) === false) {
      break;
    }
  }
};

ArrayWrapper.prototype.toArray = function() {
  return this.source.slice(0);
};
