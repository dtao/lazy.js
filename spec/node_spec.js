var fs         = require("fs"),
    JSONStream = require('JSONStream');

require("./lazy_spec.js");
require("./map_spec.js");
require("./filter_spec.js");
require("./reverse_spec.js");
require("./shuffle_spec.js");
require("./concat_spec.js");
require("./flatten_spec.js");
require("./take_spec.js");
require("./drop_spec.js");
require("./sort_by_spec.js");
require("./group_by_spec.js");
require("./count_by_spec.js");
require("./without_spec.js");
require("./union_spec.js");
require("./intersection_spec.js");
require("./uniq_spec.js");
require("./zip_spec.js");
require("./find_spec.js");
require("./min_spec.js");
require("./max_spec.js");
require("./sum_spec.js");
require("./watch_spec.js");

// Sequence types
require("./string_like_sequence_spec.js");
require("./async_sequence_spec.js");

describe("working with streams", function() {

  // TODO: Figure out a smart way to test HTTP streams and other types of
  // streams as well.
  it("can split the contents of the stream, as if it were a string", function() {
    var stream = fs.createReadStream("./spec/data/haiku.txt"),
        words  = [];

    Lazy(stream).split(/\s+/).each(function(word) {
      words.push(word);
    });

    waitsFor(function() {
      return words.length > 0;
    });

    runs(function() {
      expect(words).toEqual([
        'at', 'the', 'age', 'old', 'pond',
        'a', 'frog', 'leaps', 'into', 'water',
        'a', 'deep', 'resonance'
      ]);
    });
  });

  it("can also do string-style matching on streams", function() {
    var stream = fs.createReadStream("./spec/data/haiku.txt"),
        words  = [];

    Lazy(stream).match(/\ba\w*/).each(function(word) {
      words.push(word);
    });

    waitsFor(function() {
      return words.length > 0;
    });

    runs(function() {
      expect(words).toEqual(['at', 'age', 'a', 'a']);
    });
  });

  it("does not insert extra breaks on newlines when splitting", function() {
    var stream = fs.createReadStream("./spec/data/commas.txt"),
        chunks = [];

    Lazy(stream).split(/,\s*/).each(function(chunk) {
      chunks.push(chunk);
    });

    waitsFor(function() {
      return chunks.length > 0;
    });

    runs(function() {
      expect(chunks).toEqual([
        'first chunk',
        'second chunk',
        'third\nchunk',
        'fourth chunk',
        'fifth chunk'
      ]);
    });
  });

  describe("file streams", function() {
    describe("lines", function() {
      it("reads every line of a file", function() {
        var lines = [];

        runs(function() {
          Lazy.readFile("./spec/data/lines.txt")
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

    describe("wrapping a stream directly", function() {
      it("works the same as calling a helper, e.g., readFile", function() {
        var lines = [];

        runs(function() {
          Lazy(fs.createReadStream("./spec/data/lines.txt"))
            .lines()
            .take(1)
            .each(function(line) {
              lines.push(line);
            });
        });

        waitsFor(function() {
          return lines.length > 0;
        });

        runs(function() {
          expect(lines[0]).toEqual("The quick brown fox jumped over the lazy dog.");
        });
      });
    });

    describe("wrapping non-text streams", function() {
      it("works with whatever the stream produces, such as objects", function() {
        var objects = [];

        runs(function() {
          var stream = fs.createReadStream("./spec/data/objects.json")
            .pipe(JSONStream.parse("*"));

          Lazy(stream).each(function(object) {
            objects.push(object);
          });
        });

        waitsFor(function() {
          return objects.length > 0;
        });

        runs(function() {
          var names = Lazy(objects).pluck("name");
          expect(names).toComprise(["foobar", "flintstones"]);
        });
      });
    });
  });
});
