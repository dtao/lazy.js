var SortedSequence = CachingSequence.inherit(function(parent, sortFn) {
  this.parent = parent;
  this.sortFn = sortFn;
});

SortedSequence.prototype.each = function(fn) {
  var sortFn = this.sortFn,
      sorted = this.parent.toArray(),
      i = -1;

  sorted.sort(function(x, y) { return compare(x, y, sortFn); });

  while (++i < sorted.length) {
    if (fn(sorted[i]) === false) {
      break;
    }
  }
};
