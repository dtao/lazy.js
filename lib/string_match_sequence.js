var StringMatchSequence = Sequence.inherit(function(source, pattern) {
  this.source = source;
  this.pattern = pattern;
});

StringMatchSequence.prototype.each = function(fn) {
  var source = this.source,
      pattern = this.pattern,
      match,
      index = 0;

  if (pattern.source === "" || pattern.source === "(?:)") {
    eachChar(str, fn);
    return;
  }

  // clone the RegExp
  pattern = eval("" + pattern + (!pattern.global ? "g" : ""));

  while (match = pattern.exec(source)) {
    if (fn(match[0]) === false) {
      return;
    }
  }
};
