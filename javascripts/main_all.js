(function() {
  Benchmark.options.maxTime = 0.1;

  var arrays = {};
  var benchmarksForToArray = {};
  var benchmarksForEach = {};
  var benchmarkResults = {};

  // Since Boiler.js is the last lib we added, it's the most recent hijacker of
  // the _ identifier.
  boiler = _.noConflict();

  // Lo-Dash was next in line.
  lodash = _.noConflict();

  // Now Underscore is back!

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

  function finishedLoading() {
    $(".benchmark-results-section").removeClass("loading");
    $(".start-benchmarking").prop("disabled", false);
    $(".benchmark-result").removeClass("running");
  }

  function getReferenceResultKey() {
    // Maybe later I'll make it so you can pick one.
    return "lodash";
  }

  function createBenchmarks(description, input, options) {
    var toArrayBenchmarks = [
      // Lazy.js
      options.valueOnly ?
        new Benchmark(description, function() { options.lazy.apply(this, input); }) :
        new Benchmark(description, function() { options.lazy.apply(this, input).toArray(); }),

      // Underscore
      new Benchmark(description, function() { options.underscore.apply(this, input); }),

      // Lo-Dash
      new Benchmark(description, function() { options.lodash.apply(this, input); })
    ];

    if (window.COMPARE_ALL_LIBS) {
      toArrayBenchmarks = toArrayBenchmarks.concat([
        // Wu.js
        options.valueOnly ?
          new Benchmark(description, function() { options.wu.apply(this, input); }) :
          new Benchmark(description, function() { options.wu.apply(this, input).toArray(); }),

        // Sugar
        new Benchmark(description, function() { options.sugar.apply(this, input); }),

        // Linq.js
        options.valueOnly ?
          new Benchmark(description, function() { options.linq.apply(this, input); }) :
          new Benchmark(description, function() { options.linq.apply(this, input).ToArray(); }),

        // JSLINQ
        new Benchmark(description, function() { options.jslinq.apply(this, input).ToArray(); }),

        // From.js
        options.valueOnly ?
          new Benchmark(description, function() { options.from.apply(this, input); }) :
          new Benchmark(description, function() { options.from.apply(this, input).toArray(); }),

        // IxJS
        options.valueOnly ?
          new Benchmark(description, function() { options.ix.apply(this, input); }) :
          new Benchmark(description, function() { options.ix.apply(this, input).toArray(); }),

        // Boiler.js
        new Benchmark(description, function() { options.boiler.apply(this, input); }),

        // Sloth.js
        options.valueOnly ?
          new Benchmark(description, function() { options.sloth.apply(this, input); }) :
          new Benchmark(description, function() { options.sloth.apply(this, input).force(); })
      ]);
    }

    var eachBenchmarks = [
      // Lazy.js
      options.valueOnly ?
        new Benchmark(description, function() { options.lazy.apply(this, input); }) :
        new Benchmark(description, function() {
          options.lazy.apply(this, input).each(function(e) {});
        }),

      // Underscore
      options.valueOnly ?
        new Benchmark(description, function() { options.underscore.apply(this, input); }) :
        new Benchmark(description, function() {
          _.each(options.underscore.apply(this, input), function(e) {});
        }),

      // Lo-Dash
      options.valueOnly ?
        new Benchmark(description, function() { options.lodash.apply(this, input); }) :
        new Benchmark(description, function() {
          lodash.each(options.lodash.apply(this, input), function(e) {});
        })
    ];

    if (window.COMPARE_ALL_LIBS) {
      eachBenchmarks = eachBenchmarks.concat([
        // Wu.js
        options.valueOnly ?
          new Benchmark(description, function() { options.wu.apply(this, input); }) :
          new Benchmark(description, function() {
            options.wu.apply(this, input).each(function(e) {});
          }),

        // Sugar
        options.valueOnly ?
          new Benchmark(description, function() { options.sugar.apply(this, input); }) :
          new Benchmark(description, function() {
            options.sugar.apply(this, input).forEach(function(e) {});
          }),

        // Linq.js
        options.valueOnly ?
          new Benchmark(description, function() { options.linq.apply(this, input); }) :
          new Benchmark(description, function() {
            options.linq.apply(this, input).ForEach(function(e) {});
          }),

        // JSLINQ
        options.valueOnly ?
          new Benchmark(description, function() { options.jslinq.apply(this, input); }) :
          new Benchmark(description, function() {
            // JSLINQ doesn't expose a ForEach method like Linq.js; so I'll just
            // iterate over the resulting array in the fastest way I can think of.
            var result = options.jslinq.apply(this, input).items,
                i = -1, e;

            // Need to actually access the result for a relatively apples-to-apples
            // comparison.
            while (++i < result.length) { e = result[i]; }
          }),

        // From.js
        options.valueOnly ?
          new Benchmark(description, function() { options.from.apply(this, input); }) :
          new Benchmark(description, function() {
            options.from.apply(this, input).each(function(e) {});
          }),

        // IxJS
        options.valueOnly ?
          new Benchmark(description, function() { options.ix.apply(this, input); }) :
          new Benchmark(description, function() {
            options.ix.apply(this, input).forEach(function(e) {});
          }),

        // Boiler.js
        options.valueOnly ?
          new Benchmark(description, function() { options.boiler.apply(this, input); }) :
          new Benchmark(description, function() {
            options.boiler.apply(this, input).each(function(e) {});
          }),

        // Sloth.js
        options.valueOnly ?
          new Benchmark(description, function() { options.sloth.apply(this, input); }) :
          new Benchmark(description, function() {
            options.sloth.apply(this, input).each(function(e) {});
          })
      ]);
    }

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

  function addBenchmarkToTable(description, benchmarkId, category) {
    var table = $("#benchmark-results-table-" + category);
    var row   = $("<tr>")
      .addClass("benchmark-result")
      .attr("id", "benchmark-result-" + benchmarkId)
      .attr("data-benchmark-id", benchmarkId)
      .appendTo(table);

    $("<td>").text(description).appendTo(row);
    $("<td>").addClass("underscore-result").appendTo(row);
    $("<td>").addClass("lodash-result").appendTo(row);

    if (window.COMPARE_ALL_LIBS) {
      $("<td>").addClass("wu-result").appendTo(row);
      $("<td>").addClass("sugar-result").appendTo(row);
      $("<td>").addClass("linqjs-result").appendTo(row);
      $("<td>").addClass("jslinq-result").appendTo(row);
      $("<td>").addClass("fromjs-result").appendTo(row);
      $("<td>").addClass("ixjs-result").appendTo(row);
      $("<td>").addClass("boiler-result").appendTo(row);
      $("<td>").addClass("sloth-result").appendTo(row);
    }

    $("<td>").addClass("lazy-result").appendTo(row);
  }

  function addResultToCell(result, cell, fastestResult, referenceResult) {
    if (result === 0.0) {
      cell.addClass("not-applicable");
      cell.text("N/A");
      return;
    }

    var resultToDisplay = result,
        suffix = "";

    // Optionally display result as percentage of fastest result.
    if ($("#test-proportional").is(":checked")) {
      resultToDisplay = (result / fastestResult) * 100.0;
      suffix = "%";
    } else if ($("#test-proportional-lodash").is(":checked")) {
      resultToDisplay = (result / referenceResult) * 100.0;
      suffix = "%";
    }

    // Add commas.
    var parts = resultToDisplay.toFixed(2).split(".");
    var pattern = /(\d+)(\d{3})/;
    while (pattern.test(parts[0])) {
        parts[0] = parts[0].replace(pattern, '$1,$2');
    }
    cell.text(parts.join(".") + suffix);

    // Highlight the fastest result for each benchmark.
    if (result === fastestResult) {
      cell.addClass("positive");
    }
  }

  function addBenchmarkResultToTable(result) {
    var row = $("#benchmark-result-" + result.benchmarkSetId);

    var fastestResult = Lazy(result)
      .filter(function(data, key) { return !!data.hz; })
      .map(function(data, key) { return data.hz; })
      .max();

    var referenceResult = Lazy(result)
      .find(function(data, key) { return key === getReferenceResultKey(); })
      .hz;

    addResultToCell(result.underscore.hz, $(".underscore-result", row), fastestResult, referenceResult);
    addResultToCell(result.lodash.hz, $(".lodash-result", row), fastestResult, referenceResult);
    if (window.COMPARE_ALL_LIBS) {
      addResultToCell(result.wu.hz, $(".wu-result", row), fastestResult, referenceResult);
      addResultToCell(result.sugar.hz, $(".sugar-result", row), fastestResult, referenceResult);
      addResultToCell(result.linq.hz, $(".linqjs-result", row), fastestResult, referenceResult);
      addResultToCell(result.jslinq.hz, $(".jslinq-result", row), fastestResult, referenceResult);
      addResultToCell(result.from.hz, $(".fromjs-result", row), fastestResult, referenceResult);
      addResultToCell(result.ix.hz, $(".ixjs-result", row), fastestResult, referenceResult);
      addResultToCell(result.boiler.hz, $(".boiler-result", row), fastestResult, referenceResult);
      addResultToCell(result.sloth.hz, $(".sloth-result", row), fastestResult, referenceResult);
    }
    addResultToCell(result.lazy.hz, $(".lazy-result", row), fastestResult, referenceResult);
  }

  function clearRow(row) {
    $("td:nth-child(n+2)", row).empty();
    $(".lazy-result", row).removeClass("positive").removeClass("negative");
  }

  function markBenchmarkRunning(benchmarkSetId) {
    var row = $("#benchmark-result-" + benchmarkSetId).addClass("running");
    clearRow(row);
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

  window.compareAlternatives = function(description, options) {
    var inputs = options.inputs ?
      Lazy(options.inputs) :
      Lazy([10, 100]).map(function(size) { return [getOrCreateArray(size)] });

    var smallInput = inputs.first();
    var exceptions = Lazy(options.doesNotMatch || []);

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

      if (options.lodash && !exceptions.contains("lodash")) {
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

      if (options.wu && !exceptions.contains("wu")) {
        it("returns the same result as wu.js for '" + description + "'", function() {
          var lazyResult = options.lazy.apply(this, smallInput);
          var wuResult = options.wu.apply(this, smallInput);
          if (typeof lazyResult.toArray === "function") {
            lazyResult = lazyResult.toArray();
          }
          if (typeof wuResult.toArray === "function") {
            wuResult = wuResult.toArray();
          }
          expect(lazyResult).toEqual(wuResult);
        });
      }

      if (options.sugar && !exceptions.contains("sugar")) {
        it("returns the same result as Sugar for '" + description + "'", function() {
          var lazyResult = options.lazy.apply(this, smallInput);
          var sugarResult = options.sugar.apply(this, smallInput);
          if (typeof lazyResult.toArray === "function") {
            lazyResult = lazyResult.toArray();
          }
          if (typeof sugarResult.toArray === "function") {
            sugarResult = sugarResult.toArray();
          }
          expect(lazyResult).toEqual(sugarResult);
        });
      }

      if (options.linq && !exceptions.contains("linq")) {
        it("returns the same result as linq.js for '" + description + "'", function() {
          var lazyResult = options.lazy.apply(this, smallInput);
          var linqResult = options.linq.apply(this, smallInput);
          if (typeof lazyResult.toArray === "function") {
            lazyResult = lazyResult.toArray();
          }
          if (typeof linqResult.ToArray === "function") {
            linqResult = linqResult.ToArray();
          }
          expect(lazyResult).toEqual(linqResult);
        });
      }

      if (options.jslinq && !exceptions.contains("jslinq")) {
        it("returns the same result as JSLINQ for '" + description + "'", function() {
          var lazyResult = options.lazy.apply(this, smallInput);
          var jslinqResult = options.jslinq.apply(this, smallInput);
          if (typeof lazyResult.toArray === "function") {
            lazyResult = lazyResult.toArray();
          }
          if (typeof jslinqResult.ToArray === "function") {
            jslinqResult = jslinqResult.ToArray();
          }
          expect(lazyResult).toEqual(jslinqResult);
        });
      }

      if (options.from && !exceptions.contains("from")) {
        it("returns the same result as from.js for '" + description + "'", function() {
          var lazyResult = options.lazy.apply(this, smallInput);
          var fromResult = options.from.apply(this, smallInput);
          if (typeof lazyResult.toArray === "function") {
            lazyResult = lazyResult.toArray();
          }
          if (typeof fromResult.toArray === "function") {
            fromResult = fromResult.toArray();
          }
          expect(lazyResult).toEqual(fromResult);
        });
      }

      if (options.ix && !exceptions.contains("ix")) {
        it("returns the same result as IxJS for '" + description + "'", function() {
          var lazyResult = options.lazy.apply(this, smallInput);
          var ixResult = options.ix.apply(this, smallInput);
          if (typeof lazyResult.toArray === "function") {
            lazyResult = lazyResult.toArray();
          }
          if (typeof ixResult.toArray === "function") {
            ixResult = ixResult.toArray();
          }
          expect(lazyResult).toEqual(ixResult);
        });
      }

      if (options.boiler && !exceptions.contains("boiler")) {
        it("returns the same result as Boiler.js for '" + description + "'", function() {
          var lazyResult = options.lazy.apply(this, smallInput);
          var boilerResult = options.boiler.apply(this, smallInput);
          if (typeof lazyResult.toArray === "function") {
            lazyResult = lazyResult.toArray();
          }
          if (typeof boilerResult.end === "function") {
            boilerResult = boilerResult.end();
          }
          expect(lazyResult).toEqual(boilerResult);
        });
      }

      if (options.sloth && !exceptions.contains("sloth")) {
        it("returns the same result as sloth.js for '" + description + "'", function() {
          var lazyResult = options.lazy.apply(this, smallInput);
          var slothResult = options.sloth.apply(this, smallInput);
          if (typeof lazyResult.toArray === "function") {
            lazyResult = lazyResult.toArray();
          }
          if (typeof slothResult.force === "function") {
            slothResult = slothResult.force();
          }
          expect(lazyResult).toEqual(slothResult);
        });
      }
    }

    inputs.each(function(input) {
      var benchmarkSetId = createBenchmarks(description, input, options);

      // Add a row to the appropriate table for this benchmark
      // once the document's loaded.
      $(document).ready(function() {
        var inputSize = input[0] instanceof Array ? input[0].length : "other";
        addBenchmarkToTable(description, benchmarkSetId, inputSize);
      });
    });
  };

  window.addEventListener("load", function() {
    $("#test-to-array").on("change", function() {
      $("#test-each").prop("checked", false);
    });

    $("#test-each").on("change", function() {
      $("#test-to-array").prop("checked", false);
    });

    $("#test-absolute").on("change", function() {
      $("#test-proportional").prop("checked", false);
      $("#test-proportional-lodash").prop("checked", false);
    });

    $("#test-proportional").on("change", function() {
      $("#test-absolute").prop("checked", false);
      $("#test-proportional-lodash").prop("checked", false);
    });

    $("#test-proportional-lodash").on("change", function() {
      $("#test-absolute").prop("checked", false);
      $("#test-proportional").prop("checked", false);
    });

    $("a.why-to-array-vs-each").on("click", function() {
      // Show the info panel.
      $("#why-to-array-vs-each").addClass("showing");

      // Hide the info panel once the user clicks anywhere else.
      $(document).one("click", function() {
        $("#why-to-array-vs-each").removeClass("showing");
      });

      // Prevent this click from propagating to the document node, which would
      // immediately dismiss the panel via the handler above.
      return false;
    });

    $("#why-to-array-vs-each").on("click", function() {
      // Clicking on the panel itself shouldn't dismiss it.
      return false;
    });

    $(".select-all").on("click", function() {
      $(this).closest("section").find(".benchmark-result").addClass("selected");
    });

    $(".select-none").on("click", function() {
      $(this).closest("section").find(".benchmark-result").removeClass("selected");
    });

    $(".clear-selected").on("click", function() {
      $(this).closest("section").find(".benchmark-result").each(function() {
        clearRow($(this));
      });
    });

    $(".benchmark-result").on("click", function() {
      $(this).toggleClass("selected");
    });

    $(".start-benchmarking").on("click", function() {
      $(".start-benchmarking").prop("disabled", true);
      $(".benchmark-results-section").addClass("loading");

      var benchmarkSuite = createBenchmarkSuite();

      // No benchmarks selected
      if (benchmarkSuite.length === 0) {
        finishedLoading();
        return false;
      }

      var resultsPerBenchmark = window.COMPARE_ALL_LIBS ? 11 : 3;

      var currentResultSet = [];
      benchmarkSuite.on("cycle", function(e) {
        var benchmarkSetId = e.target.benchmarkSetId;
        var benchmarkResults;

        currentResultSet.push(e.target);
        if (currentResultSet.length === resultsPerBenchmark) {
          benchmarkResults = {
            benchmarkSetId: benchmarkSetId,
            lazy: currentResultSet[0],
            underscore: currentResultSet[1],
            lodash: currentResultSet[2]
          };

          if (window.COMPARE_ALL_LIBS) {
            benchmarkResults.wu = currentResultSet[3];
            benchmarkResults.sugar = currentResultSet[4];
            benchmarkResults.linq = currentResultSet[5];
            benchmarkResults.jslinq = currentResultSet[6];
            benchmarkResults.from = currentResultSet[7];
            benchmarkResults.ix = currentResultSet[8];
            benchmarkResults.boiler = currentResultSet[9];
            benchmarkResults.sloth = currentResultSet[10];
          }

          addBenchmarkResultToTable(benchmarkResults);
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

      // Need to return false to prevent the enclosing form from being submitted
      // on Firefox.
      return false;
    });

    $(".show-all-specs").on("click", function() {
      $("#test-results-table tr").show();
    });

    $(".show-failing-specs").on("click", function() {
      $("#test-results-table tr.success").hide();
    });

    updateCharts();
  });
})();
$(document).ready(function() {
  $("nav ul li a").on("click", function() {
    var link     = $(this);
    var nav      = link.closest("nav");
    var target   = link.attr("href");
    var sections = nav.attr("data-sections");

    // If this link doesn't have an href like '#target', forget it!
    if (target.charAt(0) !== "#" && !link.is(".nav-link")) {
      return;
    }

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

  $(".underscore-version").text(_.VERSION);
  $(".lodash-version").text(lodash.VERSION);
});
var SpecReporter = function() {
  var currentRowId = 0;
  var rowsBySuiteId = {};
  var rowsBySpecId = {};
  var rowsBySpecDescription = {};

  function getOrCreateRowForSuite(suite) {
    var row = rowsBySuiteId[suite.id];

    if (!row) {
      var table = $("#test-results-table").removeClass("empty");

      row = $("<tr>")
        .addClass("test-suite")
        .attr("data-tt-id", currentRowId++);

      if (suite.parentSuite) {
        row.attr("data-tt-parent-id", getOrCreateRowForSuite(suite.parentSuite));
      }

      row.appendTo(table);

      $("<td>").text(suite.description).appendTo(row);
      $("<td>").appendTo(row);

      rowsBySuiteId[suite.id] = row;
    }

    return row.attr("data-tt-id");
  }

  function addFailureInformation(row, results) {
    var message = Lazy(results.items_)
      .reject(function(i) { return i.passed(); })
      .map(function(i) { return i.message; })
      .toArray()
      .join("\n");

    $("<div>")
      .text(message)
      .addClass("failure-information")
      .appendTo(row.find("td:first-child"));
  }

  this.reportSpecStarting = function(spec) {
    var table    = $("#test-results-table");
    var suiteRow = getOrCreateRowForSuite(spec.suite);
    var specRow  = $("<tr>").addClass("test-spec").appendTo(table);

    $("<td>").text(spec.description).appendTo(specRow);
    $("<td>").appendTo(specRow);
    specRow.attr("data-tt-id", currentRowId++);
    specRow.attr("data-tt-parent-id", suiteRow);

    rowsBySpecId[spec.id] = specRow;
    rowsBySpecDescription[spec.description] = specRow;
  };

  this.reportSpecResults = function(spec) {
    var row   = rowsBySpecId[spec.id];
    if (spec.results().passed()) {
      row.addClass("success");
    } else {
      row.addClass("failure");
      addFailureInformation(row, spec.results());
    }
  };

  this.reportSuiteResults = function(suite) {
    var row   = rowsBySuiteId[suite.id];
    var style = suite.results().passed() ? "success" : "failure";
    row.addClass(style);
  };

  this.reportRunnerResults = function(runner) {
    $("#test-results-table").treetable({ expandable: true });
    $("#test-results-table").treetable("expandAll");

    $(".failure-information").each(function() {
      var indenter = $(this).closest("td").find("span.indenter");
      $(this).css("margin-left", parseInt(indenter.css("padding-left"), 10) + 20);
    });
  };
};
(function() {
  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.updateInterval = 1000;

  var specReporter = new SpecReporter();
  jasmineEnv.addReporter(specReporter);

  window.addEventListener("load", function() {
    jasmineEnv.execute();
  });
}());
(function(context) {
  var Person = function(name, age, gender) {
    var accessed = false;

    function markAccessed() {
      Person.accesses += 1;
      if (!accessed) {
        accessed = true;
        Person.objectsTouched += 1;
      }
    }

    this.getName = function() {
      markAccessed();
      return name;
    };

    this.getAge = function() {
      markAccessed();
      return age;
    };

    this.getGender = function() {
      markAccessed();
      return gender;
    };

    this.reset = function() {
      accessed = false;
    };

    this.toDto = function() {
      return {
        name: name,
        age: age,
        gender: gender
      };
    };

    this.toString = function() {
      return name;
    };

    this.jasmineToString = function() {
      return this.toString();
    };
  };

  Person.getName = function(p) {
    return p.getName();
  };

  Person.getAge = function(p) {
    return p.getAge();
  };

  Person.getGender = function(p) {
    return p.getGender();
  };

  Person.isFemale = function(p) {
    return p.getGender() === "F";
  };

  Person.isMale = function(p) {
    return p.getGender() === "M";
  };

  Person.toDto = function(p) {
    return p.toDto();
  };

  Person.reset = function(people) {
    if (people) {
      for (var i = 0; i < people.length; ++i) {
        people[i].reset();
      }
    }

    Person.accesses = 0;
    Person.objectsTouched = 0;
  };

  Person.reset();

  context.Person = Person;

}(typeof global !== "undefined" ? global : window));
(function(context) {

  // If this is Node, then we're running jasmine-node, which will load this file
  // first (so we need to require Lazy right here right now).
  if (typeof require === 'function') {
    context.Lazy = require('../../lazy.node.js');

    // Also need to load this for a nicer jasmine async interface
    // (see https://github.com/derickbailey/jasmine.async).
    context.AsyncSpec = require('jasmine-async')(context.jasmine);

    // ...and also need this... at least until I refactor it on out of here.
    require('./person.js');
  }

  /**
   * Tests many requirements of a sequence in one fell swoop. (See
   * comprehensiveTestCase for more details.) Also verifies that aliases
   * delegate properly.
   *
   * @param {string} name The name of the method under test.
   * @param {Object} options A whole bunch of configuration options specifying
   *     what should be tested. Here are the important ones:
   *
   *     {
   *       cases: [
   *         {
   *           input:  (the object, e.g., an array, to serve as the underlying
   *                    source of the sequence),
   *           params: (the parameters to pass to the method, called on a
   *                    sequence based on the underlying source),
   *           result: (the expected result of applying this method to the
   *                    sequence, after calling .value())
   *         },
   *         ...
   *       ],
   *
   *       aliases: (an array of other names this method can be called by),
   *       arrayLike: (whether the result should provide indexed access),
   *       supportsAsync: (just what it sounds like)
   *     }
   */
  context.comprehensiveSequenceTest = function(name, options) {
    var cases = options.cases;
    Lazy(cases).each(function(testCase) {
      comprehensiveTestCase(name, testCase, options);
    });

    var aliases = options.aliases || [];
    Lazy(aliases).each(function(alias) {
      describe('#' + alias, function() {
        it('is an alias for #' + name, function() {
          var verifyDelegation = function(sequence) {
            spyOn(sequence, name).andCallThrough();
            iterate(sequence[alias].apply(sequence, cases[0].params));
            expect(sequence[name]).toHaveBeenCalled();
          };

          verifyDelegation(Lazy(cases[0].input));
          verifyDelegation(Lazy(cases[0].input).map(Lazy.identity));
          verifyDelegation(Lazy(cases[0].input).filter(alwaysTrue));
        });
      });
    });
  };

  /**
   * Verifies the following for a given sequence method, for a specified case
   * (input/output):
   *
   * - the actual sequence behavior (result matches expected output)
   * - consistent behavior among different base sequence types (e.g., wrapped
   *   array, array-like, and vanilla Sequence)
   * - true laziness (does not iterate until `each` is called)
   * - support for early termination
   * - support for async iteration
   */
  function comprehensiveTestCase(name, testCase, options) {
    var label = '#' + name;

    if (testCase.label) {
      label += ' (' + testCase.label + ')';
    }

    describe(label, function() {
      var monitor, sequence;

      beforeEach(function() {
        monitor  = createMonitor(testCase.input);
        sequence = Lazy(monitor);
      });

      function getResult() {
        return sequence[name].apply(sequence, testCase.params || []);
      }

      function iterateResult() {
        return iterate(getResult());
      }

      function assertResult() {
        expect(getResult()).toComprise(testCase.result);
      }

      var sequenceTypes = [
        {
          label: 'an ArrayWrapper',
          transform: function() { return sequence; }
        },
        {
          label: 'an ArrayLikeSequence',
          transform: function() { return sequence.map(Lazy.identity); }
        },
        {
          label: 'an ordinary sequence',
          transform: function() { return sequence.filter(alwaysTrue); },
          arrayLike: false
        }
      ];

      Lazy(sequenceTypes).each(function(sequenceType) {
        describe('for ' + sequenceType.label, function() {
          beforeEach(function() {
            sequence = sequenceType.transform();
          });

          it('works as expected', function() {
            assertResult();
          });

          it('is actually lazy', function() {
            getResult();
            expect(monitor.accessCount()).toBe(0);
          });

          it('supports early termination', function() {
            expect(getResult().take(2)).toComprise(testCase.result.slice(0, 2));
          });

          // For something like Lazy([...]).take(N), we only need to access N
          // elements; however, some sequence types may require > N accesses
          // to produce N results. An obvious example is #filter.
          if (!lookupValue('skipAccessCounts', [sequenceType, options])) {
            it('accesses the minimum number of elements from the source', function() {
              var expectedAccessCount = testCase.accessCountForTake2 || 2;

              iterate(getResult().take(2));
              expect(monitor.accessCount()).toEqual(expectedAccessCount);
            });
          }

          it('passes along the index with each element during iteration', function() {
            indexes = getResult().map(function(e, i) { return i; }).toArray();
            expect(indexes).toComprise(Lazy.range(indexes.length));
          });

          describe('each', function() {
            it('returns true if the entire sequence is iterated', function() {
              var result = iterateResult();
              expect(result).toBe(true);
            });

            it('returns false if iteration is terminated early', function() {
              var result = getResult().each(alwaysFalse);
              expect(result).toBe(false);
            });

            it('returns false if the last iteration returns false', function() {
              var length = getResult().value().length;
              var result = getResult().each(function(e, i) {
                if (i === length - 1) {
                  return false;
                }
              });
              expect(result).toBe(false);
            });
          });

          describe('indexed access', function() {
            it('is supported', function() {
              expect(getResult().get(1)).toEqual(testCase.result[1]);
            });

            if (lookupValue('arrayLike', [sequenceType, options])) {
              it('does not invoke full iteration', function() {
                getResult().get(1);
                expect(monitor.accessCount()).toEqual(1);
              });
            }
          });

          if (lookupValue('supportsAsync', [sequenceType, options])) {
            describe('async iteration', function() {
              var async = new AsyncSpec(this);

              function getAsyncResult() {
                return getResult().async();
              }

              // Currently this tests if blah().async() works.
              // TODO: First, think about whether async().blah() should work.
              // TODO: IF it should work, then make it work (better)!

              async.it('is supported', function(done) {
                getAsyncResult().toArray().onComplete(function(result) {
                  expect(result).toEqual(testCase.result);
                  done();
                });
              });

              async.it('supports early termination', function(done) {
                var expectedAccessCount = testCase.accessCountForTake2 || 2;

                getAsyncResult().take(2).toArray().onComplete(function(result) {
                  expect(result).toEqual(testCase.result.slice(0, 2));
                  done();
                });
              });
            });
          }
        });
      });
    });
  }

  /**
   * Takes an object (e.g. an array) and returns a copy of that object that
   * monitors its properties so that it can tell when one has been accessed.
   * This is useful for tests that want to ensure certain elements of an array
   * haven't been looked at.
   */
  function createMonitor(target) {
    var monitor  = Lazy.clone(target),
        accesses = {};

    function monitorProperty(property) {
      Object.defineProperty(monitor, property, {
        get: function() {
          accesses[property] = true;
          return target[property];
        }
      });
    }

    Lazy(target).each(function(value, property) {
      monitorProperty(property);
    });

    monitor.accessCount = function() {
      return Object.keys(accesses).length;
    };

    monitor.accessedAt = function(property) {
      return !!accesses[property];
    };

    return monitor;
  }

  /**
   * Forces iteration over a sequence.
   */
  function iterate(sequence) {
    return sequence.each(Lazy.noop);
  }

  /**
   * Given the name of a property, iterates over a list of objects until finding
   * one with the given property. Returns the first value found.
   *
   * This is to allow the options supplied to a call to
   * #comprehensiveSequenceTest to include properties at the top level, and also
   * to override those at the case level.
   */
  function lookupValue(property, objects) {
    for (var i = 0; i < objects.length; ++i) {
      if (property in objects[i]) {
        return objects[i][property];
      }
    }
  }

  // This is basically to allow verifying that certain methods don't create
  // intermediate arrays. Not sure if it's really sensible to test this; but
  // anyway, that's the purpose.
  context.arraysCreated = 0;

  var originalToArray = Lazy.Sequence.prototype.toArray;
  Lazy.Sequence.prototype.toArray = function() {
    var result = originalToArray.apply(this);
    arraysCreated += 1;
    return result;
  };

  beforeEach(function() {
    var people = [
      context.david  = new Person("David", 63, "M"),
      context.mary   = new Person("Mary", 62, "F"),
      context.lauren = new Person("Lauren", 32, "F"),
      context.adam   = new Person("Adam", 30, "M"),
      context.daniel = new Person("Daniel", 28, "M"),
      context.happy  = new Person("Happy", 25, "F")
    ];

    context.people = people.slice(0);

    var personsAccessed = [
      false,
      false,
      false,
      false,
      false,
      false
    ];

    context.personsAccessed = function() {
      return Lazy(personsAccessed).compact().value().length;
    };

    Lazy.range(context.people.length).forEach(function(index) {
      Object.defineProperty(context.people, index, {
        get: function() {
          personsAccessed[index] = true;
          return people[index];
        }
      });
    });

    Person.reset(people);

    arraysCreated = 0;
  });

  beforeEach(function() {
    this.addMatchers({
      toComprise: function(elements) {
        var actual = this.actual;

        if (actual instanceof Lazy.Sequence) {
          actual = actual.value();
        }

        if (elements instanceof Lazy.Sequence) {
          elements = elements.value();
        }

        expect(actual).toEqual(elements);

        return true;
      },

      toBeInstanceOf: function(type) {
        var actual = this.actual;

        this.message = function() {
          return 'Expected ' + actual + ' to be a ' + (type.name || type);
        };

        return actual instanceof type;
      },

      toPassToEach: function(argumentIndex, expectedValues) {
        var i = 0;
        this.actual.each(function() {
          expect(arguments[argumentIndex]).toEqual(expectedValues[i++]);
        });
        return true;
      }
    });
  });

  /**
   * Populates a collection.
   */
  context.populate = function(collection, contents) {
    if (collection instanceof Array) {
      for (var i = 0, len = contents.length; i < len; ++i) {
        collection.push(contents[i]);
      }
      return;
    }

    for (var key in contents) {
      collection[key] = contents[key];
    }
  };

  // --------------------------------------------------------------------------
  // I think most of the stuff below here is deprecated. It's more specialized
  // stuff duplicating what comprehensiveSequenceTest provides.
  // --------------------------------------------------------------------------

  context.ensureLaziness = function(action) {
    it("doesn't eagerly iterate the collection", function() {
      action();
      expect(Person.accesses).toBe(0);
    });
  };

  // Example usage:
  // createAsyncTest('blah', {
  //   getSequence: function() { return Lazy([1, 2, 3]); },
  //   expected: [1, 2, 3]
  // });
  context.createAsyncTest = function(description, options) {
    it(description, function() {
      performAsyncSteps(options);
    });
  };

  context.performAsyncSteps = function(options) {
    var results = [];

    // This can be a function, in case what we want to expect is not defined at the time
    // createAsyncTest is called.
    var expected = typeof options.expected === "function" ?
      options.expected() :
      options.expected;

    runs(function() {
      options.getSequence().each(function(e) { results.push(e); });

      // Should not yet be populated.
      expect(results.length).toBe(0);
    });

    waitsFor(function() {
      return results.length === expected.length;
    });

    runs(function() {
      expect(results).toEqual(expected);
    });

    if (options.additionalExpectations) {
      runs(options.additionalExpectations);
    }
  };

  context.testAllSequenceTypes = function(description, array, expectation) {
    it(description + " for a wrapped array", function() {
      var arrayWrapper = Lazy(array);
      expectation(arrayWrapper);
    });

    it(description + " for an indexed sequence", function() {
      var indexedSequence = Lazy(array).map(Lazy.identity);
      expectation(indexedSequence);
    });

    it(description + " for a non-indexed sequence", function() {
      var nonIndexedSequence = Lazy(array).filter(alwaysTrue);
      expectation(nonIndexedSequence);
    });
  };

  // ----- Helpers, to make specs more concise -----

  context.add         = function(x, y) { return x + y; };
  context.increment   = function(x) { return x + 1; };
  context.isEven      = function(x) { return x % 2 === 0; };
  context.alwaysTrue  = function(x) { return true; };
  context.alwaysFalse = function(x) { return false; };

  // ----- Specifically for spies -----

  context.toBeCalled = function(callback) {
    return function() { return callback.callCount > 0; };
  };

  context.toBePopulated = function(collection, length) {
    return function() {
      if (!collection) {
        return false;
      }

      var size = typeof collection.length === 'number' ?
        collection.length :
        Object.keys(collection).length;

      if (length) {
        return size === length;
      }

      return size > 0;
    };
  };

}(typeof global !== 'undefined' ? global : window));
describe("Lazy", function() {
  it("wraps an array which can be easily unwrapped", function() {
    var result = Lazy(people);
    expect(result.toArray()).toEqual(people);
  });

  it("has no effect if wrapping an already-lazy collection", function() {
    var doubleWrapped = Lazy(Lazy(people));
    expect(doubleWrapped.toArray()).toEqual(people);
  });

  describe("define", function() {
    it("requires custom sequences to implement at least getIterator or each", function() {
      expect(function() { Lazy.Sequence.define("blah", {}); }).toThrow();
    });

    it("assigns functionality to the Sequence prototype", function() {
      var HodorSequence = Lazy.Sequence.define("hodor", {
        each: function(fn) {
          return this.parent.each(function(e) {
            return fn("hodor");
          });
        }
      });

      expect(Lazy([1, 2, 3]).hodor().toArray()).toEqual(["hodor", "hodor", "hodor"]);
    });
  });

  describe("generate", function() {
    it("allows generation of arbitrary sequences", function() {
      var sequence = Lazy.generate(function(i) { return i; })
        .drop(1)
        .take(3)
        .toArray();

      expect(sequence).toEqual([1, 2, 3]);
    });

    it("can be iterated just like any other sequence", function() {
      var randomNumbers = Lazy.generate(function(i) { return Math.random(); });

      // Iterate over the numbers until there's a number > 0.5.
      randomNumbers.each(function(x) {
        if (x > 0.5) {
          return false;
        }
      });
    });

    it("provides 'random access'", function() {
      var naturalNumbers = Lazy.generate(function(i) { return i + 1; });
      expect(naturalNumbers.get(9)).toEqual(10);
    });

    it("has an undefined length", function() {
      var naturalNumbers = Lazy.generate(function(i) { return i + 1; });
      expect(naturalNumbers.length()).toBeUndefined();
    });

    it("does let you specify a length if you want", function() {
      var oneThroughFive = Lazy.generate(function(i) { return i + 1; }, 5).toArray();
      expect(oneThroughFive).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe("range", function() {
    it("returns a sequence from 0 to stop (exclusive), incremented by 1", function() {
      expect(Lazy.range(5).toArray()).toEqual([0, 1, 2, 3, 4]);
    });

    it("returns a sequence from start to stop, incremented by 1", function() {
      expect(Lazy.range(2, 7).toArray()).toEqual([2, 3, 4, 5, 6]);
    });

    it("returns a sequence from start to stop, incremented by step", function() {
      expect(Lazy.range(0, 30, 5).toArray()).toEqual([0, 5, 10, 15, 20, 25]);
    });

    it("returns an empty sequence when start is equal to or greater than stop", function() {
      expect(Lazy.range(0).toArray()).toEqual([]);
    });
  });

  describe("async", function() {
    createAsyncTest("creates a sequence that can be iterated over asynchronously", {
      getSequence: function() { return Lazy(people).async().map(Person.getName); },
      expected: ["David", "Mary", "Lauren", "Adam", "Daniel", "Happy"]
    });

    it("on an already-asynchronous sequence, returns the same sequence", function() {
      var asyncSequence = Lazy(people).async();
      expect(asyncSequence.async()).toBe(asyncSequence);
    });

    describe("when interval is undefined", function() {
      var context = typeof global !== "undefined" ? global : window;

      if (typeof setImmediate === "function") {
        it("uses setImmediate if available", function() {
          var personCount = 0;
          runs(function() {
            spyOn(context, "setImmediate").andCallThrough();
            Lazy(people).async().each(function() { ++personCount; });
          });
          waitsFor(function() {
            return personCount === people.length;
          });
          runs(function() {
            expect(context.setImmediate).toHaveBeenCalled();
            expect(context.setImmediate.callCount).toBeGreaterThan(people.length);
          });
        });

      } else {
        it("otherwise, uses setTimeout", function() {
          var personCount = 0;
          runs(function() {
            spyOn(context, "setTimeout").andCallThrough();
            Lazy(people).async().each(function() { ++personCount; });
          });
          waitsFor(function() {
            return personCount === people.length;
          });
          runs(function() {
            expect(context.setTimeout).toHaveBeenCalled();
            expect(context.setTimeout.callCount).toBeGreaterThan(people.length);
          });
        });
      }
    });

    describe("the object returned by each()", function() {
      it("provides a cancel() method, which will stop iteration", function() {
        var evens = Lazy([1, 3, 5]).map(increment).async(50),
            result = [],
            handle;

        runs(function() {
          handle = evens.each(function(even) {
            result.push(even);
          });
        });

        waitsFor(function() {
          return result.length > 0;
        });

        runs(function() {
          handle.cancel();
        });

        waits(150);

        runs(function() {
          expect(result).toEqual([2])
        });
      });

      it("provides an error callback via onError", function() {
        var rebelSequence = Lazy([1, 2, 3]).async(50),
            errorCallback = jasmine.createSpy(),
            handle;

        runs(function() {
          handle = rebelSequence.each(function(x) {
            throw "Oh no, I'm throwing an exception!";
          });

          handle.onError(errorCallback);
        })

        waitsFor(toBeCalled(errorCallback));

        runs(function() {
          expect(errorCallback).toHaveBeenCalled();
        });
      });
    });
  });

  describe("toObject", function() {
    it("converts an array of pairs into an object", function() {
      var pairs = Lazy(people).map(function(p) { return [p.getName(), p]; });

      expect(pairs.toObject()).toEqual({
        "David": david,
        "Mary": mary,
        "Lauren": lauren,
        "Adam": adam,
        "Daniel": daniel,
        "Happy": happy
      });
    });
  });

  describe("toArray", function() {
    it("for an object, creates an array of key/value pairs", function() {
      var pairs = Lazy({ foo: "FOO", bar: "BAR" }).toArray();
      expect(pairs).toEqual([["foo", "FOO"], ["bar", "BAR"]]);
    })
  });

  describe("keys", function() {
    it("iterates over the keys (property names) of an object", function() {
      var keys = Lazy({ foo: "FOO", bar: "BAR" }).keys().toArray();
      expect(keys).toEqual(["foo", "bar"]);
    });
  });

  describe("values", function() {
    it("iterates over the values of an object", function() {
      var keys = Lazy({ foo: "FOO", bar: "BAR" }).values().toArray();
      expect(keys).toEqual(["FOO", "BAR"]);
    });
  });

  describe("each", function() {
    it("passes an index along with each element", function() {
      expect(Lazy(people)).toPassToEach(1, [0, 1, 2, 3, 4, 5]);
    });
  });

  describe("where", function() {
    var peopleDtos;

    beforeEach(function() {
      peopleDtos = Lazy(people).map(Person.toDto).toArray();
      Person.reset(people);
    });

    it("returns all of the elements with the specified key-value pairs", function() {
      var namedDavid = Lazy(peopleDtos).where({ name: "David" }).toArray();
      expect(namedDavid).toEqual([{ name: "David", age: 63, gender: "M" }]);
    });
  });

  describe("assign", function() {
    it("creates a sequence from updating the object with new values", function() {
      var people = { parent: david, child: daniel };
      var result = Lazy(people).assign({ parent: mary });
      expect(result.toObject()).toEqual({ parent: mary, child: daniel });
    });
  });

  describe("functions", function() {
    it("creates a sequence comprising the function properties of an object", function() {
      var walk   = function() {};
      var gobble = function() {};
      var turkey = { size: 100, weight: 100, walk: walk, gobble: gobble };
      var result = Lazy(turkey).functions();
      expect(result.toArray()).toEqual(["walk", "gobble"]);
    });
  });

  describe("invert", function() {
    it("swaps the keys/values of an object", function() {
      var object = { foo: "bar", marco: "polo" };
      var result = Lazy(object).invert();
      expect(result.toObject()).toEqual({ bar: "foo", polo: "marco" });
    });
  });

  describe("pick", function() {
    it("picks only the listed properties from the object", function() {
      var object = { foo: "bar", marco: "polo" };
      var result = Lazy(object).pick(["marco"]);
      expect(result.toObject()).toEqual({ marco: "polo" });
    });
  });

  describe("omit", function() {
    it("does the opposite of pick", function() {
      var object = { foo: "bar", marco: "polo" };
      var result = Lazy(object).omit(["marco"]);
      expect(result.toObject()).toEqual({ foo: "bar" });
    });
  });

  describe("all", function() {
    it("returns true if the condition holds true for every element", function() {
      var allPeople = Lazy(people).all(function(x) {
        return x instanceof Person;
      });

      expect(allPeople).toBe(true);
    });

    it("returns false if the condition does not hold true for every element", function() {
      var allMales = Lazy(people).all(Person.isMale);
      expect(allMales).toBe(false);
    });
  });

  describe("any", function() {
    it("returns true if the condition holds true for any element", function() {
      var anyMales = Lazy(people).any(Person.isMale);
      expect(anyMales).toBe(true);
    });

    it("returns false if the condition does not hold true for any element", function() {
      var anyUnknownGender = Lazy(people).any(function(x) {
        return x.getGender() === "?";
      });

      expect(anyUnknownGender).toBe(false);
    });
  });

  describe("first", function() {
    it("returns the first element in the collection", function() {
      var firstGirl = Lazy(people).filter(Person.isFemale).first();
      expect(firstGirl).toEqual(mary);
    });

    it("returns the first N elements in the collection", function() {
      var firstTwo = Lazy(people).first(2).toArray();
      expect(firstTwo).toEqual([david, mary]);
    });
  });

  describe("last", function() {
    it("returns the last element in the collection", function() {
      var lastBoy = Lazy(people).filter(Person.isMale).last();
      expect(lastBoy).toEqual(daniel);
    });

    it("returns the last N elements in the collection", function() {
      var lastTwo = Lazy(people).last(2).toArray();
      expect(lastTwo).toEqual([daniel, happy]);
    });

    it("iterates from the tail if possible", function() {
      Lazy(people).map(Person.getGender).last();
      expect(Person.objectsTouched).toEqual(1);
    });
  });

  describe("reduce", function() {
    it("aggregates the values in the collection according to some function", function() {
      var sumOfAges = Lazy(people).map(Person.getAge).reduce(function(sum, age) {
        return sum + age;
      }, 0);
      expect(sumOfAges).toEqual(240);
    });

    it("traverses the collection from left to right", function() {
      var firstInitials = Lazy(people).reduce(function(array, person) {
        array.push(person.getName().charAt(0));
        return array;
      }, []);
      expect(firstInitials).toEqual(["D", "M", "L", "A", "D", "H"]);
    });

    it("if no memo is given, starts with the head and reduces over the tail", function() {
      var familyAcronym = Lazy(people)
        .map(Person.getName)
        .map(function(name) { return name.charAt(0).toUpperCase(); })
        .reduce(function(acronym, initial) {
          acronym += initial;
          return acronym;
        });
      expect(familyAcronym).toEqual("DMLADH");
    });

    it("passes the index of each element into the accumulator function", function() {
      var sumOfIndices = Lazy(people).reduce(function(sum, p, i) {
        return sum + i;
      }, 0);
      expect(sumOfIndices).toEqual(0 + 1 + 2 + 3 + 4 + 5);
    });
  });

  describe("reduceRight", function() {
    it("traverses the collection from right to left", function() {
      var firstInitials = Lazy(people).reduceRight(function(array, person) {
        array.push(person.getName().charAt(0));
        return array;
      }, []);
      expect(firstInitials).toEqual(["H", "D", "A", "L", "M", "D"]);
    });

    it("passes indices in reverse order", function() {
      var sumOfIndices = Lazy(people).reduceRight(function(str, p, i) {
        return str + i;
      }, "");
      expect(sumOfIndices).toEqual("543210");
    });
  });

  describe("indexOf", function() {
    it("returns the index of the specified element in the collection", function() {
      expect(Lazy(people).indexOf(adam)).toEqual(3);
    });
  });

  describe("lastIndexOf", function() {
    it("returns the last index of the specified element in the collection", function() {
      var numbers = [0, 1, 2, 3, 2, 1, 0];
      expect(Lazy(numbers).lastIndexOf(1)).toEqual(5);
    });

    it("traverses the collection from the tail end", function() {
      var names = Lazy(people).map(Person.getName);
      expect(Lazy(names).lastIndexOf("Daniel")).toEqual(4);

      // should only have touched Happy and Daniel
      expect(Person.objectsTouched).toEqual(2);
    });
  });

  describe("contains", function() {
    it("returns true if the collection contains the specified element", function() {
      expect(Lazy(people).contains(adam)).toBe(true);
    });

    it("returns false if the collection does not contain the specified element", function() {
      expect(Lazy(people).contains(new Person("Joe", 25, "M"))).toBe(false);
    });
  });

  describe("chaining methods together", function() {
    ensureLaziness(function() {
      Lazy(people)
        .filter(Person.isFemale)
        .map(Person.getName)
        .reverse()
        .drop(1)
        .take(2)
        .uniq();
    });

    it("applies the effects of all chained methods", function() {
      var girlNames = Lazy(people)
        .filter(Person.isFemale)
        .map(Person.getName)
        .reverse()
        .drop(1)
        .take(2)
        .uniq()
        .toArray();

      expect(girlNames).toEqual(["Lauren", "Mary"]);
    });

    describe("filter -> take", function() {
      it("only ever touches as many objects as necessary", function() {
        var firstMale = Lazy(people)
          .filter(Person.isMale)
          .map(Person.getGender)
          .take(1)
          .toArray();

        expect(firstMale).toEqual(["M"]);
        expect(Person.objectsTouched).toEqual(1);
      });
    });

    describe("take -> map", function() {
      it("maps the items taken (just making sure)", function() {
        var firstTwoGenders = Lazy(people)
          .take(2)
          .map(Person.getGender)
          .toArray();

        expect(firstTwoGenders).toEqual(["M", "F"]);
      });
    });

    describe("map -> map -> map", function() {
      function getAgeGroup(age) {
        return age < 50 ? "young" : "old";
      }

      function getFirstLetter(str) {
        return str.charAt(0);
      }

      it("only creates one array from the combination of maps", function() {
        var ages = Lazy(people)
          .map(Person.getAge)
          .map(getAgeGroup)
          .map(getFirstLetter);

        ages.toArray();

        expect(arraysCreated).toEqual(1);
      });
    });
  });

  // ----- Tests for experimental functionality -----

  xdescribe("parsing JSON", function() {
    it("translates a JSON array of strings", function() {
      var json = JSON.stringify(["foo", "bar", "baz"]);
      expect(Lazy.parse(json).toArray()).toEqual(["foo", "bar", "baz"]);
    });

    it("translates a JSON array of integers", function() {
      var json = JSON.stringify([1, 22, 333]);
      expect(Lazy.parse(json).toArray()).toEqual([1, 22, 333]);
    });

    it("translates a JSON array of floats", function() {
      var json = JSON.stringify([1.2, 34.56]);
      expect(Lazy.parse(json).toArray()).toEqual([1.2, 34.56]);
    });
  });
});
describe("compared to Underscore, Lo-Dash, etc.", function() {
  function inc(x) { return x + 1; }
  function dec(x) { return x - 1; }
  function square(x) { return x * x; }
  function isEven(x) { return x % 2 === 0; }
  function identity(x) { return x; }

  function arr(from, to) {
    return Lazy.range(from, to).toArray();
  }

  function dupes(min, max, count) {
    var numbers = Lazy.generate(function() {
      return Math.floor((Math.random() * (max - min)) + min);
    });
    return numbers.take(count).toArray();
  }

  function wuTake(arr, count) {
    var i = -1;
    if (arr instanceof Array) {
      arr = wu(arr);
    }
    return arr.takeWhile(function() { return ++i < count; });
  }

  function wuDrop(arr, count) {
    var i = -1;
    if (arr instanceof Array) {
      arr = wu(arr);
    }
    return arr.dropWhile(function() { return ++i < count; });
  }

  var jaggedArray = [
    [1, 2, 3],
    [
      [4, 5, 6],
      [7, 8, 9],
      [
        [10, 11],
        12
      ],
      13,
      14,
      [15, 16],
      17
    ],
    [
      18,
      19,
      20,
      [21, 22]
    ],
    [23, 24, 25],
    26,
    27,
    28,
    [29, 30],
    [
      [31, 32, 33],
      [34, 35]
    ],
    36
  ];

  // ---------- Common operations ---------- //

  compareAlternatives("map", {
    lazy: function(arr) { return Lazy(arr).map(square); },
    underscore: function(arr) { return _(arr).map(square); },
    lodash: function(arr) { return lodash.map(arr, square); },
    wu: function(arr) { return wu(arr).map(square); },
    sugar: function(arr) { return arr.map(square); },
    from: function(arr) { return from(arr).select(square); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).select(square); },
    boiler: function(arr) { return boiler.map(arr, square); },
    sloth: function(arr) { return sloth.ify(arr).map(square); }
  });

  compareAlternatives("filter", {
    lazy: function(arr) { return Lazy(arr).filter(isEven); },
    underscore: function(arr) { return _(arr).filter(isEven); },
    lodash: function(arr) { return lodash.filter(arr, isEven); },
    wu: function(arr) { return wu(arr).filter(isEven); },
    sugar: function(arr) { return arr.filter(isEven); },
    from: function(arr) { return from(arr).where(isEven); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).where(isEven); },
    boiler: function(arr) { return boiler.filter(arr, isEven); },
    sloth: function(arr) { return sloth.ify(arr).filter(isEven); }
  });

  compareAlternatives("flatten", {
    lazy: function(arr) { return Lazy(arr).flatten(); },
    underscore: function(arr) { return _(arr).flatten(); },
    lodash: function(arr) { return lodash.flattenDeep(arr); },
    sugar: function(arr) { return arr.flatten(); },
    boiler: function(arr) { return boiler.flatten(arr); },
    inputs: [[jaggedArray]]
  });

  compareAlternatives("uniq (mostly duplicates)", {
    lazy: function(arr) { return Lazy(arr).uniq(); },
    underscore: function(arr) { return _(arr).uniq(); },
    lodash: function(arr) { return lodash.uniq(arr); },
    sugar: function(arr) { return arr.unique(); },
    from: function(arr) { return from(arr).distinct(); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).distinct(); },
    boiler: function(arr) { return boiler.uniq(arr); },
    inputs: [[dupes(0, 2, 10)], [dupes(0, 10, 100)]]
  });

  compareAlternatives("uniq (about half dupes)", {
    lazy: function(arr) { return Lazy(arr).uniq(); },
    underscore: function(arr) { return _(arr).uniq(); },
    lodash: function(arr) { return lodash.uniq(arr); },
    sugar: function(arr) { return arr.unique(); },
    from: function(arr) { return from(arr).distinct(); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).distinct(); },
    boiler: function(arr) { return boiler.uniq(arr); },
    inputs: [[dupes(0, 5, 10)], [dupes(0, 50, 100)]]
  });

  compareAlternatives("uniq (mostly uniques)", {
    lazy: function(arr) { return Lazy(arr).uniq(); },
    underscore: function(arr) { return _(arr).uniq(); },
    lodash: function(arr) { return lodash.uniq(arr); },
    sugar: function(arr) { return arr.unique(); },
    from: function(arr) { return from(arr).distinct(); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).distinct(); },
    boiler: function(arr) { return boiler.uniq(arr); },
    inputs: [[dupes(0, 10, 10)], [dupes(0, 100, 100)]]
  });

  compareAlternatives("union", {
    lazy: function(arr, other) { return Lazy(arr).union(other); },
    underscore: function(arr, other) { return _.union(arr, other); },
    lodash: function(arr, other) { return lodash.union(arr, other); },
    sugar: function(arr, other) { return arr.union(other); },
    from: function(arr, other) { return from(arr).union(other); },
    ix: function(arr, other) { return Ix.Enumerable.fromArray(arr).union(Ix.Enumerable.fromArray(other)); },
    boiler: function(arr, other) { return boiler.union(arr, other); },
    sloth: function(arr, other) { return sloth.ify(arr).union(other); },
    inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
  });

  compareAlternatives("intersection", {
    lazy: function(arr, other) { return Lazy(arr).intersection(other); },
    underscore: function(arr, other) { return _.intersection(arr, other); },
    lodash: function(arr, other) { return lodash.intersection(arr, other); },
    sugar: function(arr, other) { return arr.intersect(other); },
    from: function(arr, other) { return from(arr).intersect(other); },
    ix: function(arr, other) { return Ix.Enumerable.fromArray(arr).intersect(Ix.Enumerable.fromArray(other)); },
    boiler: function(arr, other) { return boiler.intersection(arr, other); },
    sloth: function(arr, other) { return sloth.ify(arr).intersect(other); },
    inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
  });

  compareAlternatives("shuffle", {
    lazy: function(arr) { return Lazy(arr).shuffle(); },
    underscore: function(arr) { return _(arr).shuffle(); },
    lodash: function(arr) { return lodash.shuffle(arr); },
    sugar: function(arr) { return arr.randomize(); },
    boiler: function(arr) { return boiler.shuffle(arr); },
    shouldMatch: false
  });

  compareAlternatives("zip", {
    lazy: function(arr, other) { return Lazy(arr).zip(other); },
    underscore: function(arr, other) { return _(arr).zip(other); },
    lodash: function(arr, other) { return lodash.zip(arr, other); },
    sugar: function(arr, other) { return arr.zip(other); },
    boiler: function(arr, other) { return boiler.zip(arr, other); },
    inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
  });

  // ---------- Chained operations ----------//

  compareAlternatives("map -> filter", {
    lazy: function(arr) { return Lazy(arr).map(inc).filter(isEven); },
    underscore: function(arr) { return _.chain(arr).map(inc).filter(isEven); },
    lodash: function(arr) { return lodash(arr).map(inc).filter(isEven); },
    wu: function(arr) { return wu(arr).map(inc).filter(isEven); },
    sugar: function(arr) { return arr.map(inc).filter(isEven); },
    from: function(arr) { return from(arr).select(inc).where(isEven); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).select(inc).where(isEven); },
    boiler: function(arr) { return boiler.chain(arr).map(inc).filter(isEven).end(); },
    sloth: function(arr) { return sloth.ify(arr).map(inc).filter(isEven); },
    category: "chained",
  });

  compareAlternatives("flatten -> map", {
    lazy: function(arr) { return Lazy(arr).flatten().map(inc); },
    underscore: function(arr) { return _.chain(arr).flatten().map(inc); },
    lodash: function(arr) { return lodash(arr).flattenDeep().map(inc); },
    sugar: function(arr) { return arr.flatten().map(inc); },
    boiler: function(arr) { return boiler.chain(arr).flatten().map(inc).end(); },
    category: "chained",
    inputs: [[jaggedArray]]
  });

  compareAlternatives("map -> uniq", {
    lazy: function(arr) { return Lazy(arr).map(inc).uniq(); },
    underscore: function(arr) { return _.chain(arr).map(inc).uniq(); },
    lodash: function(arr) { return lodash(arr).map(inc).uniq(); },
    sugar: function(arr) { return arr.map(inc).unique(); },
    from: function(arr) { return from(arr).select(inc).distinct(); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).select(inc).distinct(); },
    boiler: function(arr) { return boiler.chain(arr).map(inc).uniq().end(); },
    category: "chained",
    inputs: [[dupes(0, 5, 10)], [dupes(0, 50, 100)]]
  });

  compareAlternatives("map -> union", {
    lazy: function(arr, other) { return Lazy(arr).map(inc).union(other); },
    underscore: function(arr, other) { return _.chain(arr).map(inc).union(other); },
    lodash: function(arr, other) { return lodash(arr).map(inc).union(other); },
    sugar: function(arr, other) { return arr.map(inc).union(other); },
    from: function(arr, other) { return from(arr).select(inc).union(other); },
    ix: function(arr, other) { return Ix.Enumerable.fromArray(arr).select(inc).union(Ix.Enumerable.fromArray(other)); },
    boiler: function(arr, other) { return boiler.chain(arr).map(inc).union(other).end(); },
    sloth: function(arr, other) { return sloth.ify(arr).map(inc).union(other); },
    category: "chained",
    inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
  });

  compareAlternatives("map -> intersection", {
    lazy: function(arr, other) { return Lazy(arr).map(inc).intersection(other); },
    underscore: function(arr, other) { return _.chain(arr).map(inc).intersection(other); },
    lodash: function(arr, other) { return lodash(arr).map(inc).intersection(other); },
    sugar: function(arr, other) { return arr.map(inc).intersect(other); },
    from: function(arr, other) { return from(arr).select(inc).intersect(other); },
    ix: function(arr, other) { return Ix.Enumerable.fromArray(arr).select(inc).intersect(Ix.Enumerable.fromArray(other)); },
    boiler: function(arr, other) { return boiler.chain(arr).map(inc).intersection(other); },
    sloth: function(arr, other) { return sloth.ify(arr).map(inc).intersect(other); },
    category: "chained",
    inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
  });

  compareAlternatives("map -> shuffle", {
    lazy: function(arr) { return Lazy(arr).map(inc).shuffle(); },
    underscore: function(arr) { return _.chain(arr).map(inc).shuffle(); },
    lodash: function(arr) { return lodash(arr).map(inc).shuffle(); },
    sugar: function(arr) { return arr.map(inc).randomize(); },
    boiler: function(arr) { return boiler.chain(arr).map(inc).shuffle(); },
    category: "chained",
    shouldMatch: false
  });

  compareAlternatives("map -> zip", {
    lazy: function(arr, other) { return Lazy(arr).map(inc).zip(other); },
    underscore: function(arr, other) { return _.chain(arr).map(inc).zip(other); },
    lodash: function(arr, other) { return lodash(arr).map(inc).zip(other); },
    sugar: function(arr, other) { return arr.map(inc).zip(other); },
    boiler: function(arr, other) { return boiler.chain(arr).map(inc).zip(other); },
    category: "chained",
    inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
  });

  // ---------- Short-circuited operations ---------- //

  compareAlternatives("map -> indexOf", {
    lazy: function(arr, value) { return Lazy(arr).map(inc).indexOf(value); },
    underscore: function(arr, value) { return _.chain(arr).map(inc).indexOf(value); },
    lodash: function(arr, value) { return lodash(arr).map(inc).indexOf(value); },
    sugar: function(arr, value) { return arr.map(inc).indexOf(value); },
    boiler: function(arr, value) { return boiler.chain(arr).map(inc).indexOf(value); },
    category: "shorted",
    inputs: [[arr(0, 10), 4], [arr(0, 100), 35]],
    valueOnly: true
  });

  compareAlternatives("map -> sortedIndex", {
    lazy: function(arr) { return Lazy(arr).map(inc).sortedIndex(arr[arr.length / 2]); },
    underscore: function(arr) { return _.chain(arr).map(inc).sortedIndex(arr[arr.length / 2]); },
    lodash: function(arr) { return lodash(arr).map(inc).sortedIndex(arr[arr.length / 2]); },
    category: "shorted",
    inputs: [[arr(0, 10), 4], [arr(0, 100), 35]],
    valueOnly: true
  });

  compareAlternatives("map -> take", {
    lazy: function(arr) { return Lazy(arr).map(inc).take(5); },
    underscore: function(arr) { return _.chain(arr).map(inc).take(5); },
    lodash: function(arr) { return lodash(arr).map(inc).take(5); },
    sugar: function(arr) { return arr.map(inc).first(5); },
    from: function(arr) { return from(arr).select(inc).take(5); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).select(inc).take(5); },
    boiler: function(arr) { return boiler.chain(arr).map(inc).first(5).end(); },
    sloth: function(arr) { return sloth.ify(arr).map(inc).take(5); },
    category: "shorted"
  });

  compareAlternatives("filter -> take", {
    lazy: function(arr) { return Lazy(arr).filter(isEven).take(5); },
    underscore: function(arr) { return _.chain(arr).filter(isEven).first(5); },
    lodash: function(arr) { return lodash(arr).filter(isEven).take(5); },
    sugar: function(arr) { return arr.filter(isEven).first(5); },
    from: function(arr) { return from(arr).where(isEven).take(5); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).where(isEven).take(5); },
    boiler: function(arr) { return boiler.chain(arr).filter(isEven).first(5).end(); },
    sloth: function(arr) { return sloth.ify(arr).filter(isEven).take(5); },
    category: "shorted",
  });

  compareAlternatives("map -> filter -> take", {
    lazy: function(arr) { return Lazy(arr).map(inc).filter(isEven).take(5); },
    underscore: function(arr) { return _.chain(arr).map(inc).filter(isEven).take(5); },
    lodash: function(arr) { return lodash(arr).map(inc).filter(isEven).take(5); },
    wu: function(arr) { return wuTake(wu(arr).map(inc).filter(isEven), 5); },
    sugar: function(arr) { return arr.map(inc).filter(isEven).first(5); },
    from: function(arr) { return from(arr).select(inc).where(isEven).take(5); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).select(inc).where(isEven).take(5); },
    boiler: function(arr) { return boiler.chain(arr).map(inc).filter(isEven).first(5).end(); },
    sloth: function(arr) { return sloth.ify(arr).map(inc).filter(isEven).take(5); },
    category: "shorted",
  });

  compareAlternatives("map -> drop -> take", {
    lazy: function(arr) { return Lazy(arr).map(inc).drop(5).take(5); },
    underscore: function(arr) { return _.chain(arr).map(inc).rest(5).take(5); },
    lodash: function(arr) { return lodash(arr).map(inc).drop(5).take(5); },
    wu: function(arr) { return wuTake(wuDrop(wu(arr).map(inc), 5), 5); },
    sugar: function(arr) { return arr.map(inc).last(arr.length - 5).first(5); },
    from: function(arr) { return from(arr).select(inc).skip(5).take(5); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).select(inc).skip(5).take(5); },
    boiler: function(arr) { return boiler.chain(arr).map(inc).rest(5).first(5).end(); },
    sloth: function(arr) { return sloth.ify(arr).map(inc).drop(5).take(5); },
    category: "shorted",
  });

  compareAlternatives("filter -> drop -> take", {
    lazy: function(arr) { return Lazy(arr).filter(isEven).drop(5).take(5); },
    underscore: function(arr) { return _.chain(arr).filter(isEven).rest(5).first(5); },
    lodash: function(arr) { return lodash(arr).filter(isEven).drop(5).take(5); },
    from: function(arr) { return from(arr).where(isEven).skip(5).take(5); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).where(isEven).skip(5).take(5); },
    boiler: function(arr) { return boiler.chain(arr).filter(isEven).rest(5).first(5).end(); },
    sloth: function(arr) { return sloth.ify(arr).filter(isEven).drop(5).take(5); },
    category: "shorted",
  });

  compareAlternatives("flatten -> take", {
    lazy: function(arr) { return Lazy(arr).flatten().take(5); },
    underscore: function(arr) { return _.chain(arr).flatten().first(5); },
    lodash: function(arr) { return lodash(arr).flattenDeep().take(5); },
    sugar: function(arr) { return arr.flatten().first(5); },
    boiler: function(arr) { return boiler.chain(arr).flatten().first(5).end(); },
    category: "shorted",
    inputs: [[jaggedArray]]
  });

  compareAlternatives("uniq -> take", {
    lazy: function(arr) { return Lazy(arr).uniq().take(5); },
    underscore: function(arr) { return _.chain(arr).uniq().first(5); },
    lodash: function(arr) { return lodash(arr).uniq().take(5); },
    sugar: function(arr) { return arr.unique().first(5); },
    from: function(arr) { return from(arr).distinct().take(5); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).distinct().take(5); },
    boiler: function(arr) { return boiler.chain(arr).uniq().first(5).end(); },
    category: "shorted",
    inputs: [[dupes(0, 5, 10)], [dupes(0, 10, 100)]]
  });

  compareAlternatives("union -> take", {
    lazy: function(arr, other) { return Lazy(arr).union(other).take(5); },
    underscore: function(arr, other) { return _.chain(arr).union(other).first(5); },
    lodash: function(arr, other) { return lodash(arr).union(other).take(5); },
    sugar: function(arr, other) { return arr.union(other).first(5); },
    from: function(arr, other) { return from(arr).union(other).take(5); },
    ix: function(arr, other) { return Ix.Enumerable.fromArray(arr).union(other).take(5); },
    boiler: function(arr, other) { return boiler.chain(arr).union(other).first(5).end(); },
    sloth: function(arr, other) { return sloth.ify(arr).union(other).take(5); },
    category: "shorted",
    inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
  });

  compareAlternatives("intersection -> take", {
    lazy: function(arr, other) { return Lazy(arr).intersection(other).take(5); },
    underscore: function(arr, other) { return _.chain(arr).intersection(other).first(5); },
    lodash: function(arr, other) { return lodash(arr).intersection(other).take(5); },
    sugar: function(arr, other) { return arr.intersect(other).first(5); },
    from: function(arr, other) { return from(arr).intersect(other).take(5); },
    ix: function(arr, other) { return Ix.Enumerable.fromArray(arr).intersect(Ix.Enumerable.fromArray(other)).take(5); },
    boiler: function(arr, other) { return boiler.chain(arr).intersection(other).first(5).end(); },
    sloth: function(arr, other) { return sloth.ify(arr).intersect(other).take(5); },
    category: "shorted",
    inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
  });

  compareAlternatives("without -> take", {
    lazy: function(arr, other) { return Lazy(arr).without(other).take(5); },
    underscore: function(arr, other) { return _.chain(arr).difference(other).first(5); },
    lodash: function(arr, other) { return lodash(arr).difference(other).take(5); },
    sugar: function(arr, other) { return arr.subtract(other).first(5); },
    category: "shorted",
    inputs: [[arr(0, 10), arr(3, 7)], [arr(0, 100), arr(25, 75)]]
  });

  compareAlternatives("shuffle -> take", {
    lazy: function(arr) { return Lazy(arr).shuffle().take(5); },
    underscore: function(arr) { return _.chain(arr).shuffle().first(5); },
    lodash: function(arr) { return lodash(arr).shuffle().take(5); },
    sugar: function(arr) { return arr.randomize().first(5); },
    boiler: function(arr) { return boiler.chain(arr).shuffle().first(5).end(); },
    category: "shorted",
    shouldMatch: false
  });

  compareAlternatives("zip -> take", {
    lazy: function(arr, other) { return Lazy(arr).zip(other).take(5); },
    underscore: function(arr, other) { return _.chain(arr).zip(other).first(5); },
    lodash: function(arr, other) { return lodash(arr).zip(other).take(5); },
    sugar: function(arr, other) { return arr.zip(other).first(5); },
    boiler: function(arr, other) { return boiler.chain(arr).zip(other).first(5).end(); },
    category: "shorted",
    inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
  });

  compareAlternatives("map -> any", {
    lazy: function(arr) { return Lazy(arr).map(inc).any(isEven); },
    underscore: function(arr) { return _.chain(arr).map(inc).any(isEven); },
    lodash: function(arr) { return lodash(arr).map(inc).some(isEven); },
    sugar: function(arr) { return arr.map(inc).any(isEven); },
    from: function(arr) { return from(arr).select(inc).any(isEven); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).select(inc).any(isEven); },
    boiler: function(arr) { return boiler.chain(arr).map(inc).any(isEven); },
    sloth: function(arr, other) { return sloth.ify(arr).map(inc).any(isEven); },
    category: "shorted",
    valueOnly: true
  });

  compareAlternatives("map -> all", {
    lazy: function(arr) { return Lazy(arr).map(inc).all(isEven); },
    underscore: function(arr) { return _.chain(arr).map(inc).every(isEven); },
    lodash: function(arr) { return lodash(arr).map(inc).every(isEven); },
    sugar: function(arr) { return arr.map(inc).all(isEven); },
    from: function(arr) { return from(arr).select(inc).all(isEven); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).select(inc).all(isEven); },
    boiler: function(arr) { return boiler.chain(arr).map(inc).all(isEven); },
    sloth: function(arr, other) { return sloth.ify(arr).map(inc).all(isEven); },
    category: "shorted",
    valueOnly: true
  });

  // These aren't really comparisons to Underscore or Lo-Dash; rather, they're
  // comparisons to the native Array.join, String.split, and String.match
  // methods. But designating them as such at the UI level will require some
  // refactoring. For now, I think it's fine to put them here.

  compareAlternatives("map -> join", {
    lazy: function(arr) { return Lazy(arr).map(inc).join(", "); },
    underscore: function(arr) { return _(arr).map(inc).join(", "); },
    category: "other",
    valueOnly: true
  });

  compareAlternatives("split(string) -> take", {
    lazy: function(str, delimiter) { return Lazy(str).split(delimiter).take(5); },
    underscore: function(str, delimiter) { return _(str.split(delimiter)).take(5); },
    category: "other",
    inputs: [[Lazy.range(100).join(", "), ", "]]
  });

  compareAlternatives("split(regex) -> take", {
    lazy: function(str, delimiter) { return Lazy(str).split(delimiter).take(5); },
    underscore: function(str, delimiter) { return _(str.split(delimiter)).take(5); },
    category: "other",
    inputs: [[Lazy.range(100).join(", "), /,\s*/]]
  });

  compareAlternatives("match(regex) -> take", {
    lazy: function(str, pattern) { return Lazy(str).match(pattern).take(5); },
    underscore: function(str, pattern) { return _(str.match(pattern)).take(5); },
    category: "other",
    inputs: [[Lazy.range(100).join(" "), /\d+/g]]
  });
});








