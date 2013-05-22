var UniqueSequence = CachingSequence.inherit(function(parent) {
  this.parent = parent;
});

UniqueSequence.prototype.each = function(fn) {
  var set = new Set(),
      i = 0;
  this.parent.each(function(e) {
    if (set.add(e)) {
      return fn(e, i++);
    }
  });
};
