(function(exports) {

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
  
  Sequence.prototype.filter = function(filterFn) {
    return new FilteredSequence(this, filterFn);
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
      return getLast(this);
    }
    return this.reverse().first();
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
  
  var IndexedSequence = Sequence.inherit(function(parent) {
    this.parent = parent;
  });
  
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
  
  var CachingSequence = Sequence.inherit(function(parent) {
    this.parent = parent;
  });
  
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
  
  MappedSequence.prototype.each = function(action) {
    var self = this;
    self.parent.each(function(e) {
      return action(self.mapFn(e));
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
    this.count  = count;
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
    this.count  = count;
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
    this.each = function(action) {
      var shuffled = parent.toArray();
      for (var i = shuffled.length - 1; i > 0; --i) {
        swap(shuffled, i, Math.floor(Math.random() * i) + 1);
        if (action(shuffled[i]) === false) {
          return;
        }
      }
      action(shuffled[0]);
    };
  });
  
  // TODO: This should really return an object, not an jagged array. Will
  // require a bit of rework -- but hopefully not too much!
  var GroupedSequence = CachingSequence.inherit(function(parent, keyFn) {
    this.each = function(action) {
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
        action([key, grouped[key]]);
      }
    };
  });
  
  // TODO: This should return an object too (like GroupBySequence).
  var CountedSequence = CachingSequence.inherit(function(parent, keyFn) {
    this.each = function(action) {
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
        action([key, grouped[key]]);
      }
    };
  });
  
  var UniqueSequence = CachingSequence.inherit(function(parent) {
    this.each = function(action) {
      var set = {};
      parent.each(function(e) {
        if (e in set) { return; }
        set[e] = true;
        return action(e);
      });
    };
  });
  
  var FlattenedSequence = CachingSequence.inherit(function(parent) {
    this.each = function(action) {
      parent.each(function(e) {
        if (e instanceof Array) {
          return recursiveForEach(e, action);
        } else {
          return action(e);
        }
      });
    };
  });
  
  var WithoutSequence = CachingSequence.inherit(function(parent, values) {
    this.each = function(action) {
      var set = new Set(values);
      parent.each(function(e) {
        if (!set.contains(e)) {
          return action(e);
        }
      });
    };
  });
  
  var UnionSequence = CachingSequence.inherit(function(parent, arrays) {
    this.each = function(action) {
      var set = new Set();
      parent.each(function(e) {
        if (!set.contains(e)) {
          set.add(e);
          action(e);
        }
      });
      Lazy(arrays).flatten().each(function(e) {
        if (!set.contains(e)) {
          set.add(e);
          action(e);
        }
      });
    };
  });
  
  var IntersectionSequence = CachingSequence.inherit(function(parent, arrays) {
    this.each = function(action) {
      var sets = Lazy(arrays)
        .map(function(values) { return new Set(values); })
        .toArray();
  
      parent.each(function(e) {
        for (var i = 0; i < sets.length; ++i) {
          if (!sets[i].contains(e)) {
            return;
          }
        }
        action(e);
      });
    };
  });
  
  var ZippedSequence = CachingSequence.inherit(function(parent, arrays) {
    this.each = function(action) {
      var i = 0;
      parent.each(function(e) {
        var group = [e];
        for (var j = 0; j < arrays.length; ++j) {
          if (arrays[j].length > i) {
            group.push(arrays[j][i]);
          }
        }
        ++i;
        return action(group);
      });
    };
  });
  
  var GeneratedSequence = Sequence.inherit(function(generatorFn) {
    this.get = generatorFn;
  
    this.length = function() {
      throw "Cannot get the length of a generated sequence.";
    };
  
    this.each = function(action) {
      var i = 0;
      while (true) {
        if (action(generatorFn(i++)) === false) {
          break;
        }
      }
    };
  });
  
  exports.Lazy = function(source) {
    if (source instanceof Lazy.Sequence) {
      return source;
    }
    return new ArrayWrapper(source);
  };
  
  exports.Lazy.generate = function(SequenceFn) {
    return new GeneratedSequence(SequenceFn);
  };
  
  exports.Lazy.range = function() {
    var start = arguments.length > 1 ? arguments[0] : 0,
        stop  = arguments.length > 1 ? arguments[1] : arguments[0],
        step  = arguments.length > 2 ? arguments[2] : 1;
    return this.generate(function(i) { return start + (step * i); })
      .take(Math.floor((stop - start) / step));
  };
  
  exports.Lazy.Sequence = Sequence;
  exports.Lazy.IndexedSequence = IndexedSequence;
  exports.Lazy.CachingSequence = CachingSequence;
  exports.Lazy.GeneratedSequence = GeneratedSequence;
  
  /*** Useful utility methods ***/
  
  var Set = function(values) {
    var object = {};
    Lazy(values || []).flatten().each(function(e) {
      object[e] = true;
    });
  
    this.add = function(value) {
      object[value] = true;
    };
  
    this.contains = function(value) {
      return object[value];
    };
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
  
  function getLast(sequence) {
    if (sequence.indexed) {
      return sequence.get(sequence.length() - 1);
    }
  
    var result;
    sequence.each(function(e) {
      result = e;
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

}(typeof exports !== 'undefined' ? exports : window));