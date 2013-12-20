/**
 * from.js v2.1.6.1
 *
 * Copyright 2012-2013 suckgamony@gmail.com
 * 
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

//
// Tab size: 4
//

(function() {



// Beginning of code

var platform;

var platformList = {
    'nodejs': function () {
        return typeof module !== 'undefined' && module.exports;
    },
    'web': function () {
        return true;
    }
};

for (var key in platformList) {
    if (platformList[key]()) {
        platform = key;
        break;
    }
}

var alias = 'from';

var defaultTrimmingTarget = [undefined, null, false, 0, ' ', '\n', '\t'];
var defaultTrimmingPredicateArray = 'from(@t).contains($)';
var defaultTrimmingPredicateIterable = '@t.contains($)';

var CACHE_MAX = 16;

function isNumber(str) {
	return /^[0-9]+$/.exec(str) ? true : false;
}

function expandAbbreviated(s, prefixLen, to) {
	if (s.length == prefixLen) {
		return to;
	}
	else {
		var prop = s.substr(prefixLen);
		if (isNumber(prop)) {
			return to + "[" + prop + "]";
		}
		else {
			return to + "." + prop;
		}
	}
}

var rxLambdaWithOneArg = /^\s*(\w+)\s*=>(.+)$/;
var rxLambdaWithManyArgs = /^\s*\(\s*([\w\s,]*)\s*\)\s*=>(.+)$/;
var rxIds = /"(?:[^"]|\\")*"|'(?:[^']|\\')*'|[\$@\w_#]+/g;

function lambdaGetUseCount(str, argCount, splited) {
	var hint;
	var names;
	
    rxLambdaWithOneArg.lastIndex = 0;
	var m = rxLambdaWithOneArg.exec(str);
	if (m) {
		names = [m[1]];
		str = m[2];
		hint = new Array(1);
	}
	else if ((rxLambdaWithManyArgs.lastIndex = 0), (m = rxLambdaWithManyArgs.exec(str))) {
		names = m[1].split(/\s*,\s*/);
		str = m[2];
		hint = new Array(names.length);
	}
	else {
		hint = new Array(argCount);
	}

	for (var i = 0, c = hint.length; i < c; ++i) {
		hint[i] = 0;
	}
	
	var prevIndex = 0;
	var prefixToAdd = '';
	
	if (names) {
        rxIds.lastIndex = 0;
	    while (m = rxIds.exec(str)) {
			var s = m[0];
			for (var j = 0, l = names.length; j < l; ++j) {
				if (s == names[j]) {
					++hint[j];
					
					if (splited) {
					    splited.push(str.substring(prevIndex, m.index));
					    splited.push(j);
					    
					    prevIndex = m.index + s.length;
					}
					
					break;
				}
			}
	    }
	}
	else {
    	var nextPrefixToAdd = '';
        rxIds.lastIndex = 0;
	    while (m = rxIds.exec(str)) {
			var s = m[0];
			var ch = s.charAt(0);

			var arg = null;
			
			if (ch == "$") {
				var l = s.length;
				if (l >= 2 && s.charAt(1) == "$") {
					++hint[1];
					
					if (splited) {
					    arg = 1;
					    nextPrefixToAdd = expandAbbreviated(s, 2, '');
					}
				}
				else /*if (l == 1 || !(s in global))*/ {
					++hint[0];
					
					if (splited) {
					    arg = 0;
					    nextPrefixToAdd = expandAbbreviated(s, 1, '');
					}
				}
			}
			else if (ch == "@") {
			    var index = hint.length - 1;
				++hint[index];
				
				if (splited) {
				    arg = index;
				    nextPrefixToAdd = expandAbbreviated(s, 1, '');
				}
			}
			else if (ch == "#") {
				var index = parseInt(s.substr(1));
				++hint[index];
				
				if (splited) {
				    arg = index;
				    nextPrefixToAdd = '';
				}
			}
			
			if (splited && arg !== null) {
			    splited.push(prefixToAdd + str.substring(prevIndex, m.index));
			    splited.push(arg);
			    
			    prevIndex = m.index + s.length;
			    prefixToAdd = nextPrefixToAdd;
			    nextPrefixToAdd = '';
			}
		}
	}

    if (splited) {
        splited.push(prefixToAdd + str.substring(prevIndex, str.length));
    }

	return hint;
}

function lambdaReplace(str, v, k) {
	var names;
	
    rxLambdaWithOneArg.lastIndex = 0;
	var m = rxLambdaWithOneArg.exec(str);
	if (m) {
		names = [m[1]];
		str = m[2];
	}
	else if ((rxLambdaWithManyArgs.lastIndex = 0), (m = rxLambdaWithManyArgs.exec(str))) {
		names = m[1].split(/\s*,\s*/);
		str = m[2];
	}

	var args = arguments;
	var a = (args.length > 0 ? args[args.length - 1] : "");

	if (names) {
        rxIds.lastIndex = 0;
		return str.replace(rxIds, function(s) {
			for (var i = 0, l = names.length; i < l; ++i) {
				if (s == names[i]) {
					return args[i + 1];
				}
			}
			return s;
		});
	}
	else {
        rxIds.lastIndex = 0;
		return str.replace(rxIds, function(s) {
			var ch = s.charAt(0);
			if (ch == "$") {
				var l = s.length;
				if (l >= 2 && s.charAt(1) == "$") {
					return expandAbbreviated(s, 2, k);
				} else /*if (l == 1 || !(s in global))*/ {
					return expandAbbreviated(s, 1, v);
				}
			}
			else if (ch == "@") {
				return expandAbbreviated(s, 1, a);
			}
			else if (ch == "#") {
				return args[parseInt(s.substr(1)) + 1];
			}

			return s;
		});
	}
}

function lambdaJoin(splited, v, k) {
    for (var i = 1, c = splited.length; i < c; i += 2) {
        var s = splited[i];
        if (typeof s == 'number') {
            splited[i] = arguments[s + 1];
        }
    }
    
    return splited.join('');
}

function lambdaParse(str, argCount) {
	if (!str) return null;
	if (typeof(str) == "function") return str;

	var names;
	
	var m = /^\s*(\w+)\s*=>(.+)$/.exec(str);
	if (m) {
		names = [m[1]];
		str = m[2];
	}
	else if (m = /^\s*\(\s*([\w\s,]*)\s*\)\s*=>(.+)$/.exec(str)) {
		names = m[1].split(/\s*,\s*/);
		str = m[2];
	}

	if (names) {
		names.push("return " + str + ";");
		return Function.apply(null, names);
	}
	else {
		names = [];
		for (var i = 0; i < argCount; ++i) {
			names.push("$" + i);
		}

		var params = [str].concat(names);
		str = lambdaReplace.apply(null, params);

		names.push("return " + str + ";");
		return Function.apply(null, names);
	}
}

function quote(s) {
	var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
	var meta = {    // table of character substitutions
		'\b': '\\b',
		'\t': '\\t',
		'\n': '\\n',
		'\f': '\\f',
		'\r': '\\r',
		'"' : '\\"',
		'\\': '\\\\'
	};

	return escapable.test(s) ? '"' + s.replace(escapable, function (a) {
		var c = meta[a];
		return c
			? c
			: '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
	}) + '"' : '"' + s + '"';
}

function extend(from, to) {
	var emptyCtor = function() {};
	emptyCtor.prototype = from.prototype;
	
    to.prototype = new emptyCtor();
    to.prototype.constructor = to;
}

function toURLEncoded(prefix, obj) {
	var prefixEqual = (prefix ? prefix + "=" : "");

	if (typeof(obj) == "boolean") {
		return prefixEqual + (obj ? "1" : "0");
	}
	else if (typeof(obj) == "string") {
		return prefixEqual + encodeURIComponent(obj);
	}
	else if (typeof(obj) == "number") {
		return prefixEqual + obj.toString();
	}
	else if (typeof(obj) == "object") {
		var array = [];
		from(obj).each(function(v, k) {
			k = encodeURIComponent(k);

			var key;
			if (prefix) {
				key = prefix + "[" + k + "]";
			}
			else {
				key = k;
			}

			array.push(toURLEncoded(key, v));
		});

		return array.join("&");
	}

	return "";
}

function getTrimmingArgument(left, right, arg) {
    var leftTarget;
    var rightTarget;
    
    if (!left || left instanceof Array) {
        leftTarget = (!left ? defaultTrimmingTarget : left);
        left = defaultTrimmingPredicateArray;
    } else if (left instanceof Iterable) {
        leftTarget = defaultTrimmingTarget;
        left = defaultTrimmingPredicateIterable;
    } else if (typeof left == 'string') {
        left = lambdaReplace(left, '$', '$$', '@.a');
    }

    if (!right || right instanceof Array) {
        rightTarget = (!right ? defaultTrimmingTarget : right);
        right = defaultTrimmingPredicateArray;
    } else if (right instanceof Iterable) {
        rightTarget = defaultTrimmingTarget;
        right = defaultTrimmingPredicateIterable;
    } else if (typeof right == 'string') {
        right = lambdaReplace(right, '$', '$$', '@.a');
    }

    var leftArg = {t: leftTarget, a: arg};
    var rightArg = {t: rightTarget, a: arg};

    return {left: left, leftArg: leftArg, right: right, rightArg: rightArg};
}

