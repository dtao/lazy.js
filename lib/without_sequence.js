var WithoutSequence = CachingSequence.inherit(function(parent, values) {
  this.each = function(action) {
    var set = new Set(values);
    parent.each(function(e) {
      if (!set.contains(e)) {
        return action(e);
      }
    });
  };
});
