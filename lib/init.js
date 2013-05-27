/**
 * Wraps an object and returns something lazy.
 *
 * For arrays and objects, Lazy will create a {@link Sequence} object.
 * For strings, Lazy will create a {@link StringWrapper}, with
 * {@link StringWrapper.split} and {@link StringWrapper.match} methods that
 * themselves create sequences.
 *
 * @param {*} source An array, object, or string to wrap.
 * @return {StringWrapper|Sequence} The wrapped lazy object.
 */
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

/**
 * Deprecated.
 */
Lazy.async = function(source, interval) {
  return new AsyncSequence(new ArrayWrapper(source), interval);
};

/**
 * Creates a {@link GeneratedSequence} using the specified generator function
 * and (optionally) length.
 *
 * @param {function(number):*} generatorFn The function used to generate the
 *     sequence. This function accepts an index as a parameter and should return
 *     a value for that index in the resulting sequence.
 * @param {number=} length The length of the sequence, for sequences with a
 *     definite length.
 * @return {Sequence} The generated sequence.
 */
Lazy.generate = function(generatorFn, length) {
  return new GeneratedSequence(generatorFn, length);
};

/**
 * Creates a sequence from a given starting value, up to a specified stopping
 * value, incrementing by a given step.
 *
 * @return {Sequence} The sequence defined by the given ranges.
 */
Lazy.range = function() {
  var start = arguments.length > 1 ? arguments[0] : 0,
      stop  = arguments.length > 1 ? arguments[1] : arguments[0],
      step  = arguments.length > 2 ? arguments[2] : 1;
  return this.generate(function(i) { return start + (step * i); })
    .take(Math.floor((stop - start) / step));
};

/**
 * Creates a sequence consisting of the given value repeated a specified number
 * of times.
 *
 * @param {*} value The value to repeat.
 * @param {number=} count The number of times the value should be repeated in
 *     the sequence. If this argument is omitted, the value will repeat forever.
 * @return {Sequence} The sequence containing the repeated value.
 */
Lazy.repeat = function(value, count) {
  return Lazy.generate(function() { return value; }, count);
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
