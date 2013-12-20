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
