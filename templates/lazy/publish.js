/* All this file does is output a bunch of the data produced by JSDoc to the
 * console in JSON format. The point of this is to make the data consumable by
 * some other process. (For me, I shall choose Ruby.)
 *
 * TODO: Publish this as another open-source project. Or submit a pull request
 * to the JSDoc project to make it part of their code. This really shouldn't
 * have been this hard :(
 */

// Hey, let's use Lazy to generate its own docs!
var Lazy = require("../../lazy.js");

// I haven't decided which classes exactly make sense to provide documentation
// for. At least these.
var CLASSES_TO_DOCUMENT = [
  "Lazy",
  "Sequence",
  "ArrayLikeSequence",
  "ObjectLikeSequence",
  "StringLikeSequence",
  "GeneratedSequence",
  "AsyncSequence",
  "StreamLikeSequence",
  "Iterator"
];

function isTaggedDebug(doclet) {
  return doclet.tags && Lazy(doclet.tags).any(function(tag) {
    return tag.title === "debug";
  });
}

function getMethodData(doclet) {
  return {
    longname: doclet.longname,
    name: doclet.name,
    description: doclet.description,
    scope: doclet.scope,
    params: doclet.params,
    returns: doclet.returns,
    examples: doclet.examples
  };
}

// Spit it out, JSDoc!
exports.publish = function(data, opts) {
  var doclets = data().get();

  var classes = Lazy(CLASSES_TO_DOCUMENT).map(function(className) {
    var classDoclet = Lazy(doclets).findWhere({ longname: className });

    var nameMatcher = new RegExp("^" + className);
    var methods = Lazy(doclets)
      .where({ kind: "function" })
      .filter(function(d) { return nameMatcher.test(d.longname); })
      .reject(function(d) { return d.meta.filename === "experimental.js"; })
      .reject(isTaggedDebug)
      .map(getMethodData);

    var instanceMethods = methods.where({ scope: "instance" }).toArray();
    var staticMethods = methods.where({ scope: "static" }).toArray();

    return {
      name: className,
      constructor: getMethodData(classDoclet),
      instanceMethods: instanceMethods,
      staticMethods: staticMethods
    };
  }).toArray();

  console.log(JSON.stringify(classes));
};
