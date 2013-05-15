var FilteredSequence = CachingSequence.inherit(function(parent, filterFn) {
  this.parent   = parent;
  this.filterFn = filterFn;
});

FilteredSequence.prototype.each = function(fn) {
  var self = this;
  self.parent.each(function(e) {
    if (self.filterFn(e)) {
      return fn(e);
    }
  });
};
