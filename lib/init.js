var Lazy = function(source) {
  if (source instanceof Sequence) {
    return source;
  } else if (typeof source === "string") {
    return new StringWrapper(source);
  }
  return new ArrayWrapper(source);
};

Lazy.async = function(source, interval) {
  return new AsyncSequence(new ArrayWrapper(source), interval);
};

Lazy.generate = function(sequenceFn, length) {
  return new GeneratedSequence(sequenceFn, length);
};

Lazy.range = function() {
  var start = arguments.length > 1 ? arguments[0] : 0,
      stop  = arguments.length > 1 ? arguments[1] : arguments[0],
      step  = arguments.length > 2 ? arguments[2] : 1;
  return this.generate(function(i) { return start + (step * i); })
    .take(Math.floor((stop - start) / step));
};

Lazy.Sequence = Sequence;
Lazy.IndexedSequence = IndexedSequence;
Lazy.CachingSequence = CachingSequence;
Lazy.GeneratedSequence = GeneratedSequence;

/*** Useful utility methods ***/

/**
 * Creates a Set containing the specified values.
 *
 * @param {...*} values One or more values (or array(s) of values) used to
 *     populate the set.
 * @return {Set} A new set containing the values passed in.
 */
function createSet(values) {
  var set = new Set();
  Lazy(values || []).flatten().each(function(e) {
    set.add(e);
  });
  return set;
};

/**
 * Compares two elements for sorting purposes.
 *
 * @param {*} x The left element to compare.
 * @param {*} y The right element to compare.
 * @param {Function=} fn An optional function to call on each element, to get
 *     the values to compare.
 * @return {number} 1 if x > y, -1 if x < y, or 0 if x and y are equal.
 */
function compare(x, y, fn) {
  if (typeof fn === "function") {
    return compare(fn(x), fn(y));
  }

  if (x === y) {
    return 0;
  }

  return x > y ? 1 : -1;
}

function recursiveForEach(array, fn) {
  var i = -1;
  while (++i < array.length) {
    if (array[i] instanceof Array) {
      if (recursiveForEach(array[i], fn) === false) {
        return false;
      }
    } else {
      if (fn(array[i]) === false) {
        return false;
      }
    }
  }
}

function getFirst(sequence) {
  var result;
  sequence.each(function(e) {
    result = e;
    return false;
  });
  return result;
}

function swap(array, i, j) {
  var temp = array[i];
  array[i] = array[j];
  array[j] = temp;
}

function indent(depth) {
  return new Array(depth).join("  ");
}

/*** Exposing Lazy to the world ***/

// For Node.js
if (typeof module !== "undefined") {
  module.exports = Lazy;

// For browsers
} else {
  context.Lazy = Lazy;
}
