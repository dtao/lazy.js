(function(global) {
  var Iterator = function(parent, source) {
    this.parent = parent;
    this.source = source;
    this.depth  = parent ? parent.depth + 1 : 0;

    // We'll count how many arrays we create from the root.
    if (!this.parent) {
      this.arraysCreated = 0;
    }
  };

  Iterator.prototype.get = function(i) {
    return this.source ? this.source[i] : this.parent.get(i);
  };

  Iterator.prototype.length = function() {
    return this.source ? this.source.length : this.parent.length();
  };

  Iterator.prototype.root = function() {
    var ancestor = this;
    while (ancestor.parent) {
      ancestor = ancestor.parent;
    }
    return ancestor;
  };

  Iterator.prototype.arrayCount = function() {
    return this.root().arraysCreated;
  };

  Iterator.prototype.each = function(fn) {
    forEach(this.source, fn);
  };

  Iterator.prototype.log = function(msg) {
    console.log(indent(this.depth) + msg);
  };

  Iterator.prototype.toArray = function() {
    var array = [];
    this.each(function(e) {
      array.push(e);
    });

    // Temporarily keeping track of how many arrays get created,
    // for testing purposes.
    this.root().arraysCreated += 1;

    return array;
  };

  Iterator.prototype.toObject = function() {
    var object = {};
    this.each(function(e) {
      object[e[0]] = e[1];
    });

    return object;
  };

  Iterator.prototype.map = function(mapFn) {
    return new MapIterator(this, mapFn);
  };

  Iterator.prototype.pluck = function(propertyName) {
    return new MapIterator(this, function(e) {
      return e[propertyName];
    });
  };

  Iterator.prototype.invoke = function(methodName) {
    return new MapIterator(this, function(e) {
      return e[methodName]();
    });
  };

  Iterator.prototype.filter = function(filterFn) {
    return new FilterIterator(this, filterFn);
  };

  Iterator.prototype.reject = function(rejectFn) {
    return new FilterIterator(this, function(e) {
      return !rejectFn(e);
    });
  };

  Iterator.prototype.where = function(properties) {
    return new FilterIterator(this, function(e) {
      for (var p in properties) {
        if (e[p] !== properties[p]) {
          return false;
        }
      }
      return true;
    });
  };

  Iterator.prototype.reverse = function() {
    return new ReverseIterator(this);
  };

  Iterator.prototype.first =
  Iterator.prototype.head =
  Iterator.prototype.take = function(count) {
    if (typeof count === "undefined") {
      return this.get(0);
    }
    return new TakeIterator(this, count);
  };

  Iterator.prototype.initial = function(count) {
    if (typeof count === "undefined") {
      count = 1;
    }
    return this.take(this.length() - count);
  };

  Iterator.prototype.last = function(count) {
    if (typeof count === "undefined") {
      return this.get(this.length() - 1);
    }
    return this.reverse().first();
  };

  Iterator.prototype.findWhere = function(properties) {
    return this.where(properties).first();
  };

  Iterator.prototype.rest =
  Iterator.prototype.tail =
  Iterator.prototype.drop = function(count) {
    return new DropIterator(this, count);
  };

  Iterator.prototype.sortBy = function(sortFn) {
    return new SortByIterator(this, sortFn);
  };

  Iterator.prototype.groupBy = function(keyFn) {
    return new GroupByIterator(this, keyFn);
  };

  Iterator.prototype.countBy = function(keyFn) {
    return new CountByIterator(this, keyFn);
  };

  Iterator.prototype.uniq = function() {
    return new UniqIterator(this);
  };

  Iterator.prototype.zip = function() {
    var arrays = Array.prototype.slice.call(arguments, 0);
    return new ZipIterator(this, arrays);
  };

  Iterator.prototype.shuffle = function() {
    return new ShuffleIterator(this);
  };

  Iterator.prototype.flatten = function() {
    return new FlattenIterator(this);
  };

  Iterator.prototype.compact = function() {
    return this.filter(function(e) { return !!e; });
  };

  Iterator.prototype.without =
  Iterator.prototype.difference = function() {
    return new WithoutIterator(this, Array.prototype.slice.call(arguments, 0));
  };

  Iterator.prototype.union = function() {
    return new UnionIterator(this, Array.prototype.slice.call(arguments, 0));
  };

  Iterator.prototype.intersection = function() {
    return new IntersectionIterator(this, Array.prototype.slice.call(arguments, 0));
  };

  Iterator.prototype.every =
  Iterator.prototype.all = function(predicate) {
    var success = true;
    this.each(function(e) {
      if (!predicate(e)) {
        success = false;
        return false;
      }
    });
    return success;
  };

  Iterator.prototype.some =
  Iterator.prototype.any = function(predicate) {
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

  Iterator.prototype.isEmpty = function() {
    return !this.any();
  };

  Iterator.prototype.indexOf = function(value) {
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

  Iterator.prototype.lastIndexOf = function(value) {
    var index = this.reverse().indexOf(value);
    if (index !== -1) {
      index = this.length() - index - 1;
    }
    return index;
  };

  Iterator.prototype.contains = function(value) {
    return this.indexOf(value) !== -1;
  };

  Iterator.prototype.reduce =
  Iterator.prototype.inject =
  Iterator.prototype.foldl = function(aggregator, memo) {
    this.each(function(e) {
      memo = aggregator(memo, e);
    });
    return memo;
  };

  Iterator.prototype.reduceRight =
  Iterator.prototype.foldr = function(aggregator, memo) {
    return this.reverse().reduce(aggregator, memo);
  };

  Iterator.prototype.find =
  Iterator.prototype.detect = function(predicate) {
    return this.filter(predicate).first();
  };

  Iterator.prototype.min = function() {
    return this.reduce(function(least, value) {
      if (typeof least === "undefined") {
        return value;
      }
      return value < least ? value : least;
    });
  };

  Iterator.prototype.max = function() {
    return this.reduce(function(greatest, value) {
      if (typeof greatest === "undefined") {
        return value;
      }
      return value > greatest ? value : greatest;
    });
  };

  Iterator.inherit = function(fn) {
    var constructor = function() {
      var parent = arguments[0];
      Iterator.call(this, parent);
      fn.apply(this, arguments);
    };
    constructor.prototype = Iterator.prototype;
    return constructor;
  };

  var CachingIterator = Iterator.inherit(function(parent) {
    var cached;

    this.cache = function() {
      if (!cached) {
        cached = this.toArray();
      }
      return cached;
    };

    this.get = function(i) {
      return this.cache()[i];
    };

    this.length = function() {
      return this.cache().length;
    };
  });

  CachingIterator.inherit = function(fn) {
    var constructor = function() {
      var parent = arguments[0];
      CachingIterator.call(this, parent);
      fn.apply(this, arguments);
    };
    constructor.prototype = CachingIterator.prototype;
    return constructor;
  };

  var MapIterator = Iterator.inherit(function(parent, mapFn) {
    this.get = function(i) {
      return mapFn(parent.get(i));
    };

    this.each = function(action) {
      parent.each(function(e) {
        return action(mapFn(e));
      });
    };
  });

  var FilterIterator = CachingIterator.inherit(function(parent, filterFn) {
    this.each = function(action) {
      parent.each(function(e) {
        if (filterFn(e)) {
          return action(e);
        }
      });
    };
  });

  var ReverseIterator = Iterator.inherit(function(parent) {
    this.get = function(i) {
      return parent.get(parent.length() - i - 1);
    };

    this.length = function() {
      return parent.length();
    };

    this.each = function(action) {
      var length = parent.length();
      for (var i = length - 1; i >= 0; --i) {
        if (action(parent.get(i)) === false) {
          break;
        }
      }
    };
  });

  var TakeIterator = CachingIterator.inherit(function(parent, count) {
    this.each = function(action) {
      var i = 0;
      parent.each(function(e) {
        var result = action(e);
        if (++i >= count) { return false; }
        return result;
      });
    };
  });

  var DropIterator = CachingIterator.inherit(function(parent, count) {
    this.each = function(action) {
      var i = 0;
      parent.each(function(e) {
        if (i++ < count) { return; }
        return action(e);
      });
    };
  });

  var SortByIterator = CachingIterator.inherit(function(parent, sortFn) {
    this.each = function(action) {
      var sorted = parent.toArray();
      sorted.sort(function(x, y) { return compare(x, y, sortFn); });
      forEach(sorted, action);
    };
  });

  // TODO: This should really return an object, not an jagged array. Will
  // require a bit of rework -- but hopefully not too much!
  var GroupByIterator = CachingIterator.inherit(function(parent, keyFn) {
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

  // TODO: This should return an object too (like GroupByIterator).
  var CountByIterator = CachingIterator.inherit(function(parent, keyFn) {
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

  var UniqIterator = CachingIterator.inherit(function(parent) {
    this.each = function(action) {
      var set = {};
      parent.each(function(e) {
        if (e in set) { return; }
        set[e] = true;
        return action(e);
      });
    };
  });

  var WithoutIterator = CachingIterator.inherit(function(parent, values) {
    this.each = function(action) {
      var set = new Set(values);
      parent.each(function(e) {
        if (!set.contains(e)) {
          return action(e);
        }
      });
    };
  });

  var UnionIterator = CachingIterator.inherit(function(parent, arrays) {
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

  var IntersectionIterator = CachingIterator.inherit(function(parent, arrays) {
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

  var ZipIterator = CachingIterator.inherit(function(parent, arrays) {
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

  var ShuffleIterator = CachingIterator.inherit(function(parent) {
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

  var FlattenIterator = CachingIterator.inherit(function(parent) {
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

  var Generator = Iterator.inherit(function(generatorFn) {
    Iterator.call(this);

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

  global.Lazy = function(source) {
    if (source instanceof Iterator) {
      return source;
    }
    return new Iterator(null, source);
  };

  global.Lazy.generate = function(iteratorFn) {
    return new Generator(iteratorFn);
  };

  global.Lazy.range = function() {
    var start = arguments.length > 1 ? arguments[0] : 0,
        stop  = arguments.length > 1 ? arguments[1] : arguments[0],
        step  = arguments.length > 2 ? arguments[2] : 1;
    return this.generate(function(i) { return start + (step * i); })
      .take(Math.floor((stop - start) / step));
  };

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
    for (var i = 0; i < array.length; ++i) {
      if (fn(array[i]) === false) {
        break;
      }
    }
  }

  function recursiveForEach(array, fn) {
    for (var i = 0; i < array.length; ++i) {
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

  function swap(array, i, j) {
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }

  function indent(depth) {
    return new Array(depth).join("  ");
  }

})(window);
