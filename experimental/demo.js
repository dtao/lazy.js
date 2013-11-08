window.addEventListener('load', function() {

  var startButton = document.getElementById('start'),
      textarea    = document.querySelector('#input textarea'),
      results     = document.getElementById('results'),
      handler;

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
      results.innerHTML = '';
    }

    handler = Lazy.parseJSON(textarea.value).async(100).each(function(data) {
      displayData(JSON.stringify(data));
    });

    handler.onError(function(error) {
      displayData(error.message, 'error');
    });
  });

});
