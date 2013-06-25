var Lazy = require("./lazy.node.js");
var _    = require("./site/lib/lodash.js");

function random(min, max) {
  return Math.floor(min + (Math.random() * (max + 1 - min)));
}

function randomChar() {
  return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(random(0, 26));
}

function randomString() {
  var length = random(10, 20);

  var str = "";
  while (str.length < length) {
    str += randomChar();
  }
  return str;
}

var gibberish = Lazy.generate(randomString).take(100000);
var json      = JSON.stringify(gibberish.toArray());

console.log("Generated " + json.length + "-character JSON string.");

console.log("Parsing w/ JSON.parse...");
var started    = new Date().getTime();
var jsonResult = _.take(JSON.parse(json), 10);
_.each(jsonResult, function(token) {});
var elapsed    = new Date().getTime() - started;
console.log("Finished in " + elapsed + "ms.");

console.log("Parsing w/ Lazy.parse...");
started        = new Date().getTime();
var lazyResult = Lazy.parse(json).take(10);
lazyResult.each(function(token) {});
elapsed        = new Date().getTime() - started;
console.log("Finished in " + elapsed + "ms.");

console.log("First 10 results (just to check):");
lazyResult.each(function(word, i) {
  console.log(i + ": " + word + " (Lazy), " + jsonResult[i] + " (JSON)");
});
