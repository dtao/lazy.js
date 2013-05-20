var StringMatchSequence = Sequence.inherit(function(source, pattern) {
  this.source = source;
  this.pattern = pattern;
});

StringMatchSequence.prototype.each = function(fn) {
  var source = this.source,
      pattern = this.pattern,
      match;

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

StringMatchSequence.prototype.getIterator = function() {
  var source = this.source,
      pattern = this.pattern,
      match;

  if (pattern.source === "" || pattern.source === "(?:)") {
    return new CharIterator(source);
  }

  // clone the RegExp
  pattern = eval("" + pattern + (!pattern.global ? "g" : ""));

  return {
    current: function() {
      return match[0];
    },

    moveNext: function() {
      return !!(match = pattern.exec(source));
    }
  };
};
