/*
 * @name Lazy.js
 *
 * @fileOverview
 * Lazy.js is a lazy evaluation library for JavaScript.
 *
 * This has been done before. For examples see:
 *
 * - [wu.js](http://fitzgen.github.io/wu.js/)
 * - [Linq.js](http://linqjs.codeplex.com/)
 * - [from.js](https://github.com/suckgamoni/fromjs/)
 * - [IxJS](http://rx.codeplex.com/)
 * - [sloth.js](http://rfw.name/sloth.js/)
 *
 * However, at least at present, Lazy.js is faster (on average) than any of
 * those libraries. It is also more complete, with nearly all of the
 * functionality of [Underscore](http://underscorejs.org/) and
 * [Lo-Dash](http://lodash.com/).
 *
 * Finding your way around the code
 * --------------------------------
 *
 * At the heart of Lazy.js is the {@link Sequence} object. You create an initial
 * sequence using {@link Lazy}, which can accept an array, object, or string.
 * You can then "chain" together methods from this sequence, creating a new
 * sequence with each call.
 *
 * Here's an example:
 *
 *     var data = getReallyBigArray();
 *
 *     var statistics = Lazy(data)
 *       .map(transform)
 *       .filter(validate)
 *       .reduce(aggregate);
 *
 * {@link Sequence} is the foundation of other, more specific sequence types.
 *
 * An {@link ArrayLikeSequence} provides indexed access to its elements.
 *
 * An {@link ObjectLikeSequence} consists of key/value pairs.
 *
 * A {@link StringLikeSequence} is like a string (duh): actually, it is an
 * {@link ArrayLikeSequence} whose elements happen to be characters.
 *
 * An {@link AsyncSequence} is special: it iterates over its elements
 * asynchronously (so calling `each` generally begins an asynchronous loop and
 * returns immediately).
 *
 * For more information
 * --------------------
 *
 * I wrote a blog post that explains a little bit more about Lazy.js, which you
 * can read [here](http://philosopherdeveloper.com/posts/introducing-lazy-js.html).
 *
 * You can also [create an issue on GitHub](https://github.com/dtao/lazy.js/issues)
 * if you have any issues with the library. I work through them eventually.
 *
 * [@dtao](https://github.com/dtao)
 */

