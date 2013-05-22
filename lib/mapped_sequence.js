var MappedSequence = Sequence.inherit(function(parent, mapFn) {
  this.parent = parent;
  this.mapFn  = mapFn;
});

MappedSequence.prototype.each = function(fn) {
  var mapFn = this.mapFn;
  this.parent.each(function(e, i) {
    return fn(mapFn(e, i), i);
  });
};

var IndexedMappedSequence = IndexedSequence.inherit(function(parent, mapFn) {
  this.parent = parent;
  this.mapFn  = mapFn;
});

IndexedMappedSequence.prototype.get = function(i) {
  return this.mapFn(this.parent.get(i), i);
};
