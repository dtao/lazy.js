var IntersectionSequence = CachingSequence.inherit(function(parent, arrays) {
  this.parent = parent;
  this.arrays = arrays;
});

IntersectionSequence.prototype.each = function(fn) {
  var sets = Lazy(this.arrays)
    .map(function(values) { return createSet(values); })
    .toArray();

  this.parent.each(function(e) {
    for (var i = 0; i < sets.length; ++i) {
      if (!sets[i][e]) {
        return;
      }
    }
    return fn(e);
  });
};