(function(context) {
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
   * 1. Pass a *method name* and an object containing *function overrides* to
   *    {@link Sequence.define}. If the object includes a function called `init`,
   *    this function will be called upon initialization of a sequence of this
   *    type. The function **must at least accept a `parent` parameter as its
   *    first argument**, which will be set to the underlying parent sequence.
   * 2. The object should include at least either a `getIterator` method or an
   *    `each` method. The former supports both asynchronous and synchronous
   *    iteration, but is slightly more cumbersome to implement. The latter
   *    supports synchronous iteration and can be automatically implemented in
   *    terms of the former. You can also implement both to optimize performance.
   *    For more info, see {@link Iterator} and {@link AsyncSequence}.
   *
   * As a trivial example, the following code defines a new type of sequence
   * called `SampleSequence` which randomly may or may not include each element
   * from its parent.
   *
   *     var SampleSequence = Lazy.Sequence.define("sample", {
   *       each: function(fn) {
   *         return this.parent.each(function(e) {
   *           // 50/50 chance of including this element.
   *           if (Math.random() > 0.5) {
   *             return fn(e);
   *           }
   *         });
   *       }
   *     });
   *
   * (Of course, the above could also easily have been implemented using
   * {@link #filter} instead of creating a custom sequence. But I *did* say this
   * was a trivial example, to be fair.)
   *
   * Now it will be possible to create this type of sequence from any parent
   * sequence by calling the method name you specified. In other words, you can
   * now do this:
   *
   *     Lazy(arr).sample();
   *     Lazy(arr).map(func).sample();
   *     Lazy(arr).map(func).filter(pred).sample();
   *
   * Etc., etc.
   *
   * Note: The reason the `init` function needs to accept a `parent` parameter as
   * its first argument (as opposed to Lazy handling that by default) has to do
   * with performance, which is a top priority for this library. While the logic
   * to do this automatically is possible to implement, it is not as efficient as
   * requiring custom sequence types to do it themselves.
   *
   * @constructor
   */
  function Sequence() {}

  /**
   * Create a new constructor function for a type inheriting from `Sequence`.
   *
   * @param {string|Array.<string>} methodName The name(s) of the method(s) to be
   *     used for constructing the new sequence. The method will be attached to
   *     the `Sequence` prototype so that it can be chained with any other
   *     sequence methods, like {@link #map}, {@link #filter}, etc.
   * @param {Object} overrides An object containing function overrides for this
   *     new sequence type.
   * @returns {Function} A constructor for a new type inheriting from `Sequence`.
   *
   * @example
   * // This sequence type logs every element to the console
   * // as it iterates over it.
   * var VerboseSequence = Sequence.define("verbose", {
   *   each: function(fn) {
   *     return this.parent.each(function(e, i) {
   *       console.log(e);
   *       return fn(e, i);
   *     });
   *   }
   * });
   *
   * Lazy([1, 2, 3]).verbose().toArray();
   * // (logs the numbers 1, 2, and 3 to the console)
   */
  Sequence.define = function(methodName, overrides) {
    if (!overrides || (!overrides.getIterator && !overrides.each)) {
      throw "A custom sequence must implement *at least* getIterator or each!";
    }

    // Define a constructor that sets this sequence's parent to the first argument
    // and (optionally) applies any additional initialization logic.

    /** @constructor */
    var init = overrides.init;
    var ctor = init ? function(var_args) {
                        this.parent = arguments[0];
                        init.apply(this, arguments);
                      } :
                      function(var_args) {
                        this.parent = arguments[0];
                      };

    // Make this type inherit from Sequence.
    ctor.prototype = new Sequence();

    // Attach overrides to the new Sequence type's prototype.
    delete overrides.init;
    for (var name in overrides) {
      ctor.prototype[name] = overrides[name];
    }

    // Expose the constructor as a chainable method so that we can do:
    // Lazy(...).map(...).filter(...).blah(...);
    var factory = (function() {
      /**
       * @skip
       * @suppress {checkTypes}
       */
      switch ((init && init.length) || 0) {
        case 0:
          return function() {
            return new ctor(this);
          };

        case 1:
          return function(arg1) {
            return new ctor(this, arg1);
          };

        case 2:
          return function(arg1, arg2) {
            return new ctor(this, arg1, arg2);
          };

        case 3:
          return function(arg1, arg2, arg3) {
            return new ctor(this, arg1, arg2, arg3);
          };

        default:
          throw 'Really need more than three arguments? https://github.com/dtao/lazy.js/issues/new';
      }
    }());

    var methodNames = typeof methodName === 'string' ? [methodName] : methodName;
    for (var i = 0; i < methodNames.length; ++i) {
      Sequence.prototype[methodNames[i]] = factory;
    }

    return ctor;
  };

  /**
   * Creates an {@link Iterator} object with two methods, `moveNext` -- returning
   * true or false -- and `current` -- returning the current value.
   *
   * This method is used when asynchronously iterating over sequences. Any type
   * inheriting from `Sequence` must implement this method or it can't support
   * asynchronous iteration.
   *
   * @returns {Iterator} An iterator object.
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
   * Creates an array snapshot of a sequence.
   *
   * Note that for indefinite sequences, this method may raise an exception or
   * (worse) cause the environment to hang.
   *
   * @returns {Array} An array containing the current contents of the sequence.
   *
   * @examples
   * Lazy([1, 2, 3]).toArray() // => [1, 2, 3]
   */
  Sequence.prototype.toArray = function() {
    var array = [];
    this.each(function(e) {
      array.push(e);
    });

    return array;
  };

  /**
   * Provides an indexed view into the sequence.
   *
   * For sequences that are already indexed, this will simply return the
   * sequence. For non-indexed sequences, this will eagerly evaluate the
   * sequence and cache the result (so subsequent calls will not create
   * additional arrays).
   *
   * @returns {ArrayLikeSequence} A sequence containing the current contents of
   *     the sequence.
   */
  Sequence.prototype.getIndex = function() {
    if (!this.cachedIndex) {
      this.cachedIndex = new ArrayWrapper(this.toArray());
    }
    return this.cachedIndex;
  };

  /**
   * Creates an object from a sequence of key/value pairs.
   *
   * @returns {Object} An object with keys and values corresponding to the pairs
   *     of elements in the sequence.
   *
   * @examples
   * var details = [
   *   ["first", "Dan"],
   *   ["last", "Tao"],
   *   ["age", 29]
   * ];
   *
   * Lazy(details).toObject() // => { first: "Dan", last: "Tao", age: 29 }
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
   * @examples
   * Lazy(['fizz', 'buzz']).each(function(str) { console.log(str); });
   */
  Sequence.prototype.each = function(fn) {
    var iterator = this.getIterator(),
        i = -1;

    while (iterator.moveNext()) {
      if (fn(iterator.current(), ++i) === false) {
        return false;
      }
    }

    return true;
  };

  /**
   * Alias for {@link Sequence#each}.
   */
  Sequence.prototype.forEach = function(fn) {
    return this.each(fn);
  };

  /**
   * Creates a new sequence whose values are calculated by passing this sequence's
   * elements through some mapping function.
   *
   * @function map
   * @memberOf Sequence
   * @instance
   * @aka collect
   *
   * @param {Function} mapFn The mapping function used to project this sequence's
   *     elements onto a new sequence.
   * @returns {Sequence} The new sequence.
   *
   * @examples
   * function increment(x) { return x + 1; }
   *
   * Lazy([]).map(increment)        // => []
   * Lazy([1, 2, 3]).map(increment) // => [2, 3, 4]
   *
   * @benchmarks
   * function increment(x) { return x + 1; }
   *
   * var smArr = Lazy.range(10).toArray(),
   *     lgArr = Lazy.range(100).toArray();
   *
   * Lazy(smArr).map(increment).each(Lazy.noop) // lazy - 10 elements
   * Lazy(lgArr).map(increment).each(Lazy.noop) // lazy - 100 elements
   * _.each(_.map(smArr, increment), Lazy.noop) // lodash - 10 elements
   * _.each(_.map(lgArr, increment), Lazy.noop) // lodash - 100 elements
   */
  Sequence.prototype.map = function(mapFn) {
    if (typeof mapFn === "string") {
      return this.pluck(mapFn);
    }

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
   * @returns {Sequence} The new sequence.
   *
   * @examples
   * var people = [
   *   { first: "Dan", last: "Tao" },
   *   { first: "Bob", last: "Smith" }
   * ];
   *
   * Lazy(people).pluck("last") // => ["Tao", "Smith"]
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
   * @returns {Sequence} The new sequence.
   *
   * @examples
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
   * Lazy(people).invoke("fullName") // => ["Dan Tao", "Bob Smith"]
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
   * @function filter
   * @memberOf Sequence
   * @instance
   * @aka select
   *
   * @param {Function} filterFn The predicate to call on each element in this
   *     sequence, which returns true if the element should be included.
   * @returns {Sequence} The new sequence.
   *
   * @examples
   * function isEven(x) { return x % 2 === 0; }
   *
   * var numbers = [1, 2, 3, 4, 5, 6];
   *
   * Lazy(numbers).select(isEven) // => [2, 4, 6]
   *
   * @benchmarks
   * function isEven(x) { return x % 2 === 0; }
   *
   * var smArr = Lazy.range(10).toArray(),
   *     lgArr = Lazy.range(100).toArray();
   *
   * Lazy(smArr).select(isEven).each(Lazy.noop) // lazy - 10 elements
   * Lazy(lgArr).select(isEven).each(Lazy.noop) // lazy - 100 elements
   * _.each(_.select(smArr, isEven), Lazy.noop) // lodash - 10 elements
   * _.each(_.select(lgArr, isEven), Lazy.noop) // lodash - 100 elements
   */
  Sequence.prototype.select = function(filterFn) {
    return new FilteredSequence(this, createCallback(filterFn));
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
   * @returns {Sequence} The new sequence.
   *
   * @examples
   * function isEven(x) { return x % 2 === 0; }
   *
   * Lazy([1, 2, 3, 4, 5]).reject(isEven) // => [1, 3, 5]
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
   * @returns {Sequence} The new sequence.
   *
   * @examples
   * var people = [
   *   { first: "Dan", last: "Tao" },
   *   { first: "Bob", last: "Smith" }
   * ];
   *
   * Lazy(people).where({ first: "Dan" }) // => [{ first: "Dan", last: "Tao" }]
   *
   * @benchmarks
   * var animals = ["dog", "cat", "mouse", "horse", "pig", "snake"];
   *
   * Lazy(animals).where({ length: 3 }).each(Lazy.noop) // lazy
   * _.each(_.where(animals, { length: 3 }), Lazy.noop) // lodash
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
   * @returns {Sequence} The new sequence.
   *
   * @examples
   * Lazy([1, 2, 3]).reverse() // => [3, 2, 1]
   * Lazy("abcdefg").reverse() // => "gfedcba".split("")
   * Lazy([]).reverse()        // => []
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
   * @returns {Sequence} The new sequence.
   *
   * @examples
   * var left  = [1, 2, 3];
   * var right = [4, 5, 6];
   *
   * Lazy(left).concat(right)  // => [1, 2, 3, 4, 5, 6]
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
   * @returns {*} The new sequence (or the first element from this sequence if
   *     no count was given).
   *
   * @examples
   * function powerOfTwo(exp) {
   *   return Math.pow(2, exp);
   * }
   *
   * Lazy.generate(powerOfTwo).first()          // => 1
   * Lazy.generate(powerOfTwo).first(5)         // => [1, 2, 4, 8, 16]
   * Lazy.generate(powerOfTwo).skip(2).first()  // => 4
   * Lazy.generate(powerOfTwo).skip(2).first(2) // => [4, 8]
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
   * Creates a new sequence comprising the elements from the head of this sequence
   * that satisfy some predicate. Once an element is encountered that doesn't
   * satisfy the predicate, iteration will stop.
   *
   * @param {Function} predicate
   * @returns {Sequence} The new sequence
   *
   * @examples
   * function lessThan(x) {
   *   return function(y) {
   *     return y < x;
   *   };
   * }
   *
   * Lazy([1, 2, 3, 4]).takeWhile(lessThan(3)) // => [1, 2]
   * Lazy([1, 2, 3, 4]).takeWhile(lessThan(0)) // => []
   */
  Sequence.prototype.takeWhile = function(predicate) {
    return new TakeWhileSequence(this, predicate);
  };

  /**
   * Creates a new sequence comprising all but the last N elements of this
   * sequence.
   *
   * @param {number=} count The number of items to omit from the end of the
   *     sequence (defaults to 1).
   * @returns {Sequence} The new sequence.
   *
   * @examples
   * Lazy([1, 2, 3, 4]).initial()  // => [1, 2, 3]
   * Lazy([1, 2, 3, 4]).initial(2) // => [1, 2]
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
   * @returns {*} The new sequence (or the last element from this sequence
   *     if no count was given).
   *
   * @examples
   * Lazy([1, 2, 3]).last()  // => 3
   * Lazy([1, 2, 3]).last(2) // => [2, 3]
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
   * @returns {*} The found element, or `undefined` if none exists in this
   *     sequence.
   *
   * @examples
   * var words = ["foo", "bar"];
   *
   * Lazy(words).findWhere({ 0: "f" }); // => "foo"
   * Lazy(words).findWhere({ 0: "z" }); // => undefined
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
   * @returns {Sequence} The new sequence.
   *
   * @examples
   * Lazy([1, 2, 3, 4]).drop()  // => [2, 3, 4]
   * Lazy([1, 2, 3, 4]).drop(0) // => [1, 2, 3, 4]
   * Lazy([1, 2, 3, 4]).drop(2) // => [3, 4]
   * Lazy([1, 2, 3, 4]).drop(5) // => []
   */
  Sequence.prototype.drop = function(count) {
    return new DropSequence(this, count);
  };

  /**
   * Alias for {@link Sequence#drop}.
   *
   * @function skip
   * @memberOf Sequence
   * @instance
   */
  Sequence.prototype.skip = Sequence.prototype.drop;

  /**
   * Alias for {@link Sequence#drop}.
   *
   * @function tail
   * @memberOf Sequence
   * @instance
   */
  Sequence.prototype.tail = Sequence.prototype.drop;

  /**
   * Alias for {@link Sequence#drop}.
   *
   * @function rest
   * @memberOf Sequence
   * @instance
   */
  Sequence.prototype.rest = Sequence.prototype.drop;

  /**
   * Creates a new sequence comprising the elements from this sequence *after*
   * those that satisfy some predicate. The sequence starts with the first
   * element that does not match the predicate.
   *
   * @param {Function} predicate
   * @returns {Sequence} The new sequence
   */
  Sequence.prototype.dropWhile = Sequence.prototype.skipWhile = function(predicate) {
    return new DropWhileSequence(this, predicate);
  };

  /**
   * Creates a new sequence with the same elements as this one, but ordered
   * according to the values returned by the specified function.
   *
   * @param {Function} sortFn The function to call on the elements in this
   *     sequence, in order to sort them.
   * @returns {Sequence} The new sequence.
   *
   * @examples
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
   * Lazy(countries).sortBy(population).last(3).pluck('name') // => ["Brazil", "USA", "China"]
   * Lazy(countries).sortBy(area).last(3).pluck('name')       // => ["USA", "China", "Russia"]
   *
   * @benchmarks
   * var randoms = Lazy.generate(Math.random).take(100).toArray();
   *
   * Lazy(randoms).sortBy(Lazy.identity).each(Lazy.noop) // lazy
   * _.each(_.sortBy(randoms, Lazy.identity), Lazy.noop) // lodash
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
   * @param {Function|string} keyFn The function to call on the elements in this
   *     sequence to obtain a key by which to group them, or a string representing
   *     a parameter to read from all the elements in this sequence.
   * @returns {Sequence} The new sequence.
   *
   * @examples
   * function oddOrEven(x) {
   *   return x % 2 === 0 ? 'even' : 'odd';
   * }
   *
   * var numbers = [1, 2, 3, 4, 5];
   *
   * Lazy(numbers).groupBy(oddOrEven) // => [["odd", [1, 3, 5]], ["even", [2, 4]]]
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
   * @returns {Sequence} The new sequence.
   *
   * @examples
   * function oddOrEven(x) {
   *   return x % 2 === 0 ? 'even' : 'odd';
   * }
   *
   * var numbers = [1, 2, 3, 4, 5];
   *
   * Lazy(numbers).countBy(oddOrEven) // => [["odd", 3], ["even", 2]]
   */
  Sequence.prototype.countBy = function(keyFn) {
    return new CountedSequence(this, keyFn);
  };

  /**
   * Creates a new sequence with every unique element from this one appearing
   * exactly once (i.e., with duplicates removed).
   *
   * @returns {Sequence} The new sequence.
   *
   * @examples
   * Lazy([1, 2, 2, 3, 3, 3]).uniq() // => [1, 2, 3]
   *
   * @benchmarks
   * function randomOf(array) {
   *   return function() {
   *     return array[Math.floor(Math.random() * array.length)];
   *   };
   * }
   *
   * var mostUnique = Lazy.generate(randomOf(_.range(100)), 100).toArray(),
   *     someUnique = Lazy.generate(randomOf(_.range(50)), 100).toArray(),
   *     mostDupes  = Lazy.generate(randomOf(_.range(5)), 100).toArray();
   *
   * Lazy(mostUnique).uniq().each(Lazy.noop) // lazy - mostly unique elements
   * Lazy(someUnique).uniq().each(Lazy.noop) // lazy - some unique elements
   * Lazy(mostDupes).uniq().each(Lazy.noop)  // lazy - mostly duplicate elements
   * _.each(_.uniq(mostUnique), Lazy.noop)   // lodash - mostly unique elements
   * _.each(_.uniq(someUnique), Lazy.noop)   // lodash - some unique elements
   * _.each(_.uniq(mostDupes), Lazy.noop)    // lodash - mostly duplicate elements
   */
  Sequence.prototype.uniq = function(keyFn) {
    return new UniqueSequence(this, createCallback(keyFn));
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
   * @returns {Sequence} The new sequence.
   *
   * @examples
   * Lazy([1, 2]).zip([3, 4]) // => [[1, 3], [2, 4]]
   *
   * @benchmarks
   * var smArrL = Lazy.range(10).toArray(),
   *     smArrR = Lazy.range(10, 20).toArray(),
   *     lgArrL = Lazy.range(100).toArray(),
   *     lgArrR = Lazy.range(100, 200).toArray();
   *
   * Lazy(smArrL).zip(smArrR).each(Lazy.noop) // lazy - zipping 10-element arrays
   * Lazy(lgArrL).zip(lgArrR).each(Lazy.noop) // lazy - zipping 100-element arrays
   * _.each(_.zip(smArrL, smArrR), Lazy.noop) // lodash - zipping 10-element arrays
   * _.each(_.zip(lgArrL, lgArrR), Lazy.noop) // lodash - zipping 100-element arrays
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
   * @returns {Sequence} The new sequence.
   *
   * @examples
   * Lazy([1, 2, 3, 4, 5]).shuffle() // the values [1, 2, 3, 4, 5] in any order
   */
  Sequence.prototype.shuffle = function() {
    return new ShuffledSequence(this);
  };

  /**
   * Creates a new sequence with every element from this sequence, and with arrays
   * exploded so that a sequence of arrays (of arrays) becomes a flat sequence of
   * values.
   *
   * @returns {Sequence} The new sequence.
   *
   * @examples
   * Lazy([1, [2, 3], [4, [5]]]).flatten() // => [1, 2, 3, 4, 5]
   */
  Sequence.prototype.flatten = function() {
    return new FlattenedSequence(this);
  };

  /**
   * Creates a new sequence with the same elements as this one, except for all
   * falsy values (`false`, `0`, `""`, `null`, and `undefined`).
   *
   * @returns {Sequence} The new sequence.
   *
   * @examples
   * Lazy(["foo", null, "bar", undefined]).compact() // => ["foo", "bar"]
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
   * @returns {Sequence} The new sequence.
   *
   * @examples
   * Lazy([1, 2, 3, 4, 5]).without(2, 3)   // => [1, 4, 5]
   * Lazy([1, 2, 3, 4, 5]).without([4, 5]) // => [1, 2, 3]
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
   * @returns {Sequence} The new sequence.
   *
   * @examples
   * Lazy(["foo", "bar"]).union([])             // => ["foo", "bar"]
   * Lazy(["foo", "bar"]).union(["bar", "baz"]) // => ["foo", "bar", "baz"]
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
   * @returns {Sequence} The new sequence.
   *
   * @examples
   * Lazy(["foo", "bar"]).intersection([])             // => []
   * Lazy(["foo", "bar"]).intersection(["bar", "baz"]) // => ["bar"]
   */
  Sequence.prototype.intersection = function(var_args) {
    if (arguments.length === 1 && arguments[0] instanceof Array) {
      return new SimpleIntersectionSequence(this, (/** @type {Array} */ var_args));
    } else {
      return new IntersectionSequence(this, Array.prototype.slice.call(arguments, 0));
    }
  };

  /**
   * Checks whether every element in this sequence satisfies a given predicate.
   *
   * @param {Function} predicate A function to call on (potentially) every element
   *     in this sequence.
   * @returns {boolean} True if `predicate` returns true for every element in the
   *     sequence (or the sequence is empty). False if `predicate` returns false
   *     for at least one element.
   *
   * @examples
   * function isEven(x) { return x % 2 === 0; }
   * function isPositive(x) { return x > 0; }
   *
   * var numbers = [1, 2, 3, 4, 5];
   *
   * Lazy(numbers).every(isEven)     // => false
   * Lazy(numbers).every(isPositive) // => true
   */
  Sequence.prototype.every = function(predicate) {
    var success = true;
    this.each(function(e, i) {
      if (!predicate(e, i)) {
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
   * @returns {boolean} True if `predicate` returns true for at least one element
   *     in the sequence. False if `predicate` returns false for every element (or
   *     the sequence is empty).
   *
   * @examples
   * function isEven(x) { return x % 2 === 0; }
   * function isNegative(x) { return x < 0; }
   *
   * var numbers = [1, 2, 3, 4, 5];
   *
   * Lazy(numbers).some(isEven)     // => true
   * Lazy(numbers).some(isNegative) // => false
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
   * @returns {boolean} True if the sequence is empty, false if it contains at
   *     least one element.
   *
   * @examples
   * Lazy([]).isEmpty()        // => true
   * Lazy([1, 2, 3]).isEmpty() // => false
   */
  Sequence.prototype.isEmpty = function() {
    return !this.any();
  };

  /**
   * Performs (at worst) a linear search from the head of this sequence,
   * returning the first index at which the specified value is found.
   *
   * @param {*} value The element to search for in the sequence.
   * @returns {number} The index within this sequence where the given value is
   *     located, or -1 if the sequence doesn't contain the value.
   *
   * @examples
   * function reciprocal(x) { return 1 / x; }
   *
   * Lazy(["foo", "bar", "baz"]).indexOf("bar")   // => 1
   * Lazy([1, 2, 3]).indexOf(4)                   // => -1
   * Lazy([1, 2, 3]).map(reciprocal).indexOf(0.5) // => 1
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
   * @returns {number} The last index within this sequence where the given value
   *     is located, or -1 if the sequence doesn't contain the value.
   *
   * @examples
   * Lazy(["a", "b", "c", "b", "a"]).lastIndexOf("b") // => 3
   * Lazy([1, 2, 3]).lastIndexOf(0)                   // => -1
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
   * @returns {number} An index within this sequence where the given value is
   *     located, or where it belongs in sorted order.
   *
   * @examples
   * function isEven(x) { return x % 2 === 0; }
   *
   * Lazy([1, 3, 6, 9]).sortedIndex(3)                    // => 1
   * Lazy([1, 3, 6, 9]).sortedIndex(7)                    // => 3
   * Lazy([5, 10, 15, 20]).filter(isEven).sortedIndex(10) // => 0
   * Lazy([5, 10, 15, 20]).filter(isEven).sortedIndex(12) // => 1
   */
  Sequence.prototype.sortedIndex = function(value) {
    var indexed = this.getIndex(),
        lower   = 0,
        upper   = indexed.length(),
        i;

    while (lower < upper) {
      i = (lower + upper) >>> 1;
      if (compare(indexed.get(i), value) === -1) {
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
   * @returns {boolean} True if the sequence contains the value, false if not.
   *
   * @examples
   * var numbers = [5, 10, 15, 20];
   *
   * Lazy(numbers).contains(15) // => true
   * Lazy(numbers).contains(13) // => false
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
   * @returns {*} The result of the aggregation.
   *
   * @examples
   * function multiply(x, y) { return x * y; }
   *
   * var numbers = [1, 2, 3, 4];
   *
   * Lazy(numbers).reduce(multiply)    // => 24
   * Lazy(numbers).reduce(multiply, 5) // => 120
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
   * @returns {*} The result of the aggregation.
   *
   * @examples
   * function append(s1, s2) {
   *   return s1 + s2;
   * }
   *
   * Lazy("abcde").reduceRight(append) // => "edcba"
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
   * @returns {*} The first element in the sequence for which `predicate` returns
   *     `true`, or `undefined` if no such element is found.
   *
   * @examples
   * function divisibleBy3(x) {
   *   return x % 3 === 0;
   * }
   *
   * function isNegative(x) {
   *   return x < 0;
   * }
   *
   * var numbers = [5, 6, 7, 8, 9, 10];
   *
   * Lazy(numbers).find(divisibleBy3) // => 6
   * Lazy(numbers).find(isNegative)   // => undefined
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
   * @param {Function=} valueFn The function by which the value for comparison is
   *     calculated for each element in the sequence.
   * @returns {*} The element with the lowest value in the sequence, or
   *     `Infinity` if the sequence is empty.
   *
   * @examples
   * function negate(x) { return x * -1; }
   *
   * Lazy([]).min()                       // => Infinity
   * Lazy([6, 18, 2, 49, 34]).min()       // => 2
   * Lazy([6, 18, 2, 49, 34]).min(negate) // => 49
   */
  Sequence.prototype.min = function(valueFn) {
    var leastValue = Infinity, least;

    if (typeof valueFn !== "undefined") {
      valueFn = createCallback(valueFn);

      this.each(function(e) {
        var value = valueFn(e);
        if (value < leastValue) {
          leastValue = value;
          least = e;
        }
      });

      return least;

    } else {
      this.each(function(e) {
        if (e < leastValue) {
          leastValue = e;
        }
      });

      return leastValue;
    }
  };

  /**
   * Gets the maximum value in the sequence.
   *
   * @param {Function=} valueFn The function by which the value for comparison is
   *     calculated for each element in the sequence.
   * @returns {*} The element with the highest value in the sequence, or
   *     `-Infinity` if the sequence is empty.
   *
   * @examples
   * function reverseDigits(x) {
   *   return Number(String(x).split('').reverse().join(''));
   * }
   *
   * Lazy([]).max()                              // => -Infinity
   * Lazy([6, 18, 2, 48, 29]).max()              // => 48
   * Lazy([6, 18, 2, 48, 29]).max(reverseDigits) // => 29
   */
  Sequence.prototype.max = function(valueFn) {
    var greatestValue = -Infinity, greatest;

    if (typeof valueFn !== "undefined") {
      valueFn = createCallback(valueFn);

      this.each(function(e) {
        var value = valueFn(e);
        if (value > greatestValue) {
          greatestValue = value;
          greatest = e;
        }
      });

      return greatest;

    } else {
      this.each(function(e) {
        if (e > greatestValue) {
          greatestValue = e;
        }
      });

      return greatestValue;
    }
  };

  /**
   * Gets the sum of the values in the sequence.
   *
   * @param {Function=} valueFn The function used to select the values that will
   *     be summed up.
   * @returns {*} The sum.
   *
   * @examples
   * Lazy([]).sum()           // => 0
   * Lazy([1, 2, 3, 4]).sum() // => 10
   */
  Sequence.prototype.sum = function(valueFn) {
    if (typeof valueFn !== "undefined") {
      valueFn = createCallback(valueFn);
      return this.reduce(function(sum, element) {
        return sum += valueFn(element);
      }, 0);

    } else {
      return this.reduce(function(sum, value) {
        return sum += value;
      }, 0);
    }
  };

  /**
   * Creates a string from joining together all of the elements in this sequence,
   * separated by the given delimiter.
   *
   * @param {string=} delimiter The separator to insert between every element from
   *     this sequence in the resulting string (defaults to `","`).
   * @returns {string} The delimited string.
   *
   * @examples
   * Lazy([6, 29, 1984]).join("/")  // => "6/29/1984"
   * Lazy(["a", "b", "c"]).join("") // => "abc"
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
   * Creates a sequence, with the same elements as this one, that will be iterated
   * over asynchronously when calling `each`.
   *
   * @param {number=} interval The approximate period, in milliseconds, that
   *     should elapse between each element in the resulting sequence. Omitting
   *     this argument will result in the fastest possible asynchronous iteration.
   * @returns {AsyncSequence} The new asynchronous sequence.
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
   * @constructor
   */
  function MappedSequence(parent, mapFn) {
    this.parent = parent;
    this.mapFn  = mapFn;
  }

  MappedSequence.prototype = new Sequence();

  MappedSequence.prototype.each = function(fn) {
    var mapFn = this.mapFn;
    return this.parent.each(function(e, i) {
      return fn(mapFn(e, i), i);
    });
  };

  /**
   * @constructor
   */
  function FilteredSequence(parent, filterFn) {
    this.parent   = parent;
    this.filterFn = filterFn;
  }

  FilteredSequence.prototype = new Sequence();

  FilteredSequence.prototype.getIterator = function() {
    return new FilteringIterator(this.parent, this.filterFn);
  };

  FilteredSequence.prototype.each = function(fn) {
    var filterFn = this.filterFn;

    return this.parent.each(function(e, i) {
      if (filterFn(e, i)) {
        return fn(e, i);
      }
    });
  };

  /**
   * @constructor
   */
  function ReversedSequence(parent) {
    this.parent = parent;
  }

  ReversedSequence.prototype = new Sequence();

  ReversedSequence.prototype.each = function(fn) {
    var indexed = this.parent.getIndex(),
        length  = indexed.length(),
        i       = 0;

    while (--length >= 0) {
      if (fn(indexed.get(length), i++) === false) {
        break;
      }
    }
  };

  /**
   * @constructor
   */
  function ConcatenatedSequence(parent, arrays) {
    this.parent = parent;
    this.arrays = arrays;
  }

  ConcatenatedSequence.prototype = new Sequence();

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

  /**
   * @constructor
   */
  function TakeSequence(parent, count) {
    this.parent = parent;
    this.count  = count;
  }

  TakeSequence.prototype = new Sequence();

  TakeSequence.prototype.each = function(fn) {
    var count = this.count,
        i     = 0;

    this.parent.each(function(e) {
      var result;
      if (i < count) { result = fn(e, i); }
      if (++i >= count) { return false; }
      return result;
    });
  };

  /**
   * @constructor
   */
  function TakeWhileSequence(parent, predicate) {
    this.parent    = parent;
    this.predicate = predicate;
  }

  TakeWhileSequence.prototype = new Sequence();

  TakeWhileSequence.prototype.each = function(fn) {
    var predicate = this.predicate;

    this.parent.each(function(e) {
      return predicate(e) && fn(e);
    });
  };

  /**
   * @constructor
   */
  function DropSequence(parent, count) {
    this.parent = parent;
    this.count  = typeof count === "number" ? count : 1;
  }

  DropSequence.prototype = new Sequence();

  DropSequence.prototype.each = function(fn) {
    var count = this.count,
        i     = 0;

    this.parent.each(function(e) {
      if (i++ < count) { return; }
      return fn(e, i - count);
    });
  };

  /**
   * @constructor
   */
  function DropWhileSequence(parent, predicate) {
    this.parent    = parent;
    this.predicate = predicate;
  }

  DropWhileSequence.prototype = new Sequence();

  DropWhileSequence.prototype.each = function(fn) {
    var predicate = this.predicate,
        done      = false;

    this.parent.each(function(e) {
      if (!done) {
        if (predicate(e)) {
          return;
        }

        done = true;
      }

      return fn(e);
    });
  };

  /**
   * @constructor
   */
  function SortedSequence(parent, sortFn) {
    this.parent = parent;
    this.sortFn = sortFn;
  }

  SortedSequence.prototype = new Sequence();

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

  /**
   * @constructor
   */
  function ShuffledSequence(parent) {
    this.parent = parent;
  }

  ShuffledSequence.prototype = new Sequence();

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

  /**
   * @constructor
   */
  function GroupedSequence(parent, keyFn) {
    this.parent = parent;
    this.keyFn  = createCallback(keyFn);
  }

  GroupedSequence.prototype = new Sequence();

  GroupedSequence.prototype.each = function(fn) {
    var keyFn   = this.keyFn,
        grouped = {};

    this.parent.each(function(e) {
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

  /**
   * @constructor
   */
  function CountedSequence(parent, keyFn) {
    this.parent = parent;
    this.keyFn  = createCallback(keyFn);
  }

  CountedSequence.prototype = new Sequence();

  CountedSequence.prototype.each = function(fn) {
    var keyFn   = this.keyFn,
        counted = {};

    this.parent.each(function(e) {
      var key = keyFn(e);
      if (!counted[key]) {
        counted[key] = 1;
      } else {
        counted[key] += 1;
      }
    });
    for (var key in counted) {
      fn([key, counted[key]]);
    }
  };

  /**
   * @constructor
   */
  function UniqueSequence(parent, keyFn) {
    this.parent = parent;
    this.keyFn  = keyFn;
  }

  UniqueSequence.prototype = new Sequence();

  UniqueSequence.prototype.each = function(fn) {
    var cache = new Set(),
        keyFn = this.keyFn,
        i     = 0;

    this.parent.each(function(e) {
      if (cache.add(keyFn(e))) {
        return fn(e, i++);
      }
    });
  };

  /**
   * @constructor
   */
  function FlattenedSequence(parent) {
    this.parent = parent;
  }

  FlattenedSequence.prototype = new Sequence();

  FlattenedSequence.prototype.each = function(fn) {
    var index = 0,
        done  = false;

    var recurseVisitor = function(e) {
      if (done) {
        return false;
      }

      if (e instanceof Sequence) {
        e.each(function(seq) {
          if (recurseVisitor(seq) === false) {
            done = true;
            return false;
          }
        });

      } else if (e instanceof Array) {
        return forEach(e, recurseVisitor);

      } else {
        return fn(e, index++);
      }
    };

    this.parent.each(recurseVisitor);
  };

  /**
   * @constructor
   */
  function WithoutSequence(parent, values) {
    this.parent = parent;
    this.values = values;
  }

  WithoutSequence.prototype = new Sequence();

  WithoutSequence.prototype.each = function(fn) {
    var set = createSet(this.values),
        i = 0;
    this.parent.each(function(e) {
      if (!set.contains(e)) {
        return fn(e, i++);
      }
    });
  };

  /**
   * @constructor
   */
  function SimpleIntersectionSequence(parent, array) {
    this.parent = parent;
    this.array  = array;
    this.each   = getEachForIntersection(array);
  }

  SimpleIntersectionSequence.prototype = new Sequence();

  SimpleIntersectionSequence.prototype.eachMemoizerCache = function(fn) {
    var iterator = new UniqueMemoizer(Lazy(this.array).getIterator()),
        i = 0;

    this.parent.each(function(e) {
      if (iterator.contains(e)) {
        return fn(e, i++);
      }
    });
  };

  SimpleIntersectionSequence.prototype.eachArrayCache = function(fn) {
    var array = this.array,
        find  = contains,
        i = 0;

    this.parent.each(function(e) {
      if (find(array, e)) {
        return fn(e, i++);
      }
    });
  };

  function getEachForIntersection(source) {
    if (source.length < 40) {
      return SimpleIntersectionSequence.prototype.eachArrayCache;
    } else {
      return SimpleIntersectionSequence.prototype.eachMemoizerCache;
    }
  }

  /**
   * @constructor
   */
  function IntersectionSequence(parent, arrays) {
    this.parent = parent;
    this.arrays = arrays;
  }

  IntersectionSequence.prototype = new Sequence();

  IntersectionSequence.prototype.each = function(fn) {
    var sets = Lazy(this.arrays).map(function(values) {
      return new UniqueMemoizer(Lazy(values).getIterator());
    });

    var setIterator = new UniqueMemoizer(sets.getIterator()),
        i = 0;

    this.parent.each(function(e) {
      var includedInAll = true;
      setIterator.each(function(set) {
        if (!set.contains(e)) {
          includedInAll = false;
          return false;
        }
      });

      if (includedInAll) {
        return fn(e, i++);
      }
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

  /**
   * @constructor
   */
  function ZippedSequence(parent, arrays) {
    this.parent = parent;
    this.arrays = arrays;
  }

  ZippedSequence.prototype = new Sequence();

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

  /**
   * The Iterator object provides an API for iterating over a sequence.
   *
   * @param {Sequence} sequence The sequence to iterate over.
   * @constructor
   */
  function Iterator(sequence) {
    this.sequence = sequence;
    this.index    = -1;
  }

  /**
   * Gets the current item this iterator is pointing to.
   *
   * @returns {*} The current item.
   */
  Iterator.prototype.current = function() {
    return this.cachedIndex && this.cachedIndex.get(this.index);
  };

  /**
   * Moves the iterator to the next item in a sequence, if possible.
   *
   * @returns {boolean} True if the iterator is able to move to a new item, or else
   *     false.
   */
  Iterator.prototype.moveNext = function() {
    var cachedIndex = this.cachedIndex;

    if (!cachedIndex) {
      cachedIndex = this.cachedIndex = this.sequence.getIndex();
    }

    if (this.index >= cachedIndex.length() - 1) {
      return false;
    }

    ++this.index;
    return true;
  };

  /**
   * An optimized version of {@link Iterator} meant to work with already-indexed
   * sequences.
   *
   * @param {ArrayLikeSequence} sequence The sequence to iterate over.
   * @constructor
   */
  function IndexedIterator(sequence) {
    this.sequence = sequence;
    this.index    = -1;
  }

  IndexedIterator.prototype.current = function() {
    return this.sequence.get(this.index);
  };

  IndexedIterator.prototype.moveNext = function() {
    if (this.index >= this.sequence.length() - 1) {
      return false;
    }

    ++this.index;
    return true;
  };

  /**
   * @constructor
   */
  function FilteringIterator(sequence, filterFn) {
    this.iterator = sequence.getIterator();
    this.filterFn = filterFn;
  }

  FilteringIterator.prototype.current = function() {
    return this.value;
  };

  FilteringIterator.prototype.moveNext = function() {
    var iterator = this.iterator,
        filterFn = this.filterFn,
        value;

    while (iterator.moveNext()) {
      value = iterator.current();
      if (filterFn(value)) {
        this.value = value;
        return true;
      }
    }

    this.value = undefined;
    return false;
  };

  /**
   * @constructor
   * @param {string|StringLikeSequence} source
   */
  function CharIterator(source) {
    this.source = source;
    this.index = -1;
  }

  CharIterator.prototype.current = function() {
    return this.source.charAt(this.index);
  };

  CharIterator.prototype.moveNext = function() {
    return (++this.index < this.source.length);
  };

  /**
   * @constructor
   */
  function StringMatchIterator(source, pattern) {
    this.source = source;

    // clone the RegExp
    this.pattern = eval("" + pattern + (!pattern.global ? "g" : ""));
  }

  StringMatchIterator.prototype.current = function() {
    return this.match[0];
  };

  StringMatchIterator.prototype.moveNext = function() {
    return !!(this.match = this.pattern.exec(this.source));
  };

  /**
   * @constructor
   */
  function SplitWithRegExpIterator(source, pattern) {
    this.source = source;

    // clone the RegExp
    this.pattern = eval("" + pattern + (!pattern.global ? "g" : ""));
  }

  SplitWithRegExpIterator.prototype.current = function() {
    return this.source.substring(this.start, this.end);
  };

  SplitWithRegExpIterator.prototype.moveNext = function() {
    if (!this.pattern) {
      return false;
    }

    var match = this.pattern.exec(this.source);

    if (match) {
      this.start = this.nextStart ? this.nextStart : 0;
      this.end = match.index;
      this.nextStart = match.index + match[0].length;
      return true;

    } else if (this.pattern) {
      this.start = this.nextStart;
      this.end = undefined;
      this.nextStart = undefined;
      this.pattern = undefined;
      return true;
    }

    return false;
  };

  /**
   * @constructor
   */
  function SplitWithStringIterator(source, delimiter) {
    this.source = source;
    this.delimiter = delimiter;
  }

  SplitWithStringIterator.prototype.current = function() {
    return this.source.substring(this.leftIndex, this.rightIndex);
  };

  SplitWithStringIterator.prototype.moveNext = function() {
    if (!this.finished) {
      this.leftIndex = typeof this.leftIndex !== "undefined" ?
        this.rightIndex + this.delimiter.length :
        0;
      this.rightIndex = this.source.indexOf(this.delimiter, this.leftIndex);
    }

    if (this.rightIndex === -1) {
      this.finished = true;
      this.rightIndex = undefined;
      return true;
    }

    return !this.finished;
  };

  /**
   * @constructor
   */
  function UniqueMemoizer(iterator) {
    this.iterator     = iterator;
    this.set          = new Set();
    this.memo         = [];
    this.currentValue = undefined;
  }

  UniqueMemoizer.prototype.current = function() {
    return this.currentValue;
  };

  UniqueMemoizer.prototype.moveNext = function() {
    var iterator = this.iterator,
        set = this.set,
        memo = this.memo,
        current;

    while (iterator.moveNext()) {
      current = iterator.current();
      if (set.add(current)) {
        memo.push(current);
        this.currentValue = current;
        return true;
      }
    }
    return false;
  };

  UniqueMemoizer.prototype.each = function(fn) {
    var memo = this.memo,
        length = memo.length,
        i = -1;

    while (++i < length) {
      if (fn(memo[i], i) === false) {
        return false;
      }
    }

    while (this.moveNext()) {
      if (fn(this.currentValue, i++) === false) {
        break;
      }
    }
  };

  UniqueMemoizer.prototype.contains = function(e) {
    if (this.set.contains(e)) {
      return true;
    }

    while (this.moveNext()) {
      if (this.currentValue === e) {
        return true;
      }
    }

    return false;
  };

  /**
   * An `ArrayLikeSequence` is a {@link Sequence} that provides random access to
   * its elements. This extends the API for iterating with the additional methods
   * {@link #get} and {@link #length}, allowing a sequence to act as a "view" into
   * a collection or other indexed data source.
   *
   * Defining custom array-like sequences
   * ------------------------------------
   *
   * Creating a custom `ArrayLikeSequence` is essentially the same as creating a
   * custom {@link Sequence}. You just have a couple more methods you need to
   * implement: `get` and (optionally) `length`.
   *
   * Here's an example. Let's define a sequence type called `OffsetSequence` that
   * offsets each of its parent's elements by a set distance, and circles back to
   * the beginning after reaching the end. **Remember**: the initialization
   * function you pass to {@link #define} should always accept a `parent` as its
   * first parameter.
   *
   *     var OffsetSequence = ArrayLikeSequence.define("offset", function(parent, offset) {
   *       this.offset = offset;
   *     });
   *
   *     OffsetSequence.prototype.get = function(i) {
   *       return this.parent.get((i + this.offset) % this.parent.length());
   *     };
   *
   * It's worth noting a couple of things here.
   *
   * First, Lazy's default implementation of `length` simply returns the parent's
   * length. In this case, since an `OffsetSequence` will always have the same
   * number of elements as its parent, that implementation is fine; so we don't
   * need to override it.
   *
   * Second, the default implementation of `each` uses `get` and `length` to
   * essentially create a `for` loop, which is fine here. If you want to implement
   * `each` your own way, you can do that; but in most cases (as here), you can
   * probably just stick with the default.
   *
   * So we're already done, after only implementing `get`! Pretty slick, huh?
   *
   * Now the `offset` method will be chainable from any `ArrayLikeSequence`. So
   * for example:
   *
   *     Lazy([1, 2, 3]).map(trans).offset(3);
   *
   * ...will work, but:
   *
   *     Lazy([1, 2, 3]).filter(pred).offset(3);
   *
   * ...will not.
   *
   * (Also, as with the example provided for defining custom {@link Sequence}
   * types, this example really could have been implemented using a function
   * already available as part of Lazy.js: in this case, {@link Sequence#map}.)
   *
   * @constructor
   */
  function ArrayLikeSequence() {}

  ArrayLikeSequence.prototype = new Sequence();

  ArrayLikeSequence.define = function(methodName, init) {
    // Define a constructor that sets this sequence's parent to the first argument
    // and (optionally) applies any additional initialization logic.

    /** @constructor */
    var ctor = init ? function(var_args) {
                        this.parent = arguments[0];
                        init.apply(this, arguments);
                      } :
                      function(var_args) {
                        this.parent = arguments[0];
                      };

    // Make this type inherit from ArrayLikeSequence.
    ctor.prototype = new ArrayLikeSequence();

    // Expose the constructor as a chainable method so that we can do:
    // Lazy(...).map(...).blah(...);
    /** @skip
      * @suppress {checkTypes} */
    ArrayLikeSequence.prototype[methodName] = function(x, y, z) {
      return new ctor(this, x, y, z);
    };

    return ctor;
  };

  /**
   * Returns the element at the specified index.
   *
   * @param {number} i The index to access.
   * @returns {*} The element.
   *
   * @examples
   * function increment(x) { return x + 1; }
   *
   * Lazy([1, 2, 3]).get(1)                // => 2
   * Lazy([1, 2, 3]).get(-1)               // => undefined
   * Lazy([1, 2, 3]).map(increment).get(1) // => 3
   */
  ArrayLikeSequence.prototype.get = function(i) {
    return this.parent.get(i);
  };

  /**
   * Returns the length of the sequence.
   *
   * @returns {number} The length.
   *
   * @examples
   * function increment(x) { return x + 1; }
   *
   * Lazy([]).length()                       // => 0
   * Lazy([1, 2, 3]).length()                // => 3
   * Lazy([1, 2, 3]).map(increment).length() // => 3
   */
  ArrayLikeSequence.prototype.length = function() {
    return this.parent.length();
  };

  /**
   * Returns the current sequence (since it is already indexed).
   */
  ArrayLikeSequence.prototype.getIndex = function() {
    return this;
  };

  /**
   * An optimized version of {@link Sequence#getIterator}.
   */
  ArrayLikeSequence.prototype.getIterator = function() {
    return new IndexedIterator(this);
  };

  /**
   * An optimized version of {@link Sequence#each}.
   */
  ArrayLikeSequence.prototype.each = function(fn) {
    var length = this.length(),
        i = -1;
    while (++i < length) {
      if (fn(this.get(i), i) === false) {
        break;
      }
    }
  };

  /**
   * An optimized version of {@link Sequence#map}, which creates an
   * `ArrayLikeSequence` so that the result still provides random access.
   *
   * @returns {ArrayLikeSequence} The new array-like sequence.
   */
  ArrayLikeSequence.prototype.map = function(mapFn) {
    if (typeof mapFn === 'string') {
      return this.pluck(mapFn);
    }

    return new IndexedMappedSequence(this, mapFn);
  };

  ArrayLikeSequence.prototype.collect = ArrayLikeSequence.prototype.map;

  /**
   * An optimized version of {@link Sequence#select}.
   */
  ArrayLikeSequence.prototype.select = function(filterFn) {
    return new IndexedFilteredSequence(this, createCallback(filterFn));
  };

  ArrayLikeSequence.prototype.filter = ArrayLikeSequence.prototype.select;

  /**
   * An optimized version of {@link Sequence#reverse}, which creates an
   * `ArrayLikeSequence` so that the result still provides random access.
   */
  ArrayLikeSequence.prototype.reverse = function() {
    return new IndexedReversedSequence(this);
  };

  /**
   * An optimized version of {@link Sequence#first}, which creates an
   * `ArrayLikeSequence` so that the result still provides random access.
   *
   * @param {number=} count
   */
  ArrayLikeSequence.prototype.first = function(count) {
    if (typeof count === "undefined") {
      return this.get(0);
    }

    return new IndexedTakeSequence(this, count);
  };

  ArrayLikeSequence.prototype.head =
  ArrayLikeSequence.prototype.take =
  ArrayLikeSequence.prototype.first;

  /**
   * An optimized version of {@link Sequence#rest}, which creates an
   * `ArrayLikeSequence` so that the result still provides random access.
   *
   * @param {number=} count
   */
  ArrayLikeSequence.prototype.rest = function(count) {
    return new IndexedDropSequence(this, count);
  };

  ArrayLikeSequence.prototype.tail =
  ArrayLikeSequence.prototype.drop = ArrayLikeSequence.prototype.rest;

  /**
   * An optimized version of {@link Sequence#concat}.
   *
   * @param {...*} var_args
   */
  ArrayLikeSequence.prototype.concat = function(var_args) {
    if (arguments.length === 1 && arguments[0] instanceof Array) {
      return new IndexedConcatenatedSequence(this, (/** @type {Array} */ var_args));
    } else {
      return Sequence.prototype.concat.apply(this, arguments);
    }
  }

  /**
   * An optimized version of {@link Sequence#uniq}.
   */
  ArrayLikeSequence.prototype.uniq = function(keyFn) {
    return new IndexedUniqueSequence(this, createCallback(keyFn));
  };

  /**
   * @constructor
   */
  function IndexedMappedSequence(parent, mapFn) {
    this.parent = parent;
    this.mapFn  = mapFn;
  }

  IndexedMappedSequence.prototype = new ArrayLikeSequence();

  IndexedMappedSequence.prototype.get = function(i) {
    if (i < 0 || i >= this.parent.length()) {
      return undefined;
    }

    return this.mapFn(this.parent.get(i), i);
  };

  /**
   * @constructor
   */
  function IndexedFilteredSequence(parent, filterFn) {
    this.parent   = parent;
    this.filterFn = filterFn;
  }

  IndexedFilteredSequence.prototype = new FilteredSequence();

  IndexedFilteredSequence.prototype.each = function(fn) {
    var parent = this.parent,
        filterFn = this.filterFn,
        length = this.parent.length(),
        i = -1,
        e;

    while (++i < length) {
      e = parent.get(i);
      if (filterFn(e, i) && fn(e, i) === false) {
        break;
      }
    }
  };

  /**
   * @constructor
   */
  function IndexedReversedSequence(parent) {
    this.parent = parent;
  }

  IndexedReversedSequence.prototype = new ArrayLikeSequence();

  IndexedReversedSequence.prototype.get = function(i) {
    return this.parent.get(this.length() - i - 1);
  };

  /**
   * @constructor
   */
  function IndexedTakeSequence(parent, count) {
    this.parent = parent;
    this.count  = count;
  }

  IndexedTakeSequence.prototype = new ArrayLikeSequence();

  IndexedTakeSequence.prototype.length = function() {
    var parentLength = this.parent.length();
    return this.count <= parentLength ? this.count : parentLength;
  };

  /**
   * @constructor
   */
  function IndexedDropSequence(parent, count) {
    this.parent = parent;
    this.count  = typeof count === "number" ? count : 1;
  }

  IndexedDropSequence.prototype = new ArrayLikeSequence();

  IndexedDropSequence.prototype.get = function(i) {
    return this.parent.get(this.count + i);
  };

  IndexedDropSequence.prototype.length = function() {
    var parentLength = this.parent.length();
    return this.count <= parentLength ? parentLength - this.count : 0;
  };

  /**
   * @constructor
   */
  function IndexedConcatenatedSequence(parent, other) {
    this.parent = parent;
    this.other  = other;
  }

  IndexedConcatenatedSequence.prototype = new ArrayLikeSequence();

  IndexedConcatenatedSequence.prototype.get = function(i) {
    var parentLength = this.parent.length();
    if (i < parentLength) {
      return this.parent.get(i);
    } else {
      return this.other[i - parentLength];
    }
  };

  IndexedConcatenatedSequence.prototype.length = function() {
    return this.parent.length() + this.other.length;
  };

  /**
   * @param {ArrayLikeSequence} parent
   * @constructor
   */
  function IndexedUniqueSequence(parent, keyFn) {
    this.parent = parent;
    this.each   = getEachForParent(parent);
    this.keyFn  = keyFn;
  }

  IndexedUniqueSequence.prototype = new Sequence();

  IndexedUniqueSequence.prototype.eachArrayCache = function(fn) {
    // Basically the same implementation as w/ the set, but using an array because
    // it's cheaper for smaller sequences.
    var parent = this.parent,
        keyFn  = this.keyFn,
        length = parent.length(),
        cache  = [],
        find   = contains,
        key, value,
        i = -1,
        j = 0;

    while (++i < length) {
      value = parent.get(i);
      key = keyFn(value);
      if (!find(cache, key)) {
        cache.push(key);
        if (fn(value, j++) === false) {
          return false;
        }
      }
    }
  };

  IndexedUniqueSequence.prototype.eachSetCache = UniqueSequence.prototype.each;

  function getEachForParent(parent) {
    if (parent.length() < 100) {
      return IndexedUniqueSequence.prototype.eachArrayCache;
    } else {
      return UniqueSequence.prototype.each;
    }
  }

  /**
   * ArrayWrapper is the most basic {@link Sequence}. It directly wraps an array
   * and implements the same methods as {@link ArrayLikeSequence}, but more
   * efficiently.
   *
   * @constructor
   */
  function ArrayWrapper(source) {
    this.source = source;
  }

  ArrayWrapper.prototype = new ArrayLikeSequence();

  /**
   * Returns the element at the specified index in the source array.
   *
   * @param {number} i The index to access.
   * @returns {*} The element.
   */
  ArrayWrapper.prototype.get = function(i) {
    return this.source[i];
  };

  /**
   * Returns the length of the source array.
   *
   * @returns {number} The length.
   */
  ArrayWrapper.prototype.length = function() {
    return this.source.length;
  };

  /**
   * An optimized version of {@link Sequence#each}.
   */
  ArrayWrapper.prototype.each = function(fn) {
    var source = this.source,
        length = source.length,
        i = -1;

    while (++i < length) {
      if (fn(source[i], i) === false) {
        break;
      }
    }
  };

  /**
   * An optimized version of {@link Sequence#map}.
   */
  ArrayWrapper.prototype.map =
  ArrayWrapper.prototype.collect = function(mapFn) {
    if (typeof mapFn === 'string') {
      return this.pluck(mapFn);
    }

    return new MappedArrayWrapper(this.source, mapFn);
  };

  /**
   * An optimized version of {@link Sequence#filter}.
   */
  ArrayWrapper.prototype.filter =
  ArrayWrapper.prototype.select = function(filterFn) {
    return new FilteredArrayWrapper(this, createCallback(filterFn));
  };

  /**
   * An optimized version of {@link Sequence#uniq}.
   */
  ArrayWrapper.prototype.uniq =
  ArrayWrapper.prototype.unique = function(keyFn) {
    return new UniqueArrayWrapper(this, createCallback(keyFn));
  };

  /**
   * An optimized version of {@link ArrayLikeSequence#concat}.
   *
   * @param {...*} var_args
   */
  ArrayWrapper.prototype.concat = function(var_args) {
    if (arguments.length === 1 && arguments[0] instanceof Array) {
      return new ConcatArrayWrapper(this.source, (/** @type {Array} */ var_args));
    } else {
      return ArrayLikeSequence.prototype.concat.apply(this, arguments);
    }
  };

  /**
   * An optimized version of {@link Sequence#toArray}.
   */
  ArrayWrapper.prototype.toArray = function() {
    return this.source.slice(0);
  };

  /**
   * @constructor
   */
  function MappedArrayWrapper(source, mapFn) {
    this.source = source;
    this.mapFn  = mapFn;
  }

  MappedArrayWrapper.prototype = new ArrayLikeSequence();

  MappedArrayWrapper.prototype.get = function(i) {
    if (i < 0 || i >= this.source.length) {
      return undefined;
    }

    return this.mapFn(this.source[i]);
  };

  MappedArrayWrapper.prototype.length = function() {
    return this.source.length;
  };

  MappedArrayWrapper.prototype.each = function(fn) {
    var source = this.source,
        length = this.source.length,
        mapFn  = this.mapFn,
        i = -1;
    while (++i < length) {
      if (fn(mapFn(source[i], i), i) === false) {
        return;
      }
    }
  };

  /**
   * @constructor
   */
  function FilteredArrayWrapper(parent, filterFn) {
    this.parent   = parent;
    this.filterFn = filterFn;
  }

  FilteredArrayWrapper.prototype = new FilteredSequence();

  FilteredArrayWrapper.prototype.each = function(fn) {
    var source = this.parent.source,
        filterFn = this.filterFn,
        length = source.length,
        i = -1,
        e;

    while (++i < length) {
      e = source[i];
      if (filterFn(e, i) && fn(e, i) === false) {
        break;
      }
    }
  };

  /**
   * @constructor
   */
  function UniqueArrayWrapper(parent, keyFn) {
    this.parent = parent;
    this.each   = getEachForSource(parent.source);
    this.keyFn  = createCallback(keyFn);
  }

  UniqueArrayWrapper.prototype = new Sequence();

  UniqueArrayWrapper.prototype.eachNoCache = function(fn) {
    var source = this.parent.source,
        keyFn  = this.keyFn,
        length = source.length,
        find   = containsBefore,
        value,

        // Yes, this is hideous.
        // Trying to get performance first, will refactor next!
        i = -1,
        k = 0;

    while (++i < length) {
      value = source[i];
      if (!find(source, value, i, keyFn) && fn(value, k++) === false) {
        return false;
      }
    }
  };

  UniqueArrayWrapper.prototype.eachArrayCache = function(fn) {
    // Basically the same implementation as w/ the set, but using an array because
    // it's cheaper for smaller sequences.
    var source = this.parent.source,
        keyFn  = this.keyFn,
        length = source.length,
        cache  = [],
        find   = contains,
        key, value,
        i = -1,
        j = 0;

    while (++i < length) {
      value = source[i];
      key = keyFn(value);
      if (!find(cache, key)) {
        cache.push(key);
        if (fn(value, j++) === false) {
          return false;
        }
      }
    }
  };

  UniqueArrayWrapper.prototype.eachSetCache = UniqueSequence.prototype.each;

  /**
   * My latest findings here...
   *
   * So I hadn't really given the set-based approach enough credit. The main issue
   * was that my Set implementation was totally not optimized at all. After pretty
   * heavily optimizing it (just take a look; it's a monstrosity now!), it now
   * becomes the fastest option for much smaller values of N.
   */
  function getEachForSource(source) {
    if (source.length < 40) {
      return UniqueArrayWrapper.prototype.eachNoCache;
    } else if (source.length < 100) {
      return UniqueArrayWrapper.prototype.eachArrayCache;
    } else {
      return UniqueSequence.prototype.each;
    }
  }

  /**
   * @constructor
   */
  function ConcatArrayWrapper(source, other) {
    this.source = source;
    this.other  = other;
  }

  ConcatArrayWrapper.prototype = new ArrayLikeSequence();

  ConcatArrayWrapper.prototype.get = function(i) {
    var sourceLength = this.source.length;

    if (i < sourceLength) {
      return this.source[i];
    } else {
      return this.other[i - sourceLength];
    }
  };

  ConcatArrayWrapper.prototype.length = function() {
    return this.source.length + this.other.length;
  };

  ConcatArrayWrapper.prototype.each = function(fn) {
    var source = this.source,
        sourceLength = source.length,
        other = this.other,
        otherLength = other.length,
        i = 0,
        j = -1;

    while (++j < sourceLength) {
      if (fn(source[j], i++) === false) {
        return false;
      }
    }

    j = -1;
    while (++j < otherLength) {
      if (fn(other[j], i++) === false) {
        return false;
      }
    }
  };

  /**
   * An `ObjectLikeSequence` object represents a sequence of key/value pairs.
   *
   * So, this one is arguably the least... good... of the sequence types right
   * now. A bunch of methods are implemented already, and they basically "work";
   * but the problem is I haven't quite made up my mind exactly how they *should*
   * work, to be consistent and useful.
   *
   * Here are a couple of issues (there are others):
   *
   * 1. For iterating over an object, there is currently *not* a good way to do it
   *    asynchronously (that I know of). The best approach is to call
   *    `Object.keys` and then iterate over *those* asynchronously; but this of
   *    course eagerly iterates over the object's keys (though maybe that's not
   *    a really big deal).
   * 2. In terms of method chaining, it is a bit unclear how that should work.
   *    Iterating over an `ObjectLikeSequence` with {@link ObjectLikeSequence#each}
   *    passes `(value, key)` to the given function; but what about the result of
   *    {@link Sequence#map}, {@link Sequence#filter}, etc.? I've flip-flopped
   *    between thinking they should return object-like sequences or regular
   *    sequences.
   *
   * Expect this section to be updated for a coming version of Lazy.js, when I
   * will hopefully have figured this stuff out.
   *
   * @constructor
   */
  function ObjectLikeSequence() {}

  ObjectLikeSequence.prototype = new Sequence();

  /**
   * Gets the element at the specified key in this sequence.
   *
   * @param {string} key The key.
   * @returns {*} The element.
   *
   * @example
   * Lazy({ foo: "bar" }).get("foo");
   * // => "bar"
   */
  ObjectLikeSequence.prototype.get = function(key) {
    return this.parent.get(key);
  };

  /**
   * Returns a {@link Sequence} whose elements are the keys of this object-like
   * sequence.
   *
   * @returns {Sequence} The sequence based on this sequence's keys.
   *
   * @examples
   * Lazy({ hello: "hola", goodbye: "hasta luego" }).keys() // => ["hello", "goodbye"]
   */
  ObjectLikeSequence.prototype.keys = function() {
    return this.map(function(v, k) { return k; });
  };

  /**
   * Returns a {@link Sequence} whose elements are the values of this object-like
   * sequence.
   *
   * @returns {Sequence} The sequence based on this sequence's values.
   *
   * @examples
   * Lazy({ hello: "hola", goodbye: "hasta luego" }).values() // => ["hola", "hasta luego"]
   */
  ObjectLikeSequence.prototype.values = function() {
    return this.map(function(v, k) { return v; });
  };

  /**
   * Returns an `ObjectLikeSequence` whose elements are the combination of this
   * sequence and another object. In the case of a key appearing in both this
   * sequence and the given object, the other object's value will override the
   * one in this sequence.
   *
   * @param {Object} other The other object to assign to this sequence.
   * @returns {ObjectLikeSequence} A new sequence comprising elements from this
   *     sequence plus the contents of `other`.
   *
   * @examples
   * Lazy({ "uno": 1, "dos": 2 }).assign({ "tres": 3 }) // => { uno: 1, dos: 2, tres: 3 }
   * Lazy({ foo: "bar" }).assign({ foo: "baz" });       // => { foo: "baz" }
   */
  ObjectLikeSequence.prototype.assign = function(other) {
    return new AssignSequence(this, other);
  };

  /**
   * Alias for {@link ObjectLikeSequence#assign}.
   *
   * @function extend
   * @memberOf ObjectLikeSequence
   * @instance
   */
  ObjectLikeSequence.prototype.extend = ObjectLikeSequence.prototype.assign;

  /**
   * Returns an `ObjectLikeSequence` whose elements are the combination of this
   * sequence and a 'default' object. In the case of a key appearing in both this
   * sequence and the given object, this sequence's value will override the
   * default object's.
   *
   * @param {Object} defaults The 'default' object to use for missing keys in this
   *     sequence.
   * @returns {ObjectLikeSequence} A new sequence comprising elements from this
   *     sequence supplemented by the contents of `defaults`.
   *
   * @examples
   * Lazy({ name: "Dan" }).defaults({ name: "User", password: "passw0rd" }) // => { name: "Dan", password: "passw0rd" }
   */
  ObjectLikeSequence.prototype.defaults = function(defaults) {
    return new DefaultsSequence(this, defaults);
  };

  /**
   * Returns an `ObjectLikeSequence` whose values are this sequence's keys, and
   * whose keys are this sequence's values.
   *
   * @returns {ObjectLikeSequence} A new sequence comprising the inverted keys and
   *     values from this sequence.
   *
   * @examples
   * Lazy({ first: "Dan", last: "Tao" }).invert() // => { Dan: "first", Tao: "last" }
   */
  ObjectLikeSequence.prototype.invert = function() {
    return new InvertedSequence(this);
  };

  /**
   * Creates a {@link Sequence} consisting of the keys from this sequence whose
   *     values are functions.
   *
   * @returns {Sequence} The new sequence.
   *
   * @examples
   * var dog = {
   *   name: "Fido",
   *   breed: "Golden Retriever",
   *   bark: function() { console.log("Woof!"); },
   *   wagTail: function() { console.log("TODO: implement robotic dog interface"); }
   * };
   *
   * Lazy(dog).functions() // => ["bark", "wagTail"]
   */
  ObjectLikeSequence.prototype.functions = function() {
    return this
      .filter(function(v, k) { return typeof(v) === "function"; })
      .map(function(v, k) { return k; });
  };

  /**
   * Alias for {@link ObjectLikeSequence#functions}.
   *
   * @function methods
   * @memberOf ObjectLikeSequence
   * @instance
   */
  ObjectLikeSequence.prototype.methods = ObjectLikeSequence.prototype.functions;

  /**
   * Creates an `ObjectLikeSequence` consisting of the key/value pairs from this
   * sequence whose keys are included in the given array of property names.
   *
   * @param {Array} properties An array of the properties to "pick" from this
   *     sequence.
   * @returns {ObjectLikeSequence} The new sequence.
   *
   * @examples
   * var players = {
   *   "who": "first",
   *   "what": "second",
   *   "i don't know": "third"
   * };
   *
   * Lazy(players).pick(["who", "what"]) // => { who: "first", what: "second" }
   */
  ObjectLikeSequence.prototype.pick = function(properties) {
    return new PickSequence(this, properties);
  };

  /**
   * Creates an `ObjectLikeSequence` consisting of the key/value pairs from this
   * sequence excluding those with the specified keys.
   *
   * @param {Array} properties An array of the properties to *omit* from this
   *     sequence.
   * @returns {ObjectLikeSequence} The new sequence.
   *
   * @examples
   * var players = {
   *   "who": "first",
   *   "what": "second",
   *   "i don't know": "third"
   * };
   *
   * Lazy(players).omit(["who", "what"]) // => { "i don't know": "third" }
   */
  ObjectLikeSequence.prototype.omit = function(properties) {
    return new OmitSequence(this, properties);
  };

  /**
   * Creates an array from the key/value pairs in this sequence.
   *
   * @returns {Array} An array of `[key, value]` elements.
   *
   * @examples
   * var colorCodes = {
   *   red: "#f00",
   *   green: "#0f0",
   *   blue: "#00f"
   * };
   *
   * Lazy(colorCodes).toArray() // => [["red", "#f00"], ["green", "#0f0"], ["blue", "#00f"]]
   */
  ObjectLikeSequence.prototype.toArray = function() {
    return this.map(function(v, k) { return [k, v]; }).toArray();
  };

  /**
   * Alias for {@link ObjectLikeSequence#toArray}.
   *
   * @function pairs
   * @memberOf ObjectLikeSequence
   * @instance
   */
  ObjectLikeSequence.prototype.pairs = ObjectLikeSequence.prototype.toArray;

  /**
   * Creates an object with the key/value pairs from this sequence.
   *
   * @returns {Object} An object with the same key/value pairs as this sequence.
   *
   * @examples
   * var colorCodes = {
   *   red: "#f00",
   *   green: "#0f0",
   *   blue: "#00f"
   * };
   *
   * Lazy(colorCodes).toObject() // => { red: "#f00", green: "#0f0", blue: "#00f" }
   */
  ObjectLikeSequence.prototype.toObject = function() {
    return this.map(function(v, k) { return [k, v]; }).toObject();
  };

  /**
   * @constructor
   */
  function AssignSequence(parent, other) {
    this.parent = parent;
    this.other  = other;
  }

  AssignSequence.prototype = new ObjectLikeSequence();

  AssignSequence.prototype.each = function(fn) {
    var merged = new Set(),
        done   = false;

    Lazy(this.other).each(function(value, key) {
      if (fn(value, key) === false) {
        done = true;
        return false;
      }

      merged.add(key);
    });

    if (!done) {
      this.parent.each(function(value, key) {
        if (!merged.contains(key) && fn(value, key) === false) {
          return false;
        }
      });
    }
  };

  /**
   * @constructor
   */
  function DefaultsSequence(parent, defaults) {
    this.parent   = parent;
    this.defaults = defaults;
  }

  DefaultsSequence.prototype = new ObjectLikeSequence();

  DefaultsSequence.prototype.each = function(fn) {
    var merged = new Set(),
        done   = false;

    this.parent.each(function(value, key) {
      if (fn(value, key) === false) {
        done = true;
        return false;
      }

      if (typeof value !== "undefined") {
        merged.add(key);
      }
    });

    if (!done) {
      Lazy(this.defaults).each(function(value, key) {
        if (!merged.contains(key) && fn(value, key) === false) {
          return false;
        }
      });
    }
  };

  /**
   * @constructor
   */
  function InvertedSequence(parent) {
    this.parent = parent;
  }

  InvertedSequence.prototype = new ObjectLikeSequence();

  InvertedSequence.prototype.each = function(fn) {
    this.parent.each(function(value, key) {
      return fn(key, value);
    });
  };

  /**
   * @constructor
   */
  function PickSequence(parent, properties) {
    this.parent     = parent;
    this.properties = properties;
  }

  PickSequence.prototype = new ObjectLikeSequence();

  PickSequence.prototype.each = function(fn) {
    var inArray    = contains,
        properties = this.properties;

    this.parent.each(function(value, key) {
      if (inArray(properties, key)) {
        return fn(value, key);
      }
    });
  };

  /**
   * @constructor
   */
  function OmitSequence(parent, properties) {
    this.parent     = parent;
    this.properties = properties;
  }

  OmitSequence.prototype = new ObjectLikeSequence();

  OmitSequence.prototype.each = function(fn) {
    var inArray    = contains,
        properties = this.properties;

    this.parent.each(function(value, key) {
      if (!inArray(properties, key)) {
        return fn(value, key);
      }
    });
  };

  /**
   * @constructor
   */
  function ObjectWrapper(source) {
    this.source = source;
  }

  ObjectWrapper.prototype = new ObjectLikeSequence();

  ObjectWrapper.prototype.get = function(key) {
    return this.source[key];
  };

  ObjectWrapper.prototype.each = function(fn) {
    var source = this.source,
        key;

    for (key in source) {
      if (fn(source[key], key) === false) {
        return;
      }
    }
  };

  /**
   * A `StringLikeSequence` represents a sequence of characters.
   *
   * @constructor
   */
  function StringLikeSequence() {}

  StringLikeSequence.prototype = new ArrayLikeSequence();

  /**
   * Returns an {@link IndexedIterator} that will step over each character in this
   * sequence one by one.
   *
   * @returns {IndexedIterator} The iterator.
   */
  StringLikeSequence.prototype.getIterator = function() {
    return new CharIterator(this.source);
  };

  /**
   * Returns the character at the given index of this sequence, or the empty
   * string if the specified index lies outside the bounds of the sequence.
   *
   * @param {number} i The index of this sequence.
   * @returns {string} The character at the specified index.
   *
   * @examples
   * Lazy("foo").charAt(0)  // => "f"
   * Lazy("foo").charAt(-1) // => ""
   * Lazy("foo").charAt(10) // => ""
   */
  StringLikeSequence.prototype.charAt = function(i) {
    return this.get(i);
  };

  /**
   * Returns the character code at the given index of this sequence, or `NaN` if
   * the index lies outside the bounds of the sequence.
   *
   * @param {number} i The index of the character whose character code you want.
   * @returns {number} The character code.
   *
   * @examples
   * Lazy("abc").charCodeAt(0)  // => 97
   * Lazy("abc").charCodeAt(-1) // => NaN
   * Lazy("abc").charCodeAt(10) // => NaN
   */
  StringLikeSequence.prototype.charCodeAt = function(i) {
    var char = this.charAt(i);
    if (!char) { return NaN; }

    return char.charCodeAt(0);
  };

  /**
   * Returns a {@link StringLikeSequence} comprising the characters from *this*
   * sequence starting at `start` and ending at `stop` (exclusive), or---if
   * `stop` is `undefined`, including the rest of the sequence.
   *
   * @param {number} start The index where this sequence should begin.
   * @param {number=} stop The index (exclusive) where this sequence should end.
   * @returns {StringLikeSequence} The new sequence.
   *
   * @examples
   * Lazy("foo").substring(1)      // => "oo"
   * Lazy("foo").substring(-1)     // => "foo"
   * Lazy("hello").substring(1, 3) // => "el"
   * Lazy("hello").substring(1, 9) // => "ello"
   */
  StringLikeSequence.prototype.substring = function(start, stop) {
    return new StringSegment(this, start, stop);
  };

  StringLikeSequence.prototype.take = function(count) {
    return this.substring(0, count);
  };

  StringLikeSequence.prototype.head =
  StringLikeSequence.prototype.first =
  StringLikeSequence.prototype.take;

  StringLikeSequence.prototype.drop = function(count) {
    return this.substring(count);
  };

  StringLikeSequence.prototype.skip =
  StringLikeSequence.prototype.tail =
  StringLikeSequence.prototype.rest =
  StringLikeSequence.prototype.drop;

  /**
   * @constructor
   */
  function StringSegment(parent, start, stop) {
    this.parent = parent;
    this.start  = Math.max(0, start);
    this.stop   = stop;
  }

  StringSegment.prototype = new StringLikeSequence();

  StringSegment.prototype.get = function(i) {
    return this.parent.get(i + this.start);
  };

  StringSegment.prototype.length = function() {
    return (typeof this.stop === "number" ? this.stop : this.parent.length()) - this.start;
  };

  /**
   * Finds the index of the first occurrence of the given substring within this
   * sequence, starting from the specified index (or the beginning of the
   * sequence).
   *
   * @param {string} substring The substring to search for.
   * @param {number=} startIndex The index from which to start the search.
   * @returns {number} The first index where the given substring is found, or
   *     -1 if it isn't in the sequence.
   *
   * @examples
   * Lazy('canal').indexOf('a')    // => 1
   * Lazy('canal').indexOf('a', 2) // => 3
   * Lazy('canal').indexOf('ana')  // => 1
   * Lazy('canal').indexOf('andy') // => -1
   * Lazy('canal').indexOf('x')    // => -1
   */
  StringLikeSequence.prototype.indexOf = function(substring, startIndex) {
    return this.toString().indexOf(substring, startIndex);
  };

  /**
   * Finds the index of the last occurrence of the given substring within this
   * sequence, starting from the specified index (or the end of the sequence)
   * and working backwards.
   *
   * @param {string} substring The substring to search for.
   * @param {number=} startIndex The index from which to start the search.
   * @returns {number} The last index where the given substring is found, or
   *     -1 if it isn't in the sequence.
   *
   * @examples
   * Lazy('canal').lastIndexOf('a')    // => 3
   * Lazy('canal').lastIndexOf('a', 2) // => 1
   * Lazy('canal').lastIndexOf('ana')  // => 1
   * Lazy('canal').lastIndexOf('andy') // => -1
   * Lazy('canal').lastIndexOf('x')    // => -1
   */
  StringLikeSequence.prototype.lastIndexOf = function(substring, startIndex) {
    return this.toString().lastIndexOf(substring, startIndex);
  };

  /**
   * Checks if this sequence contains a given substring.
   *
   * @param {string} substring The substring to check for.
   * @returns {boolean} Whether or not this sequence contains `substring`.
   *
   * @examples
   * Lazy('hello').contains('ell') // => true
   * Lazy('hello').contains('')    // => true
   * Lazy('hello').contains('abc') // => false
   */
  StringLikeSequence.prototype.contains = function(substring) {
    return this.indexOf(substring) !== -1;
  };

  /**
   * Checks if this sequence ends with a given suffix.
   *
   * @param {string} suffix The suffix to check for.
   * @returns {boolean} Whether or not this sequence ends with `suffix`.
   *
   * @examples
   * Lazy('foo').endsWith('oo')  // => true
   * Lazy('foo').endsWith('')    // => true
   * Lazy('foo').endsWith('abc') // => false
   */
  StringLikeSequence.prototype.endsWith = function(suffix) {
    return this.substring(this.length() - suffix.length).toString() === suffix;
  };

  /**
   * Checks if this sequence starts with a given prefix.
   *
   * @param {string} prefix The prefix to check for.
   * @returns {boolean} Whether or not this sequence starts with `prefix`.
   *
   * @examples
   * Lazy('foo').startsWith('fo')  // => true
   * Lazy('foo').startsWith('')    // => true
   * Lazy('foo').startsWith('abc') // => false
   */
  StringLikeSequence.prototype.startsWith = function(prefix) {
    return this.substring(0, prefix.length).toString() === prefix;
  };

  /**
   * Converts all of the characters in this string to uppercase.
   *
   * @returns {StringLikeSequence} A new sequence with the same characters as
   *     this sequence, all uppercase.
   *
   * @examples
   * function nextLetter(a) {
   *   return String.fromCharCode(a.charCodeAt(0) + 1);
   * }
   *
   * Lazy('foo').toUpperCase()                 // => 'FOO'
   * Lazy('foo').substring(1).toUpperCase()    // => 'OO'
   * Lazy('abc').map(nextLetter).toUpperCase() // => 'BCD'
   */
  StringLikeSequence.prototype.toUpperCase = function() {
    return this.map(function(char) { return char.toUpperCase(); });
  };

  /**
   * Converts all of the characters in this string to lowercase.
   *
   * @returns {StringLikeSequence} A new sequence with the same characters as
   *     this sequence, all lowercase.
   *
   * @examples
   * function nextLetter(a) {
   *   return String.fromCharCode(a.charCodeAt(0) + 1);
   * }
   *
   * Lazy('FOO').toLowerCase()                 // => 'foo'
   * Lazy('FOO').substring(1).toLowerCase()    // => 'oo'
   * Lazy('ABC').map(nextLetter).toLowerCase() // => 'bcd'
   */
  StringLikeSequence.prototype.toLowerCase = function() {
    return this.map(function(char) { return char.toLowerCase(); });
  };

  /**
   * Maps the characters of this sequence onto a new {@link StringLikeSequence}.
   *
   * @param {Function} mapFn The function used to map characters from this
   *     sequence onto the new sequence.
   * @returns {StringLikeSequence} The new sequence.
   *
   * @examples
   * function upcase(char) { return char.toUpperCase(); }
   *
   * Lazy("foo").map(upcase)               // => "FOO"
   * Lazy("foo").map(upcase).charAt(0)     // => "F"
   * Lazy("foo").map(upcase).charCodeAt(0) // => 70
   * Lazy("foo").map(upcase).substring(1)  // => "OO"
   */
  StringLikeSequence.prototype.map = function(mapFn) {
    return new MappedStringLikeSequence(this, mapFn);
  };

  /**
   * @constructor
   */
  function MappedStringLikeSequence(parent, mapFn) {
    this.parent = parent;
    this.mapFn  = mapFn;
  }

  MappedStringLikeSequence.prototype = new StringLikeSequence();
  MappedStringLikeSequence.prototype.get = IndexedMappedSequence.prototype.get;
  MappedStringLikeSequence.prototype.length = IndexedMappedSequence.prototype.length;

  StringLikeSequence.prototype.toString = function() {
    return this.join("");
  };

  /**
   * Creates a {@link Sequence} comprising all of the matches for the specified
   * pattern in the underlying string.
   *
   * @param {RegExp} pattern The pattern to match.
   * @returns {Sequence} A sequence of all the matches.
   *
   * @examples
   * Lazy("abracadabra").match(/a[bcd]/) // => ["ab", "ac", "ad", "ab"]
   * Lazy("fee fi fo fum").match(/\w+/)  // => ["fee", "fi", "fo", "fum"]
   * Lazy("hello").match(/xyz/)          // => []
   */
  StringLikeSequence.prototype.match = function(pattern) {
    return new StringMatchSequence(this.source, pattern);
  };

  /**
   * Creates a {@link Sequence} comprising all of the substrings of this string
   * separated by the given delimiter, which can be either a string or a regular
   * expression.
   *
   * @param {string|RegExp} delimiter The delimiter to use for recognizing
   *     substrings.
   * @returns {Sequence} A sequence of all the substrings separated by the given
   *     delimiter.
   *
   * @examples
   * Lazy("foo").split("")                      // => ["f", "o", "o"]
   * Lazy("yo dawg").split(" ")                 // => ["yo", "dawg"]
   * Lazy("bah bah\tblack  sheep").split(/\s+/) // => ["bah", "bah", "black", "sheep"]
   */
  StringLikeSequence.prototype.split = function(delimiter) {
    return new SplitStringSequence(this.source, delimiter);
  };

  /**
   * @constructor
   */
  function StringMatchSequence(source, pattern) {
    this.source = source;
    this.pattern = pattern;
  }

  StringMatchSequence.prototype = new Sequence();

  StringMatchSequence.prototype.each = function(fn) {
    var iterator = this.getIterator();
    while (iterator.moveNext()) {
      if (fn(iterator.current()) === false) {
        return;
      }
    }
  };

  StringMatchSequence.prototype.getIterator = function() {
    return new StringMatchIterator(this.source, this.pattern);
  };

  /**
   * @constructor
   */
  function SplitStringSequence(source, pattern) {
    this.source = source;
    this.pattern = pattern;
  }

  SplitStringSequence.prototype = new Sequence();

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
      return new SplitWithStringIterator(this.source, this.pattern);
    }
  };

  /**
   * Wraps a string exposing {@link #match} and {@link #split} methods that return
   * {@link Sequence} objects instead of arrays, improving on the efficiency of
   * JavaScript's built-in `String#split` and `String.match` methods and
   * supporting asynchronous iteration.
   *
   * @param {string} source The string to wrap.
   * @constructor
   */
  function StringWrapper(source) {
    this.source = source;
  }

  StringWrapper.prototype = new StringLikeSequence();

  StringWrapper.prototype.get = function(i) {
    return this.source.charAt(i);
  };

  StringWrapper.prototype.length = function() {
    return this.source.length;
  };

  /**
   * A GeneratedSequence does not wrap an in-memory colllection but rather
   * determines its elements on-the-fly during iteration according to a generator
   * function.
   *
   * @constructor
   * @param {function(number):*} generatorFn A function which accepts an index
   *     and returns a value for the element at that position in the sequence.
   * @param {number=} length The length of the sequence. If this argument is
   *     omitted, the sequence will go on forever.
   */
  function GeneratedSequence(generatorFn, length) {
    this.get = generatorFn;
    this.fixedLength = length;
  }

  GeneratedSequence.prototype = new Sequence();

  /**
   * Returns the length of this sequence.
   *
   * @returns {number} The length, or `undefined` if this is an indefinite
   *     sequence.
   */
  GeneratedSequence.prototype.length = function() {
    return this.fixedLength;
  };

  /**
   * See {@link Sequence#each}.
   */
  GeneratedSequence.prototype.each = function(fn) {
    var generatorFn = this.get,
        length = this.fixedLength,
        i = 0;
    while (typeof length === "undefined" || i < length) {
      if (fn(generatorFn(i++)) === false) {
        break;
      }
    }
  };

  /**
   * See {@link Sequence#getIterator}
   */
  GeneratedSequence.prototype.getIterator = function() {
    return new GeneratedIterator(this);
  };

  /**
   * Iterates over a generated sequence. (This allows generated sequences to be
   * iterated asynchronously.)
   *
   * @param {GeneratedSequence} sequence The generated sequence to iterate over.
   * @constructor
   */
  function GeneratedIterator(sequence) {
    this.sequence     = sequence;
    this.index        = 0;
    this.currentValue = null;
  }

  GeneratedIterator.prototype.current = function() {
    return this.currentValue;
  };

  GeneratedIterator.prototype.moveNext = function() {
    var sequence = this.sequence;

    if (typeof sequence.fixedLength === "number" && this.index >= sequence.fixedLength) {
      return false;
    }

    this.currentValue = sequence.get(this.index++);
    return true;
  };

  /**
   * An `AsyncSequence` iterates over its elements asynchronously when
   * {@link #each} is called.
   *
   * Returning values
   * ----------------
   *
   * Because of its asynchronous nature, an `AsyncSequence` cannot be used in the
   * same way as other sequences for functions that return values directly (e.g.,
   * `reduce`, `max`, `any`, even `toArray`).
   *
   * The plan is to eventually implement all of these methods differently for
   * `AsyncSequence`: instead of returning values, they will accept a callback and
   * pass a result to the callback once iteration has been completed (or an error
   * is raised). But that isn't done yet.
   *
   * Defining custom asynchronous sequences
   * --------------------------------------
   *
   * There are plenty of ways to define an asynchronous sequence. Here's one.
   *
   * 1. First, implement an {@link Iterator}. This is an object whose prototype
   *    has the methods {@link Iterator#moveNext} (which returns a `boolean`) and
   *    {@link current} (which returns the current value).
   * 2. Next, create a simple wrapper that inherits from `AsyncSequence`, whose
   *    `getIterator` function returns an instance of the iterator type you just
   *    defined.
   *
   * The default implementation for {@link #each} on an `AsyncSequence` is to
   * create an iterator and then asynchronously call {@link Iterator#moveNext}
   * (using `setImmediate`, if available, otherwise `setTimeout`) until the iterator
   * can't move ahead any more.
   *
   * @param {Sequence} parent A {@link Sequence} to wrap, to expose asynchronous
   *     iteration.
   * @param {number=} interval How many milliseconds should elapse between each
   *     element when iterating over this sequence. If this argument is omitted,
   *     asynchronous iteration will be executed as fast as possible.
   * @constructor
   */
  function AsyncSequence(parent, interval) {
    if (parent instanceof AsyncSequence) {
      throw "Sequence is already asynchronous!";
    }

    this.parent = parent;
    this.onNextCallback = getOnNextCallback(interval);
    this.cancelCallback = getCancelCallback();
  }

  AsyncSequence.prototype = new Sequence();

  /**
   * An asynchronous version of {@link Sequence#each}.
   *
   * @param {Function} fn The function to invoke asynchronously on each element in
   *     the sequence one by one.
   * @returns {{cancel: Function, onError: Function}} An object providing the
   *     ability to cancel the asynchronous iteration (by calling `cancel()`) as
   *     well as handle any errors with a callback (set with `onError()`).
   */
  AsyncSequence.prototype.each = function(fn) {
    var iterator = this.parent.getIterator(),
        onNextCallback = this.onNextCallback,
        cancelCallback = this.cancelCallback;

    var handle = {
      id: null,

      cancel: function() {
        if (handle.id) {
          cancelCallback(handle.id);
          handle.id = null;
        }
      },

      onError: function(callback) {
        handle.errorCallback = callback;
      },

      errorCallback: function(error) {}
    };

    if (iterator.moveNext()) {
      handle.id = onNextCallback(function iterate() {
        try {
          if (fn(iterator.current()) !== false && iterator.moveNext()) {
            handle.id = onNextCallback(iterate);
          }
        } catch (e) {
          handle.errorCallback(e);
        }
      });
    }

    return handle;
  };

  function getOnNextCallback(interval) {
    if (typeof interval === "undefined") {
      if (typeof context.setImmediate === "function") {
        return context.setImmediate;
      }
    }

    interval = interval || 0;
    return function(fn) {
      return setTimeout(fn, interval);
    };
  }

  function getCancelCallback(interval) {
    if (typeof interval === "undefined") {
      if (typeof context.clearImmediate === "function") {
        return context.clearImmediate;
      }
    }

    return context.clearTimeout;
  }

  /**
   * A StreamLikeSequence comprises a sequence of 'chunks' of data, which are
   * typically multiline strings.
   *
   * @constructor
   */
  function StreamLikeSequence() {}

  StreamLikeSequence.prototype = new Sequence();

  StreamLikeSequence.prototype.lines = function() {
    return new LinesSequence(this);
  };

  /**
   * A sequence of lines (segments of a larger string or string-like sequence
   * delimited by line breaks).
   *
   * @constructor
   */
  function LinesSequence(parent) {
    this.parent = parent;
  };

  LinesSequence.prototype = new Sequence();

  LinesSequence.prototype.each = function(fn) {
    var done = false;
    this.parent.each(function(chunk) {
      Lazy(chunk).split("\n").each(function(line) {
        if (fn(line) === false) {
          done = true;
          return false;
        }
      });

      return !done;
    });
  };

  /**
   * A StreamingHttpSequence is a `StreamLikeSequence` comprising the chunks of
   * data that are streamed in response to an HTTP request.
   *
   * @param {string} url The URL of the HTTP request.
   * @constructor
   */
  function StreamingHttpSequence(url) {
    this.url = url;
  };

  StreamingHttpSequence.prototype = new StreamLikeSequence();

  StreamingHttpSequence.prototype.each = function(fn) {
    var request = new XMLHttpRequest(),
        index   = 0,
        aborted = false;

    request.open("GET", this.url);

    var listener = function(data) {
      if (!aborted) {
        data = request.responseText.substring(index);
        if (fn(data) === false) {
          request.removeEventListener("progress", listener, false);
          request.abort();
          aborted = true;
        }
        index += data.length;
      }
    };

    request.addEventListener("progress", listener, false);

    request.send();
  };

  /**
   * Wraps an object and returns a {@link Sequence}.
   *
   * - For **arrays**, Lazy will create a sequence comprising the elements in
   *   the array (an {@link ArrayLikeSequence}).
   * - For **objects**, Lazy will create a sequence of key/value pairs
   *   (an {@link ObjectLikeSequence}).
   * - For **strings**, Lazy will create a sequence of characters (a
   *   {@link StringLikeSequence}).
   *
   * @param {Array|Object|string} source An array, object, or string to wrap.
   * @returns {Sequence} The wrapped lazy object.
   *
   * @example
   * var fromArray = Lazy([1, 2, 4]);
   * // => Lazy.ArrayLikeSequence
   *
   * var fromObject = Lazy({ foo: "bar" });
   * // => Lazy.ObjectLikeSequence
   *
   * var fromString = Lazy("hello, world!");
   * // => Lazy.StringLikeSequence
   */
  var Lazy = function(source) {
    if (source instanceof Array) {
      return new ArrayWrapper(source);
    } else if (typeof source === "string") {
      return new StringWrapper(source);
    } else if (source instanceof Sequence) {
      return source;
    }
    return new ObjectWrapper(source);
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
   * @returns {GeneratedSequence} The generated sequence.
   *
   * @example
   * var randomNumbers = Lazy.generate(Math.random);
   * // => sequence: (0.4838115070015192, 0.637410914292559, ...)
   *
   * randomNumbers.length();
   * // => undefined
   *
   * var countingNumbers = Lazy.generate(function(i) { return i + 1; }, 10);
   * // => sequence: (1, 2, ..., 10)
   *
   * countingNumbers.length();
   * // => 10
   */
  Lazy.generate = function(generatorFn, length) {
    return new GeneratedSequence(generatorFn, length);
  };

  /**
   * Creates a sequence from a given starting value, up to a specified stopping
   * value, incrementing by a given step.
   *
   * @returns {GeneratedSequence} The sequence defined by the given ranges.
   *
   * @examples
   * Lazy.range(10)       // => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
   * Lazy.range(1, 11)    // => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
   * Lazy.range(2, 10, 2) // => [2, 4, 6, 8]
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
   * @returns {GeneratedSequence} The sequence containing the repeated value.
   *
   * @example
   * var hihihi = Lazy.repeat("hi", 3);
   * // => sequence: ("hi", "hi", "hi")
   *
   * var foreverYoung = Lazy.repeat("young");
   * // => sequence: ("young", "young", ...)
   */
  Lazy.repeat = function(value, count) {
    return Lazy.generate(function() { return value; }, count);
  };

  Lazy.Sequence = Sequence;
  Lazy.ArrayLikeSequence = ArrayLikeSequence;
  Lazy.ObjectLikeSequence = ObjectLikeSequence;
  Lazy.StringLikeSequence = StringLikeSequence;
  Lazy.GeneratedSequence = GeneratedSequence;
  Lazy.AsyncSequence = AsyncSequence;

  /*** Useful utility methods ***/

  Lazy.noop     = function(e) {};
  Lazy.identity = function(x) { return x; };

  /**
   * Creates a callback... you know, Lo-Dash style.
   *
   * - for functions, just returns the function
   * - for strings, returns a pluck-style callback
   * - for objects, returns a where-style callback
   *
   * @param {Function|string|Object} A function, string, or object to convert to a callback.
   * @returns {Function} The callback function.
   */
  function createCallback(callback) {
    switch (typeof callback) {
      case "function":
        return callback;

      case "string":
        return function(e) {
          return e[callback];
        };

      case "object":
        return function(e) {
          return Lazy(callback).all(function(value, key) {
            return e[key] === value;
          });
        };

      case "undefined":
        return function(e) {
          return e;
        };

      default:
        throw "Don't know how to make a callback from a " + typeof callback + "!";
    }
  }

  /**
   * Creates a Set containing the specified values.
   *
   * @param {...Array} values One or more array(s) of values used to populate the
   *     set.
   * @returns {Set} A new set containing the values passed in.
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
   * @returns {number} 1 if x > y, -1 if x < y, or 0 if x and y are equal.
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
   * Iterates over every element in an array.
   *
   * @param {Array} array The array.
   * @param {Function} fn The function to call on every element, which can return
   *     false to stop the iteration early.
   * @returns {boolean} True if every element in the entire sequence was iterated,
   *     otherwise false.
   */
  function forEach(array, fn) {
    var i = -1,
        len = array.length;

    while (++i < len) {
      if (fn(array[i]) === false) {
        return false;
      }
    }

    return true;
  }

  /**
   * Iterates over every individual element in an array of arrays (of arrays...).
   *
   * @param {Array} array The outermost array.
   * @param {Function} fn The function to call on every element, which can return
   *     false to stop the iteration early.
   * @param {Array=} index An optional counter container, to keep track of the
   *     current index.
   * @returns {boolean} True if every element in the entire sequence was iterated,
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

  function containsBefore(array, element, index, keyFn) {
    keyFn = keyFn || function(x) { return x; };

    var i = -1;

    while (++i < index) {
      if (keyFn(array[i]) === keyFn(element)) {
        return true;
      }
    }
    return false;
  }

  function swap(array, i, j) {
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }

  function indent(depth) {
    return new Array(depth).join("  ");
  }

  /**
   * A collection of unique elements.
   *
   * @constructor
   */
  function Set() {
    this.table = {};
  }

  /**
   * Attempts to add a unique value to the set.
   *
   * @param {*} value The value to add.
   * @returns {boolean} True if the value was added to the set (meaning an equal
   *     value was not already present), or else false.
   */
  Set.prototype.add = function(value) {
    var table = this.table,
        type  = typeof value,

        // only applies for strings
        firstChar,

        // only applies for objects
        objects;

    switch (type) {
      case "number":
      case "boolean":
      case "undefined":
        if (!table[value]) {
          table[value] = true;
          return true;
        }
        return false;

      case "string":
        // Essentially, escape the first character if it could possibly collide
        // with a number, boolean, or undefined (or a string that happens to start
        // with the escape character!), OR if it could override a special property
        // such as '__proto__' or 'constructor'.
        firstChar = value.charAt(0);
        if ("_ftc@".indexOf(firstChar) >= 0 || (firstChar >= "0" && firstChar <= "9")) {
          value = "@" + value;
        }
        if (!table[value]) {
          table[value] = true;
          return true;
        }
        return false;

      default:
        // For objects and functions, we can't really do anything other than store
        // them in an array and do a linear search for reference equality.
        objects = this.objects;
        if (!objects) {
          objects = this.objects = [];
        }
        if (!contains(objects, value)) {
          objects.push(value);
          return true;
        }
        return false;
    }
  };

  /**
   * Checks whether the set contains a value.
   *
   * @param {*} value The value to check for.
   * @returns {boolean} True if the set contains the value, or else false.
   */
  Set.prototype.contains = function(value) {
    var type = typeof value,

        // only applies for strings
        firstChar;

    switch (type) {
      case "number":
      case "boolean":
      case "undefined":
        return !!this.table[value];

      case "string":
        // Essentially, escape the first character if it could possibly collide
        // with a number, boolean, or undefined (or a string that happens to start
        // with the escape character!), OR if it could override a special property
        // such as '__proto__' or 'constructor'.
        firstChar = value.charAt(0);
        if ("_ftc@".indexOf(firstChar) >= 0 || (firstChar >= "0" && firstChar <= "9")) {
          value = "@" + value;
        }
        return !!this.table[value];

      default:
        // For objects and functions, we can't really do anything other than store
        // them in an array and do a linear search for reference equality.
        return this.objects && contains(this.objects, value);
    }
  };

  /*** Exposing Lazy to the world ***/

  // For Node.js
  if (typeof module === "object") {
    module.exports = Lazy;

  // For browsers
  } else {
    context.Lazy = Lazy;
  }

}(typeof global !== "undefined" ? global : this));
