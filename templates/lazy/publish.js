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
  "AsyncSequence"
];

// Spit it out, JSDoc!
exports.publish = function(data, opts) {
  var doclets = data().get();

  var classes = Lazy(CLASSES_TO_DOCUMENT).map(function(className) {
    var classDoc = Lazy(doclets).find(function(d) {
      return d.longname === className;
    });

    var nameMatcher = new RegExp("^" + className);
    var methods = Lazy(doclets)
      .filter(function(d) { return d.kind === "function" || d.kind === "class"; })
      .filter(function(d) { return nameMatcher.test(d.longname); })
      .map(function(d) {
        return {
          longname: d.longname,
          name: d.name,
          description: d.description,
          scope: d.scope,
          params: d.params,
          returns: d.returns,
          range: d.meta && d.meta.range
        };
      })
      .toArray();

    return {
      name: className,
      description: classDoc.description,
      methods: methods
    };
  }).toArray();

  console.log(JSON.stringify(classes))
};
