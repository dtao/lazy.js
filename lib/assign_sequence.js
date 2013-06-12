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
