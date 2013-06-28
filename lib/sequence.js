/**
 * The `Sequence` object provides a unified API encapsulating the notion of
 * zero or more consecutive elements in a collection, stream, etc.
 *
 * Lazy evaluation
 * ---------------
 *
 * Generally speaking, creating a sequence should not be an expensive operation,
 * and should not iterate over an underlying source or trigger any side effects.
 * This means that chaining together methods that return sequences incurs only
 * the cost of creating the `Sequence` objects themselves and not the cost of
 * iterating an underlying data source multiple times.
 *
 * The following code, for example, creates 4 sequences and does nothing with
 * `source`:
 *
 *     var seq = Lazy(source) // 1st sequence
 *       .map(func)           // 2nd
 *       .filter(pred)        // 3rd
 *       .reverse();          // 4th
 *
 * Lazy's convention is to hold off on iterating or otherwise *doing* anything
 * (aside from creating `Sequence` objects) until you call `each`:
 *
 *     seq.each(function(x) { console.log(x); });
 *
 * Defining custom sequences
 * -------------------------
 *
 * Defining your own type of sequence is relatively simple:
 *
 * 1. Pass a constructor function to {@link Sequence.inherit}. By convention,
 *    this function should *at least* accept a `parent` parameter, which will be
 *    set to the underlying sequence.
 * 2. Define an `each` method on this new function's prototype, which accepts
 *    a function as a parameter and calls `this.parent.each` to fetch elements
 *    one by one from the underlying sequence.
 *
 * As a trivial example, the following code defines a new type of sequence
 * called `SampleSequence` which randomly may or may not include each element
 * from its parent.
 *
 *     var SampleSequence = Sequence.inherit(function(parent) {
 *       this.parent = parent;
 *     });
 *
 *     SampleSequence.prototype.each = function(fn) {
 *       this.parent.each(function(e) {
 *         // 50/50 chance of including this element.
 *         if (Math.random() > 0.5) {
 *           return fn(e);
 *         }
 *       });
 *     };
 *
 * (Of course, the above could also easily have been implemented using
 * {@link #filter} instead of creating a custom sequence. But I *did* say this
 * was a trivial example, to be fair.)
 *
 * @constructor
 */
function Sequence() {}

/**
 * Create a new constructor function for a type inheriting from `Sequence`.
 *
 * @param {Function} ctor The constructor function.
 * @return {Function} A constructor for a new type inheriting from `Sequence`.
 */
Sequence.inherit = function(ctor) {
  ctor = ctor || function() {};
  ctor.prototype = new Sequence();
  return ctor;
};

/**
 * For debug purposes only.
 * @debug
 */
Sequence.prototype.depth = function() {
  return this.parent ? this.parent.depth() + 1 : 0;
};

/**
 * For debug purposes only.
 * @debug
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
 *
 * @example
 * var range = Lazy.range(1, 10);
 * // => sequence: (1, 2, ..., 9)
 *
 * var array = range.toArray();
 * // => [1, 2, ..., 9]
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
 *
 * @example
 * var details = [
 *   ["first", "Dan"],
 *   ["last", "Tao"],
 *   ["age", 29]
 * ];
 *
 * var person = Lazy(details).toObject();
 * // => { first: "Dan", last: "Tao", age: 29 }
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
 *
 * @example
 * var subordinates = [joe, bill, wendy];
 * Lazy(subordinates).each(function(s) { s.reprimand(); });
 */
Sequence.prototype.each = function(fn) {
  // Calling each on an empty sequence does nothing.
};

/**
 * Alias for {@link Sequence#each}.
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
 *
 * @example
 * var odds = [1, 3, 5];
 * var evens = Lazy(odds).map(function(x) { return x + 1; });
 * // => sequence: (2, 4, 6)
 */
Sequence.prototype.map = function(mapFn) {
  return new MappedSequence(this, mapFn);
};

/**
 * Alias for {@link Sequence#map}.
 *
 * @function collect
 * @memberOf Sequence
 * @instance
 */
Sequence.prototype.collect = Sequence.prototype.map;

