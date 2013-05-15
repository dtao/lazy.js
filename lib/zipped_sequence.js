var ZippedSequence = CachingSequence.inherit(function(parent, arrays) {
  this.each = function(action) {
    var i = 0;
    parent.each(function(e) {
      var group = [e];
      for (var j = 0; j < arrays.length; ++j) {
        if (arrays[j].length > i) {
          group.push(arrays[j][i]);
        }
      }
      ++i;
      return action(group);
    });
  };
});
