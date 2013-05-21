/**
 * The Sequence object provides a unified API encapsulating the notion of zero
 * or more consecutive elements in a collection, stream, etc.
 *
 * @constructor
 */
function Sequence() {}

/**
 * Create a new constructor function for a type inheriting from Sequence.
 *
 * @param {Function} ctor The constructor function.
 * @return {Function} A constructor for a new type inheriting from Sequence.
 */
Sequence.inherit = function(ctor) {
  ctor.prototype = new Sequence();
  return ctor;
};

/**
 * For debug purposes only.
 */
Sequence.prototype.depth = function() {
  return this.parent ? this.parent.depth() + 1 : 0;
};

/**
 * For debug purposes only.
 */
Sequence.prototype.log = function(msg) {
  console.log(indent(this.depth()) + msg);
};

/**
 * Creates an array snapshot of a sequence.
 *
 * Note that for indefinite sequences, this method may raise an exception or
 * (worse) cause the environment to hang.
 *
 * @return {Array} An array containing the current contents of the sequence.
 */
Sequence.prototype.toArray = function() {
  var array = [];
  this.each(function(e) {
    array.push(e);
  });

  return array;
};

/**
 * Creates an object from a sequence of key/value pairs.
 *
 * @return {Object} An object with keys and values corresponding to the pairs
 *     of elements in the sequence.
 */
Sequence.prototype.toObject = function() {
  var object = {};
  this.each(function(e) {
    object[e[0]] = e[1];
  });

  return object;
};

/**
 * Iterates over this sequence and executes a function for every element.
 *
 * @param {Function} fn The function to call on each element in the sequence.
 *     Return false from the function to end the iteration.
 */
Sequence.prototype.forEach = function(fn) {
  this.each(fn);
};

/**
 * Creates a new sequence whose values are calculated by passing this sequence's
 * elements through some mapping function.
 *
 * @param {Function} mapFn The mapping function used to project this sequence's
 *     elements onto a new sequence.
 * @return {Sequence} The new sequence.
 */
Sequence.prototype.map =
Sequence.prototype.collect = function(mapFn) {
  return new MappedSequence(this, mapFn);
};

/**
 * Creates a new sequence whose values are calculated by accessing the specified
 * property from each element in this sequence.
 *
 * @param {string} propertyName The name of the property to access for every
 *     element in this sequence.
 * @return {Sequence} The new sequence.
 */
Sequence.prototype.pluck = function(propertyName) {
  return this.map(function(e) {
    return e[propertyName];
  });
};

/**
 * Creates a new sequence whose values are calculated by invoking the specified
 * function on each element in this sequence.
 *
 * @param {string} methodName The name of the method to invoke for every element
 *     in this sequence.
 * @return {Sequence} The new sequence.
 */
Sequence.prototype.invoke = function(methodName) {
  return this.map(function(e) {
    return e[methodName]();
  });
};

/**
 * Creates a new sequence whose values are the elements of this sequence which
 * satisfy the specified predicate.
 *
 * @param {Function} filterFn The predicate to call on each element in this
 *     sequence, which returns true if the element should be included.
 * @return {Sequence} The new sequence.
 */
Sequence.prototype.filter =
Sequence.prototype.select = function(filterFn) {
  return new FilteredSequence(this, filterFn);
};

/**
 * Creates a new sequence whose values exclude the elements of this sequence
 * identified by the specified predicate.
 *
 * @param {Function} rejectFn The predicate to call on each element in this
 *     sequence, which returns true if the element should be omitted.
 * @return {Sequence} The new sequence.
 */
Sequence.prototype.reject = function(rejectFn) {
  return this.filter(function(e) {
    return !rejectFn(e);
  });
};

/**
 * Creates a new sequence whose values are the elements of this sequence with
 * property names and values matching those of the specified object.
 *
 * @param {Object} properties The properties that should be found on every
 *     element that is to be included in this sequence.
 * @return {Sequence} The new sequence.
 */
Sequence.prototype.where = function(properties) {
  return this.filter(function(e) {
    for (var p in properties) {
      if (e[p] !== properties[p]) {
        return false;
      }
    }
    return true;
  });
};

/**
 * Creates a new sequence with the same elements as this one, but to be iterated
 * in the opposite order.
 *
 * Note that in some (but not all) cases, the only way to create such a sequence
 * may require iterating the entire underlying source when `each` is called.
 *
 * @return {Sequence} The new sequence.
 */
