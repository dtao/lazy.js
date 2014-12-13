window.addEventListener('load', function() {
  function runSpecs() {
    var failureNotices = $('#spec-failures');

    var jasmineEnv = jasmine.getEnv();

    jasmineEnv.addReporter({
      reportSpecResults: function(spec) {
        var editorId       = 'examples-' + spec.suiteId,
            matchingEditor = document.getElementById(editorId);

        var style = spec.results().passed() ? 'passed' : 'failed';
        $('.line[data-line-no="' + spec.lineNumber + '"]', matchingEditor).addClass(style);

        var lastElement = $(matchingEditor);
        _(spec.results().getItems())
          .filter(function(item) { return item.passed && !item.passed(); })
          .pluck('message')
          .each(function(errorMessage) {
            lastElement = $('<pre>')
              .text(errorMessage)
              .attr('id', 'example-' + spec.exampleId)
              .insertBefore(lastElement);

            var notice = $('<p>')
              .text(errorMessage)
              .appendTo(failureNotices);

            var link = $('<a>')
              .attr('href', '#example-' + spec.exampleId)
              .attr('data-editor-id', editorId)
              .attr('data-line-number', spec.lineNumber)
              .text('See specs')
              .appendTo(notice);
          });
      }
    });

    jasmineEnv.execute();
  }

  $(document).on('click', '#spec-failures a', function(e) {
    e.preventDefault();

    var link          = $(this),
        exampleTarget = link.attr('href'),
        targetExample = $(exampleTarget),
        // targetEditor  = codeMirrors[link.attr('data-editor-id')],
        targetLine    = Number(link.attr('data-line-number')),
        parentSection = targetExample.closest('section');

    // Show the section where the example is located.
    parentSection[0].scrollIntoView();

    // Highlight the example.
    // targetEditor.addLineClass(targetLine, 'background', 'highlight');
    targetExample.addClass('highlight');

    setTimeout(function() {
      // targetEditor.removeLineClass(targetLine, 'background', 'highlight');
      targetExample.removeClass('highlight');
    }, 1500);
  });

  $(document).on('keyup', 'input[name="search"]', function() {
    var query = $(this).val().toLowerCase(),
        sections = $('section.constructor,section.method,section.typedef');

    // Show all sections for a blank query.
    if (query.match(/^\s*$/)) {
      sections.show();
      return;
    }

    // Otherwise just show sections whose name matches the query.
    sections.hide();

    var selectors = [
      // Case-insensitive prefix match
      'section[data-name^="' + query + '"]',

      // Acronym prefix match
      'section[data-acronym^="' + query + '"]',

      // "Infix" (really prefix-of-part) match
      'section[data-filter*="-' + query + '"]'
    ];

    $(selectors.join(',')).show();
  });

  $(document).on('click', '.reveal-source', function(e) {
    e.preventDefault();

    var link = $(this);
    var target = $(link.attr('href'));

    link.closest('pre').hide();
    target.show();
  });

  $(document).on('click', '.perf button', function() {
    var button = $(this);
    var suite  = new Benchmark.Suite();

    // Get the method name from the section heading.
    var section  = $(this).closest('section');
    var methodId = section.attr('id');

    // Gather up all the benchmarks we want to run for this method.
    _.each(benchmarks[methodId], function(benchmark, name) {
      suite.add(benchmark);
    });

    // Remove the current bar chart and clear any currently perf results,
    // if we're re-running the benchmarks.
    $('.bar-chart', section).remove();
    $('.perf td:last-child', section).empty();

    // Populate the perf table as benchmarks are run.
    suite.on('cycle', function(e) {
      var benchmark = e.target;
      var perfTestRow = $('#perf-test-' + benchmark.benchmarkId);
      $('td[data-case-id="' + benchmark.caseId + '"]', perfTestRow)
        .text(formatNumber(benchmark.hz));
    });

    // Indicate that benchmarks are running.
    var perf = $('.perf', section).addClass('loading');
    button.hide();

    suite.on('complete', function() {
      // Indicate that benchmarks are finished.
      perf.removeClass('loading').addClass('loaded');
      button.text('Run performance tests again').show();

      // Render a bar chart with the results.
      var dataTable = $('table', perf);
      var chartContainer = $('<div>')
        .addClass('bar-chart')
        .attr('data-source', '#' + dataTable.attr('id'))
        .insertBefore(dataTable);

      HighTables.renderChart(chartContainer[0]);
    });

    suite.run({ async: true });
  });

  runSpecs();
});

function displayError(message) {
  var failureNotices = $('#spec-failures');
  $('<p>').text(message).appendTo(failureNotices);
}

Benchmark.options.onError = function(e) {
  displayError(e.message);
};

window.addEventListener('error', function(e) {
  displayError(e.message);
});
