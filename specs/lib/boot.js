(function() {
  // Set this to false to give your poor CPU some rest if/while doing TDD.
  var RUN_PERFORMANCE_TESTS = true;

  var benchmarkSuite = new Benchmark.Suite();
  Benchmark.options.maxTime = 1;

  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.updateInterval = 1000;

  var specReporter = new SpecReporter();

  jasmineEnv.addReporter(specReporter);

  var arrays = {};
  var benchmarkResults = {};

  function getOrCreateArray(size) {
    if (!arrays[size]) {
      arrays[size] = Lazy.range(size).toArray();
    }

    return arrays[size];
  }

  function finishedLoading() {
    $(".benchmark-results-section").removeClass("loading");
  }

  function addBenchmarkResult(result) {
    var elementCount = result.lazy.elementCount;
    benchmarkResults[elementCount] = benchmarkResults[elementCount] || [];
    benchmarkResults[elementCount].push(result);
    addBenchmarkResultToTable(elementCount, result);
  }

  function addBenchmarkResultToTable(count, result) {
    var table = $("#benchmark-results-table-" + count).removeClass("empty");
    var row   = $("<tr>").addClass("benchmark-result").appendTo(table);
    var style = result.lazy.hz > result.underscore.hz ? "positive" : "negative";

    $("<td>").text(result.lazy.name).appendTo(row);
    $("<td>").text(result.underscore.hz.toFixed(2)).appendTo(row);
    $("<td>").text(result.lazy.hz.toFixed(2)).addClass(style).appendTo(row);
  }

  function updateChart(count) {
    if (!count) {
      return;
    }
    var chart = document.getElementById("benchmark-results-chart-" + count);
    HighTables.renderChart(chart);
  }

  function updateCharts() {
    updateChart(10);
    updateChart(100);
    updateChart(1000);
  }

  function sortResults() {
    $("tr.benchmark-result").remove();

    for (var key in benchmarkResults) {
      Lazy(benchmarkResults[key])
        .sortBy(function(r) { return r.lazy.hz; })
        .each(function(result) {
          addBenchmarkResultToTable(key, result);
        });
    }

    updateCharts();
    finishedLoading();
  }

  window.benchmarkChartOptions = function() {
    return {
      plotOptions: {
        series: { animation: false }
      }
    };
  };

  window.compareToUnderscore = function(description, options) {
    var arrays = Lazy(options.arrays || options.arraySizes || [10, 100, 1000]).map(function(size) {
      return (typeof size === "number") ? getOrCreateArray(size) : size;
    });

    var smallArray = arrays.first();

    if (options.shouldMatch !== false) {
      it("returns the same result as underscore for '" + description + "'", function() {
        expect(options.lazy(smallArray)).toEqual(options.underscore(smallArray));
      });
    }

    arrays.each(function(array) {
      benchmarkSuite.add(description, function() { options.lazy(array); });
      benchmarkSuite.add(description, function() { options.underscore(array); });

      // Essentially, tag these for later reference.
      benchmarkSuite[benchmarkSuite.length - 1].elementCount = array.length;
      benchmarkSuite[benchmarkSuite.length - 2].elementCount = array.length;
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

    var currentResultSet = [];
    benchmarkSuite.on("cycle", function(e) {
      currentResultSet.push(e.target);
      if (currentResultSet.length === 2) {
        addBenchmarkResult({
          lazy: currentResultSet[0],
          underscore: currentResultSet[1]
        });
        updateChart(e.target.elementCount);
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
