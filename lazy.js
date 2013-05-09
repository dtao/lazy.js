(function(global) {
  var Iterator = function(source, parent) {
    var memoized;

    this.source = source;
    this.parent = parent;

    this.memoize = function() {
      if (!memoized) {
        memoized = this.toArray();
      }
      return memoized;
    };
  };

  Iterator.prototype.get = function(i) {
    return this.source ? this.source[i] : this.parent.get(i);
  };

  Iterator.prototype.length = function() {
    return this.source ? this.source.length : this.parent.length();
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
      parent.each(function(e) { eachFn(action, e); });
    };
    this.reverseEach = function(action) {
      parent.reverseEach(function(e) { eachFn(action, e); });
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

  Iterator.prototype.uniq = function() {
    return new UniqIterator(this);
  };

  var MapIterator = function(parent, mapFn) {
    Iterator.call(this, null, parent);

    this.changeIteration(function(action, e) {
      return action(mapFn(e));
    });
  };

  var FilterIterator = function(parent, filterFn) {
    Iterator.call(this, null, parent);

    this.changeIteration(function(action, e) {
      if (filterFn(e)) {
        return action(e);
      }
    });
  };

  var RejectIterator = function(parent, rejectFn) {
    Iterator.call(this, null, parent);
  };

  var ReverseIterator = function(parent) {
    Iterator.call(this, null, parent);

    this.each = parent.reverseEach;
    this.reverseEach = parent.each;
  };

  var TakeIterator = function(parent, count) {
    Iterator.call(this, null, parent);

    var i = 0;
    this.changeIteration(function(action, e) {
      if (i++ >= count) { return false; }
      return action(e);
    });
  };

  var DropIterator = function(parent, count) {
    Iterator.call(this, null, parent);

    var i = 0;
    this.changeIteration(function(action, e) {
      if (i++ < count) { return; }
      return action(e);
    });
  };

  var UniqIterator = function(parent, count) {
    Iterator.call(this, null, parent);

    var set = {};
    this.changeIteration(function(action, e) {
      if (e in set) { return; }
      set[e] = true;
      return action(e);
    });
  };

  MapIterator.prototype = Iterator.prototype;
  FilterIterator.prototype = Iterator.prototype;
  ReverseIterator.prototype = Iterator.prototype;
  TakeIterator.prototype = Iterator.prototype;
  DropIterator.prototype = Iterator.prototype;
  UniqIterator.prototype = Iterator.prototype;

  global.Lazy = function(source) {
    return new Iterator(source);
  };

})(window);
