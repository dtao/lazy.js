$(document).ready(function() {
  $("nav ul li a").on("click", function() {
    var link     = $(this);
    var nav      = link.closest("nav");
    var target   = link.attr("href");
    var sections = nav.attr("data-sections");

    // If this link doesn't have an href like '#target', forget it!
    if (target.charAt(0) !== "#" && !link.is(".nav-link")) {
      return;
    }

    // Highlight the tab
    $("li.selected", nav).removeClass("selected");
    link.closest("li").addClass("selected");

    if (!sections) {
      return;
    }

    // Show the section
    $(sections).hide();
    $(target).show();

    // Refresh the chart, if necessary
    var columnChart = $(".column-chart:visible");
    if (columnChart.length > 0) {
      HighTables.renderChart(columnChart[0]);
    }

    return false;
  });

  $(".underscore-version").text(_.VERSION);
  $(".lodash-version").text(lodash.VERSION);
});
(function() {
  Benchmark.options.maxTime = 0.1;

  var arrays = {};
  var benchmarksForToArray = {};
  var benchmarksForEach = {};
  var benchmarkResults = {};

  // Since Boiler.js is the last lib we added, it's the most recent hijacker of
  // the _ identifier.
  boiler = _.noConflict();

  // Lo-Dash was next in line.
  lodash = _.noConflict();

  // Now Underscore is back!

  function getOrCreateArray(size) {
    if (!arrays[size]) {
      arrays[size] = Lazy.range(size).toArray();
    }

    return arrays[size];
  }

  function createBenchmarkSuite() {
    var suite = new Benchmark.Suite();

    $(".benchmark-result.selected").each(function() {
      var benchmarkId = $(this).attr("data-benchmark-id");
      var benchmarksToRun = $("#test-to-array").is(":checked") ?
        benchmarksForToArray[benchmarkId] :
        benchmarksForEach[benchmarkId];

      Lazy(benchmarksToRun).each(function(benchmark) {
        suite.add(benchmark);
      });
    });

    return suite;
  }

  function finishedLoading() {
    $(".benchmark-results-section").removeClass("loading");
    $(".start-benchmarking").prop("disabled", false);
    $(".benchmark-result").removeClass("running");
  }

  function getReferenceResultKey() {
    // Maybe later I'll make it so you can pick one.
    return "lodash";
  }

  function createBenchmarks(description, input, options) {
    var toArrayBenchmarks = [
      // Lazy.js
      options.valueOnly ?
        new Benchmark(description, function() { options.lazy.apply(this, input); }) :
        new Benchmark(description, function() { options.lazy.apply(this, input).toArray(); }),

      // Underscore
      new Benchmark(description, function() { options.underscore.apply(this, input); }),

      // Lo-Dash
      new Benchmark(description, function() { options.lodash.apply(this, input); })
    ];

    if (window.COMPARE_ALL_LIBS) {
      toArrayBenchmarks = toArrayBenchmarks.concat([
        // Wu.js
        options.valueOnly ?
          new Benchmark(description, function() { options.wu.apply(this, input); }) :
          new Benchmark(description, function() { options.wu.apply(this, input).toArray(); }),

        // Sugar
        new Benchmark(description, function() { options.sugar.apply(this, input); }),

        // Linq.js
        options.valueOnly ?
          new Benchmark(description, function() { options.linq.apply(this, input); }) :
          new Benchmark(description, function() { options.linq.apply(this, input).ToArray(); }),

        // JSLINQ
        new Benchmark(description, function() { options.jslinq.apply(this, input).ToArray(); }),

        // From.js
        options.valueOnly ?
          new Benchmark(description, function() { options.from.apply(this, input); }) :
          new Benchmark(description, function() { options.from.apply(this, input).toArray(); }),

        // IxJS
        options.valueOnly ?
          new Benchmark(description, function() { options.ix.apply(this, input); }) :
          new Benchmark(description, function() { options.ix.apply(this, input).toArray(); }),

        // Boiler.js
        new Benchmark(description, function() { options.boiler.apply(this, input); }),

        // Sloth.js
        options.valueOnly ?
          new Benchmark(description, function() { options.sloth.apply(this, input); }) :
          new Benchmark(description, function() { options.sloth.apply(this, input).force(); })
      ]);
    }

    var eachBenchmarks = [
      // Lazy.js
      options.valueOnly ?
        new Benchmark(description, function() { options.lazy.apply(this, input); }) :
        new Benchmark(description, function() {
          options.lazy.apply(this, input).each(function(e) {});
        }),

      // Underscore
      options.valueOnly ?
        new Benchmark(description, function() { options.underscore.apply(this, input); }) :
        new Benchmark(description, function() {
          _.each(options.underscore.apply(this, input), function(e) {});
        }),

      // Lo-Dash
      options.valueOnly ?
        new Benchmark(description, function() { options.lodash.apply(this, input); }) :
        new Benchmark(description, function() {
          lodash.each(options.lodash.apply(this, input), function(e) {});
        })
    ];

    if (window.COMPARE_ALL_LIBS) {
      eachBenchmarks = eachBenchmarks.concat([
        // Wu.js
        options.valueOnly ?
          new Benchmark(description, function() { options.wu.apply(this, input); }) :
          new Benchmark(description, function() {
            options.wu.apply(this, input).each(function(e) {});
          }),

        // Sugar
        options.valueOnly ?
          new Benchmark(description, function() { options.sugar.apply(this, input); }) :
          new Benchmark(description, function() {
            options.sugar.apply(this, input).forEach(function(e) {});
          }),

        // Linq.js
        options.valueOnly ?
          new Benchmark(description, function() { options.linq.apply(this, input); }) :
          new Benchmark(description, function() {
            options.linq.apply(this, input).ForEach(function(e) {});
          }),

        // JSLINQ
        options.valueOnly ?
          new Benchmark(description, function() { options.jslinq.apply(this, input); }) :
          new Benchmark(description, function() {
            // JSLINQ doesn't expose a ForEach method like Linq.js; so I'll just
            // iterate over the resulting array in the fastest way I can think of.
            var result = options.jslinq.apply(this, input).items,
                i = -1, e;

            // Need to actually access the result for a relatively apples-to-apples
            // comparison.
            while (++i < result.length) { e = result[i]; }
          }),

        // From.js
        options.valueOnly ?
          new Benchmark(description, function() { options.from.apply(this, input); }) :
          new Benchmark(description, function() {
            options.from.apply(this, input).each(function(e) {});
          }),

        // IxJS
        options.valueOnly ?
          new Benchmark(description, function() { options.ix.apply(this, input); }) :
          new Benchmark(description, function() {
            options.ix.apply(this, input).forEach(function(e) {});
          }),

        // Boiler.js
        options.valueOnly ?
          new Benchmark(description, function() { options.boiler.apply(this, input); }) :
          new Benchmark(description, function() {
            options.boiler.apply(this, input).each(function(e) {});
          }),

        // Sloth.js
        options.valueOnly ?
          new Benchmark(description, function() { options.sloth.apply(this, input); }) :
          new Benchmark(description, function() {
            options.sloth.apply(this, input).each(function(e) {});
          })
      ]);
    }

    // We'll use the same benchmark to ID all of these as that's how we
    // reference a set of benchmarks from the table.
    var benchmarkSetId = toArrayBenchmarks[0].id;
    benchmarksForToArray[benchmarkSetId] = toArrayBenchmarks;
    benchmarksForEach[benchmarkSetId] = eachBenchmarks;

    // Mark each benchmark with this ID.
    Lazy(toArrayBenchmarks).concat(eachBenchmarks).each(function(bm) {
      bm.benchmarkSetId = benchmarkSetId;
    });

    return benchmarkSetId;
  }

  function addBenchmarkToTable(description, benchmarkId, category) {
    var table = $("#benchmark-results-table-" + category);
    var row   = $("<tr>")
      .addClass("benchmark-result")
      .attr("id", "benchmark-result-" + benchmarkId)
      .attr("data-benchmark-id", benchmarkId)
      .appendTo(table);

    $("<td>").text(description).appendTo(row);
    $("<td>").addClass("underscore-result").appendTo(row);
    $("<td>").addClass("lodash-result").appendTo(row);

    if (window.COMPARE_ALL_LIBS) {
      $("<td>").addClass("wu-result").appendTo(row);
      $("<td>").addClass("sugar-result").appendTo(row);
      $("<td>").addClass("linqjs-result").appendTo(row);
      $("<td>").addClass("jslinq-result").appendTo(row);
      $("<td>").addClass("fromjs-result").appendTo(row);
      $("<td>").addClass("ixjs-result").appendTo(row);
      $("<td>").addClass("boiler-result").appendTo(row);
      $("<td>").addClass("sloth-result").appendTo(row);
    }

    $("<td>").addClass("lazy-result").appendTo(row);
  }

  function addResultToCell(result, cell, fastestResult, referenceResult) {
    if (result === 0.0) {
      cell.addClass("not-applicable");
      cell.text("N/A");
      return;
    }

    var resultToDisplay = result,
        suffix = "";

    // Optionally display result as percentage of fastest result.
    if ($("#test-proportional").is(":checked")) {
      resultToDisplay = (result / fastestResult) * 100.0;
      suffix = "%";
    } else if ($("#test-proportional-lodash").is(":checked")) {
      resultToDisplay = (result / referenceResult) * 100.0;
      suffix = "%";
    }

    // Add commas.
    var parts = resultToDisplay.toFixed(2).split(".");
    var pattern = /(\d+)(\d{3})/;
    while (pattern.test(parts[0])) {
        parts[0] = parts[0].replace(pattern, '$1,$2');
    }
    cell.text(parts.join(".") + suffix);

    // Highlight the fastest result for each benchmark.
    if (result === fastestResult) {
      cell.addClass("positive");
    }
  }

  function addBenchmarkResultToTable(result) {
    var row = $("#benchmark-result-" + result.benchmarkSetId);

    var fastestResult = Lazy(result)
      .filter(function(data, key) { return !!data.hz; })
      .map(function(data, key) { return data.hz; })
      .max();

    var referenceResult = Lazy(result)
      .find(function(data, key) { return key === getReferenceResultKey(); })
      .hz;

    addResultToCell(result.underscore.hz, $(".underscore-result", row), fastestResult, referenceResult);
    addResultToCell(result.lodash.hz, $(".lodash-result", row), fastestResult, referenceResult);
    if (window.COMPARE_ALL_LIBS) {
      addResultToCell(result.wu.hz, $(".wu-result", row), fastestResult, referenceResult);
      addResultToCell(result.sugar.hz, $(".sugar-result", row), fastestResult, referenceResult);
      addResultToCell(result.linq.hz, $(".linqjs-result", row), fastestResult, referenceResult);
      addResultToCell(result.jslinq.hz, $(".jslinq-result", row), fastestResult, referenceResult);
      addResultToCell(result.from.hz, $(".fromjs-result", row), fastestResult, referenceResult);
      addResultToCell(result.ix.hz, $(".ixjs-result", row), fastestResult, referenceResult);
      addResultToCell(result.boiler.hz, $(".boiler-result", row), fastestResult, referenceResult);
      addResultToCell(result.sloth.hz, $(".sloth-result", row), fastestResult, referenceResult);
    }
    addResultToCell(result.lazy.hz, $(".lazy-result", row), fastestResult, referenceResult);
  }

  function clearRow(row) {
    $("td:nth-child(n+2)", row).empty();
    $(".lazy-result", row).removeClass("positive").removeClass("negative");
  }

  function markBenchmarkRunning(benchmarkSetId) {
    var row = $("#benchmark-result-" + benchmarkSetId).addClass("running");
    clearRow(row);
  }

  function markBenchmarkCompleted(benchmarkSetId) {
    $("#benchmark-result-" + benchmarkSetId).removeClass("running");
  }

  function updateCharts() {
    $(".column-chart").each(function() {
      HighTables.renderChart(this);
    });
  }

  window.benchmarkChartOptions = function() {
    return {
      plotOptions: {
        series: { animation: false }
      },

      xAxis: {
        labels: {
          align: "right",
          rotation: -45
        }
      }
    };
  };

  window.benchmarkChartRowFilter = function(row) {
    return $(row).find("td.lazy-result").is(":not(:empty)");
  };

  window.compareAlternatives = function(description, options) {
    var inputs = options.inputs ?
      Lazy(options.inputs) :
      Lazy([10, 100]).map(function(size) { return [getOrCreateArray(size)] });

    var smallInput = inputs.first();
    var exceptions = Lazy(options.doesNotMatch || []);

    if (options.shouldMatch !== false) {
      it("returns the same result as underscore.js for '" + description + "'", function() {
        var lazyResult = options.lazy.apply(this, smallInput);
        var underscoreResult = options.underscore.apply(this, smallInput);
        if (typeof lazyResult.toArray === "function") {
          lazyResult = lazyResult.toArray();
        }
        if (typeof underscoreResult.value === "function") {
          underscoreResult = underscoreResult.value();
        }
        expect(lazyResult).toEqual(underscoreResult);
      });

      if (options.lodash && !exceptions.contains("lodash")) {
        it("returns the same result as Lo-Dash for '" + description + "'", function() {
          var lazyResult = options.lazy.apply(this, smallInput);
          var lodashResult = options.lodash.apply(this, smallInput);
          if (typeof lazyResult.toArray === "function") {
            lazyResult = lazyResult.toArray();
          }
          if (typeof lodashResult.value === "function") {
            lodashResult = lodashResult.value();
          }
          expect(lazyResult).toEqual(lodashResult);
        });
      }

      if (options.wu && !exceptions.contains("wu")) {
        it("returns the same result as wu.js for '" + description + "'", function() {
          var lazyResult = options.lazy.apply(this, smallInput);
          var wuResult = options.wu.apply(this, smallInput);
          if (typeof lazyResult.toArray === "function") {
            lazyResult = lazyResult.toArray();
          }
          if (typeof wuResult.toArray === "function") {
            wuResult = wuResult.toArray();
          }
          expect(lazyResult).toEqual(wuResult);
        });
      }

      if (options.sugar && !exceptions.contains("sugar")) {
        it("returns the same result as Sugar for '" + description + "'", function() {
          var lazyResult = options.lazy.apply(this, smallInput);
          var sugarResult = options.sugar.apply(this, smallInput);
          if (typeof lazyResult.toArray === "function") {
            lazyResult = lazyResult.toArray();
          }
          if (typeof sugarResult.toArray === "function") {
            sugarResult = sugarResult.toArray();
          }
          expect(lazyResult).toEqual(sugarResult);
        });
      }

      if (options.linq && !exceptions.contains("linq")) {
        it("returns the same result as linq.js for '" + description + "'", function() {
          var lazyResult = options.lazy.apply(this, smallInput);
          var linqResult = options.linq.apply(this, smallInput);
          if (typeof lazyResult.toArray === "function") {
            lazyResult = lazyResult.toArray();
          }
          if (typeof linqResult.ToArray === "function") {
            linqResult = linqResult.ToArray();
          }
          expect(lazyResult).toEqual(linqResult);
        });
      }

      if (options.jslinq && !exceptions.contains("jslinq")) {
        it("returns the same result as JSLINQ for '" + description + "'", function() {
          var lazyResult = options.lazy.apply(this, smallInput);
          var jslinqResult = options.jslinq.apply(this, smallInput);
          if (typeof lazyResult.toArray === "function") {
            lazyResult = lazyResult.toArray();
          }
          if (typeof jslinqResult.ToArray === "function") {
            jslinqResult = jslinqResult.ToArray();
          }
          expect(lazyResult).toEqual(jslinqResult);
        });
      }

      if (options.from && !exceptions.contains("from")) {
        it("returns the same result as from.js for '" + description + "'", function() {
          var lazyResult = options.lazy.apply(this, smallInput);
          var fromResult = options.from.apply(this, smallInput);
          if (typeof lazyResult.toArray === "function") {
            lazyResult = lazyResult.toArray();
          }
          if (typeof fromResult.toArray === "function") {
            fromResult = fromResult.toArray();
          }
          expect(lazyResult).toEqual(fromResult);
        });
      }

      if (options.ix && !exceptions.contains("ix")) {
        it("returns the same result as IxJS for '" + description + "'", function() {
          var lazyResult = options.lazy.apply(this, smallInput);
          var ixResult = options.ix.apply(this, smallInput);
          if (typeof lazyResult.toArray === "function") {
            lazyResult = lazyResult.toArray();
          }
          if (typeof ixResult.toArray === "function") {
            ixResult = ixResult.toArray();
          }
          expect(lazyResult).toEqual(ixResult);
        });
      }

      if (options.boiler && !exceptions.contains("boiler")) {
        it("returns the same result as Boiler.js for '" + description + "'", function() {
          var lazyResult = options.lazy.apply(this, smallInput);
          var boilerResult = options.boiler.apply(this, smallInput);
          if (typeof lazyResult.toArray === "function") {
            lazyResult = lazyResult.toArray();
          }
          if (typeof boilerResult.end === "function") {
            boilerResult = boilerResult.end();
          }
          expect(lazyResult).toEqual(boilerResult);
        });
      }

      if (options.sloth && !exceptions.contains("sloth")) {
        it("returns the same result as sloth.js for '" + description + "'", function() {
          var lazyResult = options.lazy.apply(this, smallInput);
          var slothResult = options.sloth.apply(this, smallInput);
          if (typeof lazyResult.toArray === "function") {
            lazyResult = lazyResult.toArray();
          }
          if (typeof slothResult.force === "function") {
            slothResult = slothResult.force();
          }
          expect(lazyResult).toEqual(slothResult);
        });
      }
    }

    inputs.each(function(input) {
      var benchmarkSetId = createBenchmarks(description, input, options);

      // Add a row to the appropriate table for this benchmark
      // once the document's loaded.
      $(document).ready(function() {
        var inputSize = input[0] instanceof Array ? input[0].length : "other";
        addBenchmarkToTable(description, benchmarkSetId, inputSize);
      });
    });
  };

  window.addEventListener("load", function() {
    $("#test-to-array").on("change", function() {
      $("#test-each").prop("checked", false);
    });

    $("#test-each").on("change", function() {
      $("#test-to-array").prop("checked", false);
    });

    $("#test-absolute").on("change", function() {
      $("#test-proportional").prop("checked", false);
      $("#test-proportional-lodash").prop("checked", false);
    });

    $("#test-proportional").on("change", function() {
      $("#test-absolute").prop("checked", false);
      $("#test-proportional-lodash").prop("checked", false);
    });

    $("#test-proportional-lodash").on("change", function() {
      $("#test-absolute").prop("checked", false);
      $("#test-proportional").prop("checked", false);
    });

    $("a.why-to-array-vs-each").on("click", function() {
      // Show the info panel.
      $("#why-to-array-vs-each").addClass("showing");

      // Hide the info panel once the user clicks anywhere else.
      $(document).one("click", function() {
        $("#why-to-array-vs-each").removeClass("showing");
      });

      // Prevent this click from propagating to the document node, which would
      // immediately dismiss the panel via the handler above.
      return false;
    });

    $("#why-to-array-vs-each").on("click", function() {
      // Clicking on the panel itself shouldn't dismiss it.
      return false;
    });

    $(".select-all").on("click", function() {
      $(this).closest("section").find(".benchmark-result").addClass("selected");
    });

    $(".select-none").on("click", function() {
      $(this).closest("section").find(".benchmark-result").removeClass("selected");
    });

    $(".clear-selected").on("click", function() {
      $(this).closest("section").find(".benchmark-result").each(function() {
        clearRow($(this));
      });
    });

    $(".benchmark-result").on("click", function() {
      $(this).toggleClass("selected");
    });

    $(".start-benchmarking").on("click", function() {
      $(".start-benchmarking").prop("disabled", true);
      $(".benchmark-results-section").addClass("loading");

      var benchmarkSuite = createBenchmarkSuite();

      // No benchmarks selected
      if (benchmarkSuite.length === 0) {
        finishedLoading();
        return false;
      }

      var resultsPerBenchmark = window.COMPARE_ALL_LIBS ? 11 : 3;

      var currentResultSet = [];
      benchmarkSuite.on("cycle", function(e) {
        var benchmarkSetId = e.target.benchmarkSetId;
        var benchmarkResults;

        currentResultSet.push(e.target);
        if (currentResultSet.length === resultsPerBenchmark) {
          benchmarkResults = {
            benchmarkSetId: benchmarkSetId,
            lazy: currentResultSet[0],
            underscore: currentResultSet[1],
            lodash: currentResultSet[2]
          };

          if (window.COMPARE_ALL_LIBS) {
            benchmarkResults.wu = currentResultSet[3];
            benchmarkResults.sugar = currentResultSet[4];
            benchmarkResults.linq = currentResultSet[5];
            benchmarkResults.jslinq = currentResultSet[6];
            benchmarkResults.from = currentResultSet[7];
            benchmarkResults.ix = currentResultSet[8];
            benchmarkResults.boiler = currentResultSet[9];
            benchmarkResults.sloth = currentResultSet[10];
          }

          addBenchmarkResultToTable(benchmarkResults);
          markBenchmarkCompleted(benchmarkSetId);
          updateCharts();
          currentResultSet = [];

        } else {
          markBenchmarkRunning(benchmarkSetId);
        }
      });

      benchmarkSuite.on("complete", function() {
        finishedLoading();
      });

      benchmarkSuite.run({ async: true });

      // Need to return false to prevent the enclosing form from being submitted
      // on Firefox.
      return false;
    });

    $(".show-all-specs").on("click", function() {
      $("#test-results-table tr").show();
    });

    $(".show-failing-specs").on("click", function() {
      $("#test-results-table tr.success").hide();
    });

    updateCharts();
  });
})();
describe("compared to Underscore, Lo-Dash, etc.", function() {
  function inc(x) { return x + 1; }
  function dec(x) { return x - 1; }
  function square(x) { return x * x; }
  function isEven(x) { return x % 2 === 0; }
  function identity(x) { return x; }

  function arr(from, to) {
    return Lazy.range(from, to).toArray();
  }

  function dupes(min, max, count) {
    var numbers = Lazy.generate(function() {
      return Math.floor((Math.random() * (max - min)) + min);
    });
    return numbers.take(count).toArray();
  }

  function wuTake(arr, count) {
    var i = -1;
    if (arr instanceof Array) {
      arr = wu(arr);
    }
    return arr.takeWhile(function() { return ++i < count; });
  }

  function wuDrop(arr, count) {
    var i = -1;
    if (arr instanceof Array) {
      arr = wu(arr);
    }
    return arr.dropWhile(function() { return ++i < count; });
  }

  var jaggedArray = [
    [1, 2, 3],
    [
      [4, 5, 6],
      [7, 8, 9],
      [
        [10, 11],
        12
      ],
      13,
      14,
      [15, 16],
      17
    ],
    [
      18,
      19,
      20,
      [21, 22]
    ],
    [23, 24, 25],
    26,
    27,
    28,
    [29, 30],
    [
      [31, 32, 33],
      [34, 35]
    ],
    36
  ];

  // ---------- Common operations ---------- //

  compareAlternatives("map", {
    lazy: function(arr) { return Lazy(arr).map(square); },
    underscore: function(arr) { return _(arr).map(square); },
    lodash: function(arr) { return lodash.map(arr, square); },
    wu: function(arr) { return wu(arr).map(square); },
    sugar: function(arr) { return arr.map(square); },
    from: function(arr) { return from(arr).select(square); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).select(square); },
    boiler: function(arr) { return boiler.map(arr, square); },
    sloth: function(arr) { return sloth.ify(arr).map(square); }
  });

  compareAlternatives("filter", {
    lazy: function(arr) { return Lazy(arr).filter(isEven); },
    underscore: function(arr) { return _(arr).filter(isEven); },
    lodash: function(arr) { return lodash.filter(arr, isEven); },
    wu: function(arr) { return wu(arr).filter(isEven); },
    sugar: function(arr) { return arr.filter(isEven); },
    from: function(arr) { return from(arr).where(isEven); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).where(isEven); },
    boiler: function(arr) { return boiler.filter(arr, isEven); },
    sloth: function(arr) { return sloth.ify(arr).filter(isEven); }
  });

  compareAlternatives("flatten", {
    lazy: function(arr) { return Lazy(arr).flatten(); },
    underscore: function(arr) { return _(arr).flatten(); },
    lodash: function(arr) { return lodash.flattenDeep(arr); },
    sugar: function(arr) { return arr.flatten(); },
    boiler: function(arr) { return boiler.flatten(arr); },
    inputs: [[jaggedArray]]
  });

  compareAlternatives("uniq (mostly duplicates)", {
    lazy: function(arr) { return Lazy(arr).uniq(); },
    underscore: function(arr) { return _(arr).uniq(); },
    lodash: function(arr) { return lodash.uniq(arr); },
    sugar: function(arr) { return arr.unique(); },
    from: function(arr) { return from(arr).distinct(); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).distinct(); },
    boiler: function(arr) { return boiler.uniq(arr); },
    inputs: [[dupes(0, 2, 10)], [dupes(0, 10, 100)]]
  });

  compareAlternatives("uniq (about half dupes)", {
    lazy: function(arr) { return Lazy(arr).uniq(); },
    underscore: function(arr) { return _(arr).uniq(); },
    lodash: function(arr) { return lodash.uniq(arr); },
    sugar: function(arr) { return arr.unique(); },
    from: function(arr) { return from(arr).distinct(); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).distinct(); },
    boiler: function(arr) { return boiler.uniq(arr); },
    inputs: [[dupes(0, 5, 10)], [dupes(0, 50, 100)]]
  });

  compareAlternatives("uniq (mostly uniques)", {
    lazy: function(arr) { return Lazy(arr).uniq(); },
    underscore: function(arr) { return _(arr).uniq(); },
    lodash: function(arr) { return lodash.uniq(arr); },
    sugar: function(arr) { return arr.unique(); },
    from: function(arr) { return from(arr).distinct(); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).distinct(); },
    boiler: function(arr) { return boiler.uniq(arr); },
    inputs: [[dupes(0, 10, 10)], [dupes(0, 100, 100)]]
  });

  compareAlternatives("union", {
    lazy: function(arr, other) { return Lazy(arr).union(other); },
    underscore: function(arr, other) { return _.union(arr, other); },
    lodash: function(arr, other) { return lodash.union(arr, other); },
    sugar: function(arr, other) { return arr.union(other); },
    from: function(arr, other) { return from(arr).union(other); },
    ix: function(arr, other) { return Ix.Enumerable.fromArray(arr).union(Ix.Enumerable.fromArray(other)); },
    boiler: function(arr, other) { return boiler.union(arr, other); },
    sloth: function(arr, other) { return sloth.ify(arr).union(other); },
    inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
  });

  compareAlternatives("intersection", {
    lazy: function(arr, other) { return Lazy(arr).intersection(other); },
    underscore: function(arr, other) { return _.intersection(arr, other); },
    lodash: function(arr, other) { return lodash.intersection(arr, other); },
    sugar: function(arr, other) { return arr.intersect(other); },
    from: function(arr, other) { return from(arr).intersect(other); },
    ix: function(arr, other) { return Ix.Enumerable.fromArray(arr).intersect(Ix.Enumerable.fromArray(other)); },
    boiler: function(arr, other) { return boiler.intersection(arr, other); },
    sloth: function(arr, other) { return sloth.ify(arr).intersect(other); },
    inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
  });

  compareAlternatives("shuffle", {
    lazy: function(arr) { return Lazy(arr).shuffle(); },
    underscore: function(arr) { return _(arr).shuffle(); },
    lodash: function(arr) { return lodash.shuffle(arr); },
    sugar: function(arr) { return arr.randomize(); },
    boiler: function(arr) { return boiler.shuffle(arr); },
    shouldMatch: false
  });

  compareAlternatives("zip", {
    lazy: function(arr, other) { return Lazy(arr).zip(other); },
    underscore: function(arr, other) { return _(arr).zip(other); },
    lodash: function(arr, other) { return lodash.zip(arr, other); },
    sugar: function(arr, other) { return arr.zip(other); },
    boiler: function(arr, other) { return boiler.zip(arr, other); },
    inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
  });

  // ---------- Chained operations ----------//

  compareAlternatives("map -> filter", {
    lazy: function(arr) { return Lazy(arr).map(inc).filter(isEven); },
    underscore: function(arr) { return _.chain(arr).map(inc).filter(isEven); },
    lodash: function(arr) { return lodash(arr).map(inc).filter(isEven); },
    wu: function(arr) { return wu(arr).map(inc).filter(isEven); },
    sugar: function(arr) { return arr.map(inc).filter(isEven); },
    from: function(arr) { return from(arr).select(inc).where(isEven); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).select(inc).where(isEven); },
    boiler: function(arr) { return boiler.chain(arr).map(inc).filter(isEven).end(); },
    sloth: function(arr) { return sloth.ify(arr).map(inc).filter(isEven); },
    category: "chained",
  });

  compareAlternatives("flatten -> map", {
    lazy: function(arr) { return Lazy(arr).flatten().map(inc); },
    underscore: function(arr) { return _.chain(arr).flatten().map(inc); },
    lodash: function(arr) { return lodash(arr).flattenDeep().map(inc); },
    sugar: function(arr) { return arr.flatten().map(inc); },
    boiler: function(arr) { return boiler.chain(arr).flatten().map(inc).end(); },
    category: "chained",
    inputs: [[jaggedArray]]
  });

  compareAlternatives("map -> uniq", {
    lazy: function(arr) { return Lazy(arr).map(inc).uniq(); },
    underscore: function(arr) { return _.chain(arr).map(inc).uniq(); },
    lodash: function(arr) { return lodash(arr).map(inc).uniq(); },
    sugar: function(arr) { return arr.map(inc).unique(); },
    from: function(arr) { return from(arr).select(inc).distinct(); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).select(inc).distinct(); },
    boiler: function(arr) { return boiler.chain(arr).map(inc).uniq().end(); },
    category: "chained",
    inputs: [[dupes(0, 5, 10)], [dupes(0, 50, 100)]]
  });

  compareAlternatives("map -> union", {
    lazy: function(arr, other) { return Lazy(arr).map(inc).union(other); },
    underscore: function(arr, other) { return _.chain(arr).map(inc).union(other); },
    lodash: function(arr, other) { return lodash(arr).map(inc).union(other); },
    sugar: function(arr, other) { return arr.map(inc).union(other); },
    from: function(arr, other) { return from(arr).select(inc).union(other); },
    ix: function(arr, other) { return Ix.Enumerable.fromArray(arr).select(inc).union(Ix.Enumerable.fromArray(other)); },
    boiler: function(arr, other) { return boiler.chain(arr).map(inc).union(other).end(); },
    sloth: function(arr, other) { return sloth.ify(arr).map(inc).union(other); },
    category: "chained",
    inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
  });

  compareAlternatives("map -> intersection", {
    lazy: function(arr, other) { return Lazy(arr).map(inc).intersection(other); },
    underscore: function(arr, other) { return _.chain(arr).map(inc).intersection(other); },
    lodash: function(arr, other) { return lodash(arr).map(inc).intersection(other); },
    sugar: function(arr, other) { return arr.map(inc).intersect(other); },
    from: function(arr, other) { return from(arr).select(inc).intersect(other); },
    ix: function(arr, other) { return Ix.Enumerable.fromArray(arr).select(inc).intersect(Ix.Enumerable.fromArray(other)); },
    boiler: function(arr, other) { return boiler.chain(arr).map(inc).intersection(other); },
    sloth: function(arr, other) { return sloth.ify(arr).map(inc).intersect(other); },
    category: "chained",
    inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
  });

  compareAlternatives("map -> shuffle", {
    lazy: function(arr) { return Lazy(arr).map(inc).shuffle(); },
    underscore: function(arr) { return _.chain(arr).map(inc).shuffle(); },
    lodash: function(arr) { return lodash(arr).map(inc).shuffle(); },
    sugar: function(arr) { return arr.map(inc).randomize(); },
    boiler: function(arr) { return boiler.chain(arr).map(inc).shuffle(); },
    category: "chained",
    shouldMatch: false
  });

  compareAlternatives("map -> zip", {
    lazy: function(arr, other) { return Lazy(arr).map(inc).zip(other); },
    underscore: function(arr, other) { return _.chain(arr).map(inc).zip(other); },
    lodash: function(arr, other) { return lodash(arr).map(inc).zip(other); },
    sugar: function(arr, other) { return arr.map(inc).zip(other); },
    boiler: function(arr, other) { return boiler.chain(arr).map(inc).zip(other); },
    category: "chained",
    inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
  });

  // ---------- Short-circuited operations ---------- //

  compareAlternatives("map -> indexOf", {
    lazy: function(arr, value) { return Lazy(arr).map(inc).indexOf(value); },
    underscore: function(arr, value) { return _.chain(arr).map(inc).indexOf(value); },
    lodash: function(arr, value) { return lodash(arr).map(inc).indexOf(value); },
    sugar: function(arr, value) { return arr.map(inc).indexOf(value); },
    boiler: function(arr, value) { return boiler.chain(arr).map(inc).indexOf(value); },
    category: "shorted",
    inputs: [[arr(0, 10), 4], [arr(0, 100), 35]],
    valueOnly: true
  });

  compareAlternatives("map -> sortedIndex", {
    lazy: function(arr) { return Lazy(arr).map(inc).sortedIndex(arr[arr.length / 2]); },
    underscore: function(arr) { return _.chain(arr).map(inc).sortedIndex(arr[arr.length / 2]); },
    lodash: function(arr) { return lodash(arr).map(inc).sortedIndex(arr[arr.length / 2]); },
    category: "shorted",
    inputs: [[arr(0, 10), 4], [arr(0, 100), 35]],
    valueOnly: true
  });

  compareAlternatives("map -> take", {
    lazy: function(arr) { return Lazy(arr).map(inc).take(5); },
    underscore: function(arr) { return _.chain(arr).map(inc).take(5); },
    lodash: function(arr) { return lodash(arr).map(inc).take(5); },
    sugar: function(arr) { return arr.map(inc).first(5); },
    from: function(arr) { return from(arr).select(inc).take(5); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).select(inc).take(5); },
    boiler: function(arr) { return boiler.chain(arr).map(inc).first(5).end(); },
    sloth: function(arr) { return sloth.ify(arr).map(inc).take(5); },
    category: "shorted"
  });

  compareAlternatives("filter -> take", {
    lazy: function(arr) { return Lazy(arr).filter(isEven).take(5); },
    underscore: function(arr) { return _.chain(arr).filter(isEven).first(5); },
    lodash: function(arr) { return lodash(arr).filter(isEven).take(5); },
    sugar: function(arr) { return arr.filter(isEven).first(5); },
    from: function(arr) { return from(arr).where(isEven).take(5); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).where(isEven).take(5); },
    boiler: function(arr) { return boiler.chain(arr).filter(isEven).first(5).end(); },
    sloth: function(arr) { return sloth.ify(arr).filter(isEven).take(5); },
    category: "shorted",
  });

  compareAlternatives("map -> filter -> take", {
    lazy: function(arr) { return Lazy(arr).map(inc).filter(isEven).take(5); },
    underscore: function(arr) { return _.chain(arr).map(inc).filter(isEven).take(5); },
    lodash: function(arr) { return lodash(arr).map(inc).filter(isEven).take(5); },
    wu: function(arr) { return wuTake(wu(arr).map(inc).filter(isEven), 5); },
    sugar: function(arr) { return arr.map(inc).filter(isEven).first(5); },
    from: function(arr) { return from(arr).select(inc).where(isEven).take(5); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).select(inc).where(isEven).take(5); },
    boiler: function(arr) { return boiler.chain(arr).map(inc).filter(isEven).first(5).end(); },
    sloth: function(arr) { return sloth.ify(arr).map(inc).filter(isEven).take(5); },
    category: "shorted",
  });

  compareAlternatives("map -> drop -> take", {
    lazy: function(arr) { return Lazy(arr).map(inc).drop(5).take(5); },
    underscore: function(arr) { return _.chain(arr).map(inc).rest(5).take(5); },
    lodash: function(arr) { return lodash(arr).map(inc).drop(5).take(5); },
    wu: function(arr) { return wuTake(wuDrop(wu(arr).map(inc), 5), 5); },
    sugar: function(arr) { return arr.map(inc).last(arr.length - 5).first(5); },
    from: function(arr) { return from(arr).select(inc).skip(5).take(5); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).select(inc).skip(5).take(5); },
    boiler: function(arr) { return boiler.chain(arr).map(inc).rest(5).first(5).end(); },
    sloth: function(arr) { return sloth.ify(arr).map(inc).drop(5).take(5); },
    category: "shorted",
  });

  compareAlternatives("filter -> drop -> take", {
    lazy: function(arr) { return Lazy(arr).filter(isEven).drop(5).take(5); },
    underscore: function(arr) { return _.chain(arr).filter(isEven).rest(5).first(5); },
    lodash: function(arr) { return lodash(arr).filter(isEven).drop(5).take(5); },
    from: function(arr) { return from(arr).where(isEven).skip(5).take(5); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).where(isEven).skip(5).take(5); },
    boiler: function(arr) { return boiler.chain(arr).filter(isEven).rest(5).first(5).end(); },
    sloth: function(arr) { return sloth.ify(arr).filter(isEven).drop(5).take(5); },
    category: "shorted",
  });

  compareAlternatives("flatten -> take", {
    lazy: function(arr) { return Lazy(arr).flatten().take(5); },
    underscore: function(arr) { return _.chain(arr).flatten().first(5); },
    lodash: function(arr) { return lodash(arr).flattenDeep().take(5); },
    sugar: function(arr) { return arr.flatten().first(5); },
    boiler: function(arr) { return boiler.chain(arr).flatten().first(5).end(); },
    category: "shorted",
    inputs: [[jaggedArray]]
  });

  compareAlternatives("uniq -> take", {
    lazy: function(arr) { return Lazy(arr).uniq().take(5); },
    underscore: function(arr) { return _.chain(arr).uniq().first(5); },
    lodash: function(arr) { return lodash(arr).uniq().take(5); },
    sugar: function(arr) { return arr.unique().first(5); },
    from: function(arr) { return from(arr).distinct().take(5); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).distinct().take(5); },
    boiler: function(arr) { return boiler.chain(arr).uniq().first(5).end(); },
    category: "shorted",
    inputs: [[dupes(0, 5, 10)], [dupes(0, 10, 100)]]
  });

  compareAlternatives("union -> take", {
    lazy: function(arr, other) { return Lazy(arr).union(other).take(5); },
    underscore: function(arr, other) { return _.chain(arr).union(other).first(5); },
    lodash: function(arr, other) { return lodash(arr).union(other).take(5); },
    sugar: function(arr, other) { return arr.union(other).first(5); },
    from: function(arr, other) { return from(arr).union(other).take(5); },
    ix: function(arr, other) { return Ix.Enumerable.fromArray(arr).union(other).take(5); },
    boiler: function(arr, other) { return boiler.chain(arr).union(other).first(5).end(); },
    sloth: function(arr, other) { return sloth.ify(arr).union(other).take(5); },
    category: "shorted",
    inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
  });

  compareAlternatives("intersection -> take", {
    lazy: function(arr, other) { return Lazy(arr).intersection(other).take(5); },
    underscore: function(arr, other) { return _.chain(arr).intersection(other).first(5); },
    lodash: function(arr, other) { return lodash(arr).intersection(other).take(5); },
    sugar: function(arr, other) { return arr.intersect(other).first(5); },
    from: function(arr, other) { return from(arr).intersect(other).take(5); },
    ix: function(arr, other) { return Ix.Enumerable.fromArray(arr).intersect(Ix.Enumerable.fromArray(other)).take(5); },
    boiler: function(arr, other) { return boiler.chain(arr).intersection(other).first(5).end(); },
    sloth: function(arr, other) { return sloth.ify(arr).intersect(other).take(5); },
    category: "shorted",
    inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
  });

  compareAlternatives("without -> take", {
    lazy: function(arr, other) { return Lazy(arr).without(other).take(5); },
    underscore: function(arr, other) { return _.chain(arr).difference(other).first(5); },
    lodash: function(arr, other) { return lodash(arr).difference(other).take(5); },
    sugar: function(arr, other) { return arr.subtract(other).first(5); },
    category: "shorted",
    inputs: [[arr(0, 10), arr(3, 7)], [arr(0, 100), arr(25, 75)]]
  });

  compareAlternatives("shuffle -> take", {
    lazy: function(arr) { return Lazy(arr).shuffle().take(5); },
    underscore: function(arr) { return _.chain(arr).shuffle().first(5); },
    lodash: function(arr) { return lodash(arr).shuffle().take(5); },
    sugar: function(arr) { return arr.randomize().first(5); },
    boiler: function(arr) { return boiler.chain(arr).shuffle().first(5).end(); },
    category: "shorted",
    shouldMatch: false
  });

  compareAlternatives("zip -> take", {
    lazy: function(arr, other) { return Lazy(arr).zip(other).take(5); },
    underscore: function(arr, other) { return _.chain(arr).zip(other).first(5); },
    lodash: function(arr, other) { return lodash(arr).zip(other).take(5); },
    sugar: function(arr, other) { return arr.zip(other).first(5); },
    boiler: function(arr, other) { return boiler.chain(arr).zip(other).first(5).end(); },
    category: "shorted",
    inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
  });

  compareAlternatives("map -> any", {
    lazy: function(arr) { return Lazy(arr).map(inc).any(isEven); },
    underscore: function(arr) { return _.chain(arr).map(inc).any(isEven); },
    lodash: function(arr) { return lodash(arr).map(inc).some(isEven); },
    sugar: function(arr) { return arr.map(inc).any(isEven); },
    from: function(arr) { return from(arr).select(inc).any(isEven); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).select(inc).any(isEven); },
    boiler: function(arr) { return boiler.chain(arr).map(inc).any(isEven); },
    sloth: function(arr, other) { return sloth.ify(arr).map(inc).any(isEven); },
    category: "shorted",
    valueOnly: true
  });

  compareAlternatives("map -> all", {
    lazy: function(arr) { return Lazy(arr).map(inc).all(isEven); },
    underscore: function(arr) { return _.chain(arr).map(inc).every(isEven); },
    lodash: function(arr) { return lodash(arr).map(inc).every(isEven); },
    sugar: function(arr) { return arr.map(inc).all(isEven); },
    from: function(arr) { return from(arr).select(inc).all(isEven); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).select(inc).all(isEven); },
    boiler: function(arr) { return boiler.chain(arr).map(inc).all(isEven); },
    sloth: function(arr, other) { return sloth.ify(arr).map(inc).all(isEven); },
    category: "shorted",
    valueOnly: true
  });

  // These aren't really comparisons to Underscore or Lo-Dash; rather, they're
  // comparisons to the native Array.join, String.split, and String.match
  // methods. But designating them as such at the UI level will require some
  // refactoring. For now, I think it's fine to put them here.

  compareAlternatives("map -> join", {
    lazy: function(arr) { return Lazy(arr).map(inc).join(", "); },
    underscore: function(arr) { return _(arr).map(inc).join(", "); },
    category: "other",
    valueOnly: true
  });

  compareAlternatives("split(string) -> take", {
    lazy: function(str, delimiter) { return Lazy(str).split(delimiter).take(5); },
    underscore: function(str, delimiter) { return _(str.split(delimiter)).take(5); },
    category: "other",
    inputs: [[Lazy.range(100).join(", "), ", "]]
  });

  compareAlternatives("split(regex) -> take", {
    lazy: function(str, delimiter) { return Lazy(str).split(delimiter).take(5); },
    underscore: function(str, delimiter) { return _(str.split(delimiter)).take(5); },
    category: "other",
    inputs: [[Lazy.range(100).join(", "), /,\s*/]]
  });

  compareAlternatives("match(regex) -> take", {
    lazy: function(str, pattern) { return Lazy(str).match(pattern).take(5); },
    underscore: function(str, pattern) { return _(str.match(pattern)).take(5); },
    category: "other",
    inputs: [[Lazy.range(100).join(" "), /\d+/g]]
  });
});



