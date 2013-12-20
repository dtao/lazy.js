window.HighTables = {};

HighTables.charts = {};

$(document).ready(function() {
  Highcharts.setOptions({
    credits: {
      enabled: !!HighTables.includeHighchartsLinks
    }
  });

  var chartConfigs = {
    "line": { engine: HighTables.LineChart },
    "spline": { engine: HighTables.LineChart, options: { chart: { type: "spline" } } },
    "area": { engine: HighTables.LineChart, options: { chart: { type: "area" } } },
    "stack": { engine: HighTables.LineChart, options: { chart: { type: "area" }, plotOptions: { area: { stacking: "normal" } } } },
    "bar": { engine: HighTables.BarChart },
    "column": { engine: HighTables.BarChart, options: { chart: { type: "column" } } },
    "pie": { engine: HighTables.PieChart }
  };

  function renderCharts(chartType) {
    var engine  = chartConfigs[chartType].engine;
    var options = chartConfigs[chartType].options;
    $("." + chartType + "-chart").each(function() {
      engine.renderTo(this, options);
    });
  }

  function renderChartsFromTables(chartType) {
    var engine  = chartConfigs[chartType].engine;
    var options = chartConfigs[chartType].options;
    $("table.render-to-" + chartType + "-chart").each(function() {
      engine.renderFromTable(this, options);
    })
  }

  function renderChartsFromConfigs() {
    for (var chartType in chartConfigs) {
      renderCharts(chartType);
      renderChartsFromTables(chartType);
    }
  }

  function getChartType(chart) {
    var chartClasses = $(chart).attr("class").split(/\s+/);
    for (var i = 0; i < chartClasses.length; ++i) {
      if (chartClasses[i].match(/^(?:line|spline|area|stack|bar|column|pie)-chart$/)) {
        return chartClasses[i].replace(/-chart$/g, "");
      }
    }
  }

  function getChartTypeFromTable(table) {
    var chartClasses = $(table).attr("class").split(/\s+/);
    for (var i = 0; i < chartClasses.length; ++i) {
      if (chartClasses[i].match(/^render-to-(?:line|spline|area|stack|bar|column|pie)-chart$/)) {
        return chartClasses[i].replace(/^render-to-/g, "").replace(/-chart$/g, "");
      }
    }
  }

  HighTables.renderCharts = renderChartsFromConfigs;

  HighTables.renderChart = function(chart) {
    var chartType = getChartType(chart);
    var engine    = chartConfigs[chartType].engine;
    var options   = chartConfigs[chartType].options;
    engine.renderTo(chart, options);
  };

  HighTables.renderChartFromTable = function(table) {
    var chartType = getChartTypeFromTable(table);
    var engine    = chartConfigs[chartType].engine;
    var options   = chartConfigs[chartType].options;
    engine.renderFromTable(table, options);
  };

  renderChartsFromConfigs();
});

HighTables.Parse = function() {
  function parseNumber(number) {
    var result = parseFloat(number && number.replace(/^\$|,/g, ""));
    return isNaN(result) ? null : result;
  }

  function parseIntegers(integers) {
    var results = [];
    for (var i = 0; i < integers.length; ++i) {
      results.push(parseInt(integers[i]));
    }
    return results;
  }

  function parseIntegersWithRanges(sequence, max) {
    var current = 0;
    var next;

    var values = [];
    for (i = 0; i < sequence.length; ++i) {
      if (sequence[i] === "...") {
        next = sequence[i + 1] || max + 1;
        while (current < next) {
          values.push(current++);
        }
      } else {
        current = parseInt(sequence[i]);
        values.push(current++);
      }
    }

    return values;
  }

  return {
    number: parseNumber,
    integers: parseIntegers,
    integersWithRanges: parseIntegersWithRanges
  };
}();

