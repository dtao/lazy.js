var GeneratedSequence = Sequence.inherit(function(generatorFn) {
  this.get = generatorFn;
});

GeneratedSequence.prototype.length = function() {
  throw "Cannot get the length of a generated sequence.";
};

GeneratedSequence.prototype.each = function(fn) {
  var generatorFn = this.get,
      i = 0;
  while (true) {
    if (fn(generatorFn(i++)) === false) {
      break;
    }
  }
};
