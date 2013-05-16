(function() {
  Benchmark.options.maxTime = 1;

  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.updateInterval = 1000;

  var specReporter = new SpecReporter();
  jasmineEnv.addReporter(specReporter);

  var arrays = {};
  var benchmarks = {};
  var benchmarkResults = {};

  window.lodash = _.noConflict();

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
      Lazy(benchmarks[benchmarkId]).each(function(benchmark) {
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
  }

  function addBenchmarkToTable(benchmark, elementCount) {
    var table = $("#benchmark-results-table-" + elementCount).removeClass("empty");
    var row   = $("<tr>")
      .addClass("benchmark-result")
      .attr("id", "benchmark-result-" + benchmark.id)
      .attr("data-benchmark-id", benchmark.id)
      .appendTo(table);

    $("<td>").text(benchmark.name).appendTo(row);
    $("<td>").addClass("underscore-result").appendTo(row);
    $("<td>").addClass("lodash-result").appendTo(row);
    $("<td>").addClass("lazy-result").appendTo(row);
  }

  function addBenchmarkResultToTable(result) {
    var row   = $("#benchmark-result-" + result.lazy.id);
    var style = result.lazy.hz > result.underscore.hz &&
                result.lazy.hz > result.lodash.hz ? "positive" : "negative";

    $(".underscore-result", row).text(addCommas(result.underscore.hz.toFixed(2)));
    $(".lodash-result", row).text(addCommas(result.lodash.hz.toFixed(2)));
    $(".lazy-result", row).text(addCommas(result.lazy.hz.toFixed(2))).addClass(style);
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

  window.compareToUnderscore = function(description, options) {
    var inputs = options.inputs ?
      Lazy(options.inputs) :
      Lazy([10, 100]).map(function(size) { return [getOrCreateArray(size)] });

    var smallInput = inputs.first();
    var matcher    = options.valueOnly ? "toEqual" : "toMatchSequentially";

    if (options.shouldMatch !== false) {
      it("returns the same result as underscore.js for '" + description + "'", function() {
        var lazyResult = options.lazy.apply(this, smallInput);
        var underscoreResult = options.underscore.apply(this, smallInput);
        if (typeof underscoreResult.value === "function") {
          underscoreResult = underscoreResult.value();
        }
        expect(lazyResult)[matcher](underscoreResult);
      });

      it("returns the same result as Lo-Dash for '" + description + "'", function() {
        var lazyResult = options.lazy.apply(this, smallInput);
        var lodashResult = options.lodash.apply(this, smallInput);
        if (typeof lodashResult.value === "function") {
          lodashResult = lodashResult.value();
        }
        expect(lazyResult)[matcher](lodashResult);
      });
    }

    inputs.each(function(input) {
      var lazyBm, underscoreBm, lodashBm;

      if (options.valueOnly) {
        lazyBm = new Benchmark(description, function() { options.lazy.apply(this, input); });
        underscoreBm = new Benchmark(description, function() { options.underscore.apply(this, input); });
        lodashBm = new Benchmark(description, function() { options.lodash.apply(this, input); });

      } else {
        lazyBm = new Benchmark(description, function() {
          var result = options.lazy.apply(this, input);
          result.each(function(e) {});
        });

        underscoreBm = new Benchmark(description, function() {
          var result = options.underscore.apply(this, input);
          _.each(result, function(e) {});
        });

        lodashBm = new Benchmark(description, function() {
          var result = options.lodash.apply(this, input);
          lodash.each(result, function(e) {});
        });
      }

      benchmarks[lazyBm.id] = [lazyBm, underscoreBm, lodashBm];

      // Add a row to the appropriate table for this benchmark
      // once the document's loaded.
      $(document).ready(function() {
        addBenchmarkToTable(lazyBm, input[0].length);
      });
    });
  };

  window.onload = function() {
    jasmineEnv.execute();

    $("nav ul li a").on("click", function() {
      var link   = $(this);
      var nav    = link.closest("nav");
      var target = link.attr("href");

      // Show the section
      $(nav.attr("data-sections")).hide();
      $(target).show();

      // Highlight the tab
      $("li.selected", nav).removeClass("selected");
      link.closest("li").addClass("selected");

      // Refresh the chart, if necessary
      var columnChart = $(".column-chart:visible");
      if (columnChart.length > 0) {
        HighTables.renderChart(columnChart[0]);
      }

      return false;
    });

    $(".benchmark-result").on("click", function() {
      $(this).toggleClass("selected");
    });

    $(".start-benchmarking").on("click", function() {
      $(".benchmark-results-section").addClass("loading");

      var benchmarkSuite = createBenchmarkSuite();

      var currentResultSet = [];
      benchmarkSuite.on("cycle", function(e) {
        currentResultSet.push(e.target);
        if (currentResultSet.length === 3) {
          addBenchmarkResultToTable({
            lazy: currentResultSet[0],
            underscore: currentResultSet[1],
            lodash: currentResultSet[2]
          });
          updateCharts();
          currentResultSet = [];
        }
      });

      benchmarkSuite.on("complete", function() {
        finishedLoading();
      });

      benchmarkSuite.run({ async: true });
    });

    updateCharts();
  };
})();
