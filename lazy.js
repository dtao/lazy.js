(function(global) {
  function inherit(base, fn) {
    var constructor = fn;
    constructor.prototype = base.prototype;
    return constructor;
  };

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

  var Iterator = function(parent, source) {
    var length, cached;

    this.parent = parent;
    this.source = source;

    this.get = function(i) {
      return this.source ? this.source[i] : this.parent.get(i);
    };

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

  Iterator.prototype.toArray = function() {
    var array = [];
    this.each(function(e) {
      array.push(e);
    });
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

  var MapIterator = inherit(Iterator, function(parent, mapFn) {
    Iterator.call(this, parent);
    this.changeIteration(function(action, e) {
      return action(mapFn(e));
    });
  });

  var FilterIterator = inherit(Iterator, function(parent, filterFn) {
    Iterator.call(this, parent);
    this.changeIteration(function(action, e) {
      if (filterFn(e)) {
        return action(e);
      }
    });
  });

  var ReverseIterator = inherit(Iterator, function(parent) {
    Iterator.call(this, parent);
    this.each = parent.reverseEach;
    this.reverseEach = parent.each;
  });

  var TakeIterator = inherit(Iterator, function(parent, count) {
    Iterator.call(this, parent);
    var i = 0;
    this.changeIteration(function(action, e) {
      var result = action(e);
      if (++i >= count) { return false; }
      return result;
    });
  });

  var DropIterator = inherit(Iterator, function(parent, count) {
    Iterator.call(this, parent);
    var i = 0;
    this.changeIteration(function(action, e) {
      if (i++ < count) { return; }
      return action(e);
    });
  });

  var SortIterator = inherit(Iterator, function(parent, sortFn) {
    Iterator.call(this, parent);

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

  var UniqIterator = inherit(Iterator, function(parent, count) {
    Iterator.call(this, parent);
    var set = {};
    this.changeIteration(function(action, e) {
      if (e in set) { return; }
      set[e] = true;
      return action(e);
    });
  });

  global.Lazy = function(source) {
    return new Iterator(null, source);
  };

})(window);
