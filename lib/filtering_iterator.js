var FilteringIterator = function(sequence, filterFn) {
  this.iterator = sequence.getIterator();
  this.filterFn = filterFn;
};

FilteringIterator.prototype.current = function() {
  return this.value;
};

FilteringIterator.prototype.moveNext = function() {
  var iterator = this.iterator,
      filterFn = this.filterFn,
      value;

  while (iterator.moveNext()) {
    value = iterator.current();
    if (filterFn(value)) {
      this.value = value;
      return true;
    }
  }

  this.value = undefined;
  return false;
};
