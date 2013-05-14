(function(exports) {
  var Sequence = function(parent, source) {
    this.parent = parent;
    this.source = source;
    this.depth  = parent ? parent.depth + 1 : 0;

    // We'll count how many arrays we create from the root.
    if (!this.parent) {
      this.arraysCreated = 0;
    }
  };

  Sequence.prototype.get = function(i) {
    return this.source ? this.source[i] : this.parent.get(i);
  };

  Sequence.prototype.length = function() {
    return this.source ? this.source.length : this.parent.length();
  };

  Sequence.prototype.root = function() {
    var ancestor = this;
    while (ancestor.parent) {
      ancestor = ancestor.parent;
    }
    return ancestor;
  };

  Sequence.prototype.arrayCount = function() {
    return this.root().arraysCreated;
  };

  Sequence.prototype.each = function(fn) {
    forEach(this.source, fn);
  };

  Sequence.prototype.log = function(msg) {
    console.log(indent(this.depth) + msg);
  };

  Sequence.prototype.toArray = function() {
    var array = [];
    this.each(function(e) {
      array.push(e);
    });

    // Temporarily keeping track of how many arrays get created,
    // for testing purposes.
    this.root().arraysCreated += 1;

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
    return new MapSequence(this, mapFn);
  };

  Sequence.prototype.pluck = function(propertyName) {
    return new MapSequence(this, function(e) {
      return e[propertyName];
    });
  };

  Sequence.prototype.invoke = function(methodName) {
    return new MapSequence(this, function(e) {
      return e[methodName]();
    });
  };

  Sequence.prototype.filter = function(filterFn) {
    return new FilterSequence(this, filterFn);
  };

  Sequence.prototype.reject = function(rejectFn) {
    return new FilterSequence(this, function(e) {
      return !rejectFn(e);
    });
  };

  Sequence.prototype.where = function(properties) {
    return new FilterSequence(this, function(e) {
      for (var p in properties) {
        if (e[p] !== properties[p]) {
          return false;
        }
      }
      return true;
    });
  };

  Sequence.prototype.reverse = function() {
    return new ReverseSequence(this);
  };

  Sequence.prototype.first =
  Sequence.prototype.head =
  Sequence.prototype.take = function(count) {
    if (typeof count === "undefined") {
      return this.get(0);
    }
    return new TakeSequence(this, count);
  };

  Sequence.prototype.initial = function(count) {
    if (typeof count === "undefined") {
      count = 1;
    }
    return this.take(this.length() - count);
  };

  Sequence.prototype.last = function(count) {
    if (typeof count === "undefined") {
      return this.get(this.length() - 1);
    }
    return this.reverse().first();
  };

  Sequence.prototype.findWhere = function(properties) {
    return this.where(properties).first();
  };

  Sequence.prototype.rest =
  Sequence.prototype.tail =
  Sequence.prototype.drop = function(count) {
    return new DropSequence(this, count);
  };

  Sequence.prototype.sortBy = function(sortFn) {
    return new SortBySequence(this, sortFn);
  };

  Sequence.prototype.groupBy = function(keyFn) {
    return new GroupBySequence(this, keyFn);
  };

  Sequence.prototype.countBy = function(keyFn) {
    return new CountBySequence(this, keyFn);
  };

  Sequence.prototype.uniq = function() {
    return new UniqSequence(this);
  };

  Sequence.prototype.zip = function() {
    var arrays = Array.prototype.slice.call(arguments, 0);
    return new ZipSequence(this, arrays);
  };

  Sequence.prototype.shuffle = function() {
    return new ShuffleSequence(this);
  };

  Sequence.prototype.flatten = function() {
    return new FlattenSequence(this);
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

  Sequence.inherit = function(fn) {
    var constructor = function() {
      var parent = arguments[0];
      Sequence.call(this, parent);
      fn.apply(this, arguments);
    };
    constructor.prototype = Sequence.prototype;
    return constructor;
  };

  var CachingSequence = Sequence.inherit(function(parent) {
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

  CachingSequence.inherit = function(fn) {
    var constructor = function() {
      var parent = arguments[0];
      CachingSequence.call(this, parent);
      fn.apply(this, arguments);
    };
    constructor.prototype = CachingSequence.prototype;
    return constructor;
  };

  var MapSequence = Sequence.inherit(function(parent, mapFn) {
    this.get = function(i) {
      return mapFn(parent.get(i));
    };

    this.each = function(action) {
      parent.each(function(e) {
        return action(mapFn(e));
      });
    };
  });

  var FilterSequence = CachingSequence.inherit(function(parent, filterFn) {
    this.each = function(action) {
      parent.each(function(e) {
        if (filterFn(e)) {
          return action(e);
        }
      });
    };
  });

  var ReverseSequence = Sequence.inherit(function(parent) {
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

  var TakeSequence = CachingSequence.inherit(function(parent, count) {
    this.each = function(action) {
      var i = 0;
      parent.each(function(e) {
        var result = action(e);
        if (++i >= count) { return false; }
        return result;
      });
    };
  });

  var DropSequence = CachingSequence.inherit(function(parent, count) {
    this.each = function(action) {
      var i = 0;
      parent.each(function(e) {
        if (i++ < count) { return; }
        return action(e);
      });
    };
  });

  var SortBySequence = CachingSequence.inherit(function(parent, sortFn) {
    this.each = function(action) {
      var sorted = parent.toArray();
      sorted.sort(function(x, y) { return compare(x, y, sortFn); });
      forEach(sorted, action);
    };
  });

  // TODO: This should really return an object, not an jagged array. Will
  // require a bit of rework -- but hopefully not too much!
  var GroupBySequence = CachingSequence.inherit(function(parent, keyFn) {
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
  var CountBySequence = CachingSequence.inherit(function(parent, keyFn) {
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

  var UniqSequence = CachingSequence.inherit(function(parent) {
    this.each = function(action) {
      var set = {};
      parent.each(function(e) {
        if (e in set) { return; }
        set[e] = true;
        return action(e);
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

  var ZipSequence = CachingSequence.inherit(function(parent, arrays) {
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

  var ShuffleSequence = CachingSequence.inherit(function(parent) {
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

  var FlattenSequence = CachingSequence.inherit(function(parent) {
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

  var Generator = Sequence.inherit(function(generatorFn) {
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
    if (source instanceof Sequence) {
      return source;
    }
    return new Sequence(null, source);
  };

  exports.Lazy.generate = function(SequenceFn) {
    return new Generator(SequenceFn);
  };

  exports.Lazy.range = function() {
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

})(typeof exports === "undefined" ? window : exports);