function prepareVariables(hints, varName, value, ___) {
    var result = {};
    var decl = [];

    for (var i = 0, c = hints.length; i < c; ++i) {
        var argIndex = i * 2 + 1;
        
        var varName = arguments[argIndex];
        if (!varName) continue;

        var value = arguments[argIndex + 1];

        if (value instanceof Array) {
            if (hints[i] == 0) {
                for (var j = 0, c2 = value.length; j < c2; ++j) {
                    value[j] = '';
                }
                result[varName] = value;
            } else {
                result[varName] = value;
            }
        } else {
            if (hints[i] <= 1) {
                result[varName] = value;
            } else {
                decl.push('var ' + varName + '=' + value + ';');
                result[varName] = varName;
            }
        }
    }

    result.decl = decl.join('');
    return result;
}

//
// Grouper
//

function Grouper(comparer, arg) {
	this.$o = from(this.o = []);
	this.c = comparer;
	this.a = arg;
}

Grouper.prototype._getPrimitiveList = function(name, key) {
	var bucket = this[name];
	if (!bucket) this[name] = bucket = {};
	
	key = key.toString();
	
	var list = bucket[key];
	if (!list) {
		bucket[key] = list = [];
		this.o.push({k: key, l: list});
	}
	return list;
};

Grouper.prototype._getList = function(key) {
	var c = this.c;
	var pred;

	if (!c) {
		var type = typeof(key);
		switch (type) {
		case "string": return this._getPrimitiveList("s", key);
		case "number": return this._getPrimitiveList("n", key);
		case "boolean": return this._getPrimitiveList("b", key);
		}

		pred = "$k==@k";
	}
	else if (typeof(c) == "string") {
		pred = lambdaReplace(c, "$k", "@k", "@a");
	}
	else {
		pred = "@c($k,@k,@a)";
	}

	var obj = this.$o.first(pred, {k: key, c: c, a: this.a});
	if (obj) {
		return obj.l;
	}
	else {
		var result = [];
		this.o.push({k: key, l: result});
		return result;
	}
};

Grouper.prototype.add = function(key, value) {
	var list = this._getList(key);
	list.push(value);
};

Grouper.prototype.$each = function(proc, arg) {
	return !this.$o.selectPair("from($l)", "$k").each(proc, arg).broken;
};

//
// Cache
//

var cacheSlot = {};
var cacheFifo = [];

function getCacheSlot(name) {
	var slot = cacheSlot[name];
	if (!slot) {
		slot = cacheSlot[name] = {};
	}
	
	return slot;
}

var cache = {
    get: function (name, str) {
        var slot = getCacheSlot(name);
        var result = slot[str];

        if (result && cacheFifo.length > 2) {
            for (var i = 0, l = cacheFifo.length; i < l; i += 2) {
                if (cacheFifo[i] == name && cacheFifo[i + 1] == str) {
                    cacheFifo.splice(i, 2);
                    cacheFifo.push(name, str);
                    break;
                }
            }
        }
        
        return result;
    },
    
    set: function (name, str, it) {
        var slot = getCacheSlot(name);
        
        var added = !(str in slot);
        slot[str] = it;

        if (added) {
            cacheFifo.push(name, str);
            
            var maxFifo = CACHE_MAX * 2;
            while (cacheFifo.length > maxFifo) {
                slot = cacheSlot[cacheFifo[0]];
                delete slot[cacheFifo[1]];
                
                cacheFifo.splice(0, 2);
            }
        }
    }
};

//
// Iterable
//

function Iterable(it) {
	this.each = it;
}

Iterable.prototype.broken = false;

Iterable.prototype.where = function(pred, arg0) {
	var pr;
	if (typeof(pred) == "string") {
		pr = cache.get("($_$$_a0)", pred);
		if (!pr) {
			pr = "(" + lambdaReplace(pred, "$", "$$", "@a0") + ")";
			cache.set("($_$$_a0)", pred, pr);
		}
	}
	else {
		pr = "@pr($,$$,@a0)";
	}

	var self = this;
	function it(proc, arg) {
		var p;
		if (typeof(proc) == "string") {
			p = cache.get("($_$$_a)", proc);
			if (!p) {
				p = "(" + lambdaReplace(proc, "$", "$$", "@a") + ")";
				cache.set("($_$$_a)", proc, p);
			}
		}
		else {
			p = "@p($,$$,@a)";
		}

		this.broken = self.each(pr + "?" + p + ":0", {p: proc, pr: pred, a0: arg0, a: arg}).broken;
		return this;
	};

	return new Iterable(it);
};

Iterable.prototype.aggregate = function(seed, proc, arg) {
    var procStr;
    if (typeof(proc) == "string") {
	    procStr = cache.get("(c_$_$$_a)", proc);
	    if (!procStr) {
		    procStr = "(" + lambdaReplace(proc, "@c", "$", "$$", "@a") + ")";
		    cache.set("(c_$_$$_a)", proc, procStr);
	    }
    }
    else {
	    procStr = "@p(@c,$,$$,@a)";
    }

    if (seed === null) {
	    var a = {p: proc, f: true, a: arg};
	    this.each("@f?(@f=false,@c=$,0):(@c=" + procStr + ",0)", a);
	    return a.c;
	} else {
	    var a = {c: seed, a: arg, p: proc};
	    this.each("(@c=" + procStr + "),0", a);
	    return a.c;
    }
};

Iterable.prototype.all = function(pred, arg) {
	var p;
	if (typeof(pred) == "string") {
		p = cache.get("($_$$_a)", pred);
		if (!p) {
			p = "(" + lambdaReplace(pred, "$", "$$", "@a") + ")";
			cache.set("($_$$_a)", pred, p);
		}
	}
	else {
		p = "@p($,$$,@a)";
	}
	
    return !this.each("!" + p + "?false:0", {a: arg, p: pred}).broken;
};

Iterable.prototype.any = function(pred, arg) {
    var _p;
	if (!pred) {
	    _p = 'false';
	} else {
	    var p;
	    if (typeof(pred) == "string") {
		    p = cache.get("($_$$_a)", pred);
		    if (!p) {
			    p = "(" + lambdaReplace(pred, "$", "$$", "@a") + ")";
			    cache.set("($_$$_a)", pred, p);
		    }
	    }
	    else {
		    p = "@p($,$$,@a)";
	    }
	    
	    _p = p + '?false:0';
	}
	
   	return this.each(_p, {a: arg, p: pred}).broken;
};

Iterable.prototype.at = function(index) {
	return this.skip(index).first();
};

Iterable.prototype.atOrDefault = function(index, defValue) {
	var v = this.at(index);
	return (v === undefined ? defValue : v);
};

Iterable.prototype.average = function() {
	var a = {f: true};
	this.each("@f?(@f=false,@s=$,@c=1,0):(@s+=$,++@c)", a);

	return a.s / a.c;
};

Iterable.prototype.concat = function(second) {
	var self = this;
	function iterator(proc, arg) {
		if (self.each(proc, arg).broken) {
			this.broken = true;
			return this;
		}
		
		this.broken = from(second).each(proc, arg).broken;
    	return this;
	}

	return new Iterable(iterator);
};

Iterable.prototype.contains = function(value, comparer, arg) {
	var c;
	if (!comparer) {
		c = "$==@v";
	}
	else if (typeof(comparer) == "string") {
		c = cache.get("(v_$_a)", comparer);
		if (!c) {
			c = "(" + lambdaReplace(comparer, "@v", "$", "@a") + ")";
			cache.set("(v_$_a)", comparer, c);
		}
	}
	else {
		c = "@c(@v,$,@a)";
	}

	var a = {v: value, a: arg, c: comparer, r: false};
	this.each(c + "?((@r=true),false):0", a);

	return a.r;
};

Iterable.prototype.count = function(pred, arg) {
    var _p;
	if (!pred) {
	    _p = "++@c,0";
	} else {
	    var p;
	    if (typeof(pred) == "string") {
		    p = cache.get("($_$$_a)", pred);
		    if (!p) {
			    p = "(" + lambdaReplace(pred, "$", "$$", "@a") + ")";
			    cache.set("($_$$_a)", pred, p);
		    }
	    }
	    else {
		    p = "@p($,$$,@a)";
	    }
	    
	    _p = p + "?++@c:0";
	}
	

	var a = {a: arg, p: pred, c: 0};
	this.each(_p, a);
	return a.c;
};

Iterable.prototype.defaultIfEmpty = function(defValue) {
	var self = this;
	var it = function(proc, arg) {
		if (!self.each("false").broken) {
			if (typeof(proc) == "string") {
				proc = lambdaParse(proc, 3);
			}
			this.broken = (proc(defValue, 0, arg) === false);
		}
		else {
			this.broken = self.each(proc, arg).broken;
		}
		return this;
	};

	return new Iterable(it);
};

Iterable.prototype.distinct = function(comparer, arg) {
	var c = (comparer ? ",@c,@a" : "");

	var l = [];

	var self = this;
	function it(proc, arg0) {
		var p;
		if (typeof(proc) == "string") {
			p = cache.get("($_$$_a0)", proc);
			if (!p) {
				p = "(" + lambdaReplace(proc, "$", "$$", "@a0") + ")";
				cache.set("($_$$_a0)", proc, p);
			}
		}
		else {
			p = "@p($,$$,@a0)";
		}

		this.broken = self.each("!from(@l).contains($" + c + ")?(@l.push($)," + p + "):0", {c: comparer, l: l, p: proc, a0: arg0}).broken;
		return this;
	};

	return new Iterable(it);
};

