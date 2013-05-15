var UnionSequence = CachingSequence.inherit(function(parent, arrays) {
  this.parent = parent;
  this.arrays = arrays;
});

UnionSequence.prototype.each = function(fn) {
  var set = new Set();
  this.parent.each(function(e) {
    if (!set.contains(e)) {
      set.add(e);
      fn(e);
    }
  });
  Lazy(this.arrays).flatten().each(function(e) {
    if (!set.contains(e)) {
      set.add(e);
      fn(e);
    }
  });
};
