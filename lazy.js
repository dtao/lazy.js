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

  Iterator.prototype.map = function(mapFn) {
    return new MapIterator(this, mapFn);
  };

  Iterator.prototype.filter = function(filterFn) {
    return new FilterIterator(this, filterFn);
  };

  Iterator.prototype.reject = function(rejectFn) {
    return new FilterIterator(this, function(e) {
      return !rejectFn(e);
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

  Iterator.prototype.last = function(count) {
    if (typeof count === "undefined") {
      return this.get(this.length() - 1);
    }
    return this.reverse().first();
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
    var success = false;
    this.each(function(e) {
      if (predicate(e)) {
        success = true;
        return false;
      }
    });
    return success;
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
        action(parent.get(i));
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

  var UniqIterator = CachingIterator.inherit(function(parent, count) {
    this.each = function(action) {
      var set = {};
      parent.each(function(e) {
        if (e in set) { return; }
        set[e] = true;
        return action(e);
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
    return new Iterator(null, source);
  };

  global.Lazy.generate = function(iteratorFn) {
    return new Generator(iteratorFn);
  };

  /*** Useful utility methods ***/

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

  function indent(depth) {
    return new Array(depth).join("  ");
  }

})(window);