Iterable.prototype.dump = function () {
    if (platform == 'nodejs') {
        this.each('console.log("key = " + $$ + ", value = " + $)');
    } else {
        this.each('document.writeln("key = " + $$ + ", value = " + $ + "<br/>")');
    }
    
    return this;
};

Iterable.prototype.except = function(second, comparer, arg0) {
	var compStr;
	if (comparer) {
		compStr = ",@c,@a0";
	}
	else {
		compStr = "";
	}
	
	var self = this;
	function it(proc, arg) {
		if (typeof(proc) == "string") {
			this.broken = self.each("@s.contains($" + compStr + ")?0:(" + lambdaReplace(proc, "$", "$$", "@a") + ")", {c: comparer, a0: arg0, s: from(second), a: arg}).broken;
		}
		else {
			this.broken = self.each("@s.contains($" + compStr + ")?0:@p($,$$,@a)", {c: comparer, a0: arg0, p: proc, s: from(second), a: arg}).broken;
		}
		return this;
	}

	return new Iterable(it);
};

Iterable.prototype.first = function(pred, arg) {
	if (!pred) {
		var a = {};
		this.each("(@r=$),false", a);
		return a.r;
	}
	else if (typeof(pred) == "string") {
		var a = {a: arg};
		this.each("(" + lambdaReplace(pred, "$", "$$", "@a") + ")?(@r=$,false):0", a);
		return a.r;
	}
	else {
		var a = {a: arg, p: pred};
		this.each("@p($,$$,@a)?(@r=$,false):0", a);
		return a.r;
	}	
};

Iterable.prototype.firstOrDefault = function(pred, defValue, arg) {
	if (arguments.length <= 1) {
		var v = this.first();
		return (v === undefined ? pred : v);
	}
	else {
		var v = this.first(pred, arg);
		return (v === undefined ? defValue : v);
	}
};

Iterable.prototype.groupBy = function (selectors, comparer, arg) {
    var valueSelector;
    var keySelector;
    var resultSelector;

    if (selectors) {
        valueSelector = selectors.value;
        keySelector = selectors.key;
        resultSelector = selectors.result;
    }
    
    valueSelector = (valueSelector || '$');
    keySelector = (keySelector || '$$');
    
    if (resultSelector) {
	    var rs;
	    if (typeof(resultSelector) == "string") {
		    rs = lambdaReplace(resultSelector, "$", "$$", "@a");
	    }
	    else {
		    rs = "@rs($,$$,@a)";
	    }

	    return this._getGroupIterable(valueSelector, keySelector, comparer, arg).selectPair(rs, "$$", {rs: resultSelector, a: arg});
    } else {
	    return this._getGroupIterable(valueSelector, keySelector, comparer, arg);
    }
};

Iterable.prototype._getGroupIterable = function(valueSelector, keySelector, comparer, arg) {
	var groups = new Grouper(comparer, arg);
	var $groups = from(groups);

	var ks;
	if (typeof(keySelector) == "string") {
		ks = "(" + lambdaReplace(keySelector, "$", "$$", "@a") + ")";
	}
	else {
		ks = "@ks($,$$,@a)";
	}

	var vs;
	if (typeof(valueSelector) == "string") {
		vs = "(" + lambdaReplace(valueSelector, "$", "$$", "@a") + ")";
	}
	else {
		vs = "@vs($,$$,@a)";
	}

	this.each("(@k=" + ks + "),(@v=" + vs + "),@g.add(@k,@v),0", {ks: keySelector, vs: valueSelector, g: groups, a: arg});

	return $groups;
}

Iterable.prototype.groupJoin = function(inner, outerKeySelector, innerKeySelector, resultSelector, comparer, arg) {
	inner = from(inner);
	
	var oks;
	if (typeof(outerKeySelector) == "string") {
		oks = "(" + lambdaReplace(outerKeySelector, "$", "$$", "@a") + ")";
	}
	else {
		oks = "@oks($,$$,@a)";
	}

	var iks;
	if (typeof(innerKeySelector) == "string") {
		iks = "(" + lambdaReplace(innerKeySelector, "$", "$$", "@a") + ")";
	}
	else {
		iks = "@iks($,$$,@a)";
	}

	var compStr;
	if (!comparer) {
		compStr = "@ok==" + iks;
	}
	else if (typeof(comparer) == "string") {
		compStr = lambdaReplace(comparer, "@ok", iks);
	}
	else {
		compStr = "@c(@ok," + iks + ")";
	}
	compStr = quote(compStr);

	var w = "@i.where(" + compStr + ",{a:@a,ok:" + oks + ",c:@c})";

	var rs;
	if (typeof(resultSelector) == "string") {
	    var splited = [];
		var hint = lambdaGetUseCount(resultSelector, 3, splited);
		
		switch (hint[1]) {
		case 0:
		case 1: rs = lambdaJoin(splited, "$", w, "@a"); break;
		default: rs = "(@w=" + w + "),(" + lambdaJoin(splited, "$", "@w", "@a") + ")"; break;
		}
	}
	else {
		rs = "@rs($," + w + ",@a)";
	}

	return this.select(rs, {rs: resultSelector, i: inner, a: arg, c: comparer});
};

Iterable.prototype.indexOf = function(pred, arg) {
    return this.where(pred, arg).select('$$').firstOrDefault(-1);
};

Iterable.prototype.intersect = function(second, comparer, arg) {
	var compStr;
	if (!comparer) {
		compStr = "null";
	}
	else if (typeof(comparer) == "string") {
		compStr = quote(comparer);
	}
	else {
		compStr = "@c";
	}

	return this.where("@t.contains($," + compStr + ",@a)", {t: from(second), a: arg, c: comparer});
};

Iterable.prototype.join = function(inner, outerKeySelector, innerKeySelector, resultSelector, comparer, arg) {
	inner = from(inner);
	
	var oks;
	if (typeof(outerKeySelector) == "string") {
		oks = "(" + lambdaReplace(outerKeySelector, "$", "$$", "@a") + ")";
	}
	else {
		oks = "@oks($,$$,@a)";
	}

	var iks;
	if (typeof(innerKeySelector) == "string") {
		iks = "(" + lambdaReplace(innerKeySelector, "$", "$$", "@a") + ")";
	}
	else {
		iks = "@iks($,$$,@a)";
	}

	var compStr;
	if (!comparer) {
		compStr = "@ok==" + iks;
	}
	else if (typeof(comparer) == "string") {
		compStr = lambdaReplace(comparer, "@ok", iks);
	}
	else {
		compStr = "@c(@ok," + iks + ")";
	}
	compStr = quote(compStr);

	var rs;
	if (typeof(resultSelector) == "string") {
		rs = "(" + lambdaReplace(resultSelector, "@ov", "$", "@a") + ")";
	}
	else {
		rs = "@rs(@ov,$,@a)";
	}

	var self = this;
	function it(proc, arg0) {
		var procStr;
		if (typeof(proc) == "string") {
		    var splited = [];
			var hint = lambdaGetUseCount(proc, 3, splited);
			var list = [];
			var v, k;

			switch (hint[0]) {
			case 0:
			case 1: v = rs; break;
			default: list.push("(@RS=" + rs + ")"); v = "@RS"; break;
			}

			switch (hint[1]) {
			case 0:
			case 1: k = "(@c++)"; break;
			default: list.push("(@cc=@c++)"); k = "@cc"; break;
			}
			
			list.push("(" + lambdaJoin(splited, v, k, "@a0") + ")");

			procStr = list.join(",");
		}
		else {
			procStr = "@p(" + rs + ",@c++,@a0)";
		}

		this.broken = self.each("(@ok=" + oks + "),(@ov=$),@i.where(" + compStr + ",@).each(" + quote(procStr) + ",@)", {i: inner, oks: outerKeySelector, iks: innerKeySelector, rs: resultSelector, p: proc, a: arg, a0: arg0, c: 0}).broken;
		return this;
	}

	return new Iterable(it);
};

Iterable.prototype.last = function(pred, arg) {
	if (!pred) {
		var a = {};
		this.each("@r=$", a);
		return a.r;
	}
	else if (typeof(pred) == "string") {
		var a = {a: arg};
		this.each("(" + lambdaReplace(pred, "$", "$$", "@a") + ")?@r=$:0", a);
		return a.r;
	}
	else {
		var a = {a: arg, p: pred};
		this.each("@p($,$$,@a)?@r=$:0", a);
		return a.r;
	}
};

Iterable.prototype.lastOrDefault = function(pred, defValue, arg) {
	if (arguments.length <= 1) {
		var v = this.last();
		return (v === undefined ? pred : v);
	}
	else {
		var v = this.last(pred, arg);
		return (v === undefined ? defValue : v);
	}
};

Iterable.prototype.max = function(selector, arg) {
	if (!selector) {
		return this.aggregate(null, "#0>#1?#0:#1");
	}

	var s;
	if (typeof(selector) == "string") {
		s = "(" + lambdaReplace(selector, "$", "$$", "@a") + ")";
	}
	else {
		s = "@s($,$$,@a)";
	}	

	var a = {f: true, s: selector, a: arg};
	this.each("@f?((@f=false),(@r=$),(@m=" + s + "),0):((@v=" + s + "),(@v>@m?((@m=@v),(@r=$)):0),0)", a);

	return a.r;
};

