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

});
