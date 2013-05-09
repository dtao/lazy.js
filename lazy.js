(function(global) {
  var Iterator = function(source) {
    var memoized;

    this.source = source;

    this.memoize = function() {
      if (!memoized) {
        memoized = this.toArray();
      }
      return memoized;
    };
  };

  Iterator.prototype.get = function(i) {
    return this.source ? this.source[i] : this.memoize()[i];
  };

  Iterator.prototype.length = function() {
    return this.source ? this.source.length : this.memoize().length;
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
      fn(this.get(i));
    }
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

  Iterator.prototype.reverse = function() {
    return new ReverseIterator(this);
  };

  Iterator.prototype.take = function(count) {
    return new TakeIterator(this, count);
  };

  var MapIterator = function(parent, mapFn) {
    Iterator.call(this);

    this.each = function(action) {
      parent.each(function(e) {
        action(mapFn(e));
      });
    };
  };
  MapIterator.prototype = Iterator.prototype;

  var FilterIterator = function(parent, filterFn) {
    Iterator.call(this);

    this.each = function(action) {
      parent.each(function(e) {
        if (filterFn(e)) {
          action(e);
        }
      });
    };
  };
  FilterIterator.prototype = Iterator.prototype;

  var ReverseIterator = function(parent) {
    Iterator.call(this);

    this.each = function(action) {
      parent.reverseEach(function(e) {
        action(e);
      });
    };

    this.reverseEach = function(action) {
      parent.each(function(e) {
        action(e);
      });
    };
  };
  ReverseIterator.prototype = Iterator.prototype;

  var TakeIterator = function(parent, count) {
    Iterator.call(this);

    this.each = function(action) {
      var i = 0;
      parent.each(function(e) {
        if (i >= count) {
          return false;
        }
        ++i;
        return action(e);
      });
    };
  };
  TakeIterator.prototype = Iterator.prototype;

  global.Lazy = function(source) {
    return new Iterator(source);
  };

})(window);
