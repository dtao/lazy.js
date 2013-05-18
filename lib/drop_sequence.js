var DropSequence = CachingSequence.inherit(function(parent, count) {
  this.parent = parent;
  this.count  = typeof count === "number" ? count : 1;
});

DropSequence.prototype.each = function(fn) {
  var self = this,
      i = 0;
  self.parent.each(function(e) {
    if (i++ < self.count) { return; }
    return fn(e);
  });
};

var IndexedDropSequence = IndexedSequence.inherit(function(parent, count) {
  this.parent = parent;
  this.count  = typeof count === "number" ? count : 1;
});

IndexedDropSequence.prototype.get = function(i) {
  return this.parent.get(this.count + i);
};

IndexedDropSequence.prototype.length = function() {
  var parentLength = this.parent.length();
  return this.count <= parentLength ? parentLength - this.count : 0;
};
