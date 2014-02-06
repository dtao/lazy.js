window.addEventListener('load', function() {
  var generatorTxt = document.getElementById('generator'),
      sequenceTxt  = document.getElementById('sequence'),
      outputPre    = document.getElementById('output');

  function evaluate() {
    tryGetGenerator(function(generator) {
      tryGetSequence(generator, function(sequence) {
        outputPre.className = '';
        outputPre.textContent = JSON.stringify(sequence.value(), null, 2);
      });
    });
  }

  function displayError(message) {
    outputPre.className = 'error';
    outputPre.textContent = message;
  }

  function tryGetGenerator(callback) {
    try {
      var generator = eval('(' + generatorTxt.value + ')');
      if (!Lazy.isES6Generator(generator)) {
        displayError('Expression on the left is not a generator.');
        return;
      }

      callback(generator);

    } catch (e) {
      displayError(e.message || String(e));
    }
  }

  function tryGetSequence(generator, callback) {
    try {
      var sequence = eval(sequenceTxt.value);
      if (!(sequence instanceof Lazy.Sequence)) {
        displayError('Expression in the middle is not a sequence.');
        return;
      }

      callback(sequence);

    } catch (e) {
      displayError(e.message || String(e));
    }
  }

  generatorTxt.addEventListener('keyup', evaluate);
  sequenceTxt.addEventListener('keyup', evaluate);

  evaluate();
});
