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
    var style = spec.results().passed() ? "success" : "failure";
    row.addClass(style);
  };

  this.reportSuiteResults = function(suite) {
    var row   = rowsBySuiteId[suite.id];
    var style = suite.results().passed() ? "success" : "failure";
    row.addClass(style);
  };

  this.reportRunnerResults = function(runner) {
    $("#test-results-table").treetable({ expandable: true });
    $("#test-results-table").treetable("expandAll");
  };
};
