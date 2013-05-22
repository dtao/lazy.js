var UnionSequence = CachingSequence.inherit(function(parent, arrays) {
  this.parent = parent;
  this.arrays = arrays;
});

UnionSequence.prototype.each = function(fn) {
  var set = {},
      i = 0,
      done = false;

  this.parent.each(function(e) {
    if (!set[e]) {
      set[e] = true;
      if (fn(e, i++) === false) {
        done = true;
        return false;
      }
    }
  });

  if (!done) {
    Lazy(this.arrays).each(function(array) {
      if (done) {
        return false;
      }

      Lazy(array).each(function(e) {
        if (!set[e]) {
          set[e] = true;
          if (fn(e, i++) === false) {
            done = true;
            return false;
          }
        }
      })
    });
  }
};
