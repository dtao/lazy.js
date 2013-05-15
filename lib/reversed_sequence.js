var ReversedSequence = CachingSequence.inherit(function(parent) {
  this.parent = parent;
});

ReversedSequence.prototype.each = function(fn) {
  var parentArray = this.parent.toArray(),
      i = parentArray.length;
  while (--i >= 0) {
    if (fn(parentArray[i]) === false) {
      break;
    }
  }
};

var IndexedReversedSequence = IndexedSequence.inherit(function(parent) {
  this.parent = parent;
});

IndexedReversedSequence.prototype.get = function(i) {
  return this.parent.get(this.length() - i - 1);
};