Iterable.prototype.min = function(selector, arg) {
	if (!selector) {
		return this.aggregate(null, "#0<#1?#0:#1");
	}

	var s;
	if (typeof(selector) == "string") {
		s = "(" + lambdaReplace(selector, "$", "$$", "@a") + ")";
	}
	else {
		s = "@s($,$$,@a)";
	}	

	var a = {f: true, s: selector, a: arg};
	this.each("@f?((@f=false),(@r=$),(@m=" + s + "),0):((@v=" + s + "),(@v<@m?((@m=@v),(@r=$)):0),0)", a);

	return a.r;
};

Iterable.prototype.orderBy = function(keySelector, comparer, arg) {
	return new OrderedIterable(this)._addContext(keySelector || "$", comparer, 1, arg);
};

Iterable.prototype.orderByDesc = function(keySelector, comparer, arg) {
	return new OrderedIterable(this)._addContext(keySelector || "$", comparer, -1, arg);
};

Iterable.prototype.reverse = function() {
	var self = this;
	function _it(proc, _a) {
		var _l = [];
		self.each("@push($$),@push($),0", _l);

		if (typeof(proc) == "string") {
		    var splited = [];
			var hint = lambdaGetUseCount(proc, 3, splited);
			var defV, defK;
			var v, k;

			switch (hint[0]) {
			case 0:
			case 1: defV = ""; v = "l[(i-1)*2+1]"; break;
			default: defV = "var v=l[(i-1)*2+1];"; v = "v"; break;
			}

			switch (hint[1]) {
			case 0:
			case 1: defK = ""; k = "l[(i-1)*2]"; break;
			default: defK = "var k=l[(i-1)*2];"; k = "k"; break;
			}

			var f = new Function("l", "a", "for(var i=l.length/2;i>0;--i){" + defK + defV + "if((" + lambdaJoin(splited, v, k, "a") + ")===false){return true;}}return false;");
			this.broken = f(_l, _a);
		}
		else {
			this.broken = false;
			for (var i = _l.length / 2; i > 0; --i) {
				if (proc(_l[(i - 1) * 2 + 1], _l[(i - 1) * 2], _a) === false) {
					this.broken = true;
					break;
				}
			}
		}

		return this;
	}

	return new Iterable(_it);
};

Iterable.prototype.select = function(selector, arg0) {
	var self = this;
	var iterator;

	var s;
	if (typeof(selector) == "string") {
		s = cache.get("($_$$_a0)", selector);
		if (!s) {
			s = "(" + lambdaReplace(selector, "$", "$$", "@a0") + ")";
			cache.set("($_$$_a0)", selector, s);
		}
	}
	else {
		s = "@s($,$$,@a0)";
	}
	
	iterator = function(proc, arg) {
		if (typeof(proc) == "string") {
		    var splited = [];
			var hint = lambdaGetUseCount(proc, 3, splited);

			var list = [];
			var v, k;

			switch (hint[0]) {
			case 0: v = ""; break;
			case 1: v = s; break;
			default: list.push("(@v=" + s + ")"); v = "@v"; break;
			}

			switch (hint[1]) {
			case 0: k = ""; break;
			case 1: k = "(@i++)"; break;
			default: list.push("(@j=@i++)"); k = "@j"; break;
			}

			list.push(lambdaJoin(splited, v, k, "@a"));

			this.broken = self.each(list.join(","), {s: selector, a0: arg0, a: arg, i: 0}).broken;
		}
		else {
			this.broken = self.each("@p(" + s + ",@i++,@a)", {s: selector, a0: arg0, a: arg, i: 0, p: proc}).broken;
		}

		return this;
	};

	return new Iterable(iterator);
};

Iterable.prototype.selectMany = function(selector, arg) {
	var s;
	if (typeof(selector) == "string") {
		s = lambdaReplace(selector, "$", "$$", "@a");
	}
	else {
		s = "@s($,$$,@a)";
	}
	
	var self = this;
	function it(proc, arg0) {
		var procStr;
		if (typeof(proc) == "string") {
		    var splited = [];
			var hint = lambdaGetUseCount(proc, 3, splited);
			
			switch (hint[1]) {
			case 0:
			case 1: procStr = lambdaJoin(splited, "$", "(@i++)", "@a0"); break;
			default: procStr = "(@j=@i++),(" + lambdaJoin(splited, "$", "@j", "@a0") + ")";
			}
		}
		else {
			procStr = "@p($,@i++,@a0)";
		}
		
		this.broken = self.each("from(" + s + ").each(" + quote(procStr) + ",@)", {s: selector, a: arg, a0: arg0, i: 0, p: proc}).broken;
		return this;
	}

	return new Iterable(it);
};

Iterable.prototype.selectPair = function(valueSelector, keySelector, arg0) {
	var self = this;
	var iterator;

	var vs, ks;

	if (typeof(valueSelector) == "string") {
		vs = cache.get("($_$$_a0)", valueSelector);
		if (!vs) {
			vs = "(" + lambdaReplace(valueSelector, "$", "$$", "@a0") + ")";
			cache.set("($_$$_a0)", valueSelector, vs);
		}
	}
	else {
		vs = "@vs($,$$,@a0)";
	}

	if (typeof(keySelector) == "string") {
		ks = cache.get("($_$$_a0)", keySelector);
		if (!ks) {
			ks = "(" + lambdaReplace(keySelector, "$", "$$", "@a0") + ")";
			cache.set("($_$$_a0)", keySelector, ks);
		}
	}
	else {
		ks = "@ks($,$$,@a0)";
	}

	function it(proc, arg) {
		var procStr;
		if (typeof(proc) == "string") {
		    var splited = [];
			var hint = lambdaGetUseCount(proc, 3, splited);
			var v, k;
			var list = [];

			switch (hint[0]) {
			case 0:
			case 1: v = vs; break;
			default: list.push("(@VS=" + vs + ")"); v = "@VS"; break;
			}

			switch (hint[1]) {
			case 0:
			case 1: k = ks; break;
			default: list.push("(@KS=" + ks + ")"); k = "@KS"; break;
			}

			list.push(lambdaJoin(splited, v, k, "@a"));

			procStr = list.join(",");
		}
		else {
			procStr = "@p(" + vs + "," + ks + ",@a)";
		}

		this.broken = self.each(procStr, {a0: arg0, a: arg, p: proc, vs: valueSelector, ks: keySelector}).broken;
		return this;
	}

	return new Iterable(it);
};

Iterable.prototype.sequenceEqual = function(second, comparer, arg) {
	var comp;
	if (!comparer) {
		comp = "#0==#1";
	}
	else if (typeof(comparer) == "string") {
		comp = lambdaReplace(comparer, "#0", "#1", "@a");
	}
	else {
		comp = "@c(#0,#1,@a)";
	}
	
	return this.zip(second, comp, {a: arg, c: comparer}).all("$==true");
};

Iterable.prototype.single = function(pred, arg) {
	var q = (!pred ? this.take(2) : this.where(pred).take(2));
	if (q.count() == 1) {
		return q.first();
	}
};

Iterable.prototype.singleOrDefault = function(pred, defValue, arg) {
	var q;
	if (arguments.length <= 1) {
		q = this.take(2);
		defValue = pred;
	}
	else {
		q = this.where(pred).take(2);
	}

	var count = q.count();
	if (count == 0) {
		return defValue;
	}
	else if (count == 1) {
		return q.first();
	}
	else {
		throw new Error("The sequence has more than one element satisfying the condition.");
	}
};

Iterable.prototype.skip = function(count) {
    if (count == 0) {
        return this;
    } else if (count < 0) {
        return this.reverse().skip(-count).reverse();
    }

	var self = this;
	function iterator(proc, arg) {
		var p;
		if (typeof(proc) == "string") {
			p = cache.get("($_$$_a)", proc);
			if (!p) {
				p = "(" + lambdaReplace(proc, "$", "$$", "@a") + ")";
				cache.set("($_$$_a)", proc, p);
			}
		}
		else {
			p = "@p($,$$,@a)";
		}

		this.broken = self.each("@c==0?" + p + ":--@c", {p: proc, a: arg, c: count}).broken;
		return this;
	}

	return new Iterable(iterator);
};

Iterable.prototype.skipWhile = function(pred, arg) {
	var pr;
	if (typeof(pred) == "string") {
		pr = cache.get("($_$$_a)", pred);
		if (!pr) {
			pr = "(" + lambdaReplace(pred, "$", "$$", "@a") + ")"
			cache.set("($_$$_a)", pred, pr);
		}
	}
	else {
		pr = "@pr($,$$,@a)";
	}

	var self = this;
	function iterator(proc, arg0) {
		var p;
		if (typeof(proc) == "string") {
			p = cache.get("($_$$_a0)", proc);
			if (!p) {
				p = "(" + lambdaReplace(proc, "$", "$$", "@a0") + ")";
				cache.set("($_$$_a0)", proc, p);
			}
		}
		else {
			p = "@p($,$$,@a0)";
		}

		this.broken = self.each("@f||(@f=!" + pr + ")?" + p + ":0", {pr: pred, f: false, a: arg, a0: arg0}).broken;
		return this;
	}

	return new Iterable(iterator);
};

Iterable.prototype.sum = function() {
	return this.aggregate(null, "#0+#1");
};

