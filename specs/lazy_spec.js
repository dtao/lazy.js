var Person = function(name, gender) {
  this.getName = function() {
    Person.accessed += 1;
    return name;
  };

  this.getGender = function() {
    Person.accessed += 1;
    return gender;
  };

  this.isAccessed = function() {
    return accessed;
  };

  this.jasmineToString = function() {
    return name;
  };
};

Person.accessed = 0;

Person.getName = function(p) {
  return p.getName();
};

Person.isFemale = function(p) {
  return p.getGender() === "F";
};

Person.isMale = function(p) {
  return p.getGender() === "M";
};

describe("Lazy", function() {
  var fn, args;
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

  function itIsLazy() {
    var self = this,
        args = arguments;

    it("doesn't eagerly iterate the collection", function() {
      fn.apply(self, people, args);
      expect(Person.accessed).toEqual(0);
    });
  }

  describe("map", function() {
    beforeEach(function() { fn = Lazy.map; });

    itIsLazy(Person.getName);

    it("maps the collection using a mapper function", function() {
      var names = Lazy.map(people, Person.getName).toArray();
      expect(names).toEqual(["Lauren", "Adam", "Daniel", "Happy"]);
    });
  });
  
  describe("filter", function() {
    beforeEach(function() { fn = Lazy.filter; });

    itIsLazy(Person.isMale);
    
    it("selects values from the collection using a selector function", function() {
      var boys = Lazy.filter(people, Person.isMale).toArray();
      expect(boys).toEqual([adam, daniel]);
    });
  });

  describe("reverse", function() {
    beforeEach(function() { fn = Lazy.reverse; });

    itIsLazy();

    it("iterates the collection backwards", function() {
      var reversed = Lazy.reverse(people).toArray();
      expect(reversed).toEqual([happy, daniel, adam, lauren]);
    });
  });
  
  describe("chaining methods together", function() {
    it("allows you to chain method calls without iterating", function() {
      Lazy.filter(people, Person.isFemale).map(Person.getName);
      expect(Person.accessed).toEqual(0);
    });
    
    it("applies the effects of all chained methods", function() {
      var girlNames = Lazy.filter(people, Person.isFemale).map(Person.getName).toArray();
      expect(girlNames).toEqual(["Lauren", "Happy"]);
    });
  });
});
