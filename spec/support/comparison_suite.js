var Benchmark = require("../../site/lib/benchmark.js");

function ComparisonSuite(options) {
  options = options || {};

  var suite       = new Benchmark.Suite();
  var testsByName = {};
  var currentSet  = [];

  suite.on("cycle", function(e) {
    currentSet.push(e.target);
    if (currentSet.length === testsByName[e.target.name].length) {
      reportCurrentSet();
      currentSet = [];

    } else {
      reportRunning(e.target);
    }
  });

  function addTestToSuite(name, test, input, addOptions) {
    var benchmark = new Benchmark(name, function() {
      addOptions.tests[test].apply(addOptions.context, addOptions.inputs[input]);
    });
    benchmark.label = test;
    suite.add(benchmark);
    if (!testsByName[name]) { testsByName[name] = []; }
    testsByName[name].push(test);
  }

  function reportCurrentSet() {
    var reporter = options.reporter;
    if (reporter && typeof reporter.onTestResults === "function") {
      reporter.onTestResults(currentSet);
    }
  }

  function reportRunning(target) {
    var reporter = options.reporter;
    if (reporter && typeof reporter.onRunning === "function") {
      reporter.onRunning(target);
    }
  }

  this.add = function(name, addOptions) {
    for (var test in addOptions.tests) {
      for (var input in addOptions.inputs) {
        addTestToSuite(name, test, input, addOptions);
      }
    }
  };

  this.onTestResults = function(callback) {
    if (!options.reporter) { options.reporter = {}; }
    options.reporter.onTestResults = callback;
  };

  this.onRunning = function(callback) {
    if (!options.reporter) { options.reporter = {}; }
    options.reporter.onRunning = callback;
  };

  this.run = function() {
    suite.run();
  };
}

module.exports = ComparisonSuite;