Iterable.prototype.take = function(count) {
    if (count == 0) {
        return from();
    } else if (count < 0) {
        return this.reverse().take(-count).reverse();
    }

	var self = this;
	function iterator(proc, arg) {
		var p;
		if (typeof(proc) == "string") {
			p = cache.get("($_$$_a)", proc);
			if (!p) {
				p = "(" + lambdaReplace(proc, "$", "$$", "@a") + ")";
				cache.set("($_$$_a)", proc, p);
			}
		}
		else {
			p = "@p($,$$,@a)";
		}

		var _ = {i: 0, p: proc, a: arg, b: false};
		var broken = self.each("(@i++<" + count + ")?" + p + ":(@b=true,false)", _).broken;
		this.broken = broken && !_.b;

		return this;
	}

	return new Iterable(iterator);
};

Iterable.prototype.takeWhile = function(pred, arg) {
	var pr;
	if (typeof(pred) == "string") {
		pr = cache.get("($_$$_a)", pred);
		if (!pr) {
			pr = "(" + lambdaReplace(pred, "$", "$$", "@a") + ")"
			cache.set("($_$$_a)", pred, pr);
		}
	}
	else {
		pr = "@pr($,$$,@a)";
	}

	var self = this;
	function iterator(proc, arg0) {
		var p;
		if (typeof(proc) == "string") {
			p = cache.get("($_$$_a0)", proc);
			if (!p) {
				p = "(" + lambdaReplace(proc, "$", "$$", "@a0") + ")";
				cache.set("($_$$_a0)", proc, p);
			}
		}
		else {
			p = "@p($,$$,@a0)";
		}

		var _ = {p: proc, pr: pred, a: arg, a0: arg0, b: false};
		var broken = self.each(pr + "?" + p + ":(@b=true,false)", _).broken;
		this.broken = broken && !_.b;

		return this;
	}

	return new Iterable(iterator);
};

Iterable.prototype.toArray = function() {
	var result = [];
	this.each("@push($)", result);
	return result;
};

Iterable.prototype.toDictionary = function() {
	var result = {};
	this.each("@[$$]=$", result);
	return result;
};

Iterable.prototype.toJSON = function(track) {
	if (!track) track = [];
	var $track = from(track);

	function toJSON(obj) {
		var type = typeof(obj);
		if (type == "string") {
			return quote(obj);
		}
		else if (type == "number" || type == "boolean") {
			return obj.toString();
		}
		else if (type == "function") {
			return toJSON(obj());
		}
		else {
			if ($track.contains(obj) ||
				((obj instanceof ArrayIterable || obj instanceof ObjectIterable) && $track.contains(obj.data))) {
				
				return "null";
			}

			return from(obj).toJSON(track);
		}
	}

	var firstKey = this.select("$$").first();
	var isArray = (typeof(firstKey) == "number");

	track.push(this);
	var json;

	if (isArray) {
		var result = [];
		this.each(function(v) {
			result.push(toJSON(v));
		});

		json = "[" + result.join(", ") + "]";
	}
	else {
		var result = [];
		this.each(function(v, k) {
			result.push(quote(k.toString()) + ": " + toJSON(v));
		});

		json = "{" + result.join(", ") + "}";
	}

	track.pop(this);
	return json;
};

Iterable.prototype.toString = function(separator) {
    return this.toArray().join(separator || '');
};

Iterable.prototype.toURLEncoded = function() {
	return toURLEncoded(null, this);
};

Iterable.prototype.trim = function(left, right, arg) {
    var args = getTrimmingArgument(left, right, arg);

    return this.skipWhile(args.left, args.leftArg).reverse().skipWhile(args.right, args.rightArg).reverse();
};

Iterable.prototype.union = function(second, comparer, arg) {
	var buffer = [];

	var self = this;
	function it(proc, arg0) {
		var p;
		if (typeof(proc) == "string") {
		    var splited = [];
			var hint = lambdaGetUseCount(proc, 3, splited);
			
			switch (hint[1]) {
			case 0:
			case 1: p = lambdaJoin(splited, "$", "(@b.length-1)", "@a0"); break;
			default: p = "(@bb=@b.length-1),(" + lambdaJoin(splited, "$", "@bb", "@a0") + ")"; break;
			}
		}
		else {
			p = "@p($,@b.length-1,@a0)";
		}

		var lambda = "from(@b).contains($,@c,@a)?0:(@b.push($)," + p + ",0)";

		var a = {c: comparer, b: buffer, p: proc, a0: arg0, a: arg};
		if (self.each(lambda, a).broken) {
			this.broken = true;
			return this;
		}
		if (from(second).each(lambda, a).broken)  {
			this.broken = true;
			return this;
		}

		return this;
	}

	return new Iterable(it);
};

Iterable.prototype.zip = function(second, resultSelector, arg) {
	var rs;
	if (typeof(resultSelector) == "string") {
	    var splited = [];
		var hint = lambdaGetUseCount(resultSelector, 5, splited);
		var v, k, list = [];

		switch (hint[0]) {
		case 0: case 1: v = "@d[@i*2+1]"; break;
		default: list.push("(@V=@d[@i*2+1])"); v = "@V"; break;
		}

		switch (hint[2]) {
		case 0: case 1: k = "@d[@i*2]"; break;
		default: list.push("(@K=@d[@i*2])"); k = "@K"; break;
		}

		list.push(lambdaJoin(splited, v, "$", k, "$$", "@a"));

		rs = "(" + list.join(",") + ")";
	}
	else {
		rs = "@rs(@d[@i*2+1],$,@d[@i*2],$$,@a)";
	}

	var self = this;
	function iterator(proc, arg0) {
		var data = [];
		self.each("@push($$),@push($),0", data);

		var procStr;
		if (typeof(proc) == "string") {
		    var splited = [];
			var hint = lambdaGetUseCount(proc, 3, splited);
			var v, k, list = [];

			switch (hint[0]) {
			case 0: case 1: v = rs; break;
			default: list.push("(@RS=" + rs + ")"); v = "@RS"; break;
			}

			switch (hint[1]) {
			case 0: case 1: k = "(@k++)"; break;
			default: list.push("(@kk=@k++)"); k = "@kk"; break;
			}

			list.push(lambdaJoin(splited, v, k, "@a0"));

			procStr = "(" + list.join(",") + ")";
		}
		else {
			procStr = "@p(" + rs + ",@k++,@a0)";
		}

		this.broken = from(second).each("@i>=" + (data.length / 2) + "?false:@r=" + procStr + ",++@i,@r", {a: arg, a0: arg0, k: 0, i: 0, d: data, p: proc, rs: resultSelector}).broken;
		return this;
	}

	return new Iterable(iterator);
};

//
// RandomAccessIterable
//

function RandomAccessIterable(data) {
	this.data = data;
    this.rev = false;
}
extend(Iterable, RandomAccessIterable);

RandomAccessIterable.prototype.initRegion = function () {
    var r = this.region;
    if (!r) {
        this.region = r = {
            queries: null,
            measured: false,
            start: null,
            end: null,
            take: null,
            takeArg: null
        };
    }

    return r;
};

RandomAccessIterable.prototype.addRegionQuery = function (type, proc, arg) {
    var r = this.initRegion();
    var q = r.queries;

    if (!q) {
        r.queries = q = [];
    }

    q.push(type);
    q.push(proc);
    q.push(arg);

    r.start = r.end = null;
    r.measured = false;

    return this;
};

RandomAccessIterable.prototype.clone = function () {
    var result = new this.constructor(this.data);

    var r = this.region;
    if (r) {
        var rr = result.region = {
            measured: r.measured,
            start: r.start,
            end: r.end,
            take: r.take,
            takeArg: r.takeArg
        };

        var q = r.queries;
        if (q) {
            var qq = rr.queries = [];
            for (var i = 0, c = q.length; i < c; ++i) {
                qq.push(q[i]);
            }
        }
    }
    
    result.rev = this.rev;

    return result;
};

RandomAccessIterable.prototype.reverseRegion = function () {
    var r = this.initRegion();

    if (r) {
        if (r.take) {
            r.measured = false;
        }
        r.take = r.takeArg = null;
    }

    this.rev = !this.rev;
    
    return this;
};

