var Person = function(name, age, gender) {
  this.getName = function() {
    Person.accesses += 1;
    return name;
  };

  this.getAge = function() {
    Person.accesses += 1;
    return age;
  };

  this.getGender = function() {
    Person.accesses += 1;
    return gender;
  };

  this.jasmineToString = function() {
    return name;
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

Person.accesses = 0;
