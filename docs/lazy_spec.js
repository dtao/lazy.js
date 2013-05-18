describe("Lazy", function() {
  var people,
      david,
      mary,
      lauren,
      adam,
      daniel,
      happy,
      originalToArray = Lazy.Sequence.prototype.toArray,
      arraysCreated;

  Lazy.Sequence.prototype.toArray = function() {
    var result = originalToArray.apply(this);
    arraysCreated += 1;
    return result;
  };

  beforeEach(function() {
    people = [
      david  = new Person("David", 63, "M"),
      mary   = new Person("Mary", 62, "F"),
      lauren = new Person("Lauren", 32, "F"),
      adam   = new Person("Adam", 30, "M"),
      daniel = new Person("Daniel", 28, "M"),
      happy  = new Person("Happy", 25, "F")
    ];

    Person.reset(people);

    this.addMatchers({
      toMatchSequentially: function(expected) {
        var success = true,
            i = 0;

        this.actual.each(function(e) {
          expect(e).toEqual(expected[i++]);
        });
        return success && expected.length === i;
      }
    });

    arraysCreated = 0;
  });

  function ensureLaziness(action) {
    it("doesn't eagerly iterate the collection", function() {
      action();
      expect(Person.accesses).toEqual(0);
    });
  }

  it("wraps an array which can be easily unwrapped", function() {
    var result = Lazy(people);
    expect(result.toArray()).toEqual(people);
  });

  it("has no effect if wrapping an already-lazy collection", function() {
    var doubleWrapped = Lazy(Lazy(people));
    expect(doubleWrapped.toArray()).toEqual(people);
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
  });

  describe("split", function() {
    var values = Lazy.range(10).join(", ");

    it("returns a sequence that will iterate over 'split' portions of a string", function() {
      var result = Lazy.split(values, ", ").toArray();
      expect(result).toEqual(values.split(", "));
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

  describe("map", function() {
    ensureLaziness(function() { Lazy(people).map(Person.getName); });

    it("maps the collection using a mapper function", function() {
      var names = Lazy(people).map(Person.getName).toArray();

      expect(names).toEqual([
        "David",
        "Mary",
        "Lauren",
        "Adam",
        "Daniel",
        "Happy"
      ]);
    });

    it("provides indexed access into the collection", function() {
      var lastName = Lazy(people).map(Person.getName).get(people.length - 1);
      expect(lastName).toEqual("Happy");
    });

    it("does not require iteration to index into the collection", function() {
      var lastName = Lazy(people).map(Person.getName).get(people.length - 1);
      expect(Person.objectsTouched).toEqual(1);
    });
  });

  describe("pluck", function() {
    var peopleDtos;

    beforeEach(function() {
      peopleDtos = Lazy(people).map(Person.toDto).toArray();
      Person.reset(people);
    });

    it("extracts the specified property from every element in the collection", function() {
      var names = Lazy(peopleDtos).pluck("name").toArray();
      expect(names).toEqual(["David", "Mary", "Lauren", "Adam", "Daniel", "Happy"]);
    });
  });

  describe("invoke", function() {
    ensureLaziness(function() { Lazy(people).invoke("getName"); });

    it("invokes the named method on every element in the collection", function() {
      var names = Lazy(people).invoke("getName").toArray();
      expect(names).toEqual(["David", "Mary", "Lauren", "Adam", "Daniel", "Happy"]);
    });
  });

  describe("filter", function() {
    ensureLaziness(function() { Lazy(people).filter(Person.isMale); });

    it("selects values from the collection using a selector function", function() {
      var boys = Lazy(people).filter(Person.isMale).toArray();
      expect(boys).toEqual([david, adam, daniel]);
    });

    it("combines with previous filters", function() {
      var sons = Lazy(people)
        .filter(Person.isMale)
        .filter(function(p) { return p.getName() !== "David"; })
        .toArray();
      expect(sons).toEqual([adam, daniel]);
    });
  });

  describe("reject", function() {
    ensureLaziness(function() { Lazy(people).reject(Person.isMale); });

    it("does the opposite of filter", function() {
      var girls = Lazy(people).reject(Person.isMale).toArray();
      expect(girls).toEqual([mary, lauren, happy]);
    });
  });

  describe("reverse", function() {
    ensureLaziness(function() { Lazy(people).reverse(); });

    it("iterates the collection backwards", function() {
      var reversed = Lazy(people).reverse().toArray();

      expect(reversed).toEqual([
        happy,
        daniel,
        adam,
        lauren,
        mary,
        david
      ]);
    });

    it("provides indexed access into the collection", function() {
      var lastPerson = Lazy(people).reverse().get(0);
      expect(lastPerson).toEqual(happy);
    });

    it("does not create an array to index into the collection", function() {
      var reversed = Lazy(people).reverse();
      var lastPerson = reversed.get(0);
      expect(arraysCreated).toEqual(0);
    });
  });

  describe("concat", function() {
    var taos,
        nickses,
        bill,
        anne,
        clifford,
        louise;

    beforeEach(function() {
      taos = [
        bill = new Person("Bill", 93, "M"),
        anne = new Person("Anne", 90, "F")
      ];

      nickses = [
        clifford = new Person("Clifford", Infinity, "M"),
        louise = new Person("Louise", Infinity, "F")
      ];
    });

    ensureLaziness(function() { Lazy(people).concat(taos, nickses); });

    it("returns the specified elements after the end of the collection", function() {
      var family = Lazy(people).concat(taos, nickses).toArray();
      expect(family).toEqual([david, mary, lauren, adam, daniel, happy, bill, anne, clifford, louise]);
    });
  });

  describe("take", function() {
    ensureLaziness(function() { Lazy(people).take(2); });

    it("only selects the first N elements from the collection", function() {
      var firstTwo = Lazy(people).take(2).toArray();
      expect(firstTwo).toEqual([david, mary]);
    });
  });

  describe("initial", function() {
    ensureLaziness(function() { Lazy(people).initial(); });

    it("selects all but the last element from the collection", function() {
      var allButHappy = Lazy(people).initial().toArray();
      expect(allButHappy).toEqual([david, mary, lauren, adam, daniel]);
    });

    it("if N is given, selects all but the last N elements from the collection", function() {
      var allButDanAndHappy = Lazy(people).initial(2).toArray();
      expect(allButDanAndHappy).toEqual([david, mary, lauren, adam]);
    });
  });

  describe("drop", function() {
    ensureLaziness(function() { Lazy(people).drop(2); });

    it("skips the first N elements from the collection", function() {
      var children = Lazy(people).drop(2).toArray();
      expect(children).toEqual([lauren, adam, daniel, happy]);
    });
  });

  describe("sortBy", function() {
    ensureLaziness(function() { Lazy(people).sortBy(Person.getAge); });

    it("sorts the result by the specified selector", function() {
      var peopleByName = Lazy(people).sortBy(Person.getName).toArray();
      expect(peopleByName).toEqual([adam, daniel, david, happy, lauren, mary]);
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
  });

  describe("union", function() {
    var oneThroughTen = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    var fiveThroughFifteen = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

    it("returns all the elements in any of the arrays", function() {
      var union = Lazy(oneThroughTen).union(fiveThroughFifteen).toArray();
      expect(union).toEqual([1, 2, 3, 4, 5, 6, 7, 8,  9, 10, 11, 12, 13, 14, 15]);
    });
  });

  describe("intersection", function() {
    var oneThroughTen = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    var fiveThroughFifteen = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

    it("returns only the elements in all of the arrays", function() {
      var intersection = Lazy(oneThroughTen).intersection(fiveThroughFifteen).toArray();
      expect(intersection).toEqual([5, 6, 7, 8, 9, 10]);
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
  });

  describe("flatten", function() {
    ensureLaziness(function() { Lazy([[david], [mary], [lauren], [adam]]).flatten(); });

    it("flattens nested arrays of arrays into one big array", function() {
      var nested = [[david], [mary], [lauren, adam], [[daniel], happy]];
      var flattened = Lazy(nested).flatten().toArray();
      expect(flattened).toEqual([david, mary, lauren, adam, daniel, happy]);
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
  });

  describe("reduceRight", function() {
    it("traverses the collection from right to left", function() {
      var firstInitials = Lazy(people).reduceRight(function(array, person) {
        array.push(person.getName().charAt(0));
        return array;
      }, []);
      expect(firstInitials).toEqual(["H", "D", "A", "L", "M", "D"]);
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

  describe("compared to Underscore, Lo-Dash, etc.", function() {
    function inc(x) { return x + 1; }
    function dec(x) { return x - 1; }
    function square(x) { return x * x; }
    function isEven(x) { return x % 2 === 0; }
    function identity(x) { return x; }

    function arr(from, to) {
      return Lazy.range(from, to).toArray();
    }

    function dupes(min, max, count) {
      var numbers = Lazy.generate(function() {
        return Math.floor((Math.random() * (max - min)) + min);
      });
      return numbers.take(count).toArray();
    }

    var jaggedArray = [
      [1, 2, 3],
      [
        [4, 5, 6],
        [7, 8, 9],
        [
          [10, 11],
          12
        ],
        13,
        14,
        [15, 16],
        17
      ],
      [
        18,
        19,
        20,
        [21, 22]
      ],
      [23, 24, 25],
      26,
      27,
      28,
      [29, 30],
      [
        [31, 32, 33],
        [34, 35]
      ],
      36
    ];

    compareAlternatives("map", {
      lazy: function(arr) { return Lazy(arr).map(square); },
      underscore: function(arr) { return _(arr).map(square); },
      lodash: function(arr) { return lodash.map(arr, square); },
      linq: function(arr) { return Enumerable.From(arr).Select(square); },
      jslinq: function(arr) { return JSLINQ(arr).Select(square); },
      from: function(arr) { return from(arr).select(square); },

      // JSLINQ skips falsy values (e.g., conflates Select and Where --
      // not sure why they thought that was a good idea).
      doesNotMatch: ["jslinq"]
    });

    compareAlternatives("filter", {
      lazy: function(arr) { return Lazy(arr).filter(isEven); },
      underscore: function(arr) { return _(arr).filter(isEven); },
      lodash: function(arr) { return lodash.filter(arr, isEven); },
      linq: function(arr) { return Enumerable.From(arr).Where(isEven); },
      jslinq: function(arr) { return JSLINQ(arr).Where(isEven); },
      from: function(arr) { return from(arr).where(isEven); }
    });

    compareAlternatives("flatten", {
      lazy: function(arr) { return Lazy(arr).flatten(); },
      underscore: function(arr) { return _(arr).flatten(); },
      lodash: function(arr) { return lodash.flatten(arr); },
      linq: function(arr) { return Enumerable.From(arr).Flatten(); },
      inputs: [[jaggedArray]]
    });

    compareAlternatives("uniq", {
      lazy: function(arr) { return Lazy(arr).uniq(); },
      underscore: function(arr) { return _(arr).uniq(); },
      lodash: function(arr) { return lodash.uniq(arr); },
      linq: function(arr) { return Enumerable.From(arr).Distinct(); },
      jslinq: function(arr) { return JSLINQ(arr).Distinct(identity); },
      from: function(arr) { return from(arr).distinct(); },
      inputs: [[dupes(0, 5, 10)], [dupes(0, 10, 100)]]
    });

    compareAlternatives("union", {
      lazy: function(arr, other) { return Lazy(arr).union(other); },
      underscore: function(arr, other) { return _.union(arr, other); },
      lodash: function(arr, other) { return lodash.union(arr, other); },
      linq: function(arr, other) { return Enumerable.From(arr).Union(other); },
      from: function(arr, other) { return from(arr).union(other); },
      inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
    });

    compareAlternatives("intersection", {
      lazy: function(arr, other) { return Lazy(arr).intersection(other); },
      underscore: function(arr, other) { return _.intersection(arr, other); },
      lodash: function(arr, other) { return lodash.intersection(arr, other); },
      linq: function(arr, other) { return Enumerable.From(arr).Intersect(other); },
      jslinq: function(arr, other) { return JSLINQ(arr).Intersect(other); },
      from: function(arr, other) { return from(arr).intersect(other); },
      inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
    });

    compareAlternatives("shuffle", {
      lazy: function(arr) { return Lazy(arr).shuffle(); },
      underscore: function(arr) { return _(arr).shuffle(); },
      lodash: function(arr) { return lodash.shuffle(arr); },
      linq: function(arr) { return Enumerable.From(arr).Shuffle(); },
      shouldMatch: false
    });

    compareAlternatives("zip", {
      lazy: function(arr, other) { return Lazy(arr).zip(other); },
      underscore: function(arr, other) { return _(arr).zip(other); },
      lodash: function(arr, other) { return lodash.zip(arr, other); },
      inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
    });

    compareAlternatives("map -> indexOf", {
      lazy: function(arr, value) { return Lazy(arr).map(inc).indexOf(value); },
      underscore: function(arr, value) { return _.chain(arr).map(inc).indexOf(value); },
      lodash: function(arr, value) { return lodash(arr).map(inc).indexOf(value); },
      linq: function(arr, value) { return Enumerable.From(arr).Select(inc).IndexOf(value); },
      inputs: [[arr(0, 10), 4], [arr(0, 100), 35]],
      valueOnly: true
    });

    compareAlternatives("map -> sortedIndex", {
      lazy: function(arr) { return Lazy(arr).map(inc).sortedIndex(arr[arr.length / 2]); },
      underscore: function(arr) { return _.chain(arr).map(inc).sortedIndex(arr[arr.length / 2]); },
      lodash: function(arr) { return lodash(arr).map(inc).sortedIndex(arr[arr.length / 2]); },
      inputs: [[arr(0, 10), 4], [arr(0, 100), 35]],
      valueOnly: true
    });

    compareAlternatives("map -> filter", {
      lazy: function(arr) { return Lazy(arr).map(inc).filter(isEven); },
      underscore: function(arr) { return _.chain(arr).map(inc).filter(isEven); },
      lodash: function(arr) { return lodash(arr).map(inc).filter(isEven); },
      linq: function(arr) { return Enumerable.From(arr).Select(inc).Where(isEven); },
      jslinq: function(arr) { return JSLINQ(arr).Select(inc).Where(isEven); },
      from: function(arr) { return from(arr).select(inc).where(isEven); }
    });

    compareAlternatives("map -> take", {
      lazy: function(arr) { return Lazy(arr).map(inc).take(5); },
      underscore: function(arr) { return _.chain(arr).map(inc).take(5); },
      lodash: function(arr) { return lodash(arr).map(inc).take(5); },
      linq: function(arr) { return Enumerable.From(arr).Select(inc).Take(5); },
      from: function(arr) { return from(arr).select(inc).take(5); }
    });

    compareAlternatives("filter -> take", {
      lazy: function(arr) { return Lazy(arr).filter(isEven).take(5); },
      underscore: function(arr) { return _.chain(arr).filter(isEven).first(5); },
      lodash: function(arr) { return lodash(arr).filter(isEven).first(5); },
      linq: function(arr) { return Enumerable.From(arr).Where(isEven).Take(5); },
      from: function(arr) { return from(arr).where(isEven).take(5); }
    });

    compareAlternatives("map -> filter -> take", {
      lazy: function(arr) { return Lazy(arr).map(inc).filter(isEven).take(5); },
      underscore: function(arr) { return _.chain(arr).map(inc).filter(isEven).take(5); },
      lodash: function(arr) { return lodash(arr).map(inc).filter(isEven).take(5); },
      linq: function(arr) { return Enumerable.From(arr).Select(inc).Where(isEven).Take(5); },
      from: function(arr) { return from(arr).select(inc).where(isEven).take(5); }
    });

    compareAlternatives("map -> drop -> take", {
      lazy: function(arr) { return Lazy(arr).map(inc).drop(5).take(5); },
      underscore: function(arr) { return _.chain(arr).map(inc).rest(5).take(5); },
      lodash: function(arr) { return lodash(arr).map(inc).rest(5).take(5); },
      linq: function(arr) { return Enumerable.From(arr).Select(inc).Skip(5).Take(5); },
      from: function(arr) { return from(arr).select(inc).skip(5).take(5); }
    });

    compareAlternatives("filter -> drop -> take", {
      lazy: function(arr) { return Lazy(arr).filter(isEven).drop(5).take(5); },
      underscore: function(arr) { return _.chain(arr).filter(isEven).rest(5).first(5); },
      lodash: function(arr) { return lodash(arr).filter(isEven).rest(5).first(5); },
      linq: function(arr) { return Enumerable.From(arr).Where(isEven).Skip(5).Take(5); },
      from: function(arr) { return from(arr).where(isEven).skip(5).take(5); }
    });

    compareAlternatives("flatten -> take", {
      lazy: function(arr) { return Lazy(arr).flatten().take(5); },
      underscore: function(arr) { return _.chain(arr).flatten().first(5); },
      lodash: function(arr) { return lodash(arr).flatten().first(5); },
      linq: function(arr) { return Enumerable.From(arr).Flatten().Take(5); },
      inputs: [[jaggedArray]]
    });

    compareAlternatives("uniq -> take", {
      lazy: function(arr) { return Lazy(arr).uniq().take(5); },
      underscore: function(arr) { return _.chain(arr).uniq().first(5); },
      lodash: function(arr) { return lodash(arr).uniq().first(5); },
      linq: function(arr) { return Enumerable.From(arr).Distinct().Take(5); },
      from: function(arr) { return from(arr).distinct().take(5); },
      inputs: [[dupes(0, 5, 10)], [dupes(0, 10, 100)]]
    });

    compareAlternatives("union -> take", {
      lazy: function(arr, other) { return Lazy(arr).union(other).take(5); },
      underscore: function(arr, other) { return _.chain(arr).union(other).first(5); },
      lodash: function(arr, other) { return lodash(arr).union(other).first(5); },
      linq: function(arr, other) { return Enumerable.From(arr).Union(other).Take(5); },
      from: function(arr, other) { return from(arr).union(other).take(5); },
      inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
    });

    compareAlternatives("intersection -> take", {
      lazy: function(arr, other) { return Lazy(arr).intersection(other).take(5); },
      underscore: function(arr, other) { return _.chain(arr).intersection(other).first(5); },
      lodash: function(arr, other) { return lodash(arr).intersection(other).first(5); },
      linq: function(arr, other) { return Enumerable.From(arr).Intersect(other).Take(5); },
      from: function(arr, other) { return from(arr).intersect(other).take(5); },
      inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
    });

    compareAlternatives("without -> take", {
      lazy: function(arr, other) { return Lazy(arr).without(other).take(5); },
      underscore: function(arr, other) { return _.chain(arr).difference(other).first(5); },
      lodash: function(arr, other) { return lodash(arr).difference(other).first(5); },
      inputs: [[arr(0, 10), arr(3, 7)], [arr(0, 100), arr(25, 75)]]
    });

    compareAlternatives("shuffle -> take", {
      lazy: function(arr) { return Lazy(arr).shuffle().take(5); },
      underscore: function(arr) { return _.chain(arr).shuffle().first(5); },
      lodash: function(arr) { return lodash(arr).shuffle().first(5); },
      linq: function(arr) { return Enumerable.From(arr).Shuffle().Take(5); },
      shouldMatch: false
    });

    compareAlternatives("zip -> take", {
      lazy: function(arr, other) { return Lazy(arr).zip(other).take(5); },
      underscore: function(arr, other) { return _.chain(arr).zip(other).first(5); },
      lodash: function(arr, other) { return lodash(arr).zip(other).first(5); },
      inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
    });

    compareAlternatives("map -> any", {
      lazy: function(arr) { return Lazy(arr).map(inc).any(isEven); },
      underscore: function(arr) { return _.chain(arr).map(inc).any(isEven); },
      lodash: function(arr) { return lodash(arr).map(inc).any(isEven); },
      linq: function(arr) { return Enumerable.From(arr).Select(inc).Any(isEven); },
      jslinq: function(arr) { return JSLINQ(arr).Select(inc).Any(isEven); },
      from: function(arr) { return from(arr).select(inc).any(isEven); },
      valueOnly: true
    });

    compareAlternatives("map -> all", {
      lazy: function(arr) { return Lazy(arr).map(inc).all(isEven); },
      underscore: function(arr) { return _.chain(arr).map(inc).every(isEven); },
      lodash: function(arr) { return lodash(arr).map(inc).every(isEven); },
      linq: function(arr) { return Enumerable.From(arr).Select(inc).All(isEven); },
      jslinq: function(arr) { return JSLINQ(arr).Select(inc).All(isEven); },
      from: function(arr) { return from(arr).select(inc).all(isEven); },
      valueOnly: true
    });

    compareAlternatives("map -> join", {
      lazy: function(arr) { return Lazy(arr).map(inc).join(", "); },
      underscore: function(arr) { return _(arr).map(inc).join(", "); },
      valueOnly: true
    });

    compareAlternatives("split(string) -> take", {
      lazy: function(str, delimiter) { return Lazy.split(str, delimiter).take(5); },
      underscore: function(str, delimiter) { return _(str.split(delimiter)).take(5); },
      inputs: [[Lazy.range(100).join(", "), ", "]]
    });

    compareAlternatives("split(regex) -> take", {
      lazy: function(str, delimiter) { return Lazy.split(str, delimiter).take(5); },
      underscore: function(str, delimiter) { return _(str.split(delimiter)).take(5); },
      inputs: [[Lazy.range(100).join(", "), /,\s*/]]
    });
  });
});
