(function(lazy) {

  var params = {
    duration: 6,
    numbytes: 1024,
    code: 200
  };

  var url = 'https://httpbin.org/drip?' + lazy(params).map(function(v, k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(v);
  }).join('&');

  var iterateChunks = lazy.makeHttpRequest(url)
    .filter(function(chunk) {
      return chunk.length > 0;
    })
    .map(function(chunk) {
      return chunk.length + ' bytes: ' + chunk; 
    })
    .each(function(chunk) {
      var el = document.createElement('div');
      el.className = 'chunk';
      el.textContent = chunk;

      document.getElementById('chunks').appendChild(el);
    });

  iterateChunks.then(function() {
    document.getElementById('state').textContent = 'Done!';
  });

}(Lazy));
