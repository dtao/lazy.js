/**
 * An `ObjectLikeSequence` object represents a sequence of key/value pairs.
 *
 * So, this one is arguably the least... good... of the sequence types right
 * now. A bunch of methods are implemented already, and they basically "work";
 * but the problem is I haven't quite made up my mind exactly how they *should*
 * work, to be consistent and useful.
 *
 * Here are a couple of issues (there are others):
 *
 * 1. For iterating over an object, there is currently *not* a good way to do it
 *    asynchronously (that I know of). The best approach is to call
 *    `Object.keys` and then iterate over *those* asynchronously; but this of
 *    course eagerly iterates over the object's keys (though maybe that's not
 *    a really big deal).
 * 2. In terms of method chaining, it is a bit unclear how that should work.
 *    Iterating over an `ObjectLikeSequence` with {@link ObjectLikeSequence#each}
 *    passes `(value, key)` to the given function; but what about the result of
 *    {@link Sequence#map}, {@link Sequence#filter}, etc.? I've flip-flopped
 *    between thinking they should return object-like sequences or regular
 *    sequences.
 *
 * Expect this section to be updated for a coming version of Lazy.js, when I
 * will hopefully have figured this stuff out.
 *
 * @constructor
 */
function ObjectLikeSequence() {}

ObjectLikeSequence.prototype = new Sequence();

/**
 * Gets the element at the specified key in this sequence.
 *
 * @param {string} key The key.
 * @return {*} The element.
 *
 * @example
 * Lazy({ foo: "bar" }).get("foo");
 * // => "bar"
 */
ObjectLikeSequence.prototype.get = function(key) {
  return this.parent.get(key);
};

/**
 * Returns a {@link Sequence} whose elements are the keys of this object-like
 * sequence.
 *
 * @return {Sequence} The sequence based on this sequence's keys.
 *
 * @example
 * Lazy({ hello: "hola", goodbye: "hasta luego" }).keys();
 * // => sequence: ("hello", "goodbye")
 */
ObjectLikeSequence.prototype.keys = function() {
  return this.map(function(v, k) { return k; });
};

/**
 * Returns a {@link Sequence} whose elements are the values of this object-like
 * sequence.
 *
 * @return {Sequence} The sequence based on this sequence's values.
 *
 * @example
 * Lazy({ hello: "hola", goodbye: "hasta luego" }).values();
 * // => sequence: ("hola", "hasta luego")
 */
ObjectLikeSequence.prototype.values = function() {
  return this.map(function(v, k) { return v; });
};

/**
 * Returns an `ObjectLikeSequence` whose elements are the combination of this
 * sequence and another object. In the case of a key appearing in both this
 * sequence and the given object, the other object's value will override the
 * one in this sequence.
 *
 * @param {Object} other The other object to assign to this sequence.
 * @return {ObjectLikeSequence} A new sequence comprising elements from this
 *     sequence plus the contents of `other`.
 *
 * @example
 * Lazy({ "uno": 1, "dos": 2 }).assign({ "tres": 3 });
 * // => sequence: (("uno", 1), ("dos", 2), ("tres", 3))
 *
 * Lazy({ foo: "bar" }).assign({ foo: "baz" });
 * // => sequence: (("foo", "baz"))
 */
ObjectLikeSequence.prototype.assign = function(other) {
  return new AssignSequence(this, other);
};

/**
 * Alias for {@link ObjectLikeSequence#assign}.
 *
 * @function extend
 * @memberOf ObjectLikeSequence
 * @instance
 */
ObjectLikeSequence.prototype.extend = ObjectLikeSequence.prototype.assign;

/**
 * Returns an `ObjectLikeSequence` whose elements are the combination of this
 * sequence and a 'default' object. In the case of a key appearing in both this
 * sequence and the given object, this sequence's value will override the
 * default object's.
 *
 * @param {Object} defaults The 'default' object to use for missing keys in this
 *     sequence.
 * @return {ObjectLikeSequence} A new sequence comprising elements from this
 *     sequence supplemented by the contents of `defaults`.
 *
 * @example
 * Lazy({ name: "Dan" }).defaults({ name: "User", password: "passw0rd" });
 * // => sequence: (("name", "Dan"), ("password", "passw0rd"))
 */
ObjectLikeSequence.prototype.defaults = function(defaults) {
  return new DefaultsSequence(this, defaults);
};

/**
 * Returns an `ObjectLikeSequence` whose values are this sequence's keys, and
 * whose keys are this sequence's values.
 *
 * @return {ObjectLikeSequence} A new sequence comprising the inverted keys and
 *     values from this sequence.
 *
 * @example
 * Lazy({ first: "Dan", last: "Tao" }).invert();
 * // => sequence: (("Dan", "first"), ("Tao", "last"))
 */
ObjectLikeSequence.prototype.invert = function() {
  return new InvertedSequence(this);
};

/**
 * Creates a {@link Sequence} consisting of the keys from this sequence whose
 *     values are functions.
 *
 * @return {Sequence} The new sequence.
 *
 * @example
 * var dog = {
 *   name: "Fido",
 *   breed: "Golden Retriever",
 *   bark: function() { console.log("Woof!"); },
 *   wagTail: function() { console.log("TODO: implement robotic dog interface"); }
 * };
 *
 * Lazy(dog).functions();
 * // => sequence: ("bark", "wagTail")
 */
ObjectLikeSequence.prototype.functions = function() {
  return this
    .filter(function(v, k) { return typeof(v) === "function"; })
    .map(function(v, k) { return k; });
};

