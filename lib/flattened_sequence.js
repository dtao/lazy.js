var FlattenedSequence = CachingSequence.inherit(function(parent) {
  this.parent = parent;
});

FlattenedSequence.prototype.each = function(fn) {
  this.parent.each(function(e) {
    if (e instanceof Array) {
      return recursiveForEach(e, fn);
    } else {
      return fn(e);
    }
  });
};
