var fs           = require("fs"),
    path         = require("path"),
    Stream       = require("stream"),
    MemoryStream = require("memorystream");

require("./lazy_spec.js");
require("./map_spec.js");
require("./filter_spec.js");
require("./reverse_spec.js");
require("./shuffle_spec.js");
require("./concat_spec.js");
require("./flatten_spec.js");
require("./take_spec.js");
require("./drop_spec.js");
require("./initial_spec.js");
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

if (isHarmonySupported()) {
  require('../experimental/lazy.es6.js');
  require('./es6_spec.js');
}

function isHarmonySupported() {
  var version = process.version.split('.');

  // We'll only bother checking Node versions 0.10 and greater
  if (Number(version[1]) < 10) {
    return false;
  }

  try {
    eval('(function*() {})');
    return true;
  } catch (e) {
    return false;
  }
}

// Sequence types
require("./string_like_sequence_spec.js");
require("./async_sequence_spec.js");
require("./async_handle_spec.js");

describe("working with streams", function() {

  // TODO: Figure out a smart way to test HTTP streams and other types of
  // streams as well.
  it("can split the contents of the stream, as if it were a string", function() {
    var stream = fs.createReadStream("./spec/data/haiku.txt"),
        words  = [];

    Lazy(stream).split(/\s+/).each(function(word) {
      words.push(word);
    });

    waitsFor(toBePopulated(words, 13));

    runs(function() {
      expect(words).toEqual([
        'at', 'the', 'age', 'old', 'pond',
        'a', 'frog', 'leaps', 'into', 'water',
        'a', 'deep', 'resonance'
      ]);
    });
  });

  it("can split the contents of the stream across chunks", function() {
    var stream = new MemoryStream(),
        pieces = [];
    Lazy(stream).split('to be').each(function(piece) {
      pieces.push(piece);
    });

    stream.write('this ');
    stream.write('needs ');
    stream.write('to ');
    stream.write('be ');
    stream.write('split');
    stream.end();

    waitsFor(toBePopulated(pieces,2));

    runs(function() {
      expect(pieces).toEqual(['this needs ',' split']);
    });
  });

  it("can split the contents of the stream across chunks w/ a regex delimiter", function() {
    var stream = new MemoryStream(),
        pieces = [];

    Lazy(stream).split(/[aeiou]/).each(function(piece) {
      pieces.push(piece);
    });

    // What an absurd test case I've chosen here.
    stream.write('the');
    stream.write(' quick ');
    stream.write('brown ');
    stream.write('fox\n');
    stream.write('jumped');
    stream.write(' over');
    stream.write(' the lazy ');
    stream.write("dog's back");
    stream.end();

    waitsFor(toBePopulated(pieces, 14));

    runs(function() {
      expect(pieces).toEqual([
        'th',
        ' q',
        '',
        'ck br',
        'wn f',
        'x\nj',
        'mp',
        'd ',
        'v',
        'r th',
        ' l',
        'zy d',
        "g's b",
        'ck'
      ]);
    });
  });

  it("can also do string-style matching on streams", function() {
    var stream = fs.createReadStream("./spec/data/haiku.txt"),
        words  = [];

    Lazy(stream).match(/\ba\w*/).each(function(word) {
      words.push(word);
    });

    waitsFor(toBePopulated(words));

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

    waitsFor(toBePopulated(chunks));

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

        waitsFor(toBePopulated(lines, 25));

        runs(function() {
          expect(lines).toEqual(Lazy.repeat("The quick brown fox jumped over the lazy dog.", 25).toArray());
        });
      });

      it("reads every line of a file (using a handle)", function() {
        var done = jasmine.createSpy();

        runs(function() {
          Lazy.readFile("./spec/data/lines.txt")
            .lines()
            .toArray()
            .onComplete(function(array) {
              expect(array).toEqual(Lazy.repeat("The quick brown fox jumped over the lazy dog.", 25).toArray());
              done();
            });
        });

        waitsFor(toBeCalled(done));
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

      it("exposes an AsyncHandle for reduce()-style operations", function() {
        var callback = jasmine.createSpy();

        Lazy(fs.createReadStream("./spec/data/haiku.txt"))
          .split(/\s+/)
          .toArray()
          .onComplete(function(arr) {
            callback(arr);
          });

        waitsFor(toBeCalled(callback));

        runs(function() {
          var words = callback.calls[0].args[0];
          expect(words.slice(0, 8)).toEqual([
            'at', 'the', 'age', 'old', 'pond', 'a', 'frog', 'leaps'
          ]);
        });
      });
    });

    describe("wrapping non-text streams", function() {
      var JSONStream = require('JSONStream');

      it("works with whatever the stream produces, such as objects", function() {
        var objects = [];

        runs(function() {
          var stream = fs.createReadStream("./spec/data/objects.json")
            .pipe(JSONStream.parse("*"));

          Lazy(stream).each(function(object) {
            objects.push(object);
          });
        });

        waitsFor(toBePopulated(objects));

        runs(function() {
          var names = Lazy(objects).pluck("name");
          expect(names).toComprise(["foobar", "flintstones"]);
        });
      });
    });
  });

  if (typeof Stream.Readable !== "undefined") {
    describe('toStream', function() {
      it('creates a readable stream that you can use just like any other stream', function() {
        var stream = Lazy(fs.createReadStream('./spec/data/lines.txt'))
          .map(function(chunk) { return chunk.toUpperCase(); })
          .toStream();

        var finished = jasmine.createSpy();

        var output = new MemoryStream(null, { readable: false });

        stream.pipe(output);

        stream.on('end', finished);

        waitsFor(toBeCalled(finished));

        runs(function() {
          var contents = output.toString();
          var expected = Lazy.repeat('The quick brown fox jumped over the lazy dog.'.toUpperCase(), 25).join('\n');
          expect(contents).toEqual(expected);
        });
      });

      it('respects file delimiter set on the instance (e.g. by .lines())', function() {
        var stream = Lazy.readFile('./spec/data/lines.txt')
          .lines()
          .take(5)
          .toStream();

        var finished = jasmine.createSpy();
        var output = new MemoryStream(null, { readable: false });

        stream.pipe(output);
        stream.on('end', finished);

        waitsFor(toBeCalled(finished));
        runs(function() {
          var contents = output.toString().replace(/\n$/, '');
          var expected = Lazy.repeat('The quick brown fox jumped over the lazy dog.', 5).join('\n');
          expect(contents).toEqual(expected);
        });
      });
    });
  }
});