/**
 * Alias for {@link ObjectLikeSequence#functions}.
 *
 * @function methods
 * @memberOf ObjectLikeSequence
 * @instance
 */
ObjectLikeSequence.prototype.methods = ObjectLikeSequence.prototype.functions;

/**
 * Creates an `ObjectLikeSequence` consisting of the key/value pairs from this
 * sequence whose keys are included in the given array of property names.
 *
 * @param {Array} properties An array of the properties to "pick" from this
 *     sequence.
 * @return {ObjectLikeSequence} The new sequence.
 *
 * @example
 * var players = {
 *   "who": "first",
 *   "what": "second",
 *   "i don't know", "third"
 * };
 *
 * Lazy(players).pick(["who", "what"]);
 * // => sequence: (("who", "first"), ("what", "second"))
 */
ObjectLikeSequence.prototype.pick = function(properties) {
  return new PickSequence(this, properties);
};

/**
 * Creates an `ObjectLikeSequence` consisting of the key/value pairs from this
 * sequence excluding those with the specified keys.
 *
 * @param {Array} properties An array of the properties to *omit* from this
 *     sequence.
 * @return {ObjectLikeSequence} The new sequence.
 *
 * @example
 * var players = {
 *   "who": "first",
 *   "what": "second",
 *   "i don't know", "third"
 * };
 *
 * Lazy(players).omit(["who", "what"]);
 * // => sequence: (("i don't know", "third"))
 */
ObjectLikeSequence.prototype.omit = function(properties) {
  return new OmitSequence(this, properties);
};

/**
 * Creates an array from the key/value pairs in this sequence.
 *
 * @return {Array} An array of `[key, value]` elements.
 *
 * @example
 * Lazy({ red: "#f00", green: "#0f0", blue: "#00f" }).toArray();
 * // => [["red", "#f00"], ["green", "#0f0"], ["blue", "#00f"]]
 */
ObjectLikeSequence.prototype.toArray = function() {
  return this.map(function(v, k) { return [k, v]; }).toArray();
};

/**
 * Alias for {@link ObjectLikeSequence#toArray}.
 *
 * @function pairs
 * @memberOf ObjectLikeSequence
 * @instance
 */
ObjectLikeSequence.prototype.pairs = ObjectLikeSequence.prototype.toArray;

/**
 * Creates an object with the key/value pairs from this sequence.
 *
 * @return {Object} An object with the same key/value pairs as this sequence.
 *
 * @example
 * Lazy({ red: "#f00", green: "#0f0", blue: "#00f" }).toObject();
 * // => { red: "#f00", green: "#0f0", blue: "#00f" }
 */
ObjectLikeSequence.prototype.toObject = function() {
  return this.map(function(v, k) { return [k, v]; }).toObject();
};

/**
 * @constructor
 */
function AssignSequence(parent, other) {
  this.parent = parent;
  this.other  = other;
}

AssignSequence.prototype = new ObjectLikeSequence();

AssignSequence.prototype.each = function(fn) {
  var merged = new Set(),
      done   = false;

  Lazy(this.other).each(function(value, key) {
    if (fn(value, key) === false) {
      done = true;
      return false;
    }

    merged.add(key);
  });

  if (!done) {
    this.parent.each(function(value, key) {
      if (!merged.contains(key) && fn(value, key) === false) {
        return false;
      }
    });
  }
};

/**
 * @constructor
 */
function DefaultsSequence(parent, defaults) {
  this.parent   = parent;
  this.defaults = defaults;
}

DefaultsSequence.prototype = new ObjectLikeSequence();

DefaultsSequence.prototype.each = function(fn) {
  var merged = new Set(),
      done   = false;

  this.parent.each(function(value, key) {
    if (fn(value, key) === false) {
      done = true;
      return false;
    }

    if (typeof value !== "undefined") {
      merged.add(key);
    }
  });

  if (!done) {
    Lazy(this.defaults).each(function(value, key) {
      if (!merged.contains(key) && fn(value, key) === false) {
        return false;
      }
    });
  }
};

/**
 * @constructor
 */
function InvertedSequence(parent) {
  this.parent = parent;
}

InvertedSequence.prototype = new ObjectLikeSequence();

InvertedSequence.prototype.each = function(fn) {
  this.parent.each(function(value, key) {
    return fn(key, value);
  });
};

/**
 * @constructor
 */
function PickSequence(parent, properties) {
  this.parent     = parent;
  this.properties = properties;
}

PickSequence.prototype = new ObjectLikeSequence();

PickSequence.prototype.each = function(fn) {
  var inArray    = contains,
      properties = this.properties;

  this.parent.each(function(value, key) {
    if (inArray(properties, key)) {
      return fn(value, key);
    }
  });
};

/**
 * @constructor
 */
function OmitSequence(parent, properties) {
  this.parent     = parent;
  this.properties = properties;
}

OmitSequence.prototype = new ObjectLikeSequence();

OmitSequence.prototype.each = function(fn) {
  var inArray    = contains,
      properties = this.properties;

  this.parent.each(function(value, key) {
    if (!inArray(properties, key)) {
      return fn(value, key);
    }
  });
};

/**
 * @constructor
 */
function ObjectWrapper(source) {
  this.source = source;
}

ObjectWrapper.prototype = new ObjectLikeSequence();

ObjectWrapper.prototype.get = function(key) {
  return this.source[key];
};

ObjectWrapper.prototype.each = function(fn) {
  var source = this.source,
      key;

  for (key in source) {
    if (fn(source[key], key) === false) {
      return;
    }
  }
};
