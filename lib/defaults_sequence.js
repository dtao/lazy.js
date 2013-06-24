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
