var FilteredSequence = CachingSequence.inherit(function(parent, filterFn) {
  this.parent   = parent;
  this.filterFn = filterFn;
});

FilteredSequence.prototype.each = function(fn) {
  var filterFn = this.filterFn;
  this.parent.each(function(e) {
    if (filterFn(e)) {
      return fn(e);
    }
  });
};
