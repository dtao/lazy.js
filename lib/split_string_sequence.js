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
    return getSplitWithStringIterator(this.source, this.pattern);
  }
};

function getSplitWithStringIterator(str, delimiter) {
  var leftIndex,
      rightIndex,
      finished;

  return {
    current: function() {
      return str.substring(leftIndex, rightIndex);
    },

    moveNext: function() {
      if (!finished) {
        leftIndex = typeof leftIndex !== "undefined" ?
          rightIndex + delimiter.length :
          0;
        rightIndex = str.indexOf(delimiter, leftIndex);
      }

      if (rightIndex === -1) {
        finished = true;
        rightIndex = undefined;
        return true;
      }

      return !finished;
    }
  };
}
