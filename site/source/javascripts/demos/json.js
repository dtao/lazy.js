window.addEventListener('load', function() {

  var startButton  = document.getElementById('start'),
      cancelButton = document.getElementById('cancel'),
      json         = document.getElementById('json'),
      transform    = document.getElementById('transform'),
      results      = document.getElementById('results'),
      counter      = document.getElementById('counter'),
      handler;

  function updateCount(count) {
    counter.textContent = count;
  }

  function showComplete() {
    var complete = document.createElement('SPAN');
    complete.className = 'complete';
    complete.textContent = 'Done!';
    counter.appendChild(complete);
  }

  function showError() {
    var error = document.createElement('SPAN');
    error.className = 'error';
    error.textContent = 'Error!';
    counter.appendChild(error);
  }

  function showCanceled() {
    var canceled = document.createElement('SPAN');
    canceled.className = 'canceled';
    canceled.textContent = 'Canceled';
    counter.appendChild(canceled);
  }

  function displayData(data, className) {
    var pre = document.createElement('PRE');
    if (className) {
      pre.className = className;
    }
    pre.textContent = data;

    results.appendChild(pre);
  }

  startButton.addEventListener('click', function() {
    if (handler) {
      handler.cancel();
    }

    results.innerHTML = '';
    counter.innerHTML = '';

    var sequence = Lazy.parseJSON(json.value).map(function(data, i) {
      updateCount(i + 1);
      return data;
    });

    if (!(/^\s*$/).test(transform.value)) {
      eval('sequence = sequence.' + transform.value);
    }

    handler = sequence.async(10).each(function(data) {
      displayData(JSON.stringify(data));
    });

    handler.onError(function(error) {
      displayData(error.message, 'error');
      showError();
    });

    handler.onComplete(function() {
      showComplete();
    });
  });

  cancelButton.addEventListener('click', function() {
    if (handler) {
      handler.cancel();
      showCanceled();
      handler = null;
    }
  });

  window.addEventListener('error', function(e) {
    displayData(e.message || e, 'error');
  });

  var exampleData = [
    "foo",
    "bar",
    { "foo": "bar" },
    1,
    2,
    [3, 4],
    null,
    true,
    {
      "nested": {
        "inner": {
          "array": [2, 3.14, 321987432],
          "jagged array": [43, [43, [123, 32, 43, 54]]]
        }
      }
    },
    { "blah": "slime" },
    "string with \"escaped quotes\", a'p'o's't'r'a'p'h'e's, commas, [brackets] and {braces}"
  ];

  var exampleJson = JSON.stringify(exampleData);

  document.getElementById('good-example-json').textContent = exampleJson;

  document.getElementById('bad-example-json').textContent =
    exampleJson.substring(0, exampleJson.length - 10) +
    '" I AM INVALID JSON "' + exampleJson.substring(exampleJson.length - 10);

});
