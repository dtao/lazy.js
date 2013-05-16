var GeneratedSequence = Sequence.inherit(function(generatorFn, length) {
  this.get = generatorFn;
  this.fixedLength = length;
});

GeneratedSequence.prototype.length = function() {
  return this.fixedLength;
};

GeneratedSequence.prototype.each = function(fn) {
  var generatorFn = this.get,
      length = this.fixedLength,
      i = 0;
  while (typeof length === "undefined" || i < length) {
    if (fn(generatorFn(i++)) === false) {
      break;
    }
  }
};
