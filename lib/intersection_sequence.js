var IntersectionSequence = CachingSequence.inherit(function(parent, arrays) {
  this.each = function(action) {
    var sets = Lazy(arrays)
      .map(function(values) { return new Set(values); })
      .toArray();

    parent.each(function(e) {
      for (var i = 0; i < sets.length; ++i) {
        if (!sets[i].contains(e)) {
          return;
        }
      }
      action(e);
    });
  };
});
