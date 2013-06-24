var fs       = require("fs");
var Lazy     = require("../../lazy.js");
var Markdown = require("./markdown.js");
var Mustache = require("./mustache.js");

var CLASSES_TO_DOCUMENT = [
  "Lazy",
  "Sequence"
];

exports.publish = function(data, opts) {
  var doclets = data().get();
  var markdown = fs.readFileSync("./README.md", "utf-8");
  var template = fs.readFileSync("./index.html.mustache", "utf-8");

  var classes = Lazy(CLASSES_TO_DOCUMENT).map(function(className) {
    var classDoc = Lazy(doclets).find(function(d) { return d.longname === className; });

    var nameMatcher = new RegExp("^" + className);
    var methods = Lazy(doclets)
      .filter(function(d) { return d.kind === "function"; })
      .filter(function(d) { return nameMatcher.test(d.longname); })
      .map(function(d) {
        return {
          name: d.name,
          description: d.description,
          params: d.params,
          returns: d.returns
        };
      })
      .toArray();

    return {
      name: className,
      description: classDoc.description,
      methods: methods
    };
  }).toArray();

  var readme = Markdown.toHTML(markdown);

  var html = Mustache.render(template, {
    readme: readme,
    classes: classes
  });

  fs.writeFileSync("./index.html", html, "utf-8");
};
