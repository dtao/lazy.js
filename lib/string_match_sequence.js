var StringMatchSequence = Sequence.inherit(function(source, pattern) {
  this.source = source;
  this.pattern = pattern;
});

StringMatchSequence.prototype.each = function(fn) {
  var iterator = this.getIterator();
  while (iterator.moveNext()) {
    if (fn(iterator.current()) === false) {
      return;
    }
  }
};

StringMatchSequence.prototype.getIterator = function() {
  return new StringMatchIterator(this.source, this.pattern);
};
