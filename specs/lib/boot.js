(function() {
  // Set this to false to give your poor CPU some rest if/while doing TDD.
  var RUN_PERFORMANCE_TESTS = true;

  var benchmarkSuite = new Benchmark.Suite();
  Benchmark.options.maxTime = 1;

  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.updateInterval = 1000;

  var htmlReporter = new jasmine.HtmlReporter();

  jasmineEnv.addReporter(htmlReporter);

  jasmineEnv.specFilter = function(spec) {
    return htmlReporter.specFilter(spec);
  };

  var barChart;
  var benchmarkResults = [];
  function addBenchmarkResult(result) {
    benchmarkResults.push(result);
    addBenchmarkResultToTable(result);
  }

  function addBenchmarkResultToTable(result) {
    var table = $("#benchmark-results-table").removeClass("empty");
    var row   = $("<tr>").addClass("benchmark-result").appendTo(table);
    var diff  = percentDifference(result.lazy.hz, result.underscore.hz);
    var style = diff > 0 ? "positive" : "negative";
    $("<td>").text(result.lazy.name).appendTo(row);
    $("<td>").text(result.lazy.hz.toFixed(5)).appendTo(row);
    $("<td>").text(result.underscore.hz.toFixed(5)).appendTo(row);
    $("<td>").text(diff.toFixed(2) + "%").addClass(style).appendTo(row);
  }

  function updateChart() {
    barChart = barChart || document.getElementById("benchmark-results-chart");
    $(barChart).height(50 + (benchmarkResults.length * 50));
    HighTables.renderChart(barChart);
  }

  function finishedLoading() {
    $("#benchmark-results").removeClass("loading");
  }

  function sortResults() {
    $("tr.benchmark-result").remove();

    Lazy(benchmarkResults)
      .sortBy(function(r) { return percentDifference(r.lazy.hz, r.underscore.hz); })
      .each(function(result) {
        addBenchmarkResultToTable(result);
      });

    updateChart();
    finishedLoading();
  }

  function percentDifference(x, y) {
    return (x - y) / y * 100;
  }

  window.benchmarkChartOptions = function() {
    return {
      plotOptions: {
        series: { animation: false }
      },

      yAxis: {
        type: "logarithmic"
      }
    };
  };

  window.compareToUnderscore = function(description, specs, shouldMatch) {
    if (shouldMatch !== false) {
      it("returns the same result as underscore for '" + description + "'", function() {
        expect(specs.lazy()).toEqual(specs.underscore());
      });
    }

    benchmarkSuite.add(description, specs.lazy);
    benchmarkSuite.add(description, specs.underscore);
  };

  window.onload = function() {
    jasmineEnv.execute();

    var currentResultSet = [];
    benchmarkSuite.on("cycle", function(e) {
      currentResultSet.push(e.target);
      if (currentResultSet.length === 2) {
        addBenchmarkResult({
          lazy: currentResultSet[0],
          underscore: currentResultSet[1]
        });
        updateChart();
        currentResultSet = [];
      }
    });

    benchmarkSuite.on("complete", function() {
      sortResults();
    });

    if (RUN_PERFORMANCE_TESTS) {
      benchmarkSuite.run({ async: true });
    } else {
      finishedLoading();
    }
  };
})();
