/**
 * boiler.js v0.9.0
 * https://github.com/Xaxis/boiler.js
 * http://www.boilerjs.com
 * (c) 2012-2013 Wil Neeley, Trestle Media, LLC.
 * boiler.js may be freely distributed under the MIT license.
 **/
(function (exports) {
  var

  // Global root object (window or global)
  root = this,

  // Save conflict reference
  previousLib = root._,

  // Library definition
  _ = function (obj) {
    this._bound = arguments;
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(_.toArray(arguments));
  };

  // Library version
  _._version = "0.9.0";

  // Export library
  exports._ = _;

  /* ARRAY METHODS */

  _.at = function (arr, index) {
    index = _.isArray(index) ? _.keys(index) : index;
    return _.filter(arr, function(v, i) {
      if (i == index || _.contains(index, i.toString())) return true;
    });
  };

  _.difference = function (arr) {
    var rest = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1));
    return _.filter(_.uniq(arr), function (v) { return !_.inArray(rest, v); });
  };

  _.first = _.take = function (arr, n) {
    return n ? Array.prototype.slice.call(arr, 0, n) : arr[0];
  };

  _.indexOf = _.firstIndexOf = function (arr, value, from, deep) {
    if (arr == null) return -1;
    var deep = deep || _.isBool(from) ? from : false, from = _.isNumber(from) ? from : 0, i = 0;
    if (arr.indexOf && !deep) return arr.indexOf(value, from);
    for (; i < arr.length; i++) {
      if (deep && _.isEqual(arr[i], value) && i >= from) return i;
      else if (arr[i] === value && i >= from) return i;
    }
    return -1;
  };

  _.initial = function (arr, n) {
    var m = n ? arr.length - n : arr.length - 1;
    return _.filter(arr, function(v, i) { if (i < m) return true; });
  };

  _.intersection = function (arr) {
    var arrs = Array.prototype.slice.call(arguments, 1);
    return _.filter(_.uniq(arr), function (v) {
      return _.all(arrs, function (alt) {
        return _.indexOf(alt, v, true) != -1;
      });
    });
  };

  _.last = function (arr, n) {
    return n ? Array.prototype.slice.call(arr, arr.length-n, arr.length) : arr[arr.length-1];
  };

  _.lastIndexOf = function (arr, value, from, deep) {
    if (arr == null) return -1;
    var deep = deep || _.isBool(from) ? from : false, from = _.isNumber(from) ? from : arr.length;
    if (arr.lastIndexOf && !deep) return arr.lastIndexOf(value, from);
    while (--from) {
      if (deep && _.isEqual(arr[from], value)) return from;
      else if (arr[from] === value) return from;
    }
    return -1;
  };

  _.object = _.toObject = function () {
    var arrs = [], ret = {}, allArrays = true, i = 0;
    _.each(arguments, function (value) {
      if (_.isArray(value)) arrs.push(value);
      else allArrays = false;
    });
    if (allArrays && arrs.length === 2) {
      var keys = arrs[1];
      for (; i < arrs[0].length; i++) {
        ret[arrs[0][i]] = keys[i];
      }
    } else if (allArrays && arrs.length > 1) {
      for (; i < arrs.length; i++) {
        var key = arrs[i][0];
        ret[key] = arrs[i][1];
      }
    } else if (allArrays && arrs.length == 1) {
      for (; i < arrs[0].length; i += 2) {
        ret[arrs[0][i]] = arrs[0][i + 1];
      }
    } else {
      for (; i < arguments.length; i+=2) {
        ret[arguments[i]] = arguments[i+1];
      }
    }
    return ret;
  };

  _.remove = function (col, value) {
    if (col instanceof Array) {
      var key, i = col.length;
      while (i--) { if ((key = _.indexOf(col, value, true)) !== -1) col.splice(key, 1); }
    }
    return col;
  };

  _.rest = _.tail = function (arr, n) {
    var m = n || 1;
    return _.filter(arr, function(v, i) { if (i >= m) return true; });
  };

  _.union = function () {
    return _.uniq(Array.prototype.concat.apply(Array.prototype, arguments));
  };

  _.uniq = _.unique = function (arr, fn, scope) {
    var seen = [];
    return _.filter(_.isFunction(fn) ? _.map(arr, fn, scope) : arr, function (v) {
      if (_.indexOf(seen, v, true) === -1) {
        seen[seen.length] = v;
        return true;
      }
    });
  };

  _.without = _.exclude = function (arr, values) {
    return _.filter(arr, function (v) { if (!_.contains(values, v)) return true; });
  };

  _.zip = function (arr) {
    var i = 0, ret = [],
    arrs = Array.prototype.slice.call(arguments, 0);
    for (; i < arr.length; i++) { ret[i] = _.pluck(arrs, "" + i); }
    return ret;
  };

  /* COLLECTION METHODS */

  _.add = function (col, key, value, deep) {
    var start = true, type = _.isArray(col) ? true : false;
    _.deep({obj: col, fn:function(d,i,v) {
      if (start) {
        if (!(key in col)) col[key] = value;
        start = false;
      }
      if (((_.isArray(v) && type) || (_.isPlainObject(v) && !type)) && deep) {
        if (!(key in v)) v[key] = value;
      }
    }, depth: deep ? '*' : 1});
    return col;
  };

  _.all = _.every = function (col, fn, scope, deep) {
    var ret = true, deep = _.isBool(scope) ? scope : deep;
    _.deep(col, function(depth, index, value) {
      if (deep) {
        if (!_.isArray(value) && !_.isPlainObject(value)) {
          if (!fn.call(!_.isBool(scope) ? (scope || this) : this, value, index)) ret = false;
        }
      } else {
        if (!fn.call(!_.isBool(scope) ? (scope || this) : this, value, index)) ret = false;
      }
    }, deep ? '*' : 1);
    return ret;
  };

  _.any = _.some = function (col, fn, scope, deep) {
    var ret = false, deep = _.isBool(scope) ? scope : deep;
    _.deep(col, function(depth, index, value) {
      if (fn.call(!_.isBool(scope) ? (scope || this) : this, value, index) ) {
        if (!ret) ret = true;
        ret = true;
      }
    }, deep ? '*' : 1);
    return ret;
  };

  _.average = function (col, fn, deep) {
    var sumTotal = 0, deep = deep || _.isBool(fn) ? fn : false, iterator = _.isFunction(fn);
    _.deep(col, function (depth, index, value, ref) {
      if (_.isNumber(value)) sumTotal += iterator ? fn.call(this, value, index, ref) : value;
    }, deep ? "*" : 1);
    return sumTotal / _.len(col, deep);
  };

  _.clear = function (col) {
    if (_.isArray(col)) col.length = 0;
    else _.each(col, function (value, index) { delete col[index]; });
    return col;
  };

  _.clone = function (col, fn, deep) {
    var deep = _.isBool(fn) ? fn : deep, ret = _.isArray(col) ? [] : {}, iterator = _.isFunction(fn), i;
    for (i in col) {
      if (typeof col[i] == 'object' && deep) ret[i] = _.clone(col[i], fn, deep);
      else ret[i] = iterator ? fn.call(this, col[i]) : col[i];
    }
    return ret;
  };

  _.compact = function (col, all) {
    return _.filter(col, function(v) {
      if (all && !_.isFalsy(v) && !_.isEmpty(v)) return true;
      else if (!all && !_.isFalsy(v)) return true;
    });
  };

  _.contains = _.inArray = function (col, value, deep) {
    return _.isEqual(_.find(col, function (v) {
      return _.isEqual(v, value) ? true : false;
    }, deep), value);
  };

  _.count = function (col, fn, scope, deep) {
    var ret = 0, deep = _.isBool(scope) ? scope : deep;
    _.deep(col, function(depth, index, value) {
      if (deep) {
        if (!_.isArray(value) && !_.isPlainObject(value) ) {
          if (fn.call(!_.isBool(scope) ? (scope || this) : this, value, index)) ret++;
        }
      } else {
        if (fn.call(!_.isBool(scope) ? (scope || this) : this, value, index)) ret++;
      }
    }, deep ? '*' : 1);
    return ret;
  };

  _.countBy = function (col, map, scope) {
    return _.groupBy(col, map, scope || this, true);
  };

  _.deep = function (col, fn, depth) {
    var obj = col.obj || col,
        fn = col.fn || fn,
        depth = col.depth || (depth || '*'),
        args = col.args || [],
        noArrays = col.noArrays || false,
        noObjects = col.noObjects || false,
        retType = col.retType || false,
        ret = col.ret || [];
    for (var o in obj) {
      args.unshift(depth, o, obj[o], obj);
      if (fn.apply(this, args)) ret.push(obj[o]);
      if ((_.isPlainObject(obj[o]) && !noObjects) || (_.isArray(obj[o]) && !noArrays)) {
        depth = depth == '*' ? '*' : depth - 1;
        args.splice(0, 4);
        if (depth > 0 || depth === '*') {
          _.deep({obj:obj[o], fn:fn, depth:depth, args:args, noArrays:noArrays, noObjects:noObjects, ret: ret});
        }
      }
      args.splice(0, 4);
    }
    return retType ? obj : ret;
  };

  _.each = _.forEach = function (col, fn, scope) {
    if (col == null) return;
    if (col.forEach) {
      col.forEach(fn, scope);
    } else if (col instanceof Array) {
      for (var i = 0; i < col.length; i++) {
        if (fn.call(scope || col[i], col[i], i, col) === false) return;
      }
    } else {
      for (var key in col) {
        if (_.has(col, key)) {
          if (fn.call(scope || col[key], col[key], key, col) === false) return;
        }
      }
    }
  };

  _.empty = function (col, deep) {
    var ref = null;
    _.deep(col, function(d, index, value, r) {
      if (deep) {
        if (ref == null) ref = r;
        if (_.isPlainObject(value) || _.isArray(value)) ref = value;
        else ref[index] = undefined;
      } else {
        col[index] = undefined;
      }
    }, deep ? '*' : 1);
    return col;
  };

  _.filter = function (col, fn, scope) {
    var ret = [];
    if (col == null) return ret;
    if (col.filter) {
      return col.filter(fn, scope);
    } else if (col instanceof Array) {
      for (var i = 0; i < col.length; i++) {
        if (fn.call(scope || col[i], col[i], i, col)) ret[ret.length] = col[i];
      }
    } else {
      for (var key in col) {
        if (_.has(col, key)) {
          if (fn.call(scope || col[key], col[key], key, col)) ret[ret.length] = col[key];
        }
      }
    }
    return ret;
  };

  _.find = _.findValue = function (col, fn, scope, deep, mode) {
    deep = _.isBool(scope) ? scope : deep;
    var res = _.deep({obj: col, fn: function(d,i,v) {
      if (fn.call(scope ? scope : this, mode === "key" ? i : v)) return true;
    }, depth: deep ? '*' : 1});
    return res.length >= 1 ? res[0] : undefined;
  };

  _.findKey = _.findIndex = function (col, fn, scope, deep) {
    deep = deep || _.isBool(scope) ? scope : deep;
    return _.find(col, fn, scope || this, deep, "key");
  };

  _.flatten = function (col, n) {
    var ret = [], n = n || '*', nested;
    _.deep(col, function (depth, index, elm) {
      nested = !_.isArray(elm) && !_.isPlainObject(elm)
      if (depth == '*') {
        if (nested) ret.push(elm);
      } else if (depth > 1) {
        if (nested) ret.push(elm);
      } else {
        ret.push(elm);
      }
    }, n);
    return ret;
  };

  _.getByType = function (col, type, deep) {
    deep = deep || _.isBool(type) ? type : false;
    type = !_.isString(type) ? '*' : _.isString(type) ? type : undefined;
    return _.deep({obj: col, fn: function(d, index, value) {
      if (_.type(value) == type || type == '*') return true;
    }, depth: deep ? '*' : 1});
  };

  _.groupBy = function (col, map, scope, count) {
    count = count || _.isBool(scope) ? scope : false;
    var res = {};
    _.each(col, function (value, index) {
      var key = _.isString(map) ? value[map] : map.call(scope || this, value, index, col);
      if (_.has(res, key)) res[key].push(value);
      else res[key] = [value];
    });
    if (count) { _.each(res, function (value, index) { res[index] = value.length; }); }
    return res;
  };

  _.groupsOf = function (col, n, pad) {
    var res = [], i = 1, key;
    _.each(col, function (index, value) {
      if ( (key in res) && i < n ) {
        res[key].push(value);
        i += 1;
      } else {
        key = _.len(res);
        res[key] = [value];
        i = 1;
      }
    });
    if (pad) {
      _.each(res, function (value, index) {
        if (value.length < n) for (i = value.length; i < n; i++) { res[index].push(pad); }
      });
    }
    return res;
  };

  _.has = _.keyExists = function (col, key, deep) {
    return !deep && Object.hasOwnProperty ? hasOwnProperty.call(col, key) : _.findKey(col, function (index) {
      return !!(key == index);
    }, deep) ? true : false;
  };

  _.invert = function (col) {
    var inverted = {}, i = -1, keys = Object.keys(col);
    while (++i < keys.length) { inverted[col[keys[i]]] = keys[i]; }
    return inverted;
  };

  _.invoke = function (col, fn, args) {
    var args = args || [], ret;
    return _.map(col, function (value) {
      args.unshift(value);
      ret = (_.isFunction(fn) ? fn : value[fn]).apply(value, args);
      args.shift();
      return ret;
    });
  };

  _.isEmpty = function (col) {
    return ((_.isPlainObject(col) && _.len(col) === 0) || (_.isArray(col) && col.length === 0 ));
  };

  _.isUnique = function (col, key) {
    if (key in col) {
      for (var o in col) { if (_.isEqual(col[key], col[o]) && o !== key.toString()) return false; }
    }
    return true;
  };

  _.keys = function (col, deep) {
    if (!deep && Object.keys) {
      return Object.keys(col);
    } else {
      var keys = [];
      for (var o in col) { keys.push(o); }
      return deep ? _.keys(_.paths(col)) : keys;
    }
  };

  _.least = function (col, fn, most) {
    var comparator, result, ret, leastValue;
    if (_.isString(fn)) {
      result = _.countBy(col, function (p) { return p[fn]; });
      comparator = _.countBy(col, function (p) { return p[fn]; }, this, true);
    }
    else {
      result = _.countBy(col, fn || function (num) { return num; });
      comparator = _.countBy(col, fn || function (num) { return num; }, this, true);
    }
    leastValue = most ? _.max(result) : _.min(result);
    _.each(result, function (value, index) {
      if (leastValue == value) {
        ret = index;
        return false;
      }
    });
    return ret;
  };

  _.len = function (col, deep, count) {
    var count = count ? (count += _.keys(col).length) : _.keys(col).length;
    if (deep) {
      for (var o in col) {
        if (_.isPlainObject(col[o]) || _.isArray(col[o])) {
          var ret = _.len(col[o], deep, count);
          if (_.type(col[o]) === "array") return ret - 1;
          else if (_.type(col[o]) === "object") return ret;
        }
      }
    }
    return count;
  };

  _.map = _.collect = function (col, fn, scope, deep) {
    deep = deep || _.isBool(scope) ? scope : false;
    var ret = [];
    _.each(deep ? _.flatten(col) : col, function(value, index, ref) {
      ret.push(fn.call(scope || this, value, index, ref));
    });
    return ret;
  };

  _.max  = function (col, fn, deep) {
    var maxVals = [], deep = deep || _.isBool(fn) ? fn : false, iterator = _.isFunction(fn);
    _.deep(col, function (depth, index, value, ref) {
      if (_.isNumber(value)) maxVals.push(iterator ? fn.call(this, value, index, ref) : value);
    }, deep ? "*" : 1);
    return Math.max.apply(this, maxVals);
  };

  _.min  = function (col, fn, deep) {
    var minVals = [], deep = deep || _.isBool(fn) ? fn : false, iterator = _.isFunction(fn);
    _.deep(col, function(depth, index, value, ref) {
      if (_.isNumber(value)) minVals.push(iterator ? fn.call(this, value, index, ref) : value);
    }, deep ? "*" : 1);
    return Math.min.apply(this, minVals);
  };

  _.most = function (obj, fn) {
    return _.least(obj, fn, true);
  };

  _.none = function (col, fn, scope, deep) {
    deep = deep || _.isBool(scope) ? scope : false;
    var ret = true;
    _.deep(col, function(d,i,v) {
      if (fn.call(scope ? scope : this, v, i)) ret = false;
    }, deep ? '*' : 1);
    return ret;
  };

  _.omit = _.blacklist = function (col, list) {
    var props = _.isArray(list) ? list : [list];
    return _.filter(col, function(value, index) {
      if (!(index in props) && !(_.inArray(props, index))) return value;
    });
  };

  _.only = _.whitelist = function (col, list) {
    var list = _.isString(list) ? list.split(" ") : list;
    return _.filter(col, function (value, index) {
      if (_.inArray(list, index)) return true;
    });
  };

  _.paths = function (col, keys, noEnum, pathObj, lastKey, nextKey) {
    var o, keys = keys || false, pathObj = pathObj || {}, lastKey = lastKey || "", nextKey = nextKey || "",
        props = noEnum ? Object.getOwnPropertyNames(col) : _.keys(col);
    for (o = 0; o < props.length; o++) {
      if (keys) pathObj[props[o]] = (nextKey + "." + lastKey + "." + props[o]).replace(/^[.]+/g, "");
      else pathObj[(nextKey + "." + lastKey + "." + props[o]).replace(/^[.]+/g, "")] = col[props[o]];
      if (_.isPlainObject(col[props[o]]) || _.isArray(col[props[o]])) {
        _.paths(col[props[o]], keys, noEnum, pathObj, props[o], nextKey + "." + lastKey);
      }
    }
    return pathObj;
  };

  _.reduce = _.foldl = function (col, fn, scope, right) {
    var copy = col, i = 0, base, keys, vals;
    if (right) {
      if (_.isPlainObject(copy)) {
        keys = _.keys(copy).reverse();
        vals = _.values(copy).reverse();
        copy = _.object(keys, vals);
      } else if (_.isArray(copy)) {
        copy = copy.reverse();
      }
    }
    base = _.find(copy, function (value) { return value; });
    _.each(copy, function (value, index) {
      if (i !== 0) base = fn.call(scope || this, base, value, index);
      i++;
    });
    return _.isArray(base) ? base[0] : base;
  };

  _.reduceRight = _.foldr = function (col, fn, scope) {
    return _.reduce(_.values(col), fn, scope || this, true);
  };

  _.reject = function (col, fn, scope) {
    return _.filter(col, function(v, i, r) {
      return !fn.call(scope || this, v, i, r);
    }, scope || this);
  };

  _.replace = function (col, fn, scope, deep) {
    var deep = _.isBool(scope) ? scope : deep, ref = col, scope = !_.isBool(scope) ? scope : this;
    return _.deep({obj:col, fn: function(d,i,v) {
      if (deep) {
        if (_.isPlainObject(v) || _.isArray(v)) ref = v;
        else ref[i] = fn.call(scope, v);
      } else {
        ref[i] = fn.call(scope, v);
      }
    }, depth: deep ? '*' : 1, retType: true});
  };

  _.sample = function (col, n, deep) {
    var ret = [], i;
    for (i = n || 1; i > 0; i--) { ret.push(_.shuffle(deep ? _.flatten(col) : col)[0]); }
    return ret;
  };

  _.set = function (col, key, value, deep) {
    var start = true, type = _.isArray(col) ? true : false;
    _.deep({obj: col, fn:function(d,i,v) {
      if (start) {
        col[key] = value;
        start = false;
      }
      if (((_.isArray(v) && type) || (_.isPlainObject(v) && !type)) && deep) {
        v[key] = value;
      }
    }, depth: deep ? '*' : 1});
    return col;
  };

  _.setUndef = function (col, value, deep) {
    return _.deep({obj:col, fn:function (d, index, v, ref) {
      if (_.isUndefined(v)) ref[index] = value;
    }, depth: deep ? '*' : 1, retType: true});
  };

  _.shuffle  = function (col) {
    var ret, i, n, copy;
    ret = _.isPlainObject(col) ? _.toArray(col) : col;
    for (i = ret.length - 1; i > 0; i--) {
      n = Math.floor(Math.random() * (i + 1));
      copy = ret[i];
      ret[i] = ret[n];
      ret[n] = copy;
    }
    return ret;
  };

  _.size = function (col, deep, count) {
    count = count ? count : 0;
    _.each(_.values(col), function (value) { if (!_.isFalsy(value)) count += 1; });
    if (deep) {
      for (var o in col) {
        if (_.isPlainObject(col[o]) || _.isArray(col[o])) {
          var ret = _.size(col[o], deep, count);
          if (_.type(col[o]) === "array") return ret - 1;
          else if (_.type(col[o]) === "object") return ret;
        }
      }
    }
    return count;
  };

  _.sortBy = function (col, fn, scope) {
    var iterator = _.isFunction(fn) ? fn : function(v, i, r) {
      var type = typeof r[i];
      if (type == 'array' || type == 'object') return _.resolve(r[i], fn);
      else return v[fn];
    };
    return _.pluck(_.map(col, function (value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(scope || this, value, index, list)
      };
    }).sort(function (left, right) {
      var x = left.criteria;
      var y = right.criteria;
      if (x !== y) {
        if (x > y || x === void 0) return 1;
        if (x < y || y === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  _.sum = function (col, deep) {
    var ret = 0;
    _.deep(col, function (depth, index, value) {
      if (_.isNumber(value)) ret += value;
    }, deep ? "*" : 1);
    return ret;
  };

  _.tap = function (col, fn, scope) {
    return fn.call(scope || this, col);
  };

  _.where = function (col, matches, find) {
    return _[find ? 'find' : 'filter'](col, function (value) {
      for (var key in matches) { if (matches[key] !== value[key]) return false; }
      return true;
    });
  };

  _.whereFirst = function (col, matches) {
    return _.where(col, matches, true);
  };

  _.values = function (col, deep) {
    var vals = [];
    for (var o in col) { vals.push(col[o]); }
    return deep ? _.values(_.paths(col)) : vals;
  };

  /* FUNCTION METHODS */

  _.after = function (fn, n) {
    fn.n = fn.after = n;
    return function () {
      if (fn.n > 1) {
        fn.n--;
      } else {
        fn.apply(this, arguments);
        fn.n = fn.after;
      }
    };
  };

  _.bind = function (fn, scope, args) {
    args = args || _.isArray(scope) ? scope : [];
    return function () {
      for (var i = 0; i < arguments.length; i++) { args.push(arguments[i]); }
      return fn.apply(scope, args);
    };
  };

  _.bindAll = function (obj, methods) {
    if (arguments.length === 1 && obj) {
      _.each(obj, function (v, f) { if (_.isFunction(obj[f])) obj[f] = _.bind(obj[f], obj); });
    } else if (arguments.length === 2) { _.each(args.methods, function (v, f) { obj[f] = _.bind(obj[f], obj); }); }
    return obj;
  };

  _.compose = function () {
    var fns = _.filter(_.toArray(arguments), function(value) { if (_.isFunction(value)) return true; });
    return function () {
      var args = arguments;
      for (var i = fns.length - 1; i >= 0; i--) { args = [fns[i].apply(this, args)]; }
      return args[0];
    };
  };

  _.debounce = function (fn, n, edge) {
    var res, timeout;
    return function () {
      var scope = this, fargs = arguments;
      var next = function () {
        timeout = null;
        if (!edge) res = fn.apply(scope, fargs);
      };
      var ready = edge && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(next, n);
      if (ready) res = fn.apply(scope, fargs);
      return res;
    };
  };

  _.defer = function (fn) {
    return _.delay.call(this, fn, 0);
  };

  _.delay = function (fn, ms) {
    return function () {
      var args = arguments;
      setTimeout(function () {
        return fn.apply(null, args);
      }, ms);
    }
  };

  _.fill = _.partial = function (fn) {
    var args = [];
    for (var i = 1; i < arguments.length; i++) { args.push(arguments[i]); }
    return function () {
      for (var i = 0; i < arguments.length; i++) { args.push(arguments[i]); }
      return fn.apply(this, args);
    };
  };

  _.memoize = function (fn, hash) {
    var cache = {};
    hash = hash || (hash = _.identity);
    return function () {
      var key = hash.apply(this, arguments);
      return (key in cache) ? cache[key] : (cache[key] = fn.apply(this, arguments));
    };
  };

  _.once = function (fn) {
    fn.n = fn.once = 1;
    return function () {
      if (fn.n) {
        fn.n--;
        return fn.apply(this, arguments);
      }
    };
  };

  _.throttle = function (fn, ms) {
    var scope, last, timeout, fargs, ret, res, later;
    later = function () {
      last = new Date;
      timeout = null;
      ret = fn.apply(scope, fargs);
    };
    return function () {
      var now = new Date();
      var left = ms - (now - last);
      scope = this;
      fargs = arguments;
      if (left <= 0) {
        clearTimeout(timeout);
        timeout = null;
        last = now;
        res = fn.apply(scope, fargs);
      } else if (!timeout) {
        timeout = setTimeout(later, left);
      }
      return res;
    }
  };

  _.times = function (fn, n) {
    fn.n = n;
    return function () { for (var i = 0; i < fn.n; i++) { fn.apply(this, arguments); } };
  };

  _.wrap = function (fn, wrapper) {
    return function () {
      var args = [fn];
      args.push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  /* NUMBER METHODS */

  _.range = function (start, stop, step) {
    var i = 0, ret = [];
    step = step || 1;
    stop = stop || start;
    start = (arguments.length == 1) ? 0 : start;
    var len = Math.max(Math.ceil((stop - start) / step), 0);
    while (i < len) {
      ret[i++] = start;
      start += step;
    }
    return ret;
  };

  _.uniqueId = function(prefix) {
    var prefix = prefix || "", self = _.uniqueId;
    if (!('uuids' in self)) self.uuids = [];
    var newId = prefix + Math.floor((1 + Math.random()) * 0x10000).toString(10).substring(1);
    if (!_.inArray(self.uuids, newId)) {
      self.uuids.push(newId);
      return newId;
    } else {
      _.uniqueId();
    }
  };

  /* OBJECT METHODS */

  _.array = _.toArray = function () {
    var ret = [];
    if (arguments.length > 1) {
      for (var i = 0; i < arguments.length; i++) {
        _.each(arguments[i], function (value) { ret.push(value); });
      }
    } else {
      _.each(arguments[0], function (value) { ret.push(value); });
    }
    return ret;
  };

  _.defaults = function (obj, defaults) {
    _.each(defaults, function (value, index) {
      if (!(index in obj)) { obj[index] = value;
      } else if (index in obj) { if (_.isNull(obj[index]) || _.isUndefined(obj[index])) obj[index] = value; }
    });
    return obj;
  };

  _.extend = _.merge = function () {
    var keys = [], objs,
        target, obj, copy, key, i, deep;

    // Collect potential objects to merge
    objs = _.filter(_.toArray(arguments), function (value) {
      if (_.isBool(value)) deep = value;
      if (_.isPlainObject(value)) return value;
    });

    // Shift target off of the `objs` array
    target = objs.shift();

    // When TRUE is passed perform deep iteration on target
    if (deep) {

      // Build property reference used to prevent never ending loops
      _.each(objs, function (value) {
        keys.push(_.keys(value));
        keys = _.flatten(keys);
      });

      // Add properties to all nested objects
      _.deep(target, function (depth, index, obj) {
        if (_.indexOf(keys, index) === -1) {
          for (i = 0; i < objs.length; i++) {
            for (key in objs[i]) {
              if (_.isPlainObject(obj)) {
                copy = objs[i][key];
                obj[key] = copy;
              }
            }
          }
        }
      }, "*");
    }

    // Merge first level properties after going deep
    for (i = 0; i < objs.length; i++) {
      if (( obj = objs[i] ) !== null) {
        for (key in obj) {
          copy = obj[key];
          if (target === copy) continue;
          target[key] = copy;
        }
      }
    }
    return target;
  };

  _.get = function (obj, key) {
    return _.deep(obj, function(d,i) { if (key == i) return true; })[0];
  };

  _.howDeep = function (obj, key) {
    var paths = _.paths(obj, true);
    if (key && (key in paths)) {
      return paths[key].split(".").length;
    } else {
      var objs = _.getByType(obj, '*', true);
      for (var o in objs) {
        if (_.isEqual(obj, objs[o])) return _.howDeep(obj, _.keys(objs[o])[0]);
      }
    }
  };

  _.isArguments = function (obj) {
    return {}.toString.call(obj) === "[object Arguments]";
  };

  _.isArray = function (obj) {
    return {}.toString.call(obj) === "[object Array]";
  };

  _.isBool = function (obj) {
    return {}.toString.call(obj) === "[object Boolean]";
  };

  _.isDate = function (obj) {
    return {}.toString.call(obj) === "[object Date]" || obj instanceof Date;
  };

  _.isElement = function (obj) {
    return obj ? obj.nodeType === 1 : false;
  };

  _.isEqual = function (obj1, obj2) {

    // Quick compare objects that don't have nested objects
    if (_.type(obj1) === _.type(obj2) && !_.isPlainObject(obj1) && !_.isArray(obj1)) {
      switch (_.type(obj1)) {
        case "function" :
          if (obj1.toString() !== obj2.toString()) return false;
          break;
        case "nan" :
          if (obj1 === obj2) return false;
          break;
        default:
          if (obj1 !== obj2) return false;
      }
    } else {

      // When target or comparison is falsy we compare them directly
      if (_.isFalsy(obj1) || _.isFalsy(obj2)) {
        if (obj1 !== obj2) return false;
      }
      for (var o in obj1) {
        switch (true) {

          // Catch comparison of element first to prevent infinite loop when caught as objects
          case ( _.isElement(obj1[o]) ) :
            if (obj1[o] !== obj2[o]) return false;
            break;
          case ( _.isNaN(obj1[o]) ) :
            if (!_.isNaN(obj2[o])) return false;
            break;
          case ( typeof obj1[o] === "object" ) :
            if (!_.isEqual(obj1[o], obj2[o])) return false;
            break;
          case ( typeof obj1[o] === "function" ) :
            if (!_.isFunction(obj2[o])) return false;
            if (obj1[o].toString() !== obj2[o].toString()) return false;
            break;
          default :
            if (obj1[o] !== obj2[o]) return false;
        }
      }

      // Reverse comparison of `obj2`
      for (var o in obj2) {
        if (typeof obj1 === "undefined") return false;
        if (obj1 === null || obj1 === undefined) return false;
        if (_.isFalsy(obj1[o])) {
          if (_.isNaN(obj1[o])) {
            if (!_.isNaN(obj2[o])) return false;
          } else if (obj1[o] !== obj2[o]) return false;
        }
      }
    }
    return true;
  };

  _.isFalsy = function (obj) {
    return (_.isUndefined(obj) || _.isNull(obj) || _.isNaN(obj) ||
      obj === "" || obj === 0 || (_.isBool(obj) && Boolean(obj) === false));
  };

  _.isInfinite = function (obj) {
    return obj === Infinity || obj === -Infinity;
  };

  _.isFunction = function (obj) {
    return {}.toString.call(obj) === "[object Function]";
  };

  _.isNaN = function (obj) {
    return typeof obj === "number" && obj !== obj;
  };

  _.isNull = function (obj) {
    return {}.toString.call(obj) === "[object Null]";
  };

  _.isNumber = function (obj) {
    return {}.toString.call(obj) === "[object Number]";
  };

  _.isObject = function (obj) {
    return typeof obj === "object";
  };

  _.isPlainObject = function (obj) {
    return typeof obj === "object" && {}.toString.call(obj) === "[object Object]";
  };

  _.isRegExp = function (obj) {
    return {}.toString.call(obj) === "[object RegExp]" || obj instanceof RegExp;
  };

  _.isString = function (obj) {
    return typeof obj === "string" && {}.toString.call(obj) === "[object String]";
  };

  _.isUndefined = function (obj) {
    return typeof obj === "undefined";
  };

  _.module = _.build = function (ns, obj) {
    var list = ns ? ns.split(".") : [], ns = list ? list.shift() : (ns || ""), obj = obj || {};
    obj[ns] = {};
    if (list.length) _.module(list.join('.'), obj[ns]);
    return obj;
  };

  _.nest = function (obj, prefix) {
    prefix = prefix || "";
    _.each(obj, function (value, index) {
      obj[index] = {};
      obj[index][prefix + index] = value;
    });
    return obj;
  };

  _.pairs = function (obj) {
    var pairs = [];
    if (_.isPlainObject(obj)) { _.each(obj, function (value, index) { pairs.push([index, value]); }); }
    return pairs;
  };

  _.parent = function (obj, key) {
    var target = key ? _.get(obj, key) : obj,
        objs = _.getByType(obj, 'object', true);
    for (var o in objs) {
      if (_.isPlainObject(objs[o])) {
        for (var p in objs[o]) {
          if (_.isEqual(objs[o][p], target)) return objs[o];
        }
      }
    }
    return obj;
  };

  _.pluck = _.fetch = function (obj, key) {
    return _.map(obj, function (value) { return _.resolve(value, key); });
  };

  _.resolve = function (obj, path, keys, own) {
    if ((path in obj) && !keys) return obj[path];
    return _.paths(obj, keys, own)[path];
  };

  _.toQueryString = function (obj, prefix) {
    var ret = "";
    _.deep({obj: obj, fn: function (depth, index, value) {
      index = index.toString();
      if (!_.isPlainObject(value)) {
        if (_.isArray(value)) {
          _.deep(value, function (arrDepth, arrIndex, arrValue) {
            ret += (prefix ? prefix + index + "[]" : index + "[]") + "=" + arrValue + "&";
          }, "*");
        } else {
          ret += (prefix ? prefix + index : index) + "=" + value + "&";
        }
      }
    }, depth: "*", noArrays: true});
    ret = encodeURIComponent(ret.replace(/&$/g, ''));
    return ret;
  };

  _.type = function (obj) {
    var types = "Date RegExp Element Arguments PlainObject Array Function String Bool NaN Infinite Number Null Undefined Object".split(" "), i;
    for (i = 0; i < types.length; i++) {
      if (_["is" + types[i]].call(this, obj)) {
        return types[i].toLowerCase().replace(/plainobject/g, "object").replace(/infinite/g, "infinity");
      }
    }
    return false;
  };

  /* STRING METHODS */

  _.fromQueryString = function (str, deep) {
    var ret = {}, parts;
    _.each(decodeURIComponent(str).split("&"), function (value) {
      parts = value.split("=");
      if (parts[0].match(/\[\]/g) && deep) {
        parts[0] = parts[0].replace(/\[\]/g, '');
        if (parts[0] in ret) {
          ret[ parts[0] ].push(parts[1]);
        } else {
          ret[ parts[0] ] = [parts[1]];
        }
      } else {
        ret[ parts[0] ] = parts[1];
      }
    });
    return ret;
  };

  _.htmlEncode = function (str) {
    var entities = {
      '\u0026':['amp'], '\u0022':['quot'], '\u0027':['apos'], '\u003C':['lt'],
      '\u003E':['gt'], '\u00A0':['nbsp'], '/':['#x2F']
    };
    for (var e in entities) {
      var entity = new RegExp(e, 'g');
      str = str.replace(entity, '&' + entities[e][0] + ';');
    }
    return str;
  };

  _.htmlDecode = function (str) {
    var entities = {
      '&quot;':['\"'], '&amp;':['&'], '&apos;':["'"], '&lt;':['<'],
      '&gt;':['>'], '&nbsp;':[' '], '&#x2F;':['/']
    };
    for (var e in entities) {
      var entity = new RegExp(e, 'g');
      str = str.replace(entity, entities[e][0]);
    }
    return str;
  };

  /* UTILITY METHODS */

  _.chain = function () {
    return _.apply(this, _.toArray(arguments)).chain();
  };

  _.end = _.result = function (obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  _.identity = function (value) {
    return value;
  };

  _.noConflict = function () {
    root._ = previousLib;
    return _;
  };

  _.value = function (value) {
    return _.isFunction(value) ? value() : value;
  };

  // Attach library's methods to its prototype
  _.each(_.filter(_.keys(_), function (value) {
    if (!_.inArray(['_version'], value)) return true;
  }), function (name) {
    var fn = _[name];
    _.prototype[name] = function () {
      return _.end.call(this, fn.apply(_, this._bound[0].concat(_.toArray(arguments))));
    };
  });

  // Add OOP methods to the library object prototype
  _.extend(_.prototype, {
    chain: function () {
      this._chain = true;
      return this;
    },
    end: function () {
      this._chain = false;
      return this._bound[0][0];
    }
  });

})(typeof exports !== 'undefined' ? exports : window);