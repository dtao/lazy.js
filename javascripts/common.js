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
