var ConcatenatedSequence = Sequence.inherit(function(parent, arrays) {
  this.parent = parent;
  this.arrays = arrays;
});

ConcatenatedSequence.prototype.each = function(fn) {
  var done = false,
      i = 0;

  this.parent.each(function(e) {
    if (fn(e, i++) === false) {
      done = true;
      return false;
    }
  });

  if (!done) {
    Lazy(this.arrays).flatten().each(function(e) {
      if (fn(e, i++) === false) {
        return false;
      }
    });
  }
};