Sequence.prototype.reverse = function() {
  return new ReversedSequence(this);
};

/**
 * Creates a new sequence with all of the elements of this one, plus those of
 * the given array(s).
 *
 * @param {...Array} var_args One or more arrays to use for additional items
 *     after this sequence.
 * @return {Sequence} The new sequence.
 */
Sequence.prototype.concat = function(var_args) {
  return new ConcatenatedSequence(this, Array.prototype.slice.call(arguments, 0));
};

/**
 * Creates a new sequence comprising the first N elements from this sequence, OR
 * (if N is undefined) simply returns the first element of this sequence.
 *
 * @param {number=} count The number of elements to take from this sequence. If
 *     this value exceeds the length of the sequence, the resulting sequence
 *     will be essentially the same as this one.
 * @result {*} The new sequence (or the first element from this sequence if
 *     no count was given).
 */
Sequence.prototype.first =
Sequence.prototype.head =
Sequence.prototype.take = function(count) {
  if (typeof count === "undefined") {
    return getFirst(this);
  }

  return new TakeSequence(this, count);
};

/**
 * Creates a new sequence comprising all but the last N elements of this
 * sequence.
 *
 * @param {number=} count The number of items to omit from the end of the
 *     sequence (defaults to 1).
 * @return {Sequence} The new sequence.
 */
Sequence.prototype.initial = function(count) {
  if (typeof count === "undefined") {
    count = 1;
  }
  return this.take(this.length() - count);
};

/**
 * Creates a new sequence comprising the last N elements of this sequence, OR
 * (if N is undefined) simply returns the last element of this sequence.
 *
 * @param {number=} count The number of items to take from the end of the
 *     sequence.
 * @return {Sequence} The new sequence (or the last element from this sequence
 *     if no count was given).
 */
Sequence.prototype.last = function(count) {
  if (typeof count === "undefined") {
    return this.reverse().first();
  }
  return this.reverse().take(count).reverse();
};

/**
 * Returns the first element in this sequence with property names and values
 * matching those of the specified object.
 *
 * @param {Object} properties The properties that should be found on some
 *     element in this sequence.
 * @return {*} The found element, or undefined if none exists in this
 *     sequence.
 */
Sequence.prototype.findWhere = function(properties) {
  return this.where(properties).first();
};

/**
 * Creates a new sequence comprising all but the first N elements of this
 * sequence.
 *
 * @param {number=} count The number of items to omit from the beginning of the
 *     sequence (defaults to 1).
 * @return {Sequence} The new sequence.
 */
Sequence.prototype.rest =
Sequence.prototype.tail =
Sequence.prototype.drop = function(count) {
  return new DropSequence(this, count);
};

/**
 * Creates a new sequence with the same elements as this one, but ordered
 * according to the values returned by the specified function.
 *
 * @param {Function} sortFn The function to call on the elements in this
 *     sequence, in order to sort them.
 * @return {Sequence} The new sequence.
 */
Sequence.prototype.sortBy = function(sortFn) {
  return new SortedSequence(this, sortFn);
};

/**
 * TODO: Fix this guy.
 */
Sequence.prototype.groupBy = function(keyFn) {
  return new GroupedSequence(this, keyFn);
};

/**
 * TODO: Fix this guy.
 */
Sequence.prototype.countBy = function(keyFn) {
  return new CountedSequence(this, keyFn);
};

/**
 * Creates a new sequence with every unique element from this one appearing
 * exactly once (i.e., with duplicates removed).
 *
 * @return {Sequence} The new sequence.
 */
Sequence.prototype.uniq =
Sequence.prototype.unique = function() {
  return new UniqueSequence(this);
};

/**
 * Creates a new sequence by combining the elements from this sequence with
 * corresponding elements from the specified array(s).
 *
 * @param {...Array} var_args One or more arrays of elements to combine with
 *     those of this sequence.
 * @return {Sequence} The new sequence.
 */
Sequence.prototype.zip = function(var_args) {
  return new ZippedSequence(this, Array.prototype.slice.call(arguments, 0));
};

/**
 * Creates a new sequence with the same elements as this one, in a randomized
 * order.
 *
 * @return {Sequence} The new sequence.
 */
Sequence.prototype.shuffle = function() {
  return new ShuffledSequence(this);
};

