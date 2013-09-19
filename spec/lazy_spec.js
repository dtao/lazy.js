describe("Lazy", function() {
  it("wraps an array which can be easily unwrapped", function() {
    var result = Lazy(people);
    expect(result.toArray()).toEqual(people);
  });

  it("has no effect if wrapping an already-lazy collection", function() {
    var doubleWrapped = Lazy(Lazy(people));
    expect(doubleWrapped.toArray()).toEqual(people);
  });

  describe("define", function() {
    it("requires custom sequences to implement at least getIterator or each", function() {
      expect(function() { Lazy.Sequence.define("blah", {}); }).toThrow();
    });

    it("assigns functionality to the Sequence prototype", function() {
      var HodorSequence = Lazy.Sequence.define("hodor", {
        each: function(fn) {
          return this.parent.each(function(e) {
            return fn("hodor");
          });
        }
      });

      expect(Lazy([1, 2, 3]).hodor().toArray()).toEqual(["hodor", "hodor", "hodor"]);
    });
  });

  describe("generate", function() {
    it("allows generation of arbitrary sequences", function() {
      var sequence = Lazy.generate(function(i) { return i; })
        .drop(1)
        .take(3)
        .toArray();

      expect(sequence).toEqual([1, 2, 3]);
    });

    it("can be iterated just like any other sequence", function() {
      var randomNumbers = Lazy.generate(function(i) { return Math.random(); });

      // Iterate over the numbers until there's a number > 0.5.
      randomNumbers.each(function(x) {
        if (x > 0.5) {
          return false;
        }
      });
    });

    it("provides 'random access'", function() {
      var naturalNumbers = Lazy.generate(function(i) { return i + 1; });
      expect(naturalNumbers.get(9)).toEqual(10);
    });

    it("has an undefined length", function() {
      var naturalNumbers = Lazy.generate(function(i) { return i + 1; });
      expect(naturalNumbers.length()).toBeUndefined();
    });

    it("does let you specify a length if you want", function() {
      var oneThroughFive = Lazy.generate(function(i) { return i + 1; }, 5).toArray();
      expect(oneThroughFive).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe("range", function() {
    it("returns a sequence from 0 to stop (exclusive), incremented by 1", function() {
      expect(Lazy.range(5).toArray()).toEqual([0, 1, 2, 3, 4]);
    });

    it("returns a sequence from start to stop, incremented by 1", function() {
      expect(Lazy.range(2, 7).toArray()).toEqual([2, 3, 4, 5, 6]);
    });

    it("returns a sequence from start to stop, incremented by step", function() {
      expect(Lazy.range(0, 30, 5).toArray()).toEqual([0, 5, 10, 15, 20, 25]);
    });

    it("returns an empty sequence when start is equal to or greater than stop", function() {
      expect(Lazy.range(0).toArray()).toEqual([]);
    });
  });

  describe("async", function() {
    createAsyncTest("creates a sequence that can be iterated over asynchronously", {
      getSequence: function() { return Lazy(people).async().map(Person.getName); },
      expected: ["David", "Mary", "Lauren", "Adam", "Daniel", "Happy"]
    });

    it("cannot be called on an already-asynchronous sequence", function() {
      expect(function() { Lazy(people).async().async(); }).toThrow();
    });

    describe("when interval is undefined", function() {
      if (typeof global !== "undefined" && typeof global.setImmediate === "function") {
        it("in Node.js, uses setImmediate if available", function() {
          var personCount = 0;
          runs(function() {
            spyOn(global, "setImmediate").andCallThrough();
            Lazy(people).async().each(function() { ++personCount; });
          });
          waitsFor(function() {
            return personCount === people.length;
          });
          runs(function() {
            expect(global.setImmediate).toHaveBeenCalled();
            expect(global.setImmediate.callCount).toBe(6);
          });
        });

      } else if (typeof process !== "undefined" && typeof process.nextTick === "function") {
        it("in Node.js, uses process.nextTick if setImmediate is not available", function() {
          var personCount = 0;
          runs(function() {
            spyOn(process, "nextTick").andCallThrough();
            Lazy(people).async().each(function() { ++personCount; });
          });
          waitsFor(function() {
            return personCount === people.length;
          });
          runs(function() {
            expect(process.nextTick).toHaveBeenCalled();
            expect(process.nextTick.callCount).toBe(6);
          });
        });

      } else {
        var originalSetImmediate = window.setImmediate;

        beforeEach(function() {
          window.setImmediate = window.setImmediate || function(fn) {
            window.setTimeout(fn, 0);
          };
        });

        afterEach(function() {
          window.setImmediate = originalSetImmediate;
        });

        it("in a browser environment, uses window.setImmediate (if available)", function() {
          var personCount = 0;
          runs(function() {
            spyOn(window, "setImmediate").andCallThrough();
            Lazy(people).async().each(function() { ++personCount; });
          });
          waitsFor(function() {
            return personCount === people.length;
          });
          runs(function() {
            expect(window.setImmediate).toHaveBeenCalled();
            expect(window.setImmediate.callCount).toBe(6);
          });
        });
      }
    });
  });

  describe("split", function() {
    var values = Lazy.range(10).join(", ");

    it("returns a sequence that will iterate over 'split' portions of a string", function() {
      var result = Lazy(values).split(", ").toArray();
      expect(result).toEqual(values.split(", "));
    });

    it("works for regular expressions as well as strings", function() {
      var result = Lazy(values).split(/,\s*/).toArray();
      expect(result).toEqual(values.split(/,\s*/));
    });

    it("respects the specified flags on the regular expression", function() {
      var result = Lazy("a and b AND c").split(/\s*and\s*/i).toArray();
      expect(result).toEqual(["a", "b", "c"]);
    });

    it("works the same with or without the global flag on a regular expression", function() {
      var result = Lazy("a and b AND c").split(/\s*and\s*/gi).toArray();
      expect(result).toEqual(["a", "b", "c"]);
    });

    it("splits the string by character if an empty string is passed", function() {
      var result = Lazy("foo").split("").toArray();
      expect(result).toEqual(["f", "o", "o"]);
    });

    it("works for empty regular expressions as well as empty strings", function() {
      var result = Lazy("foo").split(/(?:)/).toArray();
      expect(result).toEqual(["f", "o", "o"]);
    });

    createAsyncTest("split(string) supports asynchronous iteration", {
      getSequence: function() { return Lazy(values).split(", ").async(); },
      expected: values.split(", ")
    });

    createAsyncTest("split(regexp) supports asynchronous iteration", {
      getSequence: function() { return Lazy(values).split(/,\s*/).async(); },
      expected: values.split(/,\s*/)
    });

    createAsyncTest("split('') supports asynchronous iteration", {
      getSequence: function() { return Lazy(values).split("").async(); },
      expected: values.split("")
    });
  });

  describe("match", function() {
    var source = "foo 123 bar 456 baz";

    it("returns a sequence that will iterate every match in the string", function() {
      var result = Lazy(source).match(/\d+/).toArray();
      expect(result).toEqual(source.match(/\d+/g));
    });

    createAsyncTest("supports asynchronous iteration", {
      getSequence: function() { return Lazy(source).match(/\d+/).async(); },
      expected: ["123", "456"]
    });
  });

  describe("toObject", function() {
    it("converts an array of pairs into an object", function() {
      var pairs = Lazy(people).map(function(p) { return [p.getName(), p]; });

      expect(pairs.toObject()).toEqual({
        "David": david,
        "Mary": mary,
        "Lauren": lauren,
        "Adam": adam,
        "Daniel": daniel,
        "Happy": happy
      });
    });
  });

  describe("toArray", function() {
    it("for an object, creates an array of key/value pairs", function() {
      var pairs = Lazy({ foo: "FOO", bar: "BAR" }).toArray();
      expect(pairs).toEqual([["foo", "FOO"], ["bar", "BAR"]]);
    })
  });

  describe("keys", function() {
    it("iterates over the keys (property names) of an object", function() {
      var keys = Lazy({ foo: "FOO", bar: "BAR" }).keys().toArray();
      expect(keys).toEqual(["foo", "bar"]);
    });
  });

  describe("values", function() {
    it("iterates over the values of an object", function() {
      var keys = Lazy({ foo: "FOO", bar: "BAR" }).values().toArray();
      expect(keys).toEqual(["FOO", "BAR"]);
    });
  });

  describe("each", function() {
    it("passes an index along with each element", function() {
      expect(Lazy(people)).toPassToEach(1, [0, 1, 2, 3, 4, 5]);
    });
  });

  describe("sortBy", function() {
    ensureLaziness(function() { Lazy(people).sortBy(Person.getAge); });

    it("sorts the result by the specified selector", function() {
      var peopleByName = Lazy(people).sortBy(Person.getName).toArray();
      expect(peopleByName).toEqual([adam, daniel, david, happy, lauren, mary]);
    });

    createAsyncTest("supports asynchronous iteration", {
      getSequence: function() { return Lazy(people).sortBy(Person.getName).async(); },
      expected: function() { return [adam, daniel, david, happy, lauren, mary]; }
    });

    it("passes an index along with each element", function() {
      expect(Lazy(people).sortBy(Person.getName)).toPassToEach(1, [0, 1, 2, 3, 4, 5]);
    });
  });

  describe("groupBy", function() {
    ensureLaziness(function() { Lazy(people).groupBy(Person.getGender); });

    it("groups the collection by a specified selector function", function() {
      var byGender = Lazy(people).groupBy(Person.getGender).toArray();
      expect(byGender).toEqual([
        ["M", [david, adam, daniel]],
        ["F", [mary, lauren, happy]]
      ]);
    });
  });

  describe("countBy", function() {
    ensureLaziness(function() { Lazy(people).countBy(Person.getGender); });

    it("counts the collection by a specified selector function", function() {
      var byGender = Lazy(people).countBy(Person.getGender).toArray();
      expect(byGender).toEqual([["M", 3], ["F", 3]]);
    });
  });

  describe("without", function() {
    var integers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    ensureLaziness(function() { Lazy(people).without(adam, lauren); });

    it("returns the values in collection not including the specified values", function() {
      var withoutFibonaccis = Lazy(integers)
        .without(1, 2, 3, 5, 8)
        .toArray();

      expect(withoutFibonaccis).toEqual([4, 6, 7, 9, 10]);
    });

    it("passes an index along with each element", function() {
      expect(Lazy(people).without(david, mary, daniel, happy)).toPassToEach(1, [0, 1]);
    });
  });

  describe("difference", function() {
    var integers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    ensureLaziness(function() { Lazy(people).difference([daniel, happy]); });

    it("returns only the values in collection not in the specified array(s)", function() {
      var minusFibonaccis = Lazy(integers)
        .difference([1, 2, 3], [5, 8])
        .toArray();

      expect(minusFibonaccis).toEqual([4, 6, 7, 9, 10]);
    });

    it("passes an index along with each element", function() {
      expect(Lazy(people).difference([adam, daniel])).toPassToEach(1, [0, 1, 2, 3]);
    });
  });

  describe("union", function() {
    var oneThroughTen = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    var fiveThroughFifteen = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

    it("returns all the elements in any of the arrays", function() {
      var union = Lazy(oneThroughTen).union(fiveThroughFifteen).toArray();
      expect(union).toEqual([1, 2, 3, 4, 5, 6, 7, 8,  9, 10, 11, 12, 13, 14, 15]);
    });

    it("passes an index along with each element", function() {
      expect(Lazy(["foo", "bar"]).union(["bar", "baz"])).toPassToEach(1, [0, 1, 2]);
    });
  });

  describe("intersection", function() {
    var oneThroughTen = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    var fiveThroughFifteen = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

    it("returns only the elements in all of the arrays", function() {
      var intersection = Lazy(oneThroughTen).intersection(fiveThroughFifteen).toArray();
      expect(intersection).toEqual([5, 6, 7, 8, 9, 10]);
    });

    // TODO: figure out a smart way to fix this without seriously hurting performance.
    xit("returns unique elements", function() {
      var intersection = Lazy([1, 1, 2, 3]).intersection([1, 2]).toArray();
      expect(intersection).toEqual([1, 2]);
    });

    it("passes an index along with each element", function() {
      expect(Lazy(["foo", "bar", "baz"]).intersection(["bar", "baz", "blah"])).toPassToEach(1, [0, 1]);
    });
  });

  describe("shuffle", function() {
    ensureLaziness(function() { Lazy(people).shuffle(); });

    // Not 100% sure of a great way to do this, so... let's just go with a
    // probabilistic test.
    it("shuffles the collection", function() {
      var shuffledCollections = Lazy.generate(function() {})
        .take(10)
        .map(function() { return Lazy(people).shuffle().toArray(); });

      var firstResult = shuffledCollections.first();
      shuffledCollections.each(function(collection) {
        // Verify the elements in the collection
        var resorted = Lazy(collection)
          .sortBy(Person.getAge)
          .reverse()
          .toArray();
        expect(resorted).toEqual(people);
      });

      var differences = 0;
      shuffledCollections.drop(1).each(function(collection) {
        for (var i = 0; i < collection.length; ++i) {
          if (collection[i] !== firstResult[i]) {
            ++differences;
            return false;
          }
        }
      });

      expect(differences).toBeGreaterThan(0);
    });

    it("passes an index along with each element", function() {
      expect(Lazy(people).shuffle()).toPassToEach(1, [0, 1, 2, 3, 4, 5]);
    });
  });

  describe("compact", function() {
    var mostlyFalsy = ["foo", false, null, 0, "", undefined, NaN];

    ensureLaziness(function() { Lazy(mostlyFalsy).compact(); });

    it("removes all falsy values from an array", function() {
      var compacted = Lazy(mostlyFalsy).compact().toArray();
      expect(compacted).toEqual(["foo"]);
    });
  });

  describe("uniq", function() {
    ensureLaziness(function() { Lazy(people).map(Person.getGender).uniq(); });

    it("only returns 1 of each unique value", function() {
      var genders = Lazy(people).map(Person.getGender).uniq().toArray();
      expect(genders).toEqual(["M", "F"]);
    });

    it("does not mistakenly combine distinct values w/ identical string representations", function() {
      var source = [1, 1, "1", "1", { toString: function() { return "1"; } }];
      var results = Lazy(source).uniq().toArray();

      // Not really sure how to test equality of an object w/ a function, so...
      expect(results.length).toEqual(3);
      expect(results.slice(0, 2)).toEqual([1, "1"]);
      expect(typeof results[2].toString).toBe("function");
    });

    it("does not override methods on Set, screwing up everything", function() {
      var results = Lazy(["__proto__", "constructor", "add", "contains"]).uniq().toArray();
      expect(results).toEqual(["__proto__", "constructor", "add", "contains"]);
    });

    it("correctly distinguishes between distinct objects with the same string representation", function() {
      var objects, x, y;
      objects = [
        x = { toString: function() { return "foo"; } },
        y = { toString: function() { return "foo"; } }
      ];

      expect(Lazy(objects).uniq().toArray()).toEqual([x, y]);
    });

    it("distinguishes between booleans, null, and undefined and their string equivalents", function() {
      var source = [true, false, null, undefined, "true", "false", "null", "undefined"];
      var results = Lazy(source).uniq().toArray();
      expect(results).toEqual(source);
    });

    it("does not conflate a string w/ its prefixed self", function() {
      var results = Lazy(["foo", "@foo"]).uniq().toArray();
      expect(results).toEqual(["foo", "@foo"]);
    });

    it("passes an index along with each element", function() {
      expect(Lazy([10, 5, 5, 5, 8, 8]).uniq()).toPassToEach(1, [0, 1, 2]);
    });

    it("correctly selects unique elements for medium-sized (~300 elements) collections", function() {
      var medium = Lazy.range(150).toArray();
      var result = Lazy(medium.concat(medium)).uniq().toArray()
      expect(result).toEqual(medium);
    });

    it("correctly selects unique elements for large (>= 800 elements) collections", function() {
      var large = Lazy.range(500).toArray();
      var result = Lazy(large.concat(large)).uniq().toArray();
      expect(result).toEqual(large);
    });
  });

  describe("zip", function() {
    var names;

    beforeEach(function() {
      names = Lazy(people).map(Person.getName).toArray();
      Person.reset(people);
    });

    ensureLaziness(function() { Lazy(names).zip(people); });

    it("merges together the values of each array", function() {
      var zipped = Lazy(names).zip(people).toArray();

      expect(zipped).toEqual([
        ["David", david],
        ["Mary", mary],
        ["Lauren", lauren],
        ["Adam", adam],
        ["Daniel", daniel],
        ["Happy", happy]
      ]);
    });

    it("passes an index along with each element", function() {
      expect(Lazy(names).zip(people)).toPassToEach(1, [0, 1, 2, 3, 4, 5]);
    });
  });

  describe("find", function() {
    it("returns the first element matching the specified predicate", function() {
      var firstSon = Lazy(people).find(function(p) {
        return p.getGender() === "M" && p.getName() !== "David";
      });

      expect(firstSon).toBe(adam);
    });
  });

  describe("where", function() {
    var peopleDtos;

    beforeEach(function() {
      peopleDtos = Lazy(people).map(Person.toDto).toArray();
      Person.reset(people);
    });

    it("returns all of the elements with the specified key-value pairs", function() {
      var namedDavid = Lazy(peopleDtos).where({ name: "David" }).toArray();
      expect(namedDavid).toEqual([{ name: "David", age: 63, gender: "M" }]);
    });
  });

  describe("findWhere", function() {
    var peopleDtos;

    beforeEach(function() {
      peopleDtos = Lazy(people).map(Person.toDto).toArray();
      Person.reset(people);
    });

    it("like where, but only returns the first match", function() {
      var namedDavid = Lazy(peopleDtos).findWhere({ name: "David" });
      expect(namedDavid).toEqual({ name: "David", age: 63, gender: "M" });
    });
  });

  describe("assign", function() {
    it("creates a sequence from updating the object with new values", function() {
      var people = { parent: david, child: daniel };
      var result = Lazy(people).assign({ parent: mary });
      expect(result.toObject()).toEqual({ parent: mary, child: daniel });
    });
  });

  describe("functions", function() {
    it("creates a sequence comprising the function properties of an object", function() {
      var walk   = function() {};
      var gobble = function() {};
      var turkey = { size: 100, weight: 100, walk: walk, gobble: gobble };
      var result = Lazy(turkey).functions();
      expect(result.toArray()).toEqual(["walk", "gobble"]);
    });
  });

  describe("invert", function() {
    it("swaps the keys/values of an object", function() {
      var object = { foo: "bar", marco: "polo" };
      var result = Lazy(object).invert();
      expect(result.toObject()).toEqual({ bar: "foo", polo: "marco" });
    });
  });

  describe("pick", function() {
    it("picks only the listed properties from the object", function() {
      var object = { foo: "bar", marco: "polo" };
      var result = Lazy(object).pick(["marco"]);
      expect(result.toObject()).toEqual({ marco: "polo" });
    });
  });

  describe("omit", function() {
    it("does the opposite of pick", function() {
      var object = { foo: "bar", marco: "polo" };
      var result = Lazy(object).omit(["marco"]);
      expect(result.toObject()).toEqual({ foo: "bar" });
    });
  });

  describe("all", function() {
    it("returns true if the condition holds true for every element", function() {
      var allPeople = Lazy(people).all(function(x) {
        return x instanceof Person;
      });

      expect(allPeople).toBe(true);
    });

    it("returns false if the condition does not hold true for every element", function() {
      var allMales = Lazy(people).all(Person.isMale);
      expect(allMales).toBe(false);
    });
  });

  describe("any", function() {
    it("returns true if the condition holds true for any element", function() {
      var anyMales = Lazy(people).any(Person.isMale);
      expect(anyMales).toBe(true);
    });

    it("returns false if the condition does not hold true for any element", function() {
      var anyUnknownGender = Lazy(people).any(function(x) {
        return x.getGender() === "?";
      });

      expect(anyUnknownGender).toBe(false);
    });
  });

  describe("first", function() {
    it("returns the first element in the collection", function() {
      var firstGirl = Lazy(people).filter(Person.isFemale).first();
      expect(firstGirl).toEqual(mary);
    });

    it("returns the first N elements in the collection", function() {
      var firstTwo = Lazy(people).first(2).toArray();
      expect(firstTwo).toEqual([david, mary]);
    });
  });

  describe("last", function() {
    it("returns the last element in the collection", function() {
      var lastBoy = Lazy(people).filter(Person.isMale).last();
      expect(lastBoy).toEqual(daniel);
    });

    it("returns the last N elements in the collection", function() {
      var lastTwo = Lazy(people).last(2).toArray();
      expect(lastTwo).toEqual([daniel, happy]);
    });

    it("iterates from the tail if possible", function() {
      Lazy(people).map(Person.getGender).last();
      expect(Person.objectsTouched).toEqual(1);
    });
  });

  describe("reduce", function() {
    it("aggregates the values in the collection according to some function", function() {
      var sumOfAges = Lazy(people).map(Person.getAge).reduce(function(sum, age) {
        return sum + age;
      }, 0);
      expect(sumOfAges).toEqual(240);
    });

    it("traverses the collection from left to right", function() {
      var firstInitials = Lazy(people).reduce(function(array, person) {
        array.push(person.getName().charAt(0));
        return array;
      }, []);
      expect(firstInitials).toEqual(["D", "M", "L", "A", "D", "H"]);
    });

    it("if no memo is given, starts with the head and reduces over the tail", function() {
      var familyAcronym = Lazy(people)
        .map(Person.getName)
        .map(function(name) { return name.charAt(0).toUpperCase(); })
        .reduce(function(acronym, initial) {
          acronym += initial;
          return acronym;
        });
      expect(familyAcronym).toEqual("DMLADH");
    });

    it("passes the index of each element into the accumulator function", function() {
      var sumOfIndices = Lazy(people).reduce(function(sum, p, i) {
        return sum + i;
      }, 0);
      expect(sumOfIndices).toEqual(0 + 1 + 2 + 3 + 4 + 5);
    });
  });

  describe("reduceRight", function() {
    it("traverses the collection from right to left", function() {
      var firstInitials = Lazy(people).reduceRight(function(array, person) {
        array.push(person.getName().charAt(0));
        return array;
      }, []);
      expect(firstInitials).toEqual(["H", "D", "A", "L", "M", "D"]);
    });

    it("passes indices in reverse order", function() {
      var sumOfIndices = Lazy(people).reduceRight(function(str, p, i) {
        return str + i;
      }, "");
      expect(sumOfIndices).toEqual("543210");
    });
  });

  describe("indexOf", function() {
    it("returns the index of the specified element in the collection", function() {
      expect(Lazy(people).indexOf(adam)).toEqual(3);
    });
  });

  describe("lastIndexOf", function() {
    it("returns the last index of the specified element in the collection", function() {
      var numbers = [0, 1, 2, 3, 2, 1, 0];
      expect(Lazy(numbers).lastIndexOf(1)).toEqual(5);
    });

    it("traverses the collection from the tail end", function() {
      var names = Lazy(people).map(Person.getName);
      expect(Lazy(names).lastIndexOf("Daniel")).toEqual(4);

      // should only have touched Happy and Daniel
      expect(Person.objectsTouched).toEqual(2);
    });
  });

  describe("contains", function() {
    it("returns true if the collection contains the specified element", function() {
      expect(Lazy(people).contains(adam)).toBe(true);
    });

    it("returns false if the collection does not contain the specified element", function() {
      expect(Lazy(people).contains(new Person("Joe", 25, "M"))).toBe(false);
    });
  });

  describe("min", function() {
    it("returns undefined for an empty collection", function() {
      expect(Lazy([]).min()).toBeUndefined();
    });

    it("returns the minimum value from the collection", function() {
      expect(Lazy(people).map(Person.getAge).min()).toEqual(25);
    });
  });

  describe("max", function() {
    it("returns undefined for an empty collection", function() {
      expect(Lazy([]).max()).toBeUndefined();
    });

    it("returns the maximum value from the collection", function() {
      expect(Lazy(people).map(Person.getAge).max()).toEqual(63);
    });
  });

  describe("chaining methods together", function() {
    ensureLaziness(function() {
      Lazy(people)
        .filter(Person.isFemale)
        .map(Person.getName)
        .reverse()
        .drop(1)
        .take(2)
        .uniq();
    });

    it("applies the effects of all chained methods", function() {
      var girlNames = Lazy(people)
        .filter(Person.isFemale)
        .map(Person.getName)
        .reverse()
        .drop(1)
        .take(2)
        .uniq()
        .toArray();

      expect(girlNames).toEqual(["Lauren", "Mary"]);
    });

    describe("filter -> take", function() {
      it("only ever touches as many objects as necessary", function() {
        var firstMale = Lazy(people)
          .filter(Person.isMale)
          .map(Person.getGender)
          .take(1)
          .toArray();

        expect(firstMale).toEqual(["M"]);
        expect(Person.objectsTouched).toEqual(1);
      });
    });

    describe("take -> map", function() {
      it("maps the items taken (just making sure)", function() {
        var firstTwoGenders = Lazy(people)
          .take(2)
          .map(Person.getGender)
          .toArray();

        expect(firstTwoGenders).toEqual(["M", "F"]);
      });
    });

    describe("map -> map -> map", function() {
      function getAgeGroup(age) {
        return age < 50 ? "young" : "old";
      }

      function getFirstLetter(str) {
        return str.charAt(0);
      }

      it("only creates one array from the combination of maps", function() {
        var ages = Lazy(people)
          .map(Person.getAge)
          .map(getAgeGroup)
          .map(getFirstLetter);

        ages.toArray();

        expect(arraysCreated).toEqual(1);
      });
    });
  });

  // ----- Tests for experimental functionality -----

  xdescribe("parsing JSON", function() {
    it("translates a JSON array of strings", function() {
      var json = JSON.stringify(["foo", "bar", "baz"]);
      expect(Lazy.parse(json).toArray()).toEqual(["foo", "bar", "baz"]);
    });

    it("translates a JSON array of integers", function() {
      var json = JSON.stringify([1, 22, 333]);
      expect(Lazy.parse(json).toArray()).toEqual([1, 22, 333]);
    });

    it("translates a JSON array of floats", function() {
      var json = JSON.stringify([1.2, 34.56]);
      expect(Lazy.parse(json).toArray()).toEqual([1.2, 34.56]);
    });
  });
});
