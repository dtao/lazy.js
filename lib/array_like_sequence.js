/**
 * An `ArrayLikeSequence` is a {@link Sequence} that provides random access to its
 * elements. This extends the API for iterating with the additional methods
 * `get` and `length`, allowing a sequence to act as a "view" into a collection
 * or other indexed data source.
 *
 * @constructor
 */
function ArrayLikeSequence() {}

ArrayLikeSequence.prototype = new Sequence();

/**
 * Create a new constructor function for a type inheriting from
 * {@link ArrayLikeSequence}.
 *
 * @param {Function} ctor The constructor function.
 * @return {Function} A constructor for a new type inheriting from
 *     {@link ArrayLikeSequence}.
 */
ArrayLikeSequence.inherit = function(ctor) {
  ctor.prototype = new ArrayLikeSequence();
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
 * An optimized version of {@link Sequence.each}.
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
 * An optimized version of {@link Sequence.map}, which creates an
 * {@link ArrayLikeSequence} so that the result still provides random access.
 */
ArrayLikeSequence.prototype.map =
ArrayLikeSequence.prototype.collect = function(mapFn) {
  return new IndexedMappedSequence(this, mapFn);
};

/**
 * An optimized version of {@link Sequence.filter}.
 */
ArrayLikeSequence.prototype.filter =
ArrayLikeSequence.prototype.select = function(filterFn) {
  return new IndexedFilteredSequence(this, filterFn);
};

/**
 * An optimized version of {@link Sequence.reverse}, which creates an
 * {@link ArrayLikeSequence} so that the result still provides random access.
 */
ArrayLikeSequence.prototype.reverse = function() {
  return new IndexedReversedSequence(this);
};

/**
 * An optimized version of {@link Sequence.first}, which creates an
 * {@link ArrayLikeSequence} so that the result still provides random access.
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
 * An optimized version of {@link Sequence.rest}, which creates an
 * {@link ArrayLikeSequence} so that the result still provides random access.
 *
 * @param {number=} count
 */
ArrayLikeSequence.prototype.rest = function(count) {
  return new IndexedDropSequence(this, count);
};

ArrayLikeSequence.prototype.tail =
ArrayLikeSequence.prototype.drop = ArrayLikeSequence.prototype.rest;

var IndexedMappedSequence = ArrayLikeSequence.inherit(function(parent, mapFn) {
  this.parent = parent;
  this.mapFn  = mapFn;
});

IndexedMappedSequence.prototype.get = function(i) {
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

var IndexedReversedSequence = ArrayLikeSequence.inherit(function(parent) {
  this.parent = parent;
});

IndexedReversedSequence.prototype.get = function(i) {
  return this.parent.get(this.length() - i - 1);
};

var IndexedTakeSequence = ArrayLikeSequence.inherit(function(parent, count) {
  this.parent = parent;
  this.count  = count;
});

IndexedTakeSequence.prototype.length = function() {
  var parentLength = this.parent.length();
  return this.count <= parentLength ? this.count : parentLength;
};

var IndexedDropSequence = ArrayLikeSequence.inherit(function(parent, count) {
  this.parent = parent;
  this.count  = typeof count === "number" ? count : 1;
});

IndexedDropSequence.prototype.get = function(i) {
  return this.parent.get(this.count + i);
};

IndexedDropSequence.prototype.length = function() {
  var parentLength = this.parent.length();
  return this.count <= parentLength ? parentLength - this.count : 0;
};

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
 * An optimized version of {@link Sequence.each}.
 */
ArrayWrapper.prototype.each = function(fn) {
  var i = -1;
  while (++i < this.source.length) {
    if (fn(this.source[i], i) === false) {
      break;
    }
  }
};

/**
 * An optimized version of {@link Sequence.map}.
 */
ArrayWrapper.prototype.map = function(mapFn) {
  return new MappedArrayWrapper(this.source, mapFn);
};

/**
 * An optimized version of {@link Sequence.filter}.
 */
ArrayWrapper.prototype.filter = function(filterFn) {
  return new FilteredArrayWrapper(this, filterFn);
};

/**
 * An optimized version of {@link Sequence.uniq}.
 */
ArrayWrapper.prototype.uniq =
ArrayWrapper.prototype.unique = function() {
  return new UniqueArrayWrapper(this);
};

/**
 * An optimized version of {@link Sequence.toArray}.
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

// So, this is kinda shocking.
// Soon I'll write a whole blog post about this; but for now suffice it to say
// that going w/ a no-cache approach is the fastest solution until around 200
// elements, at which point using an array-based cache is still faster than
// using a set-based cache. Not until somewhere around 800 elements does a set-
// based approach start to outpace the others.
function getEachForSource(source) {
  if (source.length < 40) {
    return UniqueArrayWrapper.prototype.eachNoCache;
  } else if (source.length < 800) {
    return UniqueArrayWrapper.prototype.eachArrayCache;
  } else {
    return UniqueSequence.prototype.each;
  }
}

