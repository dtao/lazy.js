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
      david  = new Person("David", "M"),
      mary   = new Person("Mary", "F"),
      lauren = new Person("Lauren", "F"),
      adam   = new Person("Adam", "M"),
      daniel = new Person("Daniel", "M"),
      happy  = new Person("Happy", "F")
    ];

    Person.accessed = 0;
  });

  function itIsLazy(action) {
    it("doesn't eagerly iterate the collection", function() {
      action();
      expect(Person.accessed).toEqual(0);
    });
  }

  describe("map", function() {
    itIsLazy(function() { Lazy(people).map(Person.getName); });

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
  });

  describe("filter", function() {
    itIsLazy(function() { Lazy(people).filter(Person.isMale); });
    
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

  describe("reverse", function() {
    itIsLazy(function() { Lazy(people).reverse(); });

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
  });

  describe("take", function() {
    itIsLazy(function() { Lazy(people).take(2); });

    it("only selects the first N elements from the collection", function() {
      var firstTwo = Lazy(people).take(2).toArray();
      expect(firstTwo).toEqual([david, mary]);
    });
  });
  
  describe("chaining methods together", function() {
    itIsLazy(function() {
      Lazy(people)
        .filter(Person.isFemale)
        .map(Person.getName)
        .reverse()
        .take(2);
    });

    it("applies the effects of all chained methods", function() {
      var girlNames = Lazy(people)
        .filter(Person.isFemale)
        .map(Person.getName)
        .reverse()
        .take(2)
        .toArray();
      expect(girlNames).toEqual(["Happy", "Lauren"]);
    });
  });
});
