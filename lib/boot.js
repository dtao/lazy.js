(function() {
  // Set this to false to give your poor CPU some rest if/while doing TDD.
  var RUN_PERFORMANCE_TESTS = true;

  var benchmarkSuite = new Benchmark.Suite();
  Benchmark.options.maxTime = 1;

  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.updateInterval = 1000;

  var specReporter = new SpecReporter(benchmarkSuite, RUN_PERFORMANCE_TESTS);

  jasmineEnv.addReporter(specReporter);

  var barChart;
  var benchmarkResults = [];

  function percentDifference(x, y) {
    return (x - y) / y * 100;
  }

  function finishedLoading() {
    $("#benchmark-results").removeClass("loading");
  }

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
    $("<td>").text(result.lazy.hz.toFixed(3)).appendTo(row);

    var lastCell = $("<td>").text(result.underscore.hz.toFixed(3)).appendTo(row);
    $("<span>").text("(" + diff.toFixed(2) + "%)").addClass(style).appendTo(lastCell);
  }

  function updateChart() {
    barChart = barChart || document.getElementById("benchmark-results-chart");
    // $(barChart).height(100 + (benchmarkResults.length * 50));
    HighTables.renderChart(barChart);
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

  window.benchmarkChartOptions = function() {
    return {
      plotOptions: {
        series: { animation: false }
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

    $("nav ul li a").on("click", function() {
      var link   = $(this);
      var target = link.attr("href");

      // Show the section
      $("section").hide();
      $(target).show();

      // Highlight the tab
      $("li.selected").removeClass("selected");
      link.closest("li").addClass("selected");

      // Refresh the chart, if necessary
      if (barChart && $("#benchmark-results").is(":visible")) {
        HighTables.renderChart(barChart);
      }

      return false;
    });

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