/**
 * Creates a new sequence whose values are calculated by accessing the specified
 * property from each element in this sequence.
 *
 * @param {string} propertyName The name of the property to access for every
 *     element in this sequence.
 * @return {Sequence} The new sequence.
 *
 * @example
 * var people = [
 *   { first: "Dan", last: "Tao" },
 *   { first: "Bob", last: "Smith" }
 * ];
 * var surnames = Lazy(people).pluck("last");
 * // => sequence: ("Tao", "Smith")
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
 *
 * @example
 * function Person(first, last) {
 *   this.fullName = function() {
 *     return first + " " + last;
 *   };
 * }
 *
 * var people = [
 *   new Person("Dan", "Tao"),
 *   new Person("Bob", "Smith")
 * ];
 *
 * var fullNames = Lazy(people).invoke("fullName");
 * // => sequence: ("Dan Tao", "Bob Smith")
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
 *
 * @example
 * var numbers = [1, 2, 3, 4, 5, 6];
 * var evens = Lazy(numbers).select(function(x) { return x % 2 === 0; });
 * // => sequence: (2, 4, 6)
 */
Sequence.prototype.select = function(filterFn) {
  return new FilteredSequence(this, filterFn);
};

/**
 * Alias for {@link Sequence#select}.
 *
 * @function filter
 * @memberOf Sequence
 * @instance
 */
Sequence.prototype.filter = Sequence.prototype.select;

/**
 * Creates a new sequence whose values exclude the elements of this sequence
 * identified by the specified predicate.
 *
 * @param {Function} rejectFn The predicate to call on each element in this
 *     sequence, which returns true if the element should be omitted.
 * @return {Sequence} The new sequence.
 *
 * @example
 * var numbers = [1, 2, 3, 4, 5, 6];
 * var odds = Lazy(numbers).reject(function(x) { return x % 2 === 0; });
 * // => sequence: (1, 3, 5)
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
 *
 * @example
 * var people = [
 *   { first: "Dan", last: "Tao" },
 *   { first: "Bob", last: "Smith" }
 * ];
 * var dans = Lazy(people).where({ first: "Dan" });
 * // => sequence: ({ first: "Dan", last: "Tao" })
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
 *
 * @example
 * var alphabet = "abcdefghijklmnopqrstuvwxyz";
 * var alphabetBackwards = Lazy(alphabet).reverse();
 * // => sequence: ("z", "y", "x", ..., "a")
 */
Sequence.prototype.reverse = function() {
  return new ReversedSequence(this);
};

/**
 * Creates a new sequence with all of the elements of this one, plus those of
 * the given array(s).
 *
 * @param {...*} var_args One or more values (or arrays of values) to use for
 *     additional items after this sequence.
 * @return {Sequence} The new sequence.
 *
 * @example
 * var left = [1, 2, 3];
 * var right = [4, 5, 6];
 * var both = Lazy(left).concat(right);
 * // => sequence: (1, 2, 3, 4, 5, 6)
 */
Sequence.prototype.concat = function(var_args) {
  return new ConcatenatedSequence(this, Array.prototype.slice.call(arguments, 0));
};

/**
 * Creates a new sequence comprising the first N elements from this sequence, OR
 * (if N is `undefined`) simply returns the first element of this sequence.
 *
 * @param {number=} count The number of elements to take from this sequence. If
 *     this value exceeds the length of the sequence, the resulting sequence
 *     will be essentially the same as this one.
 * @result {*} The new sequence (or the first element from this sequence if
 *     no count was given).
 *
 * @example
 * function powerOfTwo(exp) {
 *   return Math.pow(2, exp);
 * }
 *
 * var firstTenPowersOf2 = Lazy.generate(powerOfTwo).first(10);
 * // => sequence: (1, 2, 4, ..., 512)
 */
Sequence.prototype.first = function(count) {
  if (typeof count === "undefined") {
    return getFirst(this);
  }

  return new TakeSequence(this, count);
};

/**
 * Alias for {@link Sequence#first}.
 *
 * @function head
 * @memberOf Sequence
 * @instance
 */
Sequence.prototype.head = Sequence.prototype.first;

/**
 * Alias for {@link Sequence#first}.
 *
 * @function take
 * @memberOf Sequence
 * @instance
 */
Sequence.prototype.take = Sequence.prototype.first;

