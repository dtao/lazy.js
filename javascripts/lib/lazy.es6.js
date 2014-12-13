(function(context) {

  var Lazy = context.Lazy;

  if (typeof Lazy === 'undefined' && typeof require === 'function') {
    Lazy = require('../lazy.js');
  }

  var GeneratorConstructor = (function() {
    try {
      return eval('(function*() {})').constructor;

    } catch (e) {
      // If the above throws a SyntaxError, that means generators aren't
      // supported on the current platform, which means isES6Generator should
      // always return false. So we'll return an anonymous function here, so
      // that instanceof checks will always return false.
      return function() {};
    }
  }());

  /**
   * Checks whether a function is an ES6 Harmony generator.
   *
   * @private
   * @param {Function} fn
   * @returns {boolean}
   */
  function isES6Generator(fn) {
    return fn instanceof GeneratorConstructor;
  }

  /**
   * @constructor
   */
  function GeneratorWrapper(generator) {
    this.generator = generator;
  }

  GeneratorWrapper.prototype = new Lazy.Sequence();

  GeneratorWrapper.prototype.each = function each(fn) {
    var iterator = this.generator(),
        result,
        i = 0;

    while (!(result = iterator.next()).done) {
      if (fn(result.value, i++) === false) {
        return false;
      }
    };
  };

  /**
   * Checks whether an object is an ES6 Map.
   *
   * @private
   * @param {*} object
   * @returns {boolean}
   */
  function isES6Map(object) {
    return context.Map && object instanceof context.Map;
  }

  /**
   * @constructor
   */
  function MapWrapper(map) {
    this.map = map;
  }

  MapWrapper.prototype = new Lazy.ObjectLikeSequence();

  MapWrapper.prototype.each = function each(fn) {
    var map = this.map;

    for (var pair of map) {
      if (fn(pair[0], pair[1]) === false) {
        return false;
      }
    }

    return true;
  };

  /**
   * Checks whether an object is an ES6 Set.
   *
   * @private
   * @param {*} object
   * @returns {boolean}
   */
  function isES6Set(object) {
    return context.Set && object instanceof context.Set;
  }

  /**
   * @constructor
   */
  function SetWrapper(set) {
    this.set = set;
  }

  SetWrapper.prototype = new Lazy.Sequence();

  SetWrapper.prototype.each = function each(fn) {
    var set = this.set;

    for (var item of set) {
      if (fn(item) === false) {
        return false;
      }
    }

    return true;
  };

  /**
   * Checks whether an object is an ES6 Iterator.
   *
   * @private
   * @param {*} object
   * @returns {boolean}
   */
  function isES6Iterator(object) {
    return context.Iterator && object instanceof context.Iterator;
  }

  /**
   * @constructor
   */
  function IteratorWrapper(iterable) {
    this.iterable = iterable;
  }

  IteratorWrapper.prototype = new Lazy.Sequence();

  IteratorWrapper.prototype.each = function each(fn) {
    var iterable = this.iterable;

    for (var item of iterable) {
      if (fn(item) === false) {
        return false;
      }
    }

    return true;
  };

  /*
   * Add support for `Lazy(Map)`, `Lazy(Set)`, and `Lazy(GeneratorFunction)`.
   */
  Lazy.extensions || (Lazy.extensions = []);

  Lazy.extensions.push(function(source) {
    if (isES6Generator(source)) {
      return new GeneratorWrapper(source);

    } else if (isES6Map(source)) {
      return new MapWrapper(source);

    } else if (isES6Set(source)) {
      return new SetWrapper(source);

    } else if (isES6Iterator(source)) {
      return new IteratorWrapper(source);
    }
  });

  /*
   * Also add `Lazy.isES6Generator` for convenience.
   */
  Lazy.isES6Generator = isES6Generator;

}(typeof global !== 'undefined' ? global : this));
