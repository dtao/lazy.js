/**
 * @constructor
 * @param {Sequence=} parent
 * @param {Function=} filterFn
 */
function FilteredSequence(parent, filterFn) {
  this.parent   = parent;
  this.filterFn = filterFn;
}

FilteredSequence.prototype = new CachingSequence();

FilteredSequence.prototype.getIterator = function() {
  return new FilteringIterator(this.parent, this.filterFn);
};

FilteredSequence.prototype.each = function(fn) {
  var filterFn = this.filterFn;

  this.parent.each(function(e, i) {
    if (filterFn(e, i)) {
      return fn(e, i);
    }
  });
};

/**
 * @constructor
 */
function IndexedFilteredSequence(parent, filterFn) {
  this.parent   = parent;
  this.filterFn = filterFn;
}

IndexedFilteredSequence.prototype = new FilteredSequence();

IndexedFilteredSequence.prototype.each = function(fn) {
  var parent = this.parent,
      filterFn = this.filterFn,
      length = this.parent.length(),
      i = -1,
      e;

  while (++i < length) {
    e = parent.get(i);
    if (filterFn(e, i) && fn(e, i) === false) {
      break;
    }
  }
};

/**
 * @constructor
 */
function FilteredArrayWrapper(parent, filterFn) {
  this.parent   = parent;
  this.filterFn = filterFn;
}

FilteredArrayWrapper.prototype = new FilteredSequence();

FilteredArrayWrapper.prototype.each = function(fn) {
  var source = this.parent.source,
      filterFn = this.filterFn,
      length = source.length,
      i = -1,
      e;

  while (++i < length) {
    e = source[i];
    if (filterFn(e, i) && fn(e, i) === false) {
      break;
    }
  }
};
