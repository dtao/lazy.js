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

  function addCommas(number) {
    var parts = number.toString().split(".");
    var pattern = /(\d+)(\d{3})/;
    while (pattern.test(parts[0])) {
        parts[0] = parts[0].replace(pattern, '$1,$2');
    }
    return parts.join(".");
  }

  function finishedLoading() {
    $(".benchmark-results-section").removeClass("loading");
    $(".start-benchmarking").prop("disabled", false);
    $(".benchmark-result").removeClass("running");
  }

  function createBenchmarks(description, input, options) {
    var toArrayBenchmarks = [
      options.valueOnly ?
        new Benchmark(description, function() { options.lazy.apply(this, input); }) :
        new Benchmark(description, function() { options.lazy.apply(this, input).toArray(); }),
      new Benchmark(description, function() { options.underscore.apply(this, input); }),
      new Benchmark(description, function() { options.lodash.apply(this, input); })
    ];

    var eachBenchmarks = options.valueOnly ? toArrayBenchmarks : [
      new Benchmark(description, function() {
        options.lazy.apply(this, input).each(function(e) {});
      }),
      new Benchmark(description, function() {
        _.each(options.underscore.apply(this, input), function(e) {});
      }),
      new Benchmark(description, function() {
        lodash.each(options.lodash.apply(this, input), function(e) {});
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

  function addBenchmarkToTable(description, benchmarkId, elementCount) {
    var table = $("#benchmark-results-table-" + elementCount);
    var row   = $("<tr>")
      .addClass("benchmark-result")
      .attr("id", "benchmark-result-" + benchmarkId)
      .attr("data-benchmark-id", benchmarkId)
      .appendTo(table);

    $("<td>").text(description).appendTo(row);
    $("<td>").addClass("underscore-result").appendTo(row);
    $("<td>").addClass("lodash-result").appendTo(row);
    $("<td>").addClass("lazy-result").appendTo(row);
  }

  function addBenchmarkResultToTable(result) {
    var row   = $("#benchmark-result-" + result.benchmarkSetId);
    var style = result.lazy.hz > result.underscore.hz &&
                result.lazy.hz > result.lodash.hz ? "positive" : "negative";

    $(".underscore-result", row).text(addCommas(result.underscore.hz.toFixed(2)));
    $(".lodash-result", row).text(addCommas(result.lodash.hz.toFixed(2)));
    $(".lazy-result", row).text(addCommas(result.lazy.hz.toFixed(2))).addClass(style);
  }

  function markBenchmarkRunning(benchmarkSetId) {
    $("#benchmark-result-" + benchmarkSetId).addClass("running");
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

  window.compareToUnderscore = function(description, options) {
    var inputs = options.inputs ?
      Lazy(options.inputs) :
      Lazy([10, 100]).map(function(size) { return [getOrCreateArray(size)] });

    var smallInput = inputs.first();

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

    inputs.each(function(input) {
      var benchmarkSetId = createBenchmarks(description, input, options);

      // Add a row to the appropriate table for this benchmark
      // once the document's loaded.
      $(document).ready(function() {
        addBenchmarkToTable(description, benchmarkSetId, input[0].length);
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

    $(".select-all").on("click", function() {
      $(this).closest("section").find(".benchmark-result").addClass("selected");
    });

    $(".select-none").on("click", function() {
      $(this).closest("section").find(".benchmark-result").removeClass("selected");
    });

    $(".clear-selected").on("click", function() {
      $(this).closest("section").find(".benchmark-result td:nth-child(n+2)").empty();
    });

    $(".benchmark-result").on("click", function() {
      $(this).toggleClass("selected");
    });

    $(".start-benchmarking").on("click", function() {
      $(".start-benchmarking").prop("disabled", true);
      $(".benchmark-results-section").addClass("loading");

      var benchmarkSuite = createBenchmarkSuite();

      var currentResultSet = [];
      benchmarkSuite.on("cycle", function(e) {
        var benchmarkSetId = e.target.benchmarkSetId;

        currentResultSet.push(e.target);
        if (currentResultSet.length === 3) {
          addBenchmarkResultToTable({
            benchmarkSetId: benchmarkSetId,
            lazy: currentResultSet[0],
            underscore: currentResultSet[1],
            lodash: currentResultSet[2]
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
    });

    initializeDomExample();
    updateCharts();
  };
})();
