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
