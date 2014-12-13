(function() {

  /**
   * Creates a `Lemming` object with the specified script. Calling {@link #run} on the resulting
   * lemming will make it attempt to execute the script.
   *
   * @constructor
   * @param {string} script The raw JavaScript source code to (attempt to) execute.
   */
  function Lemming(script) {
    this.script = script;
  }

  /**
   * Default options for {@link Lemming} objects.
   */
  Lemming.options = {
    fileName: 'lemming.js',

    timeout: 3000,

    scripts: [],

    enableXHR: false
  };

  /**
   * Runs the {@link Lemming}'s associated JavaScript code. Execution will be terminated if the
   * `timeout` option is exceeded.
   *
   * @param {Object=} options
   */
  Lemming.prototype.run = function(options) {
    options = objectWithDefaults(options, Lemming.options);

    var lemming = this,
        worker  = new Worker(options.fileName),
        handle  = setTimeout(function() {

          worker.terminate();
          lemming.handleTimeout();
          lemming.handleCompleted();

        }, options.timeout);

    worker.addEventListener('message', function(e) {
      clearTimeout(handle);
      lemming.handleResult(e.data);
      lemming.handleCompleted();
    });

    worker.addEventListener('error', function(e) {
      clearTimeout(handle);
      lemming.handleError(e.message || e);
      lemming.handleCompleted();
    });

    var message = JSON.stringify({
      source: this.script,
      scripts: options.scripts,
      enableXHR: options.enableXHR
    });

    worker.postMessage(message);
  };

  Lemming.prototype.onResult = function(callback) {
    this.handleResult = callback;
  };

  Lemming.prototype.onTimeout = function(callback) {
    this.handleTimeout = callback;
  };

  Lemming.prototype.onError = function(callback) {
    this.handleError = callback;
  };

  Lemming.prototype.onCompleted = function(callback) {
    this.handleCompleted = callback;
  };

  Lemming.prototype.handleResult =
  Lemming.prototype.handleTimeout =
  Lemming.prototype.handleError =
  Lemming.prototype.handleCompleted = function() {};

  /**
   * Creates an object with all of the specified properties, falling back to the specified defaults.
   *
   * @private
   */
  function objectWithDefaults(properties, defaults) {
    var object = {};
    for (var p in properties) {
      object[p] = properties[p];
    }
    for (var d in defaults) {
      if (!object[d]) {
        object[d] = defaults[d];
      }
    }
    return object;
  }

  if (typeof WorkerGlobalScope !== 'undefined' && this instanceof WorkerGlobalScope) {
    this.onmessage = function onmessage(e) {
      var data = JSON.parse(e.data);

      importScripts.apply(this, data.scripts);

      if (!data.enableXHR) {
        delete this.XMLHttpRequest;
      }

      var result = eval(data.source);

      this.postMessage(result);
    };
  }

  this.Lemming = Lemming;

}).call(this);
