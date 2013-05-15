var ArrayWrapper = Sequence.inherit(function(source) {
  this.source = source;
});

ArrayWrapper.prototype.indexed = true;

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

var IndexedSequence = Sequence.inherit(function(parent) {
  this.parent = parent;
});

IndexedSequence.inherit = function(ctor) {
  ctor.prototype = new IndexedSequence();
  return ctor;
};

IndexedSequence.prototype.indexed = true;

IndexedSequence.prototype.get = function(i) {
  return this.parent.get(i);
};

IndexedSequence.prototype.length = function() {
  return this.parent.length();
};

IndexedSequence.prototype.each = function(fn) {
  var length = this.length(),
      i = -1;
  while (++i < length) {
    if (fn(this.get(i)) === false) {
      break;
    }
  }
};
