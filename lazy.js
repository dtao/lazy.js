(function(global) {
  var Iterator = function(source) {
    this.source = source;
  };

  Iterator.prototype.each = function(fn) {
    for (var i = 0; i < this.source.length; ++i) {
      fn(this.source[i]);
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

  var MapIterator = function(parent, mapFn) {
    this.each = function(action) {
      parent.each(function(e) {
        action(mapFn(e));
      });
    };
  };
  MapIterator.prototype = Iterator.prototype;

  var FilterIterator = function(parent, filterFn) {
    this.each = function(action) {
      parent.each(function(e) {
        if (filterFn(e)) {
          action(e);
        }
      });
    };
  };
  FilterIterator.prototype = Iterator.prototype;

  global.Lazy = function(source) {
    return new Iterator(source);
  };

})(window);
