var StringMatchIterator = function(source, pattern) {
  this.source = source;

  // clone the RegExp
  this.pattern = eval("" + pattern + (!pattern.global ? "g" : ""));
};

StringMatchIterator.prototype.current = function() {
  return this.match[0];
};

StringMatchIterator.prototype.moveNext = function() {
  return !!(this.match = this.pattern.exec(this.source));
};
