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
    $("<td>").text(result.lazy.hz).appendTo(row);
    $("<td>").text(result.underscore.hz).appendTo(row);

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

    benchmarkSuite.on("complete", function() {
      for (var i = 0; i < benchmarkSuite.length; i += 2) {
        addBenchmarkResult({
          lazy: benchmarkSuite[i],
          underscore: benchmarkSuite[i + 1]
        });
      }

      sortResults();
    });

    benchmarkSuite.run({ async: true });
  };
})();
