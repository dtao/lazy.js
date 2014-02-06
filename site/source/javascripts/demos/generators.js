window.addEventListener('load', function() {
  var generatorEditor = createEditor('generator'),
      sequenceEditor  = createEditor('sequence'),
      outputEditor    = createEditor('output', { readOnly: true });

  function createEditor(elementId, options) {
    options = Lazy({ mode: 'javascript', viewportMargin: Infinity }).merge(options || {}).toObject();
    return CodeMirror.fromTextArea(document.getElementById(elementId), options);
  }

  function evaluate() {
    tryGetGenerator(function(generator) {
      tryGetSequence(generator, function(sequence) {
        outputEditor.getWrapperElement().classList.remove('error');
        outputEditor.setValue(JSON.stringify(sequence.value(), null, 2));
      });
    });
  }

  function displayError(message) {
    outputEditor.getWrapperElement().classList.add('error');
    outputEditor.setValue(message);
  }

  function tryGetGenerator(callback) {
    try {
      var generator = eval('(' + generatorEditor.getValue() + ')');
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
      var sequence = eval(sequenceEditor.getValue());
      if (!(sequence instanceof Lazy.Sequence)) {
        displayError('Expression in the middle is not a sequence.');
        return;
      }

      callback(sequence);

    } catch (e) {
      displayError(e.message || String(e));
    }
  }

  generatorEditor.on('change', evaluate);
  sequenceEditor.on('change', evaluate);

  evaluate();
});
