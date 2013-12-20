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