HighTables.Base = function(element) {
  element = $(element);

  var options;
  var labelColumn;
  var valueColumns;
  var table;

  var CHART_OPTIONS_MAP = {
    "options": function(value) { return safeEval(value, true); },
    "title": function(value) { return { title: { text: value } }; },
    "order": function(value) { return { order: value }; },
    "x-interval": function(value) { return { xAxis: { tickInterval: parseInt(value) } }; },
    "x-min": function(value) { return { xAxis: { min: parseInt(value) } }; },
    "y-interval": function(value) { return { yAxis: { tickInterval: parseInt(value) } }; },
    "y-min": function(value) { return { yAxis: { min: parseInt(value) } }; }
  };

  function safeEval(name, exec) {
    var parts = name.split(".");
    var result = window;
    while (parts.length > 0) {
      result = result[parts.shift()];
    }
    return (typeof result === "function" && exec) ? result() : result;
  }

  function getTable() {
    if (!table) {
      if (element.is("table")) {
        table = element;
      } else {
        table = $(element.attr("data-source"));
      }
    }
    return table;
  }

  /* TODO: This is stupid. Options and chart options should not be conflated
   * like this; chartOptions should be a property OF options instead.
   */
  function getChartOptions() {
    var options = {};

    var dataAttr;
    for (var key in CHART_OPTIONS_MAP) {
      dataAttr = element.attr("data-" + key);
      if (dataAttr) {
        $.extend(options, CHART_OPTIONS_MAP[key](dataAttr));
      }
    }

    return $.extend(options, {
      labelColumn: getLabelColumn(),
      valueColumns: getValueColumns(),
      limit: getLimit(),
      threshold: getThreshold(),
      transpose: getTranspose(),
      rowFilter: getRowFilter()
    });
  }

  function getLabelColumn() {
    return parseInt(element.attr("data-label-column"));
  }

  function getValueColumns() {
    var attr = element.attr("data-value-columns");
    if (attr) {
      return HighTables.Parse.integersWithRanges(
        attr.split(","),
        getTable().find("tr:first th, tr:first td").length - 1
      );

    } else {
      return null;
    }
  }

  function getLimit() {
    return parseInt(element.attr("data-limit"));
  }

  function getThreshold() {
    return parseFloat(element.attr("data-threshold"));
  }

  function getTranspose() {
    return element.attr("data-transpose") === "true";
  }

  function getRowFilter() {
    var attr = element.attr("data-row-filter");
    if (attr) {
      return safeEval(attr);
    }
  }

  this.getTable = getTable;

  this.options = function() {
    if (!options) {
      options = getChartOptions();
      options.labelColumn = this.labelColumn();
      options.valueColumns = this.valueColumns();
      options.limit = getLimit();
      options.threshold = getThreshold();
      options.transpose = getTranspose();
    }

    return options;
  };

  this.labelColumn = function() {
    if (typeof labelColumn === "undefined") {
      labelColumn = getLabelColumn();
    }

    return labelColumn;
  };

  this.valueColumns = function() {
    if (typeof valueColumns === "undefined") {
      valueColumns = getValueColumns();
    }

    return valueColumns;
  };

  this.element = element;
};

