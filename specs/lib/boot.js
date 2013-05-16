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
    var inputs = options.inputs ?
      Lazy(options.inputs) :
      Lazy([10, 100, 1000]).map(function(size) { return [getOrCreateArray(size)] });

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
      if (options.valueOnly) {
        benchmarkSuite.add(description, function() { options.lazy.apply(this, input); });
        benchmarkSuite.add(description, function() { options.underscore.apply(this, input); });
        benchmarkSuite.add(description, function() { options.lodash.apply(this, input); });

      } else {
        benchmarkSuite.add(description, function() {
          var result = options.lazy.apply(this, input);
          result.each(function(e) {});
        });

        benchmarkSuite.add(description, function() {
          var result = options.underscore.apply(this, input);
          _.each(result, function(e) {});
        });

        benchmarkSuite.add(description, function() {
          var result = options.lodash.apply(this, input);
          lodash.each(result, function(e) {});
        });
      }

      // Essentially, tag these for later reference.
      benchmarkSuite[benchmarkSuite.length - 1].elementCount = input[0].length;
      benchmarkSuite[benchmarkSuite.length - 2].elementCount = input[0].length;
      benchmarkSuite[benchmarkSuite.length - 3].elementCount = input[0].length;
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
