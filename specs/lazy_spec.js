describe("Lazy", function() {
  var people, lauren, adam, daniel, happy;
  
  beforeEach(function() {
    people = [
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
      expect(names).toEqual(["Lauren", "Adam", "Daniel", "Happy"]);
    });
  });
  
  describe("filter", function() {
    itIsLazy(function() { Lazy(people).filter(Person.isMale); });
    
    it("selects values from the collection using a selector function", function() {
      var boys = Lazy(people).filter(Person.isMale).toArray();
      expect(boys).toEqual([adam, daniel]);
    });
  });

  describe("reverse", function() {
    itIsLazy(function() { Lazy(people).reverse(); });

    it("iterates the collection backwards", function() {
      var reversed = Lazy(people).reverse().toArray();
      expect(reversed).toEqual([happy, daniel, adam, lauren]);
    });
  });
  
  describe("chaining methods together", function() {
    itIsLazy(function() {
      Lazy(people).filter(Person.isFemale).map(Person.getName).reverse();
    });

    // This doesn't work because the design is fundamentally broken.
    // Will need to investigate!
    xit("applies the effects of all chained methods", function() {
      var girlNames = Lazy(people)
        .filter(Person.isFemale)
        .map(Person.getName)
        .reverse()
        .toArray();
      expect(girlNames).toEqual(["Happy", "Lauren"]);
    });
  });
});
