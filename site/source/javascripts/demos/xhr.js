(function(lazy) {

  var params = {
    duration: 6,
    numbytes: 1024,
    code: 200
  };

  var url = 'https://httpbin.org/drip?' + lazy(params).map(function(v, k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(v);
  }).join('&');

  lazy.makeHttpRequest(url).each(function(chunk) {
    var el = document.createElement('div');
    el.className = 'chunk';
    el.textContent = chunk;

    document.getElementById('chunks').appendChild(el);
  });

}(Lazy));
