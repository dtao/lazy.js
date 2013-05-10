(function(global) {
  function compare(x, y, fn) {
    if (typeof fn === "function") {
      return compare(fn(x), fn(y));
    }

    if (x === y) {
      return 0;
    }

    return x > y ? 1 : -1;
  };

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

  var Iterator = function(parent, source) {
    var length, cached;

    this.parent = parent;
    this.source = source;
    this.depth  = parent ? parent.depth + 1 : 0;

    // We'll count how many arrays we create from the root.
    if (!this.parent) {
      this.arraysCreated = 0;
    }

    this.length = function() {
      if (typeof length === "undefined") {
        length = this.source ? this.source.length : this.parent.length();
      }
      return length;
    };

    this.cache = function() {
      if (!cached) {
        cached = this.toArray();
      }
      return cached;
    };
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

  Iterator.prototype.get = function(i) {
    return this.source ? this.source[i] : this.parent.get(i);
  };

  Iterator.prototype.each = function(fn) {
    for (var i = 0; i < this.length(); ++i) {
      if (fn(this.get(i)) === false) {
        break;
      }
    }
  };

  Iterator.prototype.reverseEach = function(fn) {
    for (var i = this.length() - 1; i >= 0; --i) {
      if (fn(this.get(i)) === false) {
        break;
      }
    }
  };

  Iterator.prototype.changeIteration = function(eachFn) {
    var parent = this.parent;

    this.each = function(action) {
      parent.each(function(e) { return eachFn(action, e); });
    };
    this.reverseEach = function(action) {
      parent.reverseEach(function(e) { return eachFn(action, e); });
    };
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

  Iterator.prototype.take = function(count) {
    return new TakeIterator(this, count);
  };

  Iterator.prototype.drop = function(count) {
    return new DropIterator(this, count);
  };

  Iterator.prototype.sortBy = function(sortFn) {
    return new SortIterator(this, sortFn);
  };

  Iterator.prototype.uniq = function() {
    return new UniqIterator(this);
  };

  Iterator.inherit = function(fn) {
    var constructor = function() {
      Iterator.call(this, arguments[0]);
      fn.apply(this, arguments);
    };
    constructor.prototype = Iterator.prototype;
    return constructor;
  };

  var MapIterator = Iterator.inherit(function(parent, mapFn) {
    this.changeIteration(function(action, e) {
      return action(mapFn(e));
    });
  });

  var FilterIterator = Iterator.inherit(function(parent, filterFn) {
    this.changeIteration(function(action, e) {
      if (filterFn(e)) {
        return action(e);
      }
    });
  });

  var ReverseIterator = Iterator.inherit(function(parent) {
    this.each = parent.reverseEach;
    this.reverseEach = parent.each;
  });

  var TakeIterator = Iterator.inherit(function(parent, count) {
    var i = 0;
    this.changeIteration(function(action, e) {
      var result = action(e);
      if (++i >= count) { return false; }
      return result;
    });
  });

  var DropIterator = Iterator.inherit(function(parent, count) {
    var i = 0;
    this.changeIteration(function(action, e) {
      if (i++ < count) { return; }
      return action(e);
    });
  });

  var SortIterator = Iterator.inherit(function(parent, sortFn) {
    this.each = function(action) {
      var sorted = parent.toArray();
      sorted.sort(function(x, y) { return compare(x, y, sortFn); });
      forEach(sorted, action);
    };

    this.reverseEach = function(action) {
      var sorted = parent.toArray();
      sorted.sort(function(x, y) { return compare(y, x, sortFn); });
      forEach(sorted, action);
    };
  });

  var UniqIterator = Iterator.inherit(function(parent, count) {
    var set = {};
    this.changeIteration(function(action, e) {
      if (e in set) { return; }
      set[e] = true;
      return action(e);
    });
  });

  var Generator = Iterator.inherit(function(generatorFn) {
    Iterator.call(this);

    this.each = function(action) {
      var i = 0;
      while (true) {
        if (action(generatorFn(i++)) === false) {
          break;
        }
      }
    };

    this.reverseEach = function(action) {
      throw "You cannot reverse a generated sequence.";
    };
  });

  global.Lazy = function(source) {
    return new Iterator(null, source);
  };

  global.Lazy.generate = function(iteratorFn) {
    return new Generator(iteratorFn);
  };

})(window);
