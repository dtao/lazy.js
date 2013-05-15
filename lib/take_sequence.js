var TakeSequence = CachingSequence.inherit(function(parent, count) {
  this.parent = parent;
  this.count  = count;
});

TakeSequence.prototype.each = function(fn) {
  var self = this,
      i = 0;
  self.parent.each(function(e) {
    var result = fn(e);
    if (++i >= self.count) { return false; }
    return result;
  });
};

var IndexedTakeSequence = IndexedSequence.inherit(function(parent, count) {
  this.parent = parent;
  this.count  = count;
});

IndexedTakeSequence.prototype.length = function() {
  var parentLength = this.parent.length();
  return this.count <= parentLength ? this.count : parentLength;
};
