var UniqueSequence = CachingSequence.inherit(function(parent) {
  this.each = function(action) {
    var set = {};
    parent.each(function(e) {
      if (e in set) { return; }
      set[e] = true;
      return action(e);
    });
  };
});
