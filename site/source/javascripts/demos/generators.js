window.addEventListener('load', function() {
  Lemming.options.fileName = '../../javascripts/lib/lemming.js';
  Lemming.options.scripts = ['lazy.js', 'lazy.es6.js'];

  var generatorEditor = createEditor('generator'),
      sequenceEditor  = createEditor('sequence'),
      outputEditor    = createEditor('output', { readOnly: true });

  function createEditor(elementId, options) {
    options = Lazy({ mode: 'javascript', viewportMargin: Infinity })
      .merge(options || {})
      .toObject();
    return CodeMirror.fromTextArea(document.getElementById(elementId), options);
  }

  function addClassToEditor(editor, className) {
    editor.getWrapperElement().classList.add(className);
  }

  function removeClassFromEditor(editor, className) {
    editor.getWrapperElement().classList.remove(className);
  }

  function evaluate() {
    var lemming = new Lemming(getSource());

    lemming.onTimeout(function() {
      displayError('Timed out.');
    });

    lemming.onError(function(error) {
      displayError(error);
    });

    lemming.onResult(function(result) {
      displayMessage(result);
    });

    lemming.onCompleted(function() {
      removeClassFromEditor(outputEditor, 'loading');
    });

    addClassToEditor(outputEditor, 'loading');

    lemming.run();
  }

  function getSource() {
    return [
      generatorEditor.getValue(),
      'var sequence = ' + sequenceEditor.getValue(),
      'sequence.value()'
    ].join('\n\n');
  }

  function displayError(message) {
    addClassToEditor(outputEditor, 'error');
    outputEditor.setValue(message);
  }

  function displayMessage(message) {
    if (typeof message !== 'string') {
      message = JSON.stringify(message, null, 2);
    }

    removeClassFromEditor(outputEditor, 'error');
    outputEditor.setValue(message);
  }

  generatorEditor.on('change', evaluate);
  sequenceEditor.on('change', evaluate);

  evaluate();
});
