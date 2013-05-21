(function() {
  Benchmark.options.maxTime = 1;

  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.updateInterval = 1000;

  var specReporter = new SpecReporter();
  jasmineEnv.addReporter(specReporter);

  var arrays = {};
  var benchmarksForToArray = {};
  var benchmarksForEach = {};
  var benchmarkResults = {};

  window.lodash = _.noConflict();

  function displayCoordinates(element, pos) {
    element.textContent = "(" + pos.join(", ") + ")";
  }

  function initializeDomExample() {
    var sourceElement = document.getElementById("dom-event-source");
    var leftElement   = document.querySelector("#dom-event-output .left p");
    var rightElement  = document.querySelector("#dom-event-output .right p");

    var mouseEvents = Lazy.events(sourceElement, "mousemove");

    var coordinates = mouseEvents.map(function(e) {
      var elementRect = sourceElement.getBoundingClientRect();
      return [
        Math.floor(e.clientX - elementRect.left),
        Math.floor(e.clientY - elementRect.top)
      ];
    });

    coordinates
      .filter(function(pos) { return pos[0] < sourceElement.clientWidth / 2; })
      .each(function(pos) { displayCoordinates(leftElement, pos); });

    coordinates
      .filter(function(pos) { return pos[0] > sourceElement.clientWidth / 2; })
      .each(function(pos) { displayCoordinates(rightElement, pos); });
  }

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

  function createBenchmarks(description, input, options) {
    var toArrayBenchmarks = [
      // Lazy.js
      options.valueOnly ?
        new Benchmark(description, function() { options.lazy.apply(this, input); }) :
        new Benchmark(description, function() { options.lazy.apply(this, input).toArray(); }),

      // Underscore
      new Benchmark(description, function() { options.underscore.apply(this, input); }),

      // Lo-Dash
      new Benchmark(description, function() { options.lodash.apply(this, input); }),

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
        new Benchmark(description, function() { options.from.apply(this, input).toArray(); })
    ];

    var eachBenchmarks = options.valueOnly ? toArrayBenchmarks : [
      // Lazy.js
      new Benchmark(description, function() {
        options.lazy.apply(this, input).each(function(e) {});
      }),

      // Underscore
      new Benchmark(description, function() {
        _.each(options.underscore.apply(this, input), function(e) {});
      }),

      // Lo-Dash
      new Benchmark(description, function() {
        lodash.each(options.lodash.apply(this, input), function(e) {});
      }),

      // Wu.js
      new Benchmark(description, function() {
        options.wu.apply(this, input).each(function(e) {});
      }),

      // Sugar
      new Benchmark(description, function() {
        options.sugar.apply(this, input).forEach(function(e) {});
      }),

      // Linq.js
      new Benchmark(description, function() {
        options.linq.apply(this, input).ForEach(function(e) {});
      }),

      // JSLINQ
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
      new Benchmark(description, function() {
        options.from.apply(this, input).each(function(e) {});
      })
    ];

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
    $("<td>").addClass("wu-result").appendTo(row);
    $("<td>").addClass("sugar-result").appendTo(row);
    $("<td>").addClass("linqjs-result").appendTo(row);
    $("<td>").addClass("jslinq-result").appendTo(row);
    $("<td>").addClass("fromjs-result").appendTo(row);
    $("<td>").addClass("lazy-result").appendTo(row);
  }

  function addResultToCell(result, cell, additionalStyles) {
    if (result === 0.0) {
      cell.addClass("not-applicable");
      cell.text("N/A");
      return;
    }

    var parts = result.toFixed(2).split(".");
    var pattern = /(\d+)(\d{3})/;
    while (pattern.test(parts[0])) {
        parts[0] = parts[0].replace(pattern, '$1,$2');
    }
    cell.text(parts.join("."));

    if (additionalStyles) {
      cell.addClass(additionalStyles);
    }
  }

  function addBenchmarkResultToTable(result) {
    var row   = $("#benchmark-result-" + result.benchmarkSetId);
    var style = result.lazy.hz > result.underscore.hz &&
                result.lazy.hz > result.lodash.hz &&
                result.lazy.hz > result.wu.hz &&
                result.lazy.hz > result.linq.hz &&
                result.lazy.hz > result.jslinq.hz &&
                result.lazy.hz > result.from.hz ? "positive" : "negative";

    addResultToCell(result.underscore.hz, $(".underscore-result", row));
    addResultToCell(result.lodash.hz, $(".lodash-result", row));
    addResultToCell(result.wu.hz, $(".wu-result", row));
    addResultToCell(result.sugar.hz, $(".sugar-result", row));
    addResultToCell(result.linq.hz, $(".linqjs-result", row));
    addResultToCell(result.jslinq.hz, $(".jslinq-result", row));
    addResultToCell(result.from.hz, $(".fromjs-result", row));
    addResultToCell(result.lazy.hz, $(".lazy-result", row), style);
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
    }

    inputs.each(function(input) {
      var benchmarkSetId = createBenchmarks(description, input, options);

      // Add a row to the appropriate table for this benchmark
      // once the document's loaded.
      $(document).ready(function() {
        var category = input[0] instanceof Array ? input[0].length : "other";
        addBenchmarkToTable(description, benchmarkSetId, category);
      });
    });
  };

  window.onload = function() {
    jasmineEnv.execute();

    $("nav ul li a").on("click", function() {
      var link     = $(this);
      var nav      = link.closest("nav");
      var target   = link.attr("href");
      var sections = nav.attr("data-sections");

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

    $("#test-to-array").on("change", function() {
      $("#test-each").prop("checked", false);
    });

    $("#test-each").on("change", function() {
      $("#test-to-array").prop("checked", false);
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
      }

      var currentResultSet = [];
      benchmarkSuite.on("cycle", function(e) {
        var benchmarkSetId = e.target.benchmarkSetId;

        currentResultSet.push(e.target);
        if (currentResultSet.length === 8) {
          addBenchmarkResultToTable({
            benchmarkSetId: benchmarkSetId,
            lazy: currentResultSet[0],
            underscore: currentResultSet[1],
            lodash: currentResultSet[2],
            wu: currentResultSet[3],
            sugar: currentResultSet[4],
            linq: currentResultSet[5],
            jslinq: currentResultSet[6],
            from: currentResultSet[7]
          });
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

    initializeDomExample();
    updateCharts();
  };
})();
