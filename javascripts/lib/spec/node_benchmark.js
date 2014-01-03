// Right now this script only tests uniq, because that's what I'm working on at
// the moment. Short-term goal is to refactor this to basically do a quick run
// on ANY method. Medium-term goal is to make it environment-agnostic (so have
// a browser runner as well) and have it run against any other library.

// Long-term goal is to make it library-agnostic (not just for Lazy.js). At that
// point I think we'll have a separate open-source project on our hands ;)

var Benchmark = require("../site/lib/benchmark.js");
var ComparisonSuite = require("./support/comparison_suite.js");
var Lazy = require("../lazy.js");
var _ = require("../site/lib/lodash.js");

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

var size = parseInt(process.argv[2], 10);
if (!size) {
  console.log("You must specify a size.");
  process.exit();
}

var type = process.argv[3];
var input = (function getArrayForType(type) {
  var map;
  switch (type) {
    case "mostdupe":
      map = function(x) { return Math.floor(x * Math.sqrt(size)) + 1; };
      break;
    case "halfdupe":
      map = function(x) { return Math.floor(x * size / 2) + 1; };
      break;
    case "mostuniq":
      map = function(x) { return Math.floor(x * size) + 1; };
      break;
    default:
      console.log("You must specify a type: 'mostdupe', 'halfdupe', or 'mostuniq'.");
      process.exit();
  }

  return Lazy.generate(Math.random)
    .map(map)
    .take(size)
    .toArray();
}(type));

var suite = new ComparisonSuite({
  reporter: {
    onRunning: function(test) {
      console.log("Running test '" + test.label + "'.");
    },

    onTestResults: function(tests) {
      console.log("\nResults:\n");

      var results = Lazy(tests)
        .sortBy(function(test) { return test.hz; })
        .reverse();

      var columns = ["label", "hz", "count", "cycles", "stats.rme", "stats.deviation"];

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
    }
  }
});

suite.add("uniq", {
  tests: {
    "Lazy.js (no cache)": function(array) { Lazy(array).uniq().eachNoCache(function(e) {}); },
    "Lazy.js (array cache)": function(array) { Lazy(array).uniq().eachArrayCache(function(e) {}); },
    "Lazy.js (set cache)": function(array) { Lazy(array).uniq().eachSetCache(function(e) {}); },
    "Lo-Dash": function(array) { _.each(_.uniq(array), function(e) {}); }
  },

  inputs: {
    "array": [input]
  }
});

console.log("Running benchmarks...");

suite.run();
