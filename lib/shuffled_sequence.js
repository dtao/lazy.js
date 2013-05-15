var ShuffledSequence = CachingSequence.inherit(function(parent) {
  this.each = function(action) {
    var shuffled = parent.toArray();
    for (var i = shuffled.length - 1; i > 0; --i) {
      swap(shuffled, i, Math.floor(Math.random() * i) + 1);
      if (action(shuffled[i]) === false) {
        return;
      }
    }
    action(shuffled[0]);
  };
});
