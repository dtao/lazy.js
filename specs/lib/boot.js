(function() {
  // Set this to false to give your poor CPU some rest if/while doing TDD.
  var RUN_PERFORMANCE_TESTS = true;

  var benchmarkSuite = new Benchmark.Suite();
  Benchmark.options.maxTime = 0.1;

  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.updateInterval = 1000;

  var specReporter = new SpecReporter();
  jasmineEnv.addReporter(specReporter);

  var arrays = {};
  var benchmarkResults = {};

  window.lodash = _.noConflict();

  function getOrCreateArray(size) {
    if (!arrays[size]) {
      arrays[size] = Lazy.range(size).toArray();
    }

    return arrays[size];
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

  function addBenchmarkResult(result) {
    var elementCount = result.lazy.elementCount;
    benchmarkResults[elementCount] = benchmarkResults[elementCount] || [];
    benchmarkResults[elementCount].push(result);
    addBenchmarkResultToTable(elementCount, result);
  }

  function addBenchmarkResultToTable(count, result) {
    var table = $("#benchmark-results-table-" + count).removeClass("empty");
    var row   = $("<tr>").addClass("benchmark-result").appendTo(table);
    var style = result.lazy.hz > result.underscore.hz &&
                result.lazy.hz > result.lodash.hz ? "positive" : "negative";

    $("<td>").text(result.lazy.name).appendTo(row);
    $("<td>").text(addCommas(result.underscore.hz.toFixed(2))).appendTo(row);
    $("<td>").text(addCommas(result.lodash.hz.toFixed(2))).appendTo(row);
    $("<td>").text(addCommas(result.lazy.hz.toFixed(2))).addClass(style).appendTo(row);
  }

  function updateChart(count) {
    if (!count) {
      return;
    }
    var chart = document.getElementById("benchmark-results-chart-" + count);
    HighTables.renderChart(chart);
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
    var arrays = options.arrays ?
      Lazy(options.arrays) :
      Lazy([10, 100, 1000]).map(function(size) { return getOrCreateArray(size) });

    var smallArray = arrays.first();
    var matcher    = options.valueOnly ? "toEqual" : "toMatchSequentially";

    if (options.shouldMatch !== false) {
      it("returns the same result as underscore for '" + description + "'", function() {
        expect(options.lazy(smallArray))[matcher](options.underscore(smallArray));
      });

      it("returns the same result as lodash for '" + description + "'", function() {
        expect(options.lazy(smallArray))[matcher](options.lodash(smallArray));
      });
    }

    arrays.each(function(array) {
      if (options.valueOnly) {
        benchmarkSuite.add(description, function() { options.lazy(array); });
        benchmarkSuite.add(description, function() { options.underscore(array); });
        benchmarkSuite.add(description, function() { options.lodash(array); });

      } else {
        benchmarkSuite.add(description, function() {
          var result = options.lazy(array);
          result.each(function(e) {});
        });

        benchmarkSuite.add(description, function() {
          var result = options.underscore(array);
          for (var i = 0; i < result.length; ++i) {}
        });

        benchmarkSuite.add(description, function() {
          var result = options.lodash(array);
          for (var i = 0; i < result.length; ++i) {}
        });
      }

      // Essentially, tag these for later reference.
      benchmarkSuite[benchmarkSuite.length - 1].elementCount = array.length;
      benchmarkSuite[benchmarkSuite.length - 2].elementCount = array.length;
      benchmarkSuite[benchmarkSuite.length - 3].elementCount = array.length;
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
      if (currentResultSet.length === 3) {
        addBenchmarkResult({
          lazy: currentResultSet[0],
          underscore: currentResultSet[1],
          lodash: currentResultSet[2]
        });
        updateChart(e.target.elementCount);
        currentResultSet = [];
      }
    });

    benchmarkSuite.on("complete", function() {
      finishedLoading();
    });

    if (RUN_PERFORMANCE_TESTS) {
      benchmarkSuite.run({ async: true });
    } else {
      finishedLoading();
    }
  };
})();
