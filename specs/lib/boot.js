(function() {
  Benchmark.options.maxTime = 1;

  var benchmarkSuite = new Benchmark.Suite();

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
    var name  = $("<td>").text(result.name).appendTo(row);
    var speed = $("<td>").text(result.hz).appendTo(row);

    barChart = barChart || document.getElementById("benchmark-results-chart");
    HighTables.renderChart(barChart);
  }

  function sortResults() {
    $("tr.benchmark-result").remove();

    Lazy(benchmarkResults)
      .sortBy(function(r) { return r.hz; })
      .reverse()
      .each(function(result) {
        addBenchmarkResult(result);
      });

    $("#benchmark-results").removeClass("loading");
  }

  benchmarkSuite.on("cycle", function(e) {
    addBenchmarkResult(e.target);
  });

  benchmarkSuite.on("complete", function() {
    sortResults();
  });

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

  window.runTest = function(description, spec) {
    it(description, function() {
      spec().verify();
    });
    benchmarkSuite.add(description, spec);
  };

  window.onload = function() {
    jasmineEnv.execute();
    benchmarkSuite.run({ async: true });
  };
})();
