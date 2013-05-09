(function(global) {
  function override(base, name, override) {
    var orig = base[name];
    base["_" + name] = function() {
      return orig.apply(base, arguments);
    };
    base[name] = function() {
      return override.apply(base, arguments);
    };
  }

  function createIterator(source, overrides) {
    var index = -1;
    overrides = overrides || {};

    function get(i) {
      return source instanceof Array ? source[i] : source.get(i);
    }

    function length() {
      return source instanceof Array ? source.length : source.length();
    }

    var iterator = {
      get: get,

      length: length,

      moveNext: function() {
        if (index >= iterator.length() - 1) {
          return false;
        }
        ++index;
        return true;
      },

      getCurrent: function() {
        return iterator.get(index);
      }
    };

    for (var key in overrides) {
      override(iterator, key, overrides[key]);
    }

    iterator.map = function(mapper) {
      return createMapper(iterator, mapper);
    };

    iterator.filter = function(filter) {
      return createFilter(iterator, filter);
    };

    iterator.reverse = function() {
      return createReverse(iterator);
    };

    iterator.toArray = function() {
      var array = [];
      while (iterator.moveNext()) {
        array.push(iterator.getCurrent());
      }
      return array;
    }

    return iterator;
  };

  function createMapper(source, mapper) {
    return createIterator(source, {
      getCurrent: function() {
        return mapper(this._getCurrent());
      }
    });
  }

  function createFilter(source, filter) {
    return createIterator(source, {
      moveNext: function() {
        while (this._moveNext()) {
          if (filter(this.getCurrent())) {
            return true;
          }
        }
        return false;
      }
    });
  }

  function createReverse(source) {
    return createIterator(source, {
      get: function(i) {
        return this._get(this.length() - i - 1);
      }
    });
  }

  global.Lazy = function(source) {
    return createIterator(source);
  };

})(window);