HighTables.Table = function(element) {
  $.extend(this, new HighTables.Base(element));

  var table = this.element;
  var chart;
  var firstRow;
  var bodyRows;
  var columnCount;
  var rowCount;

  function getValueOrDefault(object, key, defaultValue) {
    if (key in object) {
      return object[key];
    }
    return defaultValue;
  }

  function getCellValue(cell, options) {
    options = options || {};
    var text = cell.text() || cell.find("input").val();
    var number;

    if (getValueOrDefault(options, "numeric", true)) {
      number = HighTables.Parse.number(text);
      if (!options.threshold || number >= options.threshold) {
        return number;
      } else {
        return null;
      }
    } else {
      return text;
    }
  }

  function getCellValueAt(rowIndex, columnIndex, options) {
    var row  = table.find("tr").get(rowIndex),
        cell = $(row).find("th, td").get(columnIndex);
    return getCellValue($(cell), options);
  }

  this.getCellValue = getCellValue;

  this.getOrCreateChart = function() {
    if (!chart) {
      chart = $("<div>").addClass("chart");
      chart.attr("id", "chart-" + $(".chart").length + 1);
      chart.insertBefore(table);
    }
    return chart;
  };

  this.firstRow = function() {
    if (!firstRow) {
      firstRow = table.find("tr:first");
    }
    return firstRow;
  };

  this.bodyRows = function() {
    if (!bodyRows) {
      bodyRows = table.find("tr:gt(0)");
    }
    return bodyRows;
  };

  this.columnCount = function() {
    if (!columnCount) {
      columnCount = this.firstRow().find("td,th").length;
    }
    return columnCount;
  };

  this.rowCount = function() {
    if (!rowCount) {
      rowCount = table.find("tr").length;
    }
    return rowCount;
  };

  this.getColumnHeader = function(index) {
    return getCellValue($(this.firstRow().find("th,td").get(index)), {
      numeric: false
    });
  };

  this.getColumnData = function(index, options) {
    options = options || this.options() || {};

    // Ugh -- jQuery removes items when the function passed to map returns null.
    var columnData = [];
    this.bodyRows().each(function() {
      if (options.rowFilter && options.rowFilter(this) === false) {
        return;
      }

      var cell = $(this).find("td").get(index);
      columnData.push(getCellValue($(cell), options));
    });

    if (options.limit) {
      columnData = columnData.slice(0, options.limit);
    }

    if (options.order === "descending") {
      columnData.reverse();
    }

    return columnData;
  };

  this.getRowHeader = function(index) {
    return getCellValue($(table.find("tr").get(index)).find("td:first"), { numeric: false });
  };

  this.getRowData = function(index, options) {
    options = options || this.options() || {};

    // See comment from getColumnData.
    var rowData = [];
    if (options.valueColumns) {
      for (var i = 0; i < options.valueColumns.length; ++i) {
        rowData.push(getCellValueAt(index, options.valueColumns[i], options));
      }
    } else {
      $(table.find("tr").get(index)).find("td:gt(0):not(.exclude-from-chart),th:gt(0):not(.exclude-from-chart)").each(function() {
        rowData.push(getCellValue($(this), options));
      });
    }
    return rowData;
  };
};

HighTables.Chart = function(element) {
  $.extend(this, new HighTables.Base(element));
};

HighTables.LineChart = function() {
  var lineCharts = HighTables.charts["line"] = [];

  function getCategories(table, options) {
    var labelColumn = options.labelColumn || 0;
    return table.getColumnData(0, $.extend({}, options, { numeric: false }));
  }

  function getSeries(table, options) {
    var series = [];
    var valueColumns = options.valueColumns;
    if (valueColumns) {
      for (var i = 0; i < valueColumns.length; ++i) {
        series.push({
          name: table.getColumnHeader(valueColumns[i]),
          data: table.getColumnData(valueColumns[i], options)
        });
      }

    } else {
      for (var i = 1; i < table.columnCount(); i++) {
        series.push({
          name: table.getColumnHeader(i),
          data: table.getColumnData(i, options)
        });
      }
    }
    return series;
  }

  function render(table, chart, options) {
    options = options || {};

    var categories = getCategories(table, options);
    var series     = getSeries(table, options);

    lineCharts.push(new Highcharts.Chart($.extend(true, {
      chart: {
        renderTo: chart[0],
        type: "line"
      },
      xAxis: { categories: categories },
      yAxis: { title: false },
      title: false,
      series: series
    }, options)));
  }

  function renderTo(element, options) {
    var chart = new HighTables.Chart(element);
    var table = new HighTables.Table(chart.getTable()[0]);
    return render(table, chart.element, $.extend({}, chart.options(), options));
  }

  function renderFromTable(element, options) {
    var table = new HighTables.Table(element);
    return render(table, table.getOrCreateChart(), $.extend({}, table.options(), options));
  }

  return {
    renderTo: renderTo,
    renderFromTable: renderFromTable
  };
}();

