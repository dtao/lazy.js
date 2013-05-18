var SplitStringSequence = Sequence.inherit(function(source, pattern) {
  this.source = source;
  this.pattern = pattern;
});

SplitStringSequence.prototype.each = function(fn) {
  if (this.pattern instanceof RegExp) {
    eachForRegExp(this.source, this.pattern, fn);
  } else if (this.pattern === "") {
    eachChar(this.source, fn);
  } else {
    eachForString(this.source, this.pattern, fn);
  }
};

function eachForRegExp(str, pattern, fn) {
  var match,
      index = 0;

  // clone the RegExp
  pattern = eval("" + pattern + (!pattern.global ? "g" : ""));

  while (match = pattern.exec(str)) {
    if (fn(str.substring(index, match.index)) === false) {
      return;
    }
    index = match.index + match[0].length;
  }
  if (index < str.length) {
    fn(str.substring(index));
  }
}

function eachChar(str, fn) {
  var length = str.length,
      i = -1;
  while (++i < length) {
    if (fn(str.charAt(i)) === false) {
      break;
    }
  }
}

function eachForString(str, delimiter, fn) {
  var leftIndex = 0,
      rightIndex = str.indexOf(delimiter);

  while (rightIndex !== -1) {
    if (fn(str.substring(leftIndex, rightIndex)) === false) {
      return;
    }
    leftIndex = rightIndex + delimiter.length;
    rightIndex = str.indexOf(delimiter, leftIndex);
  }

  if (leftIndex < str.length) {
    fn(str.substring(leftIndex));
  }
}