/**
 * Creates a new sequence with every element from this sequence, and with arrays
 * exploded so that a sequence of arrays (of arrays) becomes a flat sequence of
 * values.
 *
 * @return {Sequence} The new sequence.
 */
Sequence.prototype.flatten = function() {
  return new FlattenedSequence(this);
};

/**
 * Creates a new sequence with the same elements as this one, except for all
 * falsy values (false, 0, "", null, and undefined).
 *
 * @return {Sequence} The new sequence.
 */
Sequence.prototype.compact = function() {
  return this.filter(function(e) { return !!e; });
};

/**
 * Creates a new sequence with all the elements of this sequence that are not
 * also among the specified arguments.
 *
 * @param {*} The values, or array(s) of values, to be excluded from the
 *     resulting sequence.
 * @return {Sequence} The new sequence.
 */
Sequence.prototype.without =
Sequence.prototype.difference = function() {
  return new WithoutSequence(this, Array.prototype.slice.call(arguments, 0));
};

/**
 * Creates a new sequence with all the unique elements either in this sequence
 * or among the specified arguments.
 *
 * @param {...*} var_args The values, or array(s) of values, to be additionally
 *     included in the resulting sequence.
 * @return {Sequence} The new sequence.
 */
Sequence.prototype.union = function(var_args) {
  return new UnionSequence(this, Array.prototype.slice.call(arguments, 0));
};

/**
 * Creates a new sequence with all the elements of this sequence that also
 * appear among the specified arguments.
 *
 * @param {...*} var_args The values, or array(s) of values, in which elements
 *     from this sequence must also be included to end up in the resulting sequence.
 * @return {Sequence} The new sequence.
 */
Sequence.prototype.intersection = function(var_args) {
  return new IntersectionSequence(this, Array.prototype.slice.call(arguments, 0));
};

/**
 * Checks whether every element in this sequence satisfies a given predicate.
 *
 * @param {Function} predicate A function to call on (potentially) every element
 *     in this sequence.
 * @return {boolean} True if `predicate` returns true for every element in the
 *     sequence (or the sequence is empty). False if `predicate` returns false
 *     for at least one element.
 */
Sequence.prototype.every =
Sequence.prototype.all = function(predicate) {
  var success = true;
  this.each(function(e) {
    if (!predicate(e)) {
      success = false;
      return false;
    }
  });
  return success;
};

/**
 * Checks whether at least one element in this sequence satisfies a given
 * predicate (or, if no predicate is specified, whether the sequence contains at
 * least one element).
 *
 * @param {Function=} predicate A function to call on (potentially) every element
 *     in this sequence.
 * @return {boolean} True if `predicate` returns true for at least one element
 *     in the sequence. False if `predicate` returns false for every element (or
 *     the sequence is empty).
 */
Sequence.prototype.some =
Sequence.prototype.any = function(predicate) {
  if (!predicate) {
    predicate = function() { return true; };
  }

  var success = false;
  this.each(function(e) {
    if (predicate(e)) {
      success = true;
      return false;
    }
  });
  return success;
};

/**
 * Checks whether the sequence has no elements.
 *
 * @return {boolean} True if the sequence is empty, false if it contains at
 *     least one element.
 */
Sequence.prototype.isEmpty = function() {
  return !this.any();
};

/**
 * Performs (at worst) a linear search from the head of this sequence, returning
 * the first index at which the specified value is found.
 *
 * @param {*} value The element to search for in the sequence.
 * @return {number} The index within this sequence where the given value is
 *     located, or -1 if the sequence doesn't contain the value.
 */
Sequence.prototype.indexOf = function(value) {
  var index = 0;
  var foundIndex = -1;
  this.each(function(e) {
    if (e === value) {
      foundIndex = index;
      return false;
    }
    ++index;
  });
  return foundIndex;
};

/**
 * Performs (at worst) a linear search from the tail of this sequence, returning
 * the last index at which the specified value is found.
 *
 * @param {*} value The element to search for in the sequence.
 * @return {number} The last index within this sequence where the given value
 *     is located, or -1 if the sequence doesn't contain the value.
 */
Sequence.prototype.lastIndexOf = function(value) {
  var index = this.reverse().indexOf(value);
  if (index !== -1) {
    index = this.length() - index - 1;
  }
  return index;
};

