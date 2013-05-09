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

Person.getName = function(p) {
  return p.getName();
};

Person.isFemale = function(p) {
  return p.getGender() === "F";
};

Person.isMale = function(p) {
  return p.getGender() === "M";
};

Person.accessed = 0;
