var UniqueSequence = CachingSequence.inherit(function(parent) {
  this.parent = parent;
});

UniqueSequence.prototype.each = function(fn) {
  var set = new Set();
  this.parent.each(function(e) {
    if (set.add(e)) {
      return fn(e);
    }
  });
};
