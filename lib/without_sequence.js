var WithoutSequence = CachingSequence.inherit(function(parent, values) {
  this.parent = parent;
  this.values = values;
});

WithoutSequence.prototype.each = function(fn) {
  var set = createSet(this.values);
  this.parent.each(function(e) {
    if (!set[e]) {
      return fn(e);
    }
  });
};
