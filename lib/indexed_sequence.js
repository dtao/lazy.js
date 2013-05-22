var IndexedSequence = Sequence.inherit(function() {});

IndexedSequence.inherit = function(ctor) {
  ctor.prototype = new IndexedSequence();
  return ctor;
};

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
    if (fn(this.get(i), i) === false) {
      break;
    }
  }
};

IndexedSequence.prototype.map =
IndexedSequence.prototype.collect = function(mapFn) {
  return new IndexedMappedSequence(this, mapFn);
};

IndexedSequence.prototype.filter =
IndexedSequence.prototype.select = function(filterFn) {
  return new IndexedFilteredSequence(this, filterFn);
};

IndexedSequence.prototype.reverse = function() {
  return new IndexedReversedSequence(this);
};

IndexedSequence.prototype.first =
IndexedSequence.prototype.head =
IndexedSequence.prototype.take = function(count) {
  if (typeof count === "undefined") {
    return this.get(0);
  }

  return new IndexedTakeSequence(this, count);
};

IndexedSequence.prototype.rest =
IndexedSequence.prototype.tail =
IndexedSequence.prototype.drop = function(count) {
  return new IndexedDropSequence(this, count);
};
