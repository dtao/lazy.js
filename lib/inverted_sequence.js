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
