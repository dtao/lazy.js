var SplitStringSequence = Sequence.inherit(function(source, pattern) {
  this.source = source;
  this.pattern = pattern;
});

SplitStringSequence.prototype.each = function(fn) {
  var iterator = this.getIterator();
  while (iterator.moveNext()) {
    if (fn(iterator.current()) === false) {
      break;
    }
  }
};

SplitStringSequence.prototype.getIterator = function() {
  if (this.pattern instanceof RegExp) {
    if (this.pattern.source === "" || this.pattern.source === "(?:)") {
      return new CharIterator(this.source);
    } else {
      return new SplitWithRegExpIterator(this.source, this.pattern);
    }
  } else if (this.pattern === "") {
    return new CharIterator(this.source);
  } else {
    return new SplitWithStringIterator(this.source, this.pattern);
  }
};