RandomAccessIterable.prototype.measureRegion = function () {
    var region = this.initRegion();

    if (!region.measured) {
        var data = this.data;
        var start = region.start;
        var end = region.end;

        if (start == null) start = 0;
        if (end === null) end = data.length;

        region.take = region.takeArg = null;

        var queries = region.queries;

        if (!queries) {
            region.start = start;
            region.end = end;
        } else {
            var codes = [];

            for (var i = 0, c = queries.length; i < c; i += 3) {
                var type = queries[i];
                var proc = queries[i + 1];
                var arg = queries[i + 2];

                if (type == 'skipLeft') {
                    if (typeof proc == 'number') {
                        start = Math.min(end, start + proc);
                        //codes.push('s=Math.min(e,s+' + proc + ');'); 
                    } else if (typeof proc == 'string') {
                        var splited = [];
                        var hints = lambdaGetUseCount(proc, 3, splited);

                        var vars = prepareVariables(hints,
                            'v', this.lambdaGetItem('d', 's'),
                            null, null,
                            'a', 'q[' + (i + 2) + ']');

                        codes.push('for(;s<e;++s){', vars.decl,
                            'if(!(', lambdaJoin(splited, vars.v, 's', vars.a), ')){break;}}');
                    } else {
                        codes.push('for(;s<e&&q[', i + 1, '](', this.lambdaGetItem('d', 's'), ',s,q[', i + 2, ']);++s);');
                    }
                } else if (type == 'skipRight') {
                    if (typeof proc == 'number') {
                        end = Math.max(start, end - proc);
                        //codes.push('e=Math.max(s,e-', proc, ');'); 
                    } else if (typeof proc == 'string') {
                        var splited = [];
                        var hints = lambdaGetUseCount(proc, 3, splited);

                        var i1, i2;
                        
                        if (hints[1] == 0) {
                            i1 = ''; i2 = 'e-1';
                        } else {
                            i1 = 'var _i=e-1;'; i2 = '_i';
                        }

                        var vars = prepareVariables(hints,
                            'v', this.lambdaGetItem('d', i2),
                            null, null,
                            'a', 'q[' + (i + 2) + ']');

                        codes.push('for(;s<e;--e){', i1, vars.decl,
                            'if(!(', lambdaJoin(splited, vars.v, i2, vars.a), ')){break;}}');
                    } else {
                        codes.push('for(;s<e;--e){var _i=e-1;',
                            'if(!q[', i + 1, '](', this.lambdaGetItem('d', '_i'), ',_i,q[', i + 2, '])){break;}}');
                    }
                } else if (type == 'takeLeft') {
                    if (typeof proc == 'number') {
                        end = Math.min(end, start + proc);
                        //codes.push('e=Math.min(e,s+', proc, ');');
                    } else {
                        if (i == c - 3 && !this.rev) {
                            region.take = proc;
                            region.takeArg = arg;
                        } else if (typeof proc == 'string') {
                            var splited = [];
                            var hints = lambdaGetUseCount(proc, 3, splited);

                            var vars = prepareVariables(hints,
                                '_v', this.lambdaGetItem('d', 'e'),
                                null, null,
                                '_a', 'q[' + (i + 2) + ']');

                            codes.push('for(var _e2=e,e=s;e<_e2;++e){', vars.decl,
                                'if(!(', lambdaJoin(splited, vars._v, 'e', vars._a), ')){break;}}');
                        } else {
                            codes.push('for(var _e2=e,e=s;e<_e2;++e){',
                                'if(!q[', i + 1, '](', this.lambdaGetItem('d', 'e'), ',e,q[', i + 2, '])){break;}}');
                        }
                    }
                } else if (type == 'takeRight') {
                    if (typeof proc == 'number') {
                        start = Math.max(start, end - proc);
                        //codes.push('s=Math.max(s,e-', proc, ');');
                    } else {
                        if (i == c - 3 && this.rev) {
                            region.take = proc;
                            region.takeArg = arg;
                        } else if (typeof proc == 'string') {
                            var splited = [];
                            var hints = lambdaGetUseCount(proc, 3, splited);

                            var i1, i2;
                            
                            if (hints[1] == 0) {
                                i1 = ''; i2 = 's-1';
                            } else {
                                i1 = 'var _i=s-1;'; i2 = '_i';
                            }

                            var vars = prepareVariables(hints,
                                '_v', this.lambdaGetItem('d', i2),
                                null, null,
                                '_a', 'q[' + (i + 2) + ']');

                            codes.push('for(var _s2=s,s=e;s>_s2;--s){', i1, vars.decl,
                                'if(!(', lambdaJoin(splited, vars._v, i2, vars._a), ')){break;}}');
                        } else {
                            codes.push('for(var _s2=s,s=e;s>_s2;--s){var _i=s-1;',
                                'if(!q[', i + 1, '](', this.lambdaGetItem('d', '_i'), ',_i,q[', i + 2, '])){break;}}');
                        }
                    }
                }
            }

            if (codes.length > 0) {
                codes.push('r.start=s;r.end=e;');
                var f = new Function(alias, 'd', 'r', 'q', 's', 'e', codes.join(''));
                f(from, data, region, queries, start, end);
            } else {
                region.start = start;
                region.end = end;
            }
        }

        region.measured = true;
    }

    return region;
};

RandomAccessIterable.prototype.each = function(proc, _a) {
    var region = this.measureRegion();
    var s = region.start;
    var e = region.end;
    
    if (s >= e) {
        this.broken = false;
        return this;
    }
    
	var data = this.data;
    var take = region.take;
    var takeArg = region.takeArg;
    var p;
    
    var typeProc = typeof proc;
    var typeTake = typeof take;
    
    if (typeProc == 'function' && (!take || typeTake == 'function')) {
        this.broken = false;
        
        var rev = this.rev;
        for (var s = region.start, e = region.end; s < e; !rev ? ++s : --e) {
            var key = (!rev ? s : e - 1);
            var value = data[key];
            
            if (take && !take(value, key, takeArg)) {
                break;
            } else if (proc(value, key, _a) === false) {
                this.broken = true;
                break;
            }
        }
    } else {
	    if (typeProc == "function") {
            p = proc;
            proc = '_p($,$$,@)';
	    }

        if (take) {
            if (typeTake == 'string') {
                proc = '!(' + lambdaReplace(take, '$', '$$', '_tla') + ')?_b=false:' + proc;
            } else {
                proc = '!_tl($,$$,_tla)?_b=false:' + proc;
            }
        }

        var dt = this.dataType + (this.rev ? '_reversed' : '');
        var f = cache.get("each_" + dt, proc);

        if (!f) {
            var splited = [];
            var hints = lambdaGetUseCount(proc, 3, splited);
            var defV, v;

            var i1, i2;
            if (!this.rev) {
                i1 = ''; i2 = '_s';
            } else {
                if (hints[1] == 0) {
                    i1 = ''; i2 = '_e-1';
                } else {
                    i1 = 'var _i=_e-1;'; i2 = '_i';
                }
            }

            var srcIncrement;
            if (!this.rev) {
                srcIncrement = '++_s';
            } else {
                srcIncrement = '--_e';
            }
            
            var vars = prepareVariables(hints,
                '_v', this.lambdaGetItem('s', i2, '_l'));

            f = new Function(alias, "s", "_l", "_s", "_e", "a", "_tl", "_tla", "_p",
                ["var _b=true;for(;_s<_e;", srcIncrement, "){", i1, vars.decl,
                "if((", lambdaJoin(splited, vars._v, i2, "a"), ")===false){return _b;}}return false;"].join(''));
            cache.set("each_" + dt, proc, f);
        }

        this.broken = f(from, data, data.length, region.start, region.end, _a, take, takeArg, p);
    }

	return this;
};

RandomAccessIterable.prototype.at = function(index) {
    var r = this.measureRegion();
    if (!this.rev) {
	    return this.getItem(this.data, r.start + index);
    } else {
	    return this.getItem(this.data, r.end - index);
    }
};

RandomAccessIterable.prototype.count = function(pred, arg) {
	if (!pred) {
        var r = this.measureRegion();
        if (!r.take) {
		    return r.end - r.start;
        }
	}

    return Iterable.prototype.count.call(this, pred, arg);
};

RandomAccessIterable.prototype.any = function (pred, arg) {
    if (!pred) {
        var r = this.measureRegion();
        if (!r.take) {
            return r.start < r.end;
        }
    }

    return Iterable.prototype.any.call(this, pred, arg);
};

RandomAccessIterable.prototype.first = function(pred, arg) {
	if (!pred) {
        var r = this.measureRegion();
        if (!r.take) {
            var s = r.start;
            var e = r.end;

            if (s < e) {
                if (!this.rev) {
			        return this.getItem(this.data, s);
                } else {
                    return this.getItem(this.data, e - 1);
                }
            } else {
                return;
            }
        }
	}

    return Iterable.prototype.first.call(this, pred, arg);
};

RandomAccessIterable.prototype.last = function(pred, arg) {
	if (!pred) {
        var r = this.measureRegion();
        if (!r.take) {
            var s = r.start;
            var e = r.end;

            if (s < e) {
                if (!this.rev) {
                    return this.getItem(this.data, e - 1);
                } else {
                    return this.getItem(this.data, s);
                }
            } else {
                return;
            }
        }
	}
    
    return Iterable.prototype.last.call(this, pred, arg);
};

RandomAccessIterable.prototype.orderBy = function(keySelector, comparer, arg) {
	return new OrderedRandomAccessIterable(this)._addContext(keySelector || "$", comparer, 1, arg);
};

RandomAccessIterable.prototype.orderByDesc = function(keySelector, comparer, arg) {
	return new OrderedRandomAccessIterable(this)._addContext(keySelector || "$", comparer, -1, arg);
};

RandomAccessIterable.prototype.reverse = function () {
    return this.clone().reverseRegion();
};

RandomAccessIterable.prototype.skip = function (count) {
    if (count < 0) {
        return this.clone().addRegionQuery(!this.rev ? 'skipRight' : 'skipLeft', -count, null);
    } else if (count > 0) {
        return this.clone().addRegionQuery(!this.rev ? 'skipLeft' : 'skipRight', count, null);
    } else {
        return this;
    }
};

RandomAccessIterable.prototype.skipWhile = function (pred, arg) {
    return this.clone().addRegionQuery(!this.rev ? 'skipLeft' : 'skipRight', pred, arg);
};

