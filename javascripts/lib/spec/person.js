(function(context) {
  var Person = function(name, age, gender) {
    var accessed = false;

    function markAccessed() {
      Person.accesses += 1;
      if (!accessed) {
        accessed = true;
        Person.objectsTouched += 1;
      }
    }

    this.getName = function() {
      markAccessed();
      return name;
    };

    this.getAge = function() {
      markAccessed();
      return age;
    };

    this.getGender = function() {
      markAccessed();
      return gender;
    };

    this.reset = function() {
      accessed = false;
    };

    this.toDto = function() {
      return {
        name: name,
        age: age,
        gender: gender
      };
    };

    this.toString = function() {
      return name;
    };

    this.jasmineToString = function() {
      return this.toString();
    };
  };

  Person.getName = function(p) {
    return p.getName();
  };

  Person.getAge = function(p) {
    return p.getAge();
  };

  Person.getGender = function(p) {
    return p.getGender();
  };

  Person.isFemale = function(p) {
    return p.getGender() === "F";
  };

  Person.isMale = function(p) {
    return p.getGender() === "M";
  };

  Person.toDto = function(p) {
    return p.toDto();
  };

  Person.reset = function(people) {
    if (people) {
      for (var i = 0; i < people.length; ++i) {
        people[i].reset();
      }
    }

    Person.accesses = 0;
    Person.objectsTouched = 0;
  };

  Person.reset();

  context.Person = Person;

}(typeof global !== "undefined" ? global : window));