/**
 * Creates a new sequence comprising all but the last N elements of this
 * sequence.
 *
 * @param {number=} count The number of items to omit from the end of the
 *     sequence (defaults to 1).
 * @return {Sequence} The new sequence.
 *
 * @example
 * var produce = [apple, banana, carrot, durian];
 * var edibleProduce = Lazy(produce).initial();
 * // => sequence: (apple, banana, carrot)
 */
Sequence.prototype.initial = function(count) {
  if (typeof count === "undefined") {
    count = 1;
  }
  return this.take(this.length() - count);
};

/**
 * Creates a new sequence comprising the last N elements of this sequence, OR
 * (if N is `undefined`) simply returns the last element of this sequence.
 *
 * @param {number=} count The number of items to take from the end of the
 *     sequence.
 * @return {*} The new sequence (or the last element from this sequence
 *     if no count was given).
 *
 * @example
 * var siblings = [lauren, adam, daniel, happy];
 * var favorite = Lazy(siblings).last();
 * // => happy
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
 * @return {*} The found element, or `undefined` if none exists in this
 *     sequence.
 *
 * @example
 * var words = ["foo", "bar"];
 * var foo = Lazy(words).findWhere({ 0: "f" });
 * // => "foo"
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
 *
 * @example
 * var numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
 * var lastFive = Lazy(numbers).rest(5);
 * // #=> sequence: (6, 7, 8, 9, 10)
 */
Sequence.prototype.rest = function(count) {
  return new DropSequence(this, count);
};

/**
 * Alias for {@link Sequence#rest}.
 *
 * @function tail
 * @memberOf Sequence
 * @instance
 */
Sequence.prototype.tail = Sequence.prototype.rest;

/**
 * Alias for {@link Sequence#rest}.
 *
 * @function drop
 * @memberOf Sequence
 * @instance
 */
Sequence.prototype.drop = Sequence.prototype.rest;

/**
 * Creates a new sequence with the same elements as this one, but ordered
 * according to the values returned by the specified function.
 *
 * @param {Function} sortFn The function to call on the elements in this
 *     sequence, in order to sort them.
 * @return {Sequence} The new sequence.
 *
 * function population(country) {
 *   return country.pop;
 * }
 *
 * function area(country) {
 *   return country.sqkm;
 * }
 *
 * var countries = [
 *   { name: "USA", pop: 320000000, sqkm: 9600000 },
 *   { name: "Brazil", pop: 194000000, sqkm: 8500000 },
 *   { name: "Nigeria", pop: 174000000, sqkm: 924000 },
 *   { name: "China", pop: 1350000000, sqkm: 9700000 },
 *   { name: "Russia", pop: 143000000, sqkm: 17000000 },
 *   { name: "Australia", pop: 23000000, sqkm: 7700000 }
 * ];
 *
 * var mostPopulous = Lazy(countries).sortBy(population).last(3);
 * // => sequence: (Brazil, USA, China)
 *
 * var largest = Lazy(countries).sortBy(area).last(3);
 * // => sequence: (USA, China, Russia)
 */
Sequence.prototype.sortBy = function(sortFn) {
  return new SortedSequence(this, sortFn);
};

/**
 * Creates a new sequence comprising the elements in this one, grouped
 * together according to some key. The elements of the new sequence are pairs
 * of the form `[key, values]` where `values` is an array containing all of
 * the elements in this sequence with the same key.
 *
 * @param {Function} keyFn The function to call on the elements in this
 *     sequence to obtain a key by which to group them.
 * @return {Sequence} The new sequence.
 *
 * @example
 * var numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
 * var oddsAndEvens = Lazy(numbers).groupBy(function(x) {
 *   return x % 2 == 1 ? "odd" : "even";
 * });
 * // => sequence: (["odd", [1, 3, ..., 9]], ["even", [2, 4, ..., 10]])
 */
Sequence.prototype.groupBy = function(keyFn) {
  return new GroupedSequence(this, keyFn);
};

/**
 * Creates a new sequence containing the unique keys of all the elements in
 * this sequence, each paired with a number representing the number of times
 * that key appears in the sequence.
 *
 * @param {Function} keyFn The function to call on the elements in this
 *     sequence to obtain a key by which to count them.
 * @return {Sequence} The new sequence.
 *
 * @example
 * var numbers = [1, 2, 3, 4, 5];
 * var oddsAndEvens = Lazy(numbers).countBy(function(x) {
 *   return x % 2 == 1 ? "odd" : "even";
 * });
 * // => sequence: (["odd", 3], ["even", 2])
 */
