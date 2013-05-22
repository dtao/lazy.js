var ShuffledSequence = CachingSequence.inherit(function(parent) {
  this.parent = parent;
});

ShuffledSequence.prototype.each = function(fn) {
  var shuffled = this.parent.toArray(),
      floor = Math.floor,
      random = Math.random,
      j = 0;

  for (var i = shuffled.length - 1; i > 0; --i) {
    swap(shuffled, i, floor(random() * i) + 1);
    if (fn(shuffled[i], j++) === false) {
      return;
    }
  }
  fn(shuffled[0], j);
};
