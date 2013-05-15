// TODO: This should really return an object, not an jagged array. Will
// require a bit of rework -- but hopefully not too much!
var GroupedSequence = CachingSequence.inherit(function(parent, keyFn) {
  this.each = function(fn) {
    var grouped = {};
    parent.each(function(e) {
      var key = keyFn(e);
      if (!grouped[key]) {
        grouped[key] = [e];
      } else {
        grouped[key].push(e);
      }
    });
    for (var key in grouped) {
      if (fn([key, grouped[key]]) === false) {
        break;
      }
    }
  };
});