Sequence.prototype.countBy = function(keyFn) {
  return new CountedSequence(this, keyFn);
};

/**
 * Creates a new sequence with every unique element from this one appearing
 * exactly once (i.e., with duplicates removed).
 *
 * @return {Sequence} The new sequence.
 *
 * @example
 * Lazy([1, 2, 2, 3, 3, 3]).uniq();
 * // => sequence: (1, 2, 3)
 */
Sequence.prototype.uniq = function() {
  return new UniqueSequence(this);
};

/**
 * Alias for {@link Sequence#uniq}.
 *
 * @function unique
 * @memberOf Sequence
 * @instance
 */
Sequence.prototype.unique = Sequence.prototype.uniq;

/**
 * Creates a new sequence by combining the elements from this sequence with
 * corresponding elements from the specified array(s).
 *
 * @param {...Array} var_args One or more arrays of elements to combine with
 *     those of this sequence.
 * @return {Sequence} The new sequence.
 *
 * @example
 * Lazy([1, 2]).zip([3, 4]);
 * // => sequence: ([1, 3], [2, 4])
 */
Sequence.prototype.zip = function(var_args) {
  if (arguments.length === 1) {
    return new SimpleZippedSequence(this, (/** @type {Array} */ var_args));
  } else {
    return new ZippedSequence(this, Array.prototype.slice.call(arguments, 0));
  }
};

/**
 * Creates a new sequence with the same elements as this one, in a randomized
 * order.
 *
 * @return {Sequence} The new sequence.
 *
 * @example
 * Lazy([1, 2, 3, 4, 5]).shuffle();
 * // => sequence: (2, 3, 5, 4, 1)
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
 *
 * @example
 * Lazy([1, [2, 3], [4, [5]]]).flatten();
 * // => sequence: (1, 2, 3, 4, 5)
 */
Sequence.prototype.flatten = function() {
  return new FlattenedSequence(this);
};

/**
 * Creates a new sequence with the same elements as this one, except for all
 * falsy values (`false`, `0`, `""`, `null`, and `undefined`).
 *
 * @return {Sequence} The new sequence.
 *
 * @example
 * Lazy(["foo", null, "bar", undefined]).compact();
 * // => sequence: ("foo", "bar")
 */
Sequence.prototype.compact = function() {
  return this.filter(function(e) { return !!e; });
};

/**
 * Creates a new sequence with all the elements of this sequence that are not
 * also among the specified arguments.
 *
 * @param {...*} var_args The values, or array(s) of values, to be excluded from the
 *     resulting sequence.
 * @return {Sequence} The new sequence.
 *
 * @example
 * Lazy([1, 2, 3, 4, 5]).without(2, 3);
 * // => sequence: (1, 4, 5)
 */
Sequence.prototype.without = function(var_args) {
  return new WithoutSequence(this, Array.prototype.slice.call(arguments, 0));
};

/**
 * Alias for {@link Sequence#without}.
 *
 * @function difference
 * @memberOf Sequence
 * @instance
 */
Sequence.prototype.difference = Sequence.prototype.without;

/**
 * Creates a new sequence with all the unique elements either in this sequence
 * or among the specified arguments.
 *
 * @param {...*} var_args The values, or array(s) of values, to be additionally
 *     included in the resulting sequence.
 * @return {Sequence} The new sequence.
 *
 * @example
 * Lazy(["foo", "bar"]).union(["bar", "baz"]);
 * // => sequence: ("foo", "bar", "baz")
 */
Sequence.prototype.union = function(var_args) {
  return this.concat(var_args).uniq();
};

/**
 * Creates a new sequence with all the elements of this sequence that also
 * appear among the specified arguments.
 *
 * @param {...*} var_args The values, or array(s) of values, in which elements
 *     from this sequence must also be included to end up in the resulting sequence.
 * @return {Sequence} The new sequence.
 *
 * @example
 * Lazy(["foo", "bar"]).intersection(["bar", "baz"]);
 * // => sequence: ("bar")
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
 *
 * @example
 * var numbers = [1, 2, 3, 4, 5];
 *
 * var allEven = Lazy(numbers).every(function(x) { return x % 2 === 0; });
 * // => false
 *
 * var allPositive = Lazy(numbers).every(function(x) { return x > 0; });
 * // => true
 */