RandomAccessIterable.prototype.take = function (count) {
    if (count < 0) {
        return this.clone().addRegionQuery(!this.rev ? 'takeRight' : 'takeLeft', -count, null);
    } else if (count > 0) {
        return this.clone().addRegionQuery(!this.rev ? 'takeLeft' : 'takeRight', count, null);
    } else {
        return from();
    }
};

RandomAccessIterable.prototype.takeWhile = function (pred, arg) {
    return this.clone().addRegionQuery(!this.rev ? 'takeLeft' : 'takeRight', pred, arg);
};

RandomAccessIterable.prototype.toArray = function () {
    var r = this.measureRegion();
    if (!r.take) {
        var get = this.getItem;
        var data = this.data;
        var s = r.start;
        var e = r.end;

        var result = new Array(e - s);
        if (!this.rev) {
            for (var i = s; i < e; ++i) {
                result[i - s] = get(data, i);
            }
        } else {
            for (var i = e; i > s; --i) {
                result[e - i] = get(data, i - 1);
            }
        }

        return result;
    }

    return Iterable.prototype.toArray.call(this);
};

RandomAccessIterable.prototype.trim = function(left, right, arg) {
    var args = getTrimmingArgument(left, right, arg);

    var clone = this.clone();
    clone.addRegionQuery(!this.rev ? 'skipLeft' : 'skipRight', args.left, args.leftArg);
    clone.addRegionQuery(!this.rev ? 'skipRight' : 'skipLeft', args.right, args.rightArg);

    return clone;
};

RandomAccessIterable.prototype.zip = function(second, resultSelector, arg) {
    var rs;
    var index = (!this.rev ? '@.s++' : '--@.e');

    if (typeof(resultSelector) == "string") {
	    rs = "(" + lambdaReplace(resultSelector, '@.v', "$", '@.i', "$$", "@a") + ")";
    } else {
	    rs = '@rs(@.v,$,@.i,$$,@a)';
    }

	var self = this;
	function iterator(proc, arg0) {
		var data = self.data;

        var region = self.measureRegion();
        var s = region.start;
        var e = region.end;

        if (s >= e) {
            this.broken = false;
            return this;
        }
        
        var take = region.take;
        var takeArg = region.takeArg;

		var procStr;
		if (typeof(proc) == "string") {
		    var splited = [];
			var hint = lambdaGetUseCount(proc, 3, splited);
			var v, k, list = [];

			switch (hint[0]) {
			case 0: case 1: v = rs; break;
			default: list.push("(@RS=" + rs + ")"); v = "@RS"; break;
			}

			switch (hint[1]) {
			case 0: case 1: k = "(@k++)"; break;
			default: list.push("(@kk=@k++)"); k = "@kk"; break;
			}

			list.push(lambdaJoin(splited, v, k, "@a0"));

			procStr = "(" + list.join(",") + ")";
		}
		else {
			procStr = "@p(" + rs + ",@k++,@a0)";
		}

        var _p = ["@.s>=@.e?@.b=false:((@.i=", index, '),(@.v=', self.lambdaGetItem('@.d', '@.i'), '),'];

        if (take) {
            if (typeof take == 'string') {
                _p.push('!(', lambdaReplace(take, '@.v', '@.i', '@.ta'), ')');
            } else {
                _p.push('!@t(@.v,@.i,@.ta)');
            }
            _p.push('?@.b=false:(', procStr, "))");
        } else {
            _p.push(procStr, ')');
        }

        var a = {a: arg, a0: arg0, k: 0, d: data, s: s, e: e, p: proc, rs: resultSelector, b: true, t: take, ta: takeArg};
		this.broken = from(second).each(_p.join(''), a).broken && a.b;
		return this;
	}

	return new Iterable(iterator);
};

//
// StringIterable
//

function StringIterable(str) {
    RandomAccessIterable.call(this, str);
}
extend(RandomAccessIterable, StringIterable);

StringIterable.prototype.dataType = 'string';

StringIterable.prototype.lambdaGetItem = function (target, index) {
    return target + '.charAt(' + index + ')';
};

StringIterable.prototype.getItem = function (target, index) {
    return target.charAt(index);
};

StringIterable.prototype.toString = function (separator) {
    if (!separator && !this.rev) {
        var data = this.data;
        
        var r = this.measureRegion();
        if (!r.take) {
            var s = r.start;
            var e = r.end;

            if (s == 0 && e == data.length) {
                return data;
            } else {
                return data.substring(s, e);
            }
        }
    }

    return Iterable.prototype.toString.call(this, separator);
};

StringIterable.prototype.toJSON = function() {
	return quote(this.data);
};

//
// ArrayIterable
//

function ArrayIterable(array) {
    RandomAccessIterable.call(this, array);
}
extend(RandomAccessIterable, ArrayIterable);

ArrayIterable.prototype.dataType = 'array';

ArrayIterable.prototype.lambdaGetItem = function (target, index) {
    return target + '[' + index + ']';
};

ArrayIterable.prototype.getItem = function (target, index) {
    return target[index];
};

ArrayIterable.prototype.toJSON = function(track) {
	if (track) {
		track.push(this.data);
	}
	else {
		track = [this.data];
	}
	
	var json = Iterable.prototype.toJSON.call(this, track);
	track.pop();

	return json;
};

ArrayIterable.prototype.toArray = function () {
    if (this.rev) {
        return RandomAccessIterable.prototype.toArray.call(this);
    }
    
    var r = this.measureRegion();
    if (!r.take) {
        return this.data.slice(r.start, r.end);
    }

    return Iterable.prototype.toArray.call(this);
};

//
// ObjectIterable
//

function ObjectIterable(data) {
	this.data = data;
}
extend(Iterable, ObjectIterable);

ObjectIterable.prototype.each = function(proc, _a) {
	var _d = this.data;
	
	if  (typeof(proc) == "function") {
		this.broken = false;
		for (var key in _d) {
			if (proc(_d[key], key, _a) === false) {
				this.broken = true;
				break;
			}
		}
	}
	else {
		var f = cache.get("each_o", proc);
		if (!f) {   
		    var splited = [];
			var hint = lambdaGetUseCount(proc, 3, splited);
			var defV, v;

			switch (hint[0]) {
			case 0: case 1: defV = ""; v = "d[k]"; break;
			default: defV = "var v=d[k];"; v = "v"; break;
			}

			f = new Function(alias, "d", "a", "for(var k in d){" + defV + "if((" + lambdaJoin(splited, v, "k", "a") + ")===false){return true;}}return false;");
			cache.set("each_o", proc, f);
		}

		this.broken = f(from, _d, _a);
	}

	return this;
};

ObjectIterable.prototype.at = function(index) {
	return this.skip(index).first();
};

ObjectIterable.prototype.reverse = function() {
	return new ObjectReversedIterable(this.data);
};

ObjectIterable.prototype.toJSON = ArrayIterable.prototype.toJSON;

//
// ObjectReversedIterable
//

function ObjectReversedIterable(data) {
	this.data = data;
}
extend(ObjectIterable, ObjectReversedIterable);

ObjectReversedIterable.prototype.each = function(proc, _a) {
	var _d = this.data;

	var row = [];
	for (var key in _d) {
		row.push(key);
		row.push(_d[key]);
	}

	if  (typeof(proc) == "string") {
		var f = cache.get("each_or", proc);
		if (!f) {
		    var splited = [];
			var hint = lambdaGetUseCount(proc, 3, splited);
			var defV, defK, v, k;

			switch (hint[0]) {
			case 0: case 1: defV = ""; v = "r[ii+1]"; break;
			default: defV = "var v=r[ii+1];"; v = "v"; break;
			}

			switch (hint[1]) {
			case 0: case 1: defK = ""; k = "r[ii]"; break;
			default: defK = "var k=r[ii];"; k = "k"; break;
			}

			f = new Function(alias, "r", "a", "for(var i=r.length/2;i>0;--i){var ii=(i-1)*2;" + defV + defK + "if((" + lambdaJoin(splited, v, k, "a") + ")===false){return true;}}return false;");
			cache.set("each_or", proc, f);
		}

		this.broken = f(from, row, _a);
	}
	else {
		this.broken = false;
		for (var i = row.length / 2; i > 0; --i) {
			var ii = (i - 1) * 2;
			if (proc(row[ii + 1], row[ii], _a) === false) {
				this.broken = true;
				break;
			}
		}
	}

	return this;
};

ObjectReversedIterable.prototype.reverse = function() {
	return new ObjectIterable(this.data);
}

//
// OrderedIterable
//

function OrderedIterable(it) {
	this.it = it;
}
extend(ObjectIterable, OrderedIterable);

OrderedIterable.prototype.clone = function () {
    var o = new this.constructor(this.it);
    var ctx = this.context;

    if (ctx) {
        o.context = from(ctx).toArray();
    }

    return o;
};

OrderedIterable.prototype._addContext = function(keySelector, comparer, asc, arg) {
    var ctx = this.context;
    if (!ctx) {
        this.context = ctx = [];
    }

	ctx.push({
		keySelector: lambdaParse(keySelector, 3),
		comparer: lambdaParse(comparer, 3),
		asc: asc,
		arg: arg
	});

    return this;
}

