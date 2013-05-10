describe("Lazy", function() {
  var people,
      david,
      mary,
      lauren,
      adam,
      daniel,
      happy;

  beforeEach(function() {
    people = [
      david  = new Person("David", 63, "M"),
      mary   = new Person("Mary", 62, "F"),
      lauren = new Person("Lauren", 32, "F"),
      adam   = new Person("Adam", 30, "M"),
      daniel = new Person("Daniel", 28, "M"),
      happy  = new Person("Happy", 25, "F")
    ];

    Person.accesses = 0;
  });

  function ensureLaziness(action) {
    it("doesn't eagerly iterate the collection", function() {
      action();
      expect(Person.accesses).toEqual(0);
    });
  }

  describe("map", function() {
    ensureLaziness(function() { Lazy(people).map(Person.getName); });

    runTest("maps the collection using a mapper function", function() {
      var names = Lazy(people).map(Person.getName).toArray();

      return new Verifier(function() {
        expect(names).toEqual([
          "David",
          "Mary",
          "Lauren",
          "Adam",
          "Daniel",
          "Happy"
        ]);
      });
    });
  });

  describe("filter", function() {
    ensureLaziness(function() { Lazy(people).filter(Person.isMale); });
    
    runTest("selects values from the collection using a selector function", function() {
      var boys = Lazy(people).filter(Person.isMale).toArray();
      return new Verifier(function() {
        expect(boys).toEqual([david, adam, daniel]);
      });
    });

    runTest("combines with previous filters", function() {
      var sons = Lazy(people)
        .filter(Person.isMale)
        .filter(function(p) { return p.getName() !== "David"; })
        .toArray();
      return new Verifier(function() {
        expect(sons).toEqual([adam, daniel]);
      });
    });
  });

  describe("reject", function() {
    ensureLaziness(function() { Lazy(people).reject(Person.isMale); });

    runTest("does the opposite of filter", function() {
      var girls = Lazy(people).reject(Person.isMale).toArray();
      return new Verifier(function() {
        expect(girls).toEqual([mary, lauren, happy]);
      });
    });
  });

  describe("reverse", function() {
    ensureLaziness(function() { Lazy(people).reverse(); });

    runTest("iterates the collection backwards", function() {
      var reversed = Lazy(people).reverse().toArray();

      return new Verifier(function() {
        expect(reversed).toEqual([
          happy,
          daniel,
          adam,
          lauren,
          mary,
          david
        ]);
      });
    });
  });

  describe("take", function() {
    ensureLaziness(function() { Lazy(people).take(2); });

    runTest("only selects the first N elements from the collection", function() {
      var firstTwo = Lazy(people).take(2).toArray();
      return new Verifier(function() {
        expect(firstTwo).toEqual([david, mary]);
      });
    });
  });

  describe("drop", function() {
    ensureLaziness(function() { Lazy(people).drop(2); });

    runTest("skips the first N elements from the collection", function() {
      var children = Lazy(people).drop(2).toArray();
      return new Verifier(function() {
        expect(children).toEqual([lauren, adam, daniel, happy]);
      });
    });
  });

  describe("sortBy", function() {
    ensureLaziness(function() { Lazy(people).sortBy(Person.getAge); });

    runTest("sorts the result by the specified selector", function() {
      var peopleByName = Lazy(people).sortBy(Person.getName).toArray();
      return new Verifier(function() {
        expect(peopleByName).toEqual([adam, daniel, david, happy, lauren, mary]);
      });
    });
  });

  describe("uniq", function() {
    ensureLaziness(function() { Lazy(people).map(Person.getGender).uniq(); });

    runTest("only returns 1 of each unique value", function() {
      var genders = Lazy(people).map(Person.getGender).uniq().toArray();
      return new Verifier(function() {
        expect(genders).toEqual(["M", "F"]);
      });
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

    runTest("applies the effects of all chained methods", function() {
      var girlNames = Lazy(people)
        .filter(Person.isFemale)
        .map(Person.getName)
        .reverse()
        .drop(1)
        .take(2)
        .uniq()
        .toArray();

      return new Verifier(function() {
        expect(girlNames).toEqual(["Lauren", "Mary"]);
      });
    });
  });
});
