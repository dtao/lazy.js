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
