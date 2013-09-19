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
 * @return {*} The element.
 */
ArrayLikeSequence.prototype.get = function(i) {
  return this.parent.get(i);
};

/**
 * Returns the length of the sequence.
 *
 * @return {number} The length.
 */
ArrayLikeSequence.prototype.length = function() {
  return this.parent.length();
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
ArrayLikeSequence.prototype.getIterator = function() {
  return new Iterator(this);
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
 * @return {ArrayLikeSequence} The new array-like sequence.
 */
ArrayLikeSequence.prototype.map = function(mapFn) {
  return new IndexedMappedSequence(this, mapFn);
};

ArrayLikeSequence.prototype.collect = ArrayLikeSequence.prototype.map;

/**
 * An optimized version of {@link Sequence#select}.
 */
ArrayLikeSequence.prototype.select = function(filterFn) {
  return new IndexedFilteredSequence(this, filterFn);
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
ArrayLikeSequence.prototype.uniq = function() {
  return new IndexedUniqueSequence(this);
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
function IndexedUniqueSequence(parent) {
  this.parent = parent;
  this.each   = getEachForParent(parent);
}

IndexedUniqueSequence.prototype = new Sequence();

IndexedUniqueSequence.prototype.eachArrayCache = function(fn) {
  // Basically the same implementation as w/ the set, but using an array because
  // it's cheaper for smaller sequences.
  var parent = this.parent,
      length = parent.length(),
      cache  = [],
      find   = contains,
      value,
      i = -1,
      j = 0;

  while (++i < length) {
    value = parent.get(i);
    if (!find(cache, value)) {
      cache.push(value);
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
 * @return {*} The element.
 */
ArrayWrapper.prototype.get = function(i) {
  return this.source[i];
};

/**
 * Returns the length of the source array.
 *
 * @return {number} The length.
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
  return new MappedArrayWrapper(this.source, mapFn);
};

/**
 * An optimized version of {@link Sequence#filter}.
 */
ArrayWrapper.prototype.filter =
ArrayWrapper.prototype.select = function(filterFn) {
  return new FilteredArrayWrapper(this, filterFn);
};

/**
 * An optimized version of {@link Sequence#uniq}.
 */
ArrayWrapper.prototype.uniq =
ArrayWrapper.prototype.unique = function() {
  return new UniqueArrayWrapper(this);
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
function UniqueArrayWrapper(parent) {
  this.parent = parent;
  this.each = getEachForSource(parent.source);
}

UniqueArrayWrapper.prototype = new CachingSequence();

UniqueArrayWrapper.prototype.eachNoCache = function(fn) {
  var source = this.parent.source,
      length = source.length,
      find   = containsBefore,
      value,

      // Yes, this is hideous.
      // Trying to get performance first, will refactor next!
      i = -1,
      k = 0;

  while (++i < length) {
    value = source[i];
    if (!find(source, value, i) && fn(value, k++) === false) {
      return false;
    }
  }
};

UniqueArrayWrapper.prototype.eachArrayCache = function(fn) {
  // Basically the same implementation as w/ the set, but using an array because
  // it's cheaper for smaller sequences.
  var source = this.parent.source,
      length = source.length,
      cache  = [],
      find   = contains,
      value,
      i = -1,
      j = 0;

  while (++i < length) {
    value = source[i];
    if (!find(cache, value)) {
      cache.push(value);
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
