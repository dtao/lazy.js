(function() {
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

    var table = $("#benchmark-results-table");
    var row   = $("<tr>").addClass("benchmark-result").appendTo(table);
    $("<td>").text(result.lazy.name).appendTo(row);
    $("<td>").text(result.lazy.hz.toFixed(5)).appendTo(row);
    $("<td>").text(result.underscore.hz.toFixed(5)).appendTo(row);

    barChart = barChart || document.getElementById("benchmark-results-chart");
    HighTables.renderChart(barChart);
  }

  function sortResults() {
    $("tr.benchmark-result").remove();

    Lazy(benchmarkResults)
      .sortBy(function(r) { return r.lazy.hz - r.underscore.hz; })
      .reverse()
      .each(function(result) {
        addBenchmarkResult(result);
      });

    $("#benchmark-results").removeClass("loading");
  }

  window.Verifier = function(expectation) {
    this.verify = expectation;
  };

  window.benchmarkChartOptions = function() {
    return {
      plotOptions: {
        series: { animation: false }
      },

      yAxis: {
        type: "logarithmic",
      }
    };
  };

  window.compareToUnderscore = function(description, specs) {
    it("returns the same result as underscore for '" + description + "'", function() {
      expect(specs.lazy()).toEqual(specs.underscore());
    });

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
        currentResultSet = [];
      }
    });

    benchmarkSuite.on("complete", function() {
      sortResults();
    });

    benchmarkSuite.run({ async: true });
  };
})();
