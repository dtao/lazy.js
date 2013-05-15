var ZippedSequence = CachingSequence.inherit(function(parent, arrays) {
  this.parent = parent;
  this.arrays = arrays;
});

ZippedSequence.prototype.each = function(fn) {
  var arrays = this.arrays,
      i = 0;
  this.parent.each(function(e) {
    var group = [e];
    for (var j = 0; j < arrays.length; ++j) {
      if (arrays[j].length > i) {
        group.push(arrays[j][i]);
      }
    }
    ++i;
    return fn(group);
  });
};
