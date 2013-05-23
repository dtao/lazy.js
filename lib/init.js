var Lazy = function(source) {
  if (source instanceof Sequence) {
    return source;
  } else if (typeof source === "string") {
    return new StringWrapper(source);
  } else if (source instanceof Array) {
    return new ArrayWrapper(source);
  }
  return new ObjectWrapper(source);
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

/**
 * Iterates over every individual element in an array of arrays (of arrays...).
 *
 * @param {Array} array The outermost array.
 * @param {Function} fn The function to call on every element, which can return
 *     false to stop the iteration early.
 * @param {Array=} index An optional counter container, to keep track of the
 *     current index.
 * @return {boolean} True if every element in the entire sequence was iterated,
 *     otherwise false.
 */
function recursiveForEach(array, fn, index) {
  // It's easier to ensure this is initialized than to add special handling
  // in case it isn't.
  index = index || [0];

  var i = -1;
  while (++i < array.length) {
    if (array[i] instanceof Array) {
      if (recursiveForEach(array[i], fn, index) === false) {
        return false;
      }
    } else {
      if (fn(array[i], index[0]++) === false) {
        return false;
      }
    }
  }
  return true;
}

function getFirst(sequence) {
  var result;
  sequence.each(function(e) {
    result = e;
    return false;
  });
  return result;
}

function contains(array, element) {
  var i = -1,
      length = array.length;

  while (++i < length) {
    if (array[i] === element) {
      return true;
    }
  }
  return false;
}

if (typeof Array.prototype.indexOf === "function") {
  contains = function(array, element) {
    return array.indexOf(element) !== -1;
  };
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