Sequence.prototype.every = function(predicate) {
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
 * Alias for {@link Sequence#every}.
 *
 * @function all
 * @memberOf Sequence
 * @instance
 */
Sequence.prototype.all = Sequence.prototype.every;

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
 *
 * @example
 * var numbers = [1, 2, 3, 4, 5];
 *
 * var someEven = Lazy(numbers).some(function(x) { return x % 2 === 0; });
 * // => true
 *
 * var someNegative = Lazy(numbers).some(function(x) { return x < 0; });
 * // => false
 */
Sequence.prototype.some = function(predicate) {
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
 * Alias for {@link Sequence#some}.
 *
 * @function any
 * @memberOf Sequence
 * @instance
 */
Sequence.prototype.any = Sequence.prototype.some;

/**
 * Checks whether the sequence has no elements.
 *
 * @return {boolean} True if the sequence is empty, false if it contains at
 *     least one element.
 *
 * @example
 * Lazy([]).isEmpty();
 * // => true
 *
 * Lazy([1, 2, 3]).isEmpty();
 * // => false
 */
Sequence.prototype.isEmpty = function() {
  return !this.any();
};

/**
 * Performs (at worst) a linear search from the head of this sequence,
 * returning the first index at which the specified value is found.
 *
 * @param {*} value The element to search for in the sequence.
 * @return {number} The index within this sequence where the given value is
 *     located, or -1 if the sequence doesn't contain the value.
 *
 * @example
 * Lazy(["foo", "bar", "baz"]).indexOf("bar");
 * // => 1
 *
 * Lazy([1, 2, 3]).indexOf(4);
 * // => -1
 *
 * Lazy([1, 2, 3]).map(function(x) { return x * 2; }).indexOf(2);
 * // => 0
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
 * Performs (at worst) a linear search from the tail of this sequence,
 * returning the last index at which the specified value is found.
 *
 * @param {*} value The element to search for in the sequence.
 * @return {number} The last index within this sequence where the given value
 *     is located, or -1 if the sequence doesn't contain the value.
 *
 * @example
 * Lazy(["a", "b", "c", "b", "a"]).lastIndexOf("b");
 * // => 3
 *
 * Lazy([1, 2, 3]).lastIndexOf(0);
 * // => -1
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
 * the given value is either found, or where it belongs (if it is not already
 * in the sequence).
 *
 * This method assumes the sequence is in sorted order and will fail
 * otherwise.
 *
 * @param {*} value The element to search for in the sequence.
 * @return {number} An index within this sequence where the given value is
 *     located, or where it belongs in sorted order.
 *
 * @example
 * Lazy([1, 3, 6, 9, 12, 15, 18, 21]).sortedIndex(3);
 * // => 1
 */
Sequence.prototype.sortedIndex = function(value) {
  var lower = 0;
  var upper = this.length();
  var i;

  while (lower < upper) {
    i = (lower + upper) >>> 1;
    if (compare(this.get(i), value) === -1) {
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
 *
 * @example
 * var numbers = [5, 10, 15, 20];
 *
 * Lazy(numbers).contains(15);
 * // => true
 *
 * Lazy(numbers).contains(13);
 * // => false
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
 * @param {*=} memo The starting value to use for the aggregated result
 *     (defaults to the first element in the sequence).
 * @return {*} The result of the aggregation.
 *
 * @example
 * var numbers = [5, 10, 15, 20];
 *
 * var sum = Lazy(numbers).reduce(function(x, y) { return x + y; }, 0);
 * // => 50
 */
Sequence.prototype.reduce = function(aggregator, memo) {
  if (arguments.length < 2) {
    return this.tail().reduce(aggregator, this.head());
  }

  this.each(function(e, i) {
    memo = aggregator(memo, e, i);
  });
  return memo;
};

/**
 * Alias for {@link Sequence#reduce}.
 *
 * @function inject
 * @memberOf Sequence
 * @instance
 */
Sequence.prototype.inject = Sequence.prototype.reduce;

/**
 * Alias for {@link Sequence#reduce}.
 *
 * @function foldl
 * @memberOf Sequence
 * @instance
 */
Sequence.prototype.foldl = Sequence.prototype.reduce;

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
 *
 * @example
 * var letters = "abcde";
 *
 * var backwards = Lazy(letters).reduceRight(function(x, y) { return x + y; });
 * // => "edcba"
 */
Sequence.prototype.reduceRight = function(aggregator, memo) {
  if (arguments.length < 2) {
    return this.initial(1).reduceRight(aggregator, this.last());
  }

  // This bothers me... but frankly, calling reverse().reduce() is potentially
  // going to eagerly evaluate the sequence anyway; so it's really not an issue.
  var i = this.length() - 1;
  return this.reverse().reduce(function(m, e) {
    return aggregator(m, e, i--);
  }, memo);
};

/**
 * Alias for {@link Sequence#reduceRight}.
 *
 * @function foldr
 * @memberOf Sequence
 * @instance
 */
Sequence.prototype.foldr = Sequence.prototype.reduceRight;

/**
 * Seaches for the first element in the sequence satisfying a given predicate.
 *
 * @param {Function} predicate A function to call on (potentially) every element
 *     in the sequence.
 * @return {*} The first element in the sequence for which `predicate` returns
 *     `true`, or `undefined` if no such element is found.
 *
 * @example
 * var numbers = [5, 6, 7, 8, 9, 10];
 *
 * Lazy(numbers).find(function(x) { return x % 3 === 0; });
 * // => 6
 *
 * Lazy(numbers).find(function(x) { return x < 0; });
 * // => undefined
 */
Sequence.prototype.find = function(predicate) {
  return this.filter(predicate).first();
};

/**
 * Alias for {@link Sequence#find}.
 *
 * @function detect
 * @memberOf Sequence
 * @instance
 */
Sequence.prototype.detect = Sequence.prototype.find;

/**
 * Gets the minimum value in the sequence.
 *
 * TODO: This should support a value selector.
 *
 * @return {*} The element with the lowest value in the sequence.
 *
 * @example
 * Lazy([6, 18, 2, 49, 34]).min();
 * // => 2
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
 *
 * @example
 * Lazy([6, 18, 2, 49, 34]).max();
 * // => 49
 */
Sequence.prototype.max = function() {
  return this.reduce(function(greatest, value) {
    return value > greatest ? value : greatest;
  });
};

/**
 * Gets the sum of the values in the sequence.
 *
 * TODO: This should support a value selector.
 *
 * @return {*} The sum.
 *
 * @example
 * Lazy([1, 2, 3, 4]).sum();
 * // => 10
 */
Sequence.prototype.sum = function() {
  return this.reduce(function(sum, value) {
    return sum += value;
  }, 0);
};

/**
 * Creates a string from joining together all of the elements in this sequence,
 * separated by the given delimiter.
 *
 * @param {string=} delimiter The separator to insert between every element from
 *     this sequence in the resulting string (defaults to `","`).
 * @return {string} The delimited string.
 *
 * @example
 * Lazy([6, 29, 1984]).join("/");
 * // => "6/29/1984"
 */
Sequence.prototype.join = function(delimiter) {
  delimiter = typeof delimiter === "string" ? delimiter : ",";

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
 * Alias for {@link Sequence#join}.
 *
 * @function toString
 * @memberOf Sequence
 * @instance
 */
Sequence.prototype.toString = Sequence.prototype.join;

/**
 * Creates an iterator object with two methods, `moveNext` -- returning true or
 * false -- and `current` -- returning the current value.
 *
 * This method is used when asynchronously iterating over sequences. Any type
 * inheriting from `Sequence` must implement this method or it can't support
 * asynchronous iteration.
 *
 * @return {Iterator} An iterator object.
 *
 * @example
 * var iterator = Lazy([1, 2]).getIterator();
 *
 * iterator.moveNext();
 * // => true
 *
 * iterator.current();
 * // => 1
 *
 * iterator.moveNext();
 * // => true
 *
 * iterator.current();
 * // => 2
 *
 * iterator.moveNext();
 * // => false
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
 * @return {AsyncSequence} The new asynchronous sequence.
 *
 * @example
 * Lazy([1, 2, 3]).async(1000).each(function(x) {
 *   console.log(x);
 * });
 * // (logs the numbers 1, 2, and 3 to the console, one second apart)
 */
Sequence.prototype.async = function(interval) {
  return new AsyncSequence(this, interval);
};

/**
 * A CachingSequence is a `Sequence` that (probably) must fully evaluate the
 * underlying sequence when {@link #each} is called. For this reason, it
 * provides a {@link #cache} method to fully populate an array that can then be
 * referenced internally.
 *
 * Frankly, I question the wisdom in this sequence type and think I will
 * probably refactor this out in the near future. Most likely I will replace it
 * with something like an 'IteratingSequence' which must expose a 'getIterator'
 * and not provide {@link #get} or {@link #length} at all. But we'll see.
 *
 * @constructor
 */
function CachingSequence() {}

CachingSequence.prototype = new Sequence();

/**
 * Create a new constructor function for a type inheriting from
 * `CachingSequence`.
 *
 * @param {Function} ctor The constructor function.
 * @return {Function} A constructor for a new type inheriting from
 *     `CachingSequence`.
 */
CachingSequence.inherit = function(ctor) {
  ctor.prototype = new CachingSequence();
  return ctor;
};

/**
 * Fully evaluates the sequence and returns a cached result.
 *
 * @return {Array} The cached array, fully populated with the elements in this
 *     sequence.
 */
CachingSequence.prototype.cache = function() {
  if (!this.cached) {
    this.cached = this.toArray();
  }
  return this.cached;
};

/**
 * For internal use only.
 */
CachingSequence.prototype.get = function(i) {
  return this.cache()[i];
};

/**
 * For internal use only.
 */
CachingSequence.prototype.length = function() {
  return this.cache().length;
};

var MappedSequence = Sequence.inherit(function(parent, mapFn) {
  this.parent = parent;
  this.mapFn  = mapFn;
});

MappedSequence.prototype.each = function(fn) {
  var mapFn = this.mapFn;
  this.parent.each(function(e, i) {
    return fn(mapFn(e, i), i);
  });
};

var FilteredSequence = CachingSequence.inherit(function(parent, filterFn) {
  this.parent   = parent;
  this.filterFn = filterFn;
});

FilteredSequence.prototype.getIterator = function() {
  return new FilteringIterator(this.parent, this.filterFn);
};

FilteredSequence.prototype.each = function(fn) {
  var filterFn = this.filterFn;

  this.parent.each(function(e, i) {
    if (filterFn(e, i)) {
      return fn(e, i);
    }
  });
};

var ReversedSequence = CachingSequence.inherit(function(parent) {
  this.parent = parent;
});

ReversedSequence.prototype.each = function(fn) {
  var parentArray = this.parent.toArray(),
      i = parentArray.length;
  while (--i >= 0) {
    if (fn(parentArray[i]) === false) {
      break;
    }
  }
};

var ConcatenatedSequence = Sequence.inherit(function(parent, arrays) {
  this.parent = parent;
  this.arrays = arrays;
});

ConcatenatedSequence.prototype.each = function(fn) {
  var done = false,
      i = 0;

  this.parent.each(function(e) {
    if (fn(e, i++) === false) {
      done = true;
      return false;
    }
  });

  if (!done) {
    Lazy(this.arrays).flatten().each(function(e) {
      if (fn(e, i++) === false) {
        return false;
      }
    });
  }
};

var TakeSequence = CachingSequence.inherit(function(parent, count) {
  this.parent = parent;
  this.count  = count;
});

TakeSequence.prototype.each = function(fn) {
  var self = this,
      i = 0;
  self.parent.each(function(e) {
    var result = fn(e, i);
    if (++i >= self.count) { return false; }
    return result;
  });
};

var DropSequence = CachingSequence.inherit(function(parent, count) {
  this.parent = parent;
  this.count  = typeof count === "number" ? count : 1;
});

DropSequence.prototype.each = function(fn) {
  var self = this,
      i = 0;
  self.parent.each(function(e) {
    if (i++ < self.count) { return; }
    return fn(e);
  });
};

  var SortedSequence = CachingSequence.inherit(function(parent, sortFn) {
    this.parent = parent;
    this.sortFn = sortFn;
  });

SortedSequence.prototype.each = function(fn) {
  var sortFn = this.sortFn,
      sorted = this.parent.toArray(),
      i = -1;

  sorted.sort(function(x, y) { return compare(x, y, sortFn); });

  while (++i < sorted.length) {
    if (fn(sorted[i], i) === false) {
      break;
    }
  }
};

var ShuffledSequence = CachingSequence.inherit(function(parent) {
  this.parent = parent;
});

ShuffledSequence.prototype.each = function(fn) {
  var shuffled = this.parent.toArray(),
      floor = Math.floor,
      random = Math.random,
      j = 0;

  for (var i = shuffled.length - 1; i > 0; --i) {
    swap(shuffled, i, floor(random() * i) + 1);
    if (fn(shuffled[i], j++) === false) {
      return;
    }
  }
  fn(shuffled[0], j);
};

var GroupedSequence = CachingSequence.inherit(function(parent, keyFn) {
  this.each = function(fn) {
    var grouped = {};
    parent.each(function(e) {
      var key = keyFn(e);
      if (!grouped[key]) {
        grouped[key] = [e];
      } else {
        grouped[key].push(e);
      }
    });
    for (var key in grouped) {
      if (fn([key, grouped[key]]) === false) {
        break;
      }
    }
  };
});

var CountedSequence = CachingSequence.inherit(function(parent, keyFn) {
  this.each = function(fn) {
    var grouped = {};
    parent.each(function(e) {
      var key = keyFn(e);
      if (!grouped[key]) {
        grouped[key] = 1;
      } else {
        grouped[key] += 1;
      }
    });
    for (var key in grouped) {
      fn([key, grouped[key]]);
    }
  };
});

var UniqueSequence = CachingSequence.inherit(function(parent) {
  this.parent = parent;
});

UniqueSequence.prototype.each = function(fn) {
  var cache = new Set(),
      i     = 0;
  this.parent.each(function(e) {
    if (cache.add(e)) {
      return fn(e, i++);
    }
  });
};

var FlattenedSequence = CachingSequence.inherit(function(parent) {
  this.parent = parent;
});

FlattenedSequence.prototype.each = function(fn) {
  // Hack: store the index in a tiny array so we can increment it from outside
  // this function.
  var index = [0];

  this.parent.each(function(e) {
    if (e instanceof Array) {
      return recursiveForEach(e, fn, index);
    } else {
      return fn(e, index[0]++);
    }
  });
};

var WithoutSequence = CachingSequence.inherit(function(parent, values) {
  this.parent = parent;
  this.values = values;
});

WithoutSequence.prototype.each = function(fn) {
  var set = createSet(this.values),
      i = 0;
  this.parent.each(function(e) {
    if (!set.contains(e)) {
      return fn(e, i++);
    }
  });
};

var IntersectionSequence = CachingSequence.inherit(function(parent, arrays) {
  this.parent = parent;
  this.arrays = arrays;
});

IntersectionSequence.prototype.each = function(fn) {
  var sets = Lazy(this.arrays)
    .map(function(values) { return Lazy(values).uniq().toArray(); })
    .toArray();

  var find = contains,
      i = 0;

  this.parent.each(function(e) {
    var j = -1;
    while (++j < sets.length) {
      if (!find(sets[j], e)) {
        return;
      }
    }
    return fn(e, i++);
  });
};

/**
 * An optimized version of {@link ZippedSequence}, when zipping a sequence with
 * only one array.
 *
 * @param {Sequence} parent The underlying sequence.
 * @param {Array} array The array with which to zip the sequence.
 * @constructor
 */
function SimpleZippedSequence(parent, array) {
  this.parent = parent;
  this.array  = array;
}

SimpleZippedSequence.prototype = new Sequence();

SimpleZippedSequence.prototype.each = function(fn) {
  var array = this.array;
  this.parent.each(function(e, i) {
    return fn([e, array[i]], i);
  });
};

var ZippedSequence = CachingSequence.inherit(function(parent, arrays) {
  this.parent = parent;
  this.arrays = arrays;
});

ZippedSequence.prototype.each = function(fn) {
  var arrays = this.arrays,
      i = 0;
  this.parent.each(function(e) {
    var group = [e];
    for (var j = 0; j < arrays.length; ++j) {
      if (arrays[j].length > i) {
        group.push(arrays[j][i]);
      }
    }
    return fn(group, i++);
  });
};
