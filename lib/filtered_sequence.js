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

var IndexedFilteredSequence = CachingSequence.inherit(function(parent, filterFn) {
  this.parent   = parent;
  this.filterFn = filterFn;
});

IndexedFilteredSequence.prototype.each = function(fn) {
  var parent = this.parent,
      filterFn = this.filterFn,
      length = this.parent.length(),
      i = -1,
      e;

  while (++i < length) {
    e = parent.get(i);
    if (filterFn(e) && fn(e) === false) {
      break;
    }
  }
};
