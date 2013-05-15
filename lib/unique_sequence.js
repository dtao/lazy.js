var UniqueSequence = CachingSequence.inherit(function(parent) {
  this.parent = parent;
});

UniqueSequence.prototype.each = function(fn) {
  var set = {};
  this.parent.each(function(e) {
    if (e in set) { return; }
    set[e] = true;
    return fn(e);
  });
};
