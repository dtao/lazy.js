global.Lazy = require("../lazy.js");
require("../lazy.node.js");
require("./support/person.js");
require("./lazy_spec.js");

describe("stream", function() {
  describe("lines", function() {
    it("reads every line of a file", function() {
      var lines = [];

      runs(function() {
        Lazy.stream("./spec/data/lines.txt")
          .lines()
          .each(function(line) {
            lines.push(line);
          });
      });

      waitsFor(function() {
        return lines.length >= 25;
      });

      runs(function() {
        expect(lines).toEqual(Lazy.repeat("The quick brown fox jumped over the lazy dog.", 25).toArray());
      });
    });
  });
});
