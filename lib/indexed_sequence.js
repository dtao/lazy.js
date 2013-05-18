var IndexedSequence = Sequence.inherit(function() {});

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
