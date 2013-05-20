(function(context) {

  var Sequence = function(parent) {
    this.parent = parent;
  };

  Sequence.inherit = function(ctor) {
    ctor.prototype = new Sequence();
    return ctor;
  };

  Sequence.prototype.depth = function() {
    return this.parent ? this.parent.depth() + 1 : 0;
  };

  Sequence.prototype.log = function(msg) {
    console.log(indent(this.depth()) + msg);
  };

  Sequence.prototype.toArray = function() {
    var array = [];
    this.each(function(e) {
      array.push(e);
    });

    return array;
  };

  Sequence.prototype.toObject = function() {
    var object = {};
    this.each(function(e) {
      object[e[0]] = e[1];
    });

    return object;
  };

  Sequence.prototype.map = function(mapFn) {
    if (this.indexed) {
      return new IndexedMappedSequence(this, mapFn);
    } else {
      return new MappedSequence(this, mapFn);
    }
  };

  Sequence.prototype.pluck = function(propertyName) {
    return this.map(function(e) {
      return e[propertyName];
    });
  };

  Sequence.prototype.invoke = function(methodName) {
    return this.map(function(e) {
      return e[methodName]();
    });
  };

  Sequence.prototype.select =
  Sequence.prototype.filter = function(filterFn) {
    if (this.indexed) {
      return new IndexedFilteredSequence(this, filterFn);
    } else {
      return new FilteredSequence(this, filterFn);
    }
  };

  Sequence.prototype.reject = function(rejectFn) {
    return this.filter(function(e) {
      return !rejectFn(e);
    });
  };

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

  Sequence.prototype.reverse = function() {
    if (this.indexed) {
      return new IndexedReversedSequence(this);
    } else {
      return new ReversedSequence(this);
    }
  };

  Sequence.prototype.concat = function() {
    return new ConcatenatedSequence(this, Array.prototype.slice.call(arguments, 0));
  };

  Sequence.prototype.first =
  Sequence.prototype.head =
  Sequence.prototype.take = function(count) {
    if (typeof count === "undefined") {
      return getFirst(this);
    }

    if (this.indexed) {
      return new IndexedTakeSequence(this, count);
    } else {
      return new TakeSequence(this, count);
    }
  };

  Sequence.prototype.initial = function(count) {
    if (typeof count === "undefined") {
      count = 1;
    }
    return this.take(this.length() - count);
  };

  Sequence.prototype.last = function(count) {
    if (typeof count === "undefined") {
      return this.reverse().first();
    }
    return this.reverse().take(count).reverse();
  };

  Sequence.prototype.findWhere = function(properties) {
    return this.where(properties).first();
  };

  Sequence.prototype.rest =
  Sequence.prototype.tail =
  Sequence.prototype.drop = function(count) {
    if (this.indexed) {
      return new IndexedDropSequence(this, count);
    } else {
      return new DropSequence(this, count);
    }
  };

  Sequence.prototype.sortBy = function(sortFn) {
    return new SortedSequence(this, sortFn);
  };

  Sequence.prototype.groupBy = function(keyFn) {
    return new GroupedSequence(this, keyFn);
  };

  Sequence.prototype.countBy = function(keyFn) {
    return new CountedSequence(this, keyFn);
  };

  Sequence.prototype.uniq = function() {
    return new UniqueSequence(this);
  };

  Sequence.prototype.zip = function() {
    return new ZippedSequence(this, Array.prototype.slice.call(arguments, 0));
  };

  Sequence.prototype.shuffle = function() {
    return new ShuffledSequence(this);
  };

  Sequence.prototype.flatten = function() {
    return new FlattenedSequence(this);
  };

  Sequence.prototype.compact = function() {
    return this.filter(function(e) { return !!e; });
  };

  Sequence.prototype.without =
  Sequence.prototype.difference = function() {
    return new WithoutSequence(this, Array.prototype.slice.call(arguments, 0));
  };

  Sequence.prototype.union = function() {
    return new UnionSequence(this, Array.prototype.slice.call(arguments, 0));
  };

  Sequence.prototype.intersection = function() {
    return new IntersectionSequence(this, Array.prototype.slice.call(arguments, 0));
  };

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

  Sequence.prototype.isEmpty = function() {
    return !this.any();
  };

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

  Sequence.prototype.lastIndexOf = function(value) {
    var index = this.reverse().indexOf(value);
    if (index !== -1) {
      index = this.length() - index - 1;
    }
    return index;
  };

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

  Sequence.prototype.contains = function(value) {
    return this.indexOf(value) !== -1;
  };

  Sequence.prototype.reduce =
  Sequence.prototype.inject =
  Sequence.prototype.foldl = function(aggregator, memo) {
    this.each(function(e) {
      memo = aggregator(memo, e);
    });
    return memo;
  };

  Sequence.prototype.reduceRight =
  Sequence.prototype.foldr = function(aggregator, memo) {
    return this.reverse().reduce(aggregator, memo);
  };

  Sequence.prototype.find =
  Sequence.prototype.detect = function(predicate) {
    return this.filter(predicate).first();
  };

  Sequence.prototype.min = function() {
    return this.reduce(function(least, value) {
      if (typeof least === "undefined") {
        return value;
      }
      return value < least ? value : least;
    });
  };

  Sequence.prototype.max = function() {
    return this.reduce(function(greatest, value) {
      if (typeof greatest === "undefined") {
        return value;
      }
      return value > greatest ? value : greatest;
    });
  };

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

  Sequence.prototype.getIterator = function() {
    return new SequenceIterator(this);
  };

  Sequence.prototype.async = function(interval) {
    return new AsyncSequence(this, interval);
  };

  var SequenceIterator = function(sequence) {
    this.sequence = sequence;
    this.index = -1;
  };

  SequenceIterator.prototype.current = function() {
    return this.sequence.get(this.index);
  };

  SequenceIterator.prototype.moveNext = function() {
    if (this.index >= this.sequence.length() - 1) {
      return false;
    }

    ++this.index;
    return true;
  };

  var Set = function() {
    this.table = {};
  };

  Set.prototype.add = function(value) {
    var table = this.table,
        typeKey = typeof value,
        valueKey = "@" + value;

    if (!table[typeKey]) {
      table[typeKey] = {};
      return table[typeKey][valueKey] = true;
    }
    if (table[typeKey][valueKey]) {
      return false;
    }
    return table[typeKey][valueKey] = true;
  };

  Set.prototype.contains = function(value) {
    var valuesForType = this.table[typeof value];
    return valuesForType && valuesForType["@" + value];
  };

  var ArrayWrapper = Sequence.inherit(function(source) {
    this.source = source;
  });

  ArrayWrapper.prototype.indexed = true;

  ArrayWrapper.prototype.get = function(i) {
    return this.source[i];
  };

  ArrayWrapper.prototype.length = function() {
    return this.source.length;
  };

  ArrayWrapper.prototype.each = function(fn) {
    var i = -1;
    while (++i < this.source.length) {
      if (fn(this.source[i]) === false) {
        break;
      }
    }
  };

  ArrayWrapper.prototype.toArray = function() {
    return this.source.slice(0);
  };

  var IndexedSequence = Sequence.inherit(function() {});

  IndexedSequence.inherit = function(ctor) {
    ctor.prototype = new IndexedSequence();
    return ctor;
  };

  IndexedSequence.prototype.indexed = true;

  IndexedSequence.prototype.get = function(i) {
    return this.parent.get(i);
  };

  IndexedSequence.prototype.length = function() {
    return this.parent.length();
  };

  IndexedSequence.prototype.each = function(fn) {
    var length = this.length(),
        i = -1;
    while (++i < length) {
      if (fn(this.get(i)) === false) {
        break;
      }
    }
  };

  var CachingSequence = Sequence.inherit(function() {});

  CachingSequence.inherit = function(ctor) {
    ctor.prototype = new CachingSequence();
    return ctor;
  };

  CachingSequence.prototype.indexed = false;

  CachingSequence.prototype.cache = function() {
    if (!this.cached) {
      this.cached = this.toArray();
    }
    return this.cached;
  };

  CachingSequence.prototype.get = function(i) {
    return this.cache()[i];
  };

  CachingSequence.prototype.length = function() {
    return this.cache().length;
  };

  var MappedSequence = Sequence.inherit(function(parent, mapFn) {
    this.parent = parent;
    this.mapFn  = mapFn;
  });

  MappedSequence.prototype.each = function(fn) {
    var mapFn = this.mapFn;
    this.parent.each(function(e) {
      return fn(mapFn(e));
    });
  };

  var IndexedMappedSequence = IndexedSequence.inherit(function(parent, mapFn) {
    this.parent = parent;
    this.mapFn  = mapFn;
  });

  IndexedMappedSequence.prototype.get = function(i) {
    return this.mapFn(this.parent.get(i));
  };

  var FilteredSequence = CachingSequence.inherit(function(parent, filterFn) {
    this.parent   = parent;
    this.filterFn = filterFn;
  });

  FilteredSequence.prototype.each = function(fn) {
    var filterFn = this.filterFn;
    this.parent.each(function(e) {
      if (filterFn(e)) {
        return fn(e);
      }
    });
  };

  var IndexedFilteredSequence = CachingSequence.inherit(function(parent, filterFn) {
    this.parent   = parent;
    this.filterFn = filterFn;
  });

  IndexedFilteredSequence.prototype.each = function(fn) {
    var parent = this.parent,
        filterFn = this.filterFn,
        length = this.parent.length(),
        i = -1,
        e;

    while (++i < length) {
      e = parent.get(i);
      if (filterFn(e) && fn(e) === false) {
        break;
      }
    }
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

  var IndexedReversedSequence = IndexedSequence.inherit(function(parent) {
    this.parent = parent;
  });

  IndexedReversedSequence.prototype.get = function(i) {
    return this.parent.get(this.length() - i - 1);
  };

  var ConcatenatedSequence = Sequence.inherit(function(parent, arrays) {
    this.parent = parent;
    this.arrays = arrays;
  });

  ConcatenatedSequence.prototype.each = function(fn) {
    var done = false;

    this.parent.each(function(e) {
      if (fn(e) === false) {
        done = true;
        return false;
      }
    });

    if (!done) {
      Lazy(this.arrays).flatten().each(fn);
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
      var result = fn(e);
      if (++i >= self.count) { return false; }
      return result;
    });
  };

  var IndexedTakeSequence = IndexedSequence.inherit(function(parent, count) {
    this.parent = parent;
    this.count  = count;
  });

  IndexedTakeSequence.prototype.length = function() {
    var parentLength = this.parent.length();
    return this.count <= parentLength ? this.count : parentLength;
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

  var IndexedDropSequence = IndexedSequence.inherit(function(parent, count) {
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
      if (fn(sorted[i]) === false) {
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
        random = Math.random;

    for (var i = shuffled.length - 1; i > 0; --i) {
      swap(shuffled, i, floor(random() * i) + 1);
      if (fn(shuffled[i]) === false) {
        return;
      }
    }
    fn(shuffled[0]);
  };

  // TODO: This should really return an object, not an jagged array. Will
  // require a bit of rework -- but hopefully not too much!
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

  // TODO: This should return an object too (like GroupBySequence).
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
    var set = new Set();
    this.parent.each(function(e) {
      if (set.add(e)) {
        return fn(e);
      }
    });
  };

  var FlattenedSequence = CachingSequence.inherit(function(parent) {
    this.parent = parent;
  });

  FlattenedSequence.prototype.each = function(fn) {
    this.parent.each(function(e) {
      if (e instanceof Array) {
        return recursiveForEach(e, fn);
      } else {
        return fn(e);
      }
    });
  };

  var WithoutSequence = CachingSequence.inherit(function(parent, values) {
    this.parent = parent;
    this.values = values;
  });

  WithoutSequence.prototype.each = function(fn) {
    var set = createSet(this.values);
    this.parent.each(function(e) {
      if (!set.contains(e)) {
        return fn(e);
      }
    });
  };

  var UnionSequence = CachingSequence.inherit(function(parent, arrays) {
    this.parent = parent;
    this.arrays = arrays;
  });

  UnionSequence.prototype.each = function(fn) {
    var set = {},
        done = false;

    this.parent.each(function(e) {
      if (!set[e]) {
        set[e] = true;
        if (fn(e) === false) {
          done = true;
          return false;
        }
      }
    });

    if (!done) {
      Lazy(this.arrays).each(function(array) {
        if (done) {
          return false;
        }

        Lazy(array).each(function(e) {
          if (!set[e]) {
            set[e] = true;
            if (fn(e) === false) {
              done = true;
              return false;
            }
          }
        })
      });
    }
  };

  var IntersectionSequence = CachingSequence.inherit(function(parent, arrays) {
    this.parent = parent;
    this.arrays = arrays;
  });

  IntersectionSequence.prototype.each = function(fn) {
    var sets = Lazy(this.arrays)
      .map(function(values) { return createSet(values); })
      .toArray();

    this.parent.each(function(e) {
      for (var i = 0; i < sets.length; ++i) {
        if (!sets[i].contains(e)) {
          return;
        }
      }
      return fn(e);
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
      ++i;
      return fn(group);
    });
  };

  var GeneratedSequence = Sequence.inherit(function(generatorFn, length) {
    this.get = generatorFn;
    this.fixedLength = length;
  });

  GeneratedSequence.prototype.length = function() {
    return this.fixedLength;
  };

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

  var AsyncSequence = Sequence.inherit(function(parent, interval) {
    if (parent instanceof AsyncSequence) {
      throw "Sequence is already asynchronous!";
    }

    this.parent = parent;
    this.interval = interval || 0;
  });

  AsyncSequence.prototype.each = function(fn) {
    var iterator = this.parent.getIterator(),
        interval = this.interval;

    if (iterator.moveNext()) {
      setTimeout(function iterate() {
        if (fn(iterator.current()) !== false && iterator.moveNext()) {
          setTimeout(iterate, interval);
        }
      }, interval);
    }
  };

  var StringWrapper = function(source) {
    this.source = source;
  };

  StringWrapper.prototype.match = function(pattern) {
    return new StringMatchSequence(this.source, pattern);
  };

  StringWrapper.prototype.split = function(delimiter) {
    return new SplitStringSequence(this.source, delimiter);
  };

  var StringMatchSequence = Sequence.inherit(function(source, pattern) {
    this.source = source;
    this.pattern = pattern;
  });

  StringMatchSequence.prototype.each = function(fn) {
    var source = this.source,
        pattern = this.pattern,
        match;

    if (pattern.source === "" || pattern.source === "(?:)") {
      eachChar(str, fn);
      return;
    }

    // clone the RegExp
    pattern = eval("" + pattern + (!pattern.global ? "g" : ""));

    while (match = pattern.exec(source)) {
      if (fn(match[0]) === false) {
        return;
      }
    }
  };

  StringMatchSequence.prototype.getIterator = function() {
    var source = this.source,
        pattern = this.pattern,
        match;

    if (pattern.source === "" || pattern.source === "(?:)") {
      return new CharIterator(source);
    }

    // clone the RegExp
    pattern = eval("" + pattern + (!pattern.global ? "g" : ""));

    return {
      current: function() {
        return match;
      },

      moveNext: function() {
        return !!(match = pattern.exec(source));
      }
    };
  };

  var SplitStringSequence = Sequence.inherit(function(source, pattern) {
    this.source = source;
    this.pattern = pattern;
  });

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

  var SplitWithRegExpIterator = function(source, pattern) {
    this.source = source;

    // clone the RegExp
    this.pattern = eval("" + pattern + (!pattern.global ? "g" : ""));
  };

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

  var SplitWithStringIterator = function(source, delimiter) {
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

  var CharIterator = function(source) {
    this.source = source;
    this.index = -1;
  };

  CharIterator.prototype.current = function() {
    return this.source.charAt(this.index);
  };

  CharIterator.prototype.moveNext = function() {
    return (++this.index < this.source.length);
  };

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

  function createSet(values) {
    var set = new Set();
    Lazy(values || []).flatten().each(function(e) {
      set.add(e);
    });
    return set;
  };

  function compare(x, y, fn) {
    if (typeof fn === "function") {
      return compare(fn(x), fn(y));
    }

    if (x === y) {
      return 0;
    }

    return x > y ? 1 : -1;
  }

  function forEach(array, fn) {
    var i = -1;
    while (++i < array.length) {
      if (fn(array[i]) === false) {
        break;
      }
    }
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
    if (sequence.indexed) {
      return sequence.get(0);
    }

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

}(typeof global !== 'undefined' ? global : window));