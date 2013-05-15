var UnionSequence = CachingSequence.inherit(function(parent, arrays) {
  this.each = function(action) {
    var set = new Set();
    parent.each(function(e) {
      if (!set.contains(e)) {
        set.add(e);
        action(e);
      }
    });
    Lazy(arrays).flatten().each(function(e) {
      if (!set.contains(e)) {
        set.add(e);
        action(e);
      }
    });
  };
});
