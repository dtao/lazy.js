// TODO: This should return an object too (like GroupBySequence).
var CountedSequence = CachingSequence.inherit(function(parent, keyFn) {
  this.each = function(fn) {
    var grouped = {};
    parent.each(function(e) {
      var key = keyFn(e);
      if (!grouped[key]) {
        grouped[key] = 1;
      } else {
        grouped[key] += 1;
      }
    });
    for (var key in grouped) {
      fn([key, grouped[key]]);
    }
  };
});