OrderedIterable.prototype.each = function(proc, arg) {
	var row = [];
	this.it.each("@push($$),@push($),0", row);

	var indices = from.range(row.length / 2).toArray();

	var contexts = this.context;

	function f(a, b) {
        if (contexts) {
            for (var i = 0, l = contexts.length; i < l; ++i) {
                var ctx = contexts[i];

                var aSelected = ctx.keySelector(row[a * 2 + 1], row[a * 2], ctx.arg);
                var bSelected = ctx.keySelector(row[b * 2 + 1], row[b * 2], ctx.arg);

                var compared;
                if (!ctx.comparer) {
                    compared = (aSelected == bSelected ? 0 : (aSelected < bSelected ? -ctx.asc : ctx.asc));
                }
                else {
                    compared = ctx.asc * ctx.comparer(aSelected, bSelected, ctx.arg);
                }

                if (compared != 0) return compared;
            }
        }

		return (a == b ? 0 : (a < b ? -1 : 1));
	}

	indices.sort(f);

	if (typeof(proc) == "string") {
		var f = cache.get("each_ord", proc);
		if (!f) {
		    var splited = [];
			var hint = lambdaGetUseCount(proc, 3, splited);
			var defV, defK, v, k;

			switch (hint[0]) {
			case 0: case 1: defV = ""; v = "r[n+1]"; break;
			default: defV = "var v=r[n+1];"; v = "v"; break;
			}

			switch (hint[1]) {
			case 0: case 1: defK = ""; k = "r[n]"; break;
			default: defK = "var k=r[n];"; k = "k"; break;
			}

			f = new Function(alias, "l", "r", "a",
			    "for(var i=0,c=l.length;i<c;++i){var n=l[i]*2;" + defV + defK + "if((" + lambdaJoin(splited, v, k, "a") + ")===false)return true;}return false;");
			cache.set("each_ord", proc, f);
		}
		this.broken = f(from, indices, row, arg);
	}
	else {
		this.broken = false;
		for (var i = 0, l = indices.length; i < l; ++i) {
			var index = indices[i] * 2;
			if (proc(row[index + 1], row[index], arg) === false) {
				this.broken = true;
				break;
			}
		}
	}

	return this;
};

OrderedIterable.prototype.thenBy = function(keySelector, comparer, arg) {
	return this.clone()._addContext(keySelector, comparer, 1, arg);
};

OrderedIterable.prototype.thenByDesc = function(keySelector, comparer, arg) {
	return this.clone()._addContext(keySelector, comparer, -1, arg);
};

//
// OrderedRandomAccessIterable
//

function OrderedRandomAccessIterable(it) {
    this.it = it;
}
extend(OrderedIterable, OrderedRandomAccessIterable);

OrderedRandomAccessIterable.prototype.each = function(proc, arg) {
    var indices = this.it.select('$$').toArray();
    
    var data = this.it.data;
	var contexts = this.context;

	function f(a, b) {
        if (contexts) {
            for (var i = 0, l = contexts.length; i < l; ++i) {
                var ctx = contexts[i];

                var aSelected = ctx.keySelector(data[a], a, ctx.arg);
                var bSelected = ctx.keySelector(data[b], b, ctx.arg);

                var compared;
                if (!ctx.comparer) {
                    compared = (aSelected == bSelected ? 0 : (aSelected < bSelected ? -ctx.asc : ctx.asc));
                }
                else {
                    compared = ctx.asc * ctx.comparer(aSelected, bSelected, ctx.arg);
                }

                if (compared != 0) return compared;
            }
        }

		return (a == b ? 0 : (a < b ? -1 : 1));
	}

	indices.sort(f);

	if (typeof(proc) == "string") {
		var f = cache.get("each_ordered_random_access", proc);
		if (!f) {
		    var splited = [];
			var hint = lambdaGetUseCount(proc, 3, splited);
			var defV, defK, v, k;

			switch (hint[1]) {
			case 0: defK = ""; k = "l[i]"; break;
			default: defK = "var k=l[i];"; k = "k"; break;
			}

			switch (hint[0]) {
			case 0: case 1: defV = ""; v = "r[" + k + "]"; break;
			default: defV = "var v=r[" + k + "];"; v = "v"; break;
			}

			f = new Function(alias, "l", "r", "a",
			    "for(var i=0,c=l.length;i<c;++i){" + defK + defV + "if((" + lambdaJoin(splited, v, k, "a") + ")===false)return true;}return false;");
			cache.set("each_ordered_random_access", proc, f);
		}
		this.broken = f(from, indices, data, arg);
	}
	else {
		this.broken = false;
		for (var i = 0, l = indices.length; i < l; ++i) {
			var index = indices[i];
			if (proc(data[index], index, arg) === false) {
				this.broken = true;
				break;
			}
		}
	}

	return this;
};

//
// RegExpIterable
//

function RegExpIterable(r, str) {
    this._r = r;
    this._str = str;
}
extend(Iterable, RegExpIterable);

RegExpIterable.prototype.each = function (proc, arg) {
    var r = this._r;
    r.lastIndex = 0;

    if (r.global) {
	    var s = this.data;
        var p;
	
	    if (typeof(proc) == "function") {
            p = proc;
            proc = '_p($,$$,@)';
	    }

        var f = cache.get("each_regexp", proc);

        if (!f) {
            var splited = [];
            var hints = lambdaGetUseCount(proc, 3, splited);
            var i1, i2;
            
            if (hints[1] == 0) {
                i1 = '';
                i2 = '';
            } else {
                i1 = 'var _i=0';
                i2 = '++_i';
            }

            f = new Function(alias, "_r", "_s", '_a', "_p",
                ["var _m;for(", i1, ';_m=_r.exec(_s);', i2, "){if((", lambdaJoin(splited, '_m', '_i', "_a"), ")===false){return true;}}return false;"].join(''));
            cache.set("each_regexp", proc, f);
        }

        this.broken = f(from, this._r, this._str, arg, p);
	} else {
	    if (typeof proc == 'string') {
	        proc = lambdaParse(proc, 3);
	    }

        var m = r.exec(this._str);
        this.broken = (m ? proc(m, 0, arg) === false : false);
	}

    return this;
};

RegExpIterable.prototype.any = function (pred, arg) {
    if (!pred) {
        var r = this._r;
        r.lastIndex = 0;

        return r.test(this._str);
    } else {
        return Iterable.prototype.any.call(this, pred, arg);
    }
};

RegExpIterable.prototype.first = function (pred, arg) {
    if (!pred) {
        var r = this._r;
        r.lastIndex = 0;

        return r.exec(this._str);
    } else {
        return Iterable.prototype.first.call(this, pred, arg);
    }
};

function from(obj, target) {
    if (!obj) {
	    return new Iterable(function() { return this; });
    } else if (obj instanceof Iterable) {
		return obj;
    } else if (obj instanceof RegExp) {
        if (target) {
            return new RegExpIterable(obj, target);
        } else {
            return {
                match: function(str) {
                    return new RegExpIterable(obj, str);
                }
            };
        }
    } else if (obj.$iterable) {
        return from(obj.$iterable());
    } else if (obj.$each) {
		var f = function(proc, arg) { this.broken = (obj.$each(proc, arg) === false); return this; };
		return new Iterable(f);
	} else if (typeof(obj) == "string") {
		return new StringIterable(obj);
	} else if (obj instanceof Array) {
		return new ArrayIterable(obj);
	} else {
		return new ObjectIterable(obj);
	}
};

from.range = function(start, end, step) {
	switch (arguments.length) {
	case 1:
		end = start;
		start = 0;
		step = 1;
		break;
		
	case 2:
		step = (end > start ? 1 : -1);
		break;
	}

	function iterator(proc, arg) {
		if (typeof(proc) == "string") {
			var cacheName = (step > 0 ? "each_ru" : "each_rd");
			var f = cache.get(cacheName, proc);
			if (!f) {
				f = new Function("s", "e", "st", "a", "for(var i=s;i" + (step > 0 ? "<" : ">") + "e;i+=st){if((" + lambdaReplace(proc, "i", "i", "a") + ")===false)return true;}return false;");
				cache.set(cacheName, proc, f);
			}

			this.broken = f(start, end, step, arg);
		}
		else {
			this.broken = false;
			if (step > 0) {
				for (var i = start; i < end; i += step) {
					if (proc(i, i, arg) === false) {
						this.broken = true;
						break;
					}
				}
			}
			else {
				for (var i = start; i > end; i += step) {
					if (proc(i, i, arg) === false) {
						this.broken = true;
						break;
					}
				}
			}
		}

		return this;
	};
	
	return new Iterable(iterator);
};

from.repeat = function(elem, count) {
	function iterator(proc, arg) {
		if (typeof(proc) == "string") {
			var f = cache.get("each_rpt", proc);
			if (!f) {
				f = new Function("c", "e", "a", "for(var i=0;i<c;++i){if((" + lambdaReplace(proc, "e", "i", "a") + ")===false)return true;}return false;");
				cache.set("each_rpt", proc, f);
			}

			this.broken = f(count, elem, arg);
		}
		else {
			this.broken = false;
			for (var i = 0; i < count; ++i) {
				if (proc(elem, i, arg) === false) {
					this.broken = true;
					break;
				}
			}
		}
		return this;
	};
	
	return new Iterable(iterator);
};

from.setAlias = function (newAlias) {
    alias = newAlias;
};

from.lambda = {
	replace: lambdaReplace,
	parse: lambdaParse,
	getUseCount: lambdaGetUseCount,
	join: lambdaJoin
};

if (platform == 'nodejs') {
    module.exports = from;
} else {
    window.from = from;
}

// End of code



})();
