// This is just a smoke test to ensure that Lazy is properly exposed as a UMD
// module. It requires Lazy and uses it to perform a trivial operation.
define(['lazy.js'], function (Lazy) {
  var array = Lazy([1, 2]).map(function(x) { return x + 1; }).value();
  require('assert').deepEqual(array, [2, 3]);
});
