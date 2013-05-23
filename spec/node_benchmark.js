var Benchmark = require("../docs/lib/benchmark.js");
var Lazy = require("../lazy.js");
var _ = require("../docs/lib/lodash.js");

Benchmark.options.maxTime = 1;

// Yeah, yeah. Big deal.
String.prototype.padLeft = function(width, delimiter) {
  var padding = width - this.length;

  if (padding <= 0) {
    return this;
  }

  return this + new Array(padding + 1).join(delimiter || " ");
};

String.prototype.repeat = function(count) {
  return "".padLeft(count, this);
};

function readValue(object, keys) {
  var value = Lazy(keys.split(".")).reduce(function(obj, key) {
    return obj[key];
  }, object);

  return typeof value === "number" && Math.floor(value) !== value ?
    value.toFixed(3) : value;
};

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

var tests = {
  "Lazy.js - mostly dupes": function() {
    Lazy(mostlyDupes).uniq().each(function(e) {});
  },
  "Lazy.js - mostly uniques": function() {
    Lazy(mostlyUniques).uniq().each(function(e) {});
  },
  "Lo-Dash - mostly dupes": function() {
    _.each(_.uniq(mostlyDupes), function(e) {});
  },
  "Lo-Dash - mostly uniques": function() {
    _.each(_.uniq(mostlyUniques), function(e) {});
  }
};

console.log("Testing uniq for " + size + " elements.");

var suite = Lazy(tests).reduce(function(suite, test, name) {
  suite.add(name, test);
  return suite;
}, new Benchmark.Suite());

suite.on("cycle", function(e) {
  console.log(e.target.name + ": " + e.target.hz);
});

suite.on("complete", function() {
  console.log("\nResults:\n");

  var results = Lazy(suite.slice(0, suite.length))
    .sortBy(function(run) { return run.hz; })
    .reverse();

  var columns = ["name", "hz", "count", "cycles", "stats.rme", "stats.deviation"];

  var columnWidths = Lazy(columns)
    .map(function(columnName) {
      return [
        columnName,
        results
          .map(function(result) { return readValue(result, columnName); })
          .map(String)
          .pluck("length")
          .concat([columnName.length])
          .max()
      ];
    })
    .toObject();

  var header = Lazy(columns)
      .map(function(column) { return column.padLeft(columnWidths[column]); })
      .join(" | ");

  console.log(header);
  console.log("-".repeat(header.length));

  results.each(function(result) {
    console.log(
      Lazy(columns)
        .map(function(column) { return String(readValue(result, column)).padLeft(columnWidths[column]); })
        .join(" | ")
    );
  });
});

console.log("Running benchmarks...");

suite.run();
