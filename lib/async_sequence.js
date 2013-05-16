var AsyncSequence = Sequence.inherit(function(parent, interval) {
  this.parent = parent;
  this.interval = interval || 0;
});

AsyncSequence.prototype.each = function(fn) {
  var iterator = this.parent.getIterator(),
      interval = this.interval;

  if (iterator.moveNext()) {
    setTimeout(function iterate() {
      if (fn(iterator.current()) !== false && iterator.moveNext()) {
        setTimeout(iterate, interval);
      }
    }, interval);
  }
};