HighTables.BarChart = function() {
  var barCharts = HighTables.charts["bar"] = [];

  function getCategories(table, options) {
    if (options.transpose) {
      return table.getColumnData(0, $.extend({}, options, { numeric: false }));
    } else {
      return table.getRowData(0, $.extend({}, options, { numeric: false }));
    }
  }

  function anyValues(data) {
    for (var i = 0; i < data.length; ++i) {
      if (data[i]) {
        return true;
      }
    }
    return false;
  }

  function getSeries(table, options) {
    var series = [];

    var recordCount = options.transpose ?
      table.columnCount() :
      table.rowCount();

    var limit = options.limit ?
      Math.min(options.limit + 1, recordCount) :
      recordCount;

    var dataPoint;
    for (var i = 1; i < limit; i++) {
      if (options.transpose) {
        dataPoint = {
          name: table.getColumnHeader(i),
          data: table.getColumnData(i, options)
        };

      } else {
        dataPoint = {
          name: table.getRowHeader(i),
          data: table.getRowData(i, options)
        };
      }

      if (anyValues(dataPoint.data)) {
        series.push(dataPoint);
      }
    }
    return series;
  }

  function render(table, chart, options) {
    options = options || {};

    var categories = getCategories(table, options);
    var series     = getSeries(table, options);

    barCharts.push(new Highcharts.Chart($.extend(true, {
      chart: {
        renderTo: chart[0],
        type: "bar"
      },
      xAxis: { categories: categories },
      yAxis: { title: false },
      title: false,
      series: series
    }, options)));
  }

  function renderTo(element, options) {
    var chart = new HighTables.Chart(element);
    var table = new HighTables.Table(chart.getTable()[0]);
    return render(table, chart.element, $.extend({}, chart.options(), options));
  }

  function renderFromTable(element, options) {
    var table = new HighTables.Table(element);
    return render(table, table.getOrCreateChart(), $.extend({}, table.options(), options));
  }

  return {
    renderTo: renderTo,
    renderFromTable: renderFromTable
  };
}();

HighTables.PieChart = function() {
  var pieCharts = HighTables.charts["pie"] = [];

  function getCellSelector(options) {
    if (options.valueColumns) {
      return "nth-child(" + options.valueColumns[0] + ")";
    } else {
      return "last-child";
    }
  }

  function getSeriesName(table, options) {
    return table.getCellValue(table.firstRow().find("th:" + getCellSelector(options)), { numeric: false });
  }

  function getLabel(table, row) {
    return table.getCellValue($(row).find("td:first"), { numeric: false });
  }

  function getValue(table, row, options) {
    return table.getCellValue($(row).find("td:" + getCellSelector(options)));
  }

  function getSeriesData(table, options) {
    var seriesData = [];
    table.bodyRows().each(function() {
      var label = getLabel(table, this);
      var value = getValue(table, this, options);
      if (label && value) {
        seriesData.push([label, value]);
      }
    });
    return seriesData;
  }

  function getSeries(table, options) {
    var name = getSeriesName(table, options);
    var data = getSeriesData(table, options);

    return [{
      type: "pie",
      name: name,
      data: data
    }];
  }

  function render(table, chart, options) {
    options = options || {};

    var series  = getSeries(table, options);

    pieCharts.push(new Highcharts.Chart($.extend(true, {
      chart: {
        renderTo: chart[0],
        type: "pie"
      },
      title: false,
      series: series
    }, options)));
  }

  function renderTo(element, options) {
    var chart = new HighTables.Chart(element);
    var table = new HighTables.Table(chart.getTable()[0]);
    return render(table, chart.element, $.extend({}, chart.options(), options));
  }

  function renderFromTable(element, options) {
    var table = new HighTables.Table(element);
    return render(table, table.getOrCreateChart(), $.extend({}, table.options(), options));
  }

  return {
    renderTo: renderTo,
    renderFromTable: renderFromTable
  };
}();
