/**
 * An `ObjectLikeSequence` object represents a sequence of key/value pairs.
 *
 * @constructor
 */
function ObjectLikeSequence() {}

ObjectLikeSequence.prototype = new Sequence();

ObjectLikeSequence.prototype.get = function(key) {
  return this.parent.get(key);
};

ObjectLikeSequence.prototype.keys = function() {
  return this.map(function(v, k) { return k; });
};

ObjectLikeSequence.prototype.values = function() {
  return this.map(function(v, k) { return v; });
};

ObjectLikeSequence.prototype.assign = function(other) {
  return new AssignSequence(this, other);
};

ObjectLikeSequence.prototype.extend = ObjectLikeSequence.prototype.assign;

ObjectLikeSequence.prototype.defaults = function(defaults) {
  return new DefaultsSequence(this, defaults);
};

ObjectLikeSequence.prototype.invert = function() {
  return new InvertedSequence(this);
};

ObjectLikeSequence.prototype.functions = function() {
  return this
    .filter(function(v, k) { return typeof(v) === "function"; })
    .map(function(v, k) { return k; });
};

ObjectLikeSequence.prototype.methods = ObjectLikeSequence.prototype.functions;

ObjectLikeSequence.prototype.pick = function(properties) {
  return new PickSequence(this, properties);
};

ObjectLikeSequence.prototype.omit = function(properties) {
  return new OmitSequence(this, properties);
};

ObjectLikeSequence.prototype.toArray = function() {
  return this.map(function(v, k) { return [k, v]; }).toArray();
};

ObjectLikeSequence.prototype.pairs = ObjectLikeSequence.prototype.toArray;

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
