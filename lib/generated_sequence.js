var GeneratedSequence = Sequence.inherit(function(generatorFn) {
  this.get = generatorFn;

  this.length = function() {
    throw "Cannot get the length of a generated sequence.";
  };

  this.each = function(action) {
    var i = 0;
    while (true) {
      if (action(generatorFn(i++)) === false) {
        break;
      }
    }
  };
});
