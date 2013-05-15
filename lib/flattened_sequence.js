var FlattenedSequence = CachingSequence.inherit(function(parent) {
  this.each = function(action) {
    parent.each(function(e) {
      if (e instanceof Array) {
        return recursiveForEach(e, action);
      } else {
        return action(e);
      }
    });
  };
});
