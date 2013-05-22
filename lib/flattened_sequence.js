var FlattenedSequence = CachingSequence.inherit(function(parent) {
  this.parent = parent;
});

FlattenedSequence.prototype.each = function(fn) {
  // Hack: store the index in a tiny array so we can increment it from outside
  // this function.
  var index = [0];

  this.parent.each(function(e) {
    if (e instanceof Array) {
      return recursiveForEach(e, fn, index);
    } else {
      return fn(e, index[0]++);
    }
  });
};
