var WithoutSequence = CachingSequence.inherit(function(parent, values) {
  this.parent = parent;
  this.values = values;
});

WithoutSequence.prototype.each = function(fn) {
  var set = createSet(this.values),
      i = 0;
  this.parent.each(function(e) {
    if (!set.contains(e)) {
      return fn(e, i++);
    }
  });
};