/**
 * Performs a binary search of this sequence, returning the lowest index where
 * the given value is either found, or where it belongs (if it is not already in
 * the sequence).
 *
 * This method assumes the sequence is in sorted order and will fail otherwise.
 *
 * @param {*} value The element to search for in the sequence.
 * @return {number} An index within this sequence where the given value is
 *     located, or where it belongs in sorted order.
 */
Sequence.prototype.sortedIndex = function(value) {
  var lower = 0;
  var upper = this.length();
  var i;

  while (lower < upper) {
    i = (lower + upper) >>> 1;
    if (this.get(i) < value) {
      lower = i + 1;
    } else {
      upper = i;
    }
  }
  return lower;
};

/**
 * Checks whether the given value is in this sequence.
 *
 * @param {*} value The element to search for in the sequence.
 * @return {boolean} True if the sequence contains the value, false if not.
 */
Sequence.prototype.contains = function(value) {
  return this.indexOf(value) !== -1;
};

/**
 * Aggregates a sequence into a single value according to some accumulator
 * function.
 *
 * @param {Function} aggregator The function through which to pass every element
 *     in the sequence. For every element, the function will be passed the total
 *     aggregated result thus far and the element itself, and should return a
 *     new aggregated result.
 * @param {*} memo The starting value to use for the aggregated result.
 * @return {*} The result of the aggregation.
 */
Sequence.prototype.reduce =
Sequence.prototype.inject =
Sequence.prototype.foldl = function(aggregator, memo) {
  if (arguments.length < 2) {
    return this.tail().reduce(aggregator, this.head());
  }

  this.each(function(e) {
    memo = aggregator(memo, e);
  });
  return memo; 
};

/**
 * Aggregates a sequence, from the tail, into a single value according to some
 * accumulator function.
 *
 * @param {Function} aggregator The function through which to pass every element
 *     in the sequence. For every element, the function will be passed the total
 *     aggregated result thus far and the element itself, and should return a
 *     new aggregated result.
 * @param {*} memo The starting value to use for the aggregated result.
 * @return {*} The result of the aggregation.
 */
Sequence.prototype.reduceRight =
Sequence.prototype.foldr = function(aggregator, memo) {
  return this.reverse().reduce(aggregator, memo);
};

/**
 * Seaches for the first element in the sequence satisfying a given predicate.
 *
 * @param {Function} predicate A function to call on (potentially) every element
 *     in the sequence.
 * @return {*} The first element in the sequence for which `predicate` returns
 *     true, or undefined if no such element is found.
 */
Sequence.prototype.find =
Sequence.prototype.detect = function(predicate) {
  return this.filter(predicate).first();
};

/**
 * Gets the minimum value in the sequence.
 *
 * TODO: This should support a value selector.
 *
 * @return {*} The element with the lowest value in the sequence.
 */
Sequence.prototype.min = function() {
  return this.reduce(function(least, value) {
    return value < least ? value : least;
  });
};

/**
 * Gets the maximum value in the sequence.
 *
 * TODO: This should support a value selector.
 *
 * @return {*} The element with the highest value in the sequence.
 */
Sequence.prototype.max = function() {
  return this.reduce(function(greatest, value) {
    return value > greatest ? value : greatest;
  });
};

/**
 * Creates a string from joining together all of the elements in this sequence,
 * separated by the given delimiter.
 *
 * @param {string} delimiter The separator to insert between every element from
 *     this sequence in the resulting string.
 * @return {string} The delimited string.
 */
Sequence.prototype.join = function(delimiter) {
  var str = "";
  this.each(function(e) {
    if (str.length > 0) {
      str += delimiter;
    }
    str += e;
  });
  return str;
};

/**
 * Creates an iterator object with two methods, `moveNext` -- returning true or
 * false -- and `current` -- returning the current value.
 *
 * This method is used when asynchronously iterating over sequences. Any type
 * inheriting from `Sequence` must implement this method or it can't support
 * asynchronous iteration.
 *
 * @return {Iterator} An iterator object.
 */
Sequence.prototype.getIterator = function() {
  return new Iterator(this);
};

/**
 * Creates a sequence, with the same elements as this one, that will be iterated
 * over asynchronously when calling `each`.
 *
 * @param {number=} interval The approximate period, in milliseconds, that
 *     should elapse between each element in the resulting sequence. Omitting
 *     this argument will result in the fastest possible asynchronous iteration.
 * @return {Sequence} The new asynchronous sequence.
 */
Sequence.prototype.async = function(interval) {
  return new AsyncSequence(this, interval);
};
