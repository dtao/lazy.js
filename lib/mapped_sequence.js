var MappedSequence = Sequence.inherit(function(parent, mapFn) {
  this.parent = parent;
  this.mapFn  = mapFn;
});

MappedSequence.prototype.each = function(action) {
  var self = this;
  self.parent.each(function(e) {
    return action(self.mapFn(e));
  });
};

var IndexedMappedSequence = IndexedSequence.inherit(function(parent, mapFn) {
  this.parent = parent;
  this.mapFn  = mapFn;
});

IndexedMappedSequence.prototype.get = function(i) {
  return this.mapFn(this.parent.get(i));
};
