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

    it("on an already-asynchronous sequence, returns the same sequence", function() {
      var asyncSequence = Lazy(people).async();
      expect(asyncSequence.async()).toBe(asyncSequence);
    });

    describe("when interval is undefined", function() {
      var context = typeof global !== "undefined" ? global : window;

      if (typeof setImmediate === "function") {
        it("uses setImmediate if available", function() {
          var personCount = 0;
          runs(function() {
            spyOn(context, "setImmediate").andCallThrough();
            Lazy(people).async().each(function() { ++personCount; });
          });
          waitsFor(function() {
            return personCount === people.length;
          });
          runs(function() {
            expect(context.setImmediate).toHaveBeenCalled();
            expect(context.setImmediate.callCount).toBeGreaterThan(people.length);
          });
        });

      } else {
        it("otherwise, uses setTimeout", function() {
          var personCount = 0;
          runs(function() {
            spyOn(context, "setTimeout").andCallThrough();
            Lazy(people).async().each(function() { ++personCount; });
          });
          waitsFor(function() {
            return personCount === people.length;
          });
          runs(function() {
            expect(context.setTimeout).toHaveBeenCalled();
            expect(context.setTimeout.callCount).toBeGreaterThan(people.length);
          });
        });
      }
    });

    describe("the object returned by each()", function() {
      it("provides a cancel() method, which will stop iteration", function() {
        var evens = Lazy([1, 3, 5]).map(increment).async(50),
            result = [],
            handle;

        runs(function() {
          handle = evens.each(function(even) {
            result.push(even);
          });
        });

        waitsFor(function() {
          return result.length > 0;
        });

        runs(function() {
          handle.cancel();
        });

        waits(150);

        runs(function() {
          expect(result).toEqual([2])
        });
      });

      it("provides an error callback via onError", function() {
        var rebelSequence = Lazy([1, 2, 3]).async(50),
            errorCallback = jasmine.createSpy(),
            handle;

        runs(function() {
          handle = rebelSequence.each(function(x) {
            throw "Oh no, I'm throwing an exception!";
          });

          handle.onError(errorCallback);
        })

        waitsFor(toBeCalled(errorCallback));

        runs(function() {
          expect(errorCallback).toHaveBeenCalled();
        });
      });
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
