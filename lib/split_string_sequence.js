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

SplitStringSequence.prototype.getIterator = function() {
  if (this.pattern instanceof RegExp) {
    return getSplitWithRegExpIterator(this.source, this.pattern);
  } else if (this.pattern === "") {
    return new CharIterator(this.source);
  } else {
    return getSplitWithStringIterator(this.source, this.pattern);
  }
};

function eachForRegExp(str, pattern, fn) {
  var match,
      index = 0;

  if (pattern.source === "" || pattern.source === "(?:)") {
    eachChar(str, fn);
    return;
  }

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

function getSplitWithRegExpIterator(str, pattern) {
  var start,
      end,
      nextStart;

  if (pattern.source === "" || pattern.source === "(?:)") {
    return new CharIterator(str);
  }

  // clone the RegExp
  pattern = eval("" + pattern + (!pattern.global ? "g" : ""));

  return {
    current: function() {
      return str.substring(start, end);
    },

    moveNext: function() {
      if (!pattern) {
        return false;
      }

      var match = pattern.exec(str);

      if (match) {
        start = nextStart ? nextStart : 0;
        end = match.index;
        nextStart = match.index + match[0].length;
        return true;

      } else if (pattern) {
        start = nextStart;
        end = undefined;
        nextStart = undefined;
        pattern = undefined;
        return true;
      }

      return false;
    }
  };
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
