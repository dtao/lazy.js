var IntersectionSequence = CachingSequence.inherit(function(parent, arrays) {
  this.parent = parent;
  this.arrays = arrays;
});

IntersectionSequence.prototype.each = function(fn) {
  var sets = Lazy(this.arrays)
    .map(function(values) { return createSet(values); })
    .toArray();

  var i = 0;
  this.parent.each(function(e) {
    var j = -1;
    while (++j < sets.length) {
      if (!sets[j].contains(e)) {
        return;
      }
    }
    return fn(e, i++);
  });
};
