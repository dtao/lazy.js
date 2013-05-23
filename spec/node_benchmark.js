var Benchmark = require("../docs/lib/benchmark.js");
var Lazy = require("../lazy.js");
var _ = require("../docs/lib/lodash.js");

// Right now this script only tests uniq, because that's what I'm working on at
// the moment. Short-term goal is to refactor this to basically do a quick run
// on ANY method. Medium-term goal is to make it environment-agnostic (so have
// a browser runner as well) and have it run against any other library.

// Long-term goal is to make it library-agnostic (not just for Lazy.js). At that
// point I think we'll have a separate open-source project on our hands ;)

var size = parseInt(process.argv[2], 10);
var maxForDupes = Math.sqrt(size);

var mostlyDupes = Lazy.generate(Math.random)
  .map(function(x) { return Math.floor(x * maxForDupes) + 1; })
  .take(size)
  .toArray();

var mostlyUniques = Lazy.generate(Math.random)
  .map(function(x) { return Math.floor(x * size) + 1; })
  .take(size)
  .toArray();

console.log("Testing uniq for " + size + " elements.");

var suite = new Benchmark.Suite();

suite.add("Lazy.js - mostly dupes", function() {
  Lazy(mostlyDupes).uniq().each(function(e) {});
});

suite.add("Lazy.js - mostly uniques", function() {
  Lazy(mostlyUniques).uniq().each(function(e) {});
});

suite.add("Lo-Dash - mostly dupes", function() {
  _.each(_.uniq(mostlyDupes), function(e) {});
});

suite.add("Lo-Dash - mostly uniques", function() {
  _.each(_.uniq(mostlyUniques), function(e) {});
});

suite.on("cycle", function(e) {
  console.log(e.target.name + ": " + e.target.hz);
});

console.log("Running benchmarks...");

suite.run();
