(function() {
  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.updateInterval = 1000;

  var specReporter = new SpecReporter();
  jasmineEnv.addReporter(specReporter);

  window.addEventListener("load", function() {
    jasmineEnv.execute();
  });
}());
