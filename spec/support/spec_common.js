(function(context) {
  context.people        = null;
  context.david         = null;
  context.mary          = null;
  context.lauren        = null;
  context.adam          = null;
  context.daniel        = null;
  context.happy         = null;
  context.arraysCreated = null;

  var originalToArray = Lazy.Sequence.prototype.toArray;
  Lazy.Sequence.prototype.toArray = function() {
    var result = originalToArray.apply(this);
    arraysCreated += 1;
    return result;
  };

  beforeEach(function() {
    context.people = [
      context.david  = new Person("David", 63, "M"),
      context.mary   = new Person("Mary", 62, "F"),
      context.lauren = new Person("Lauren", 32, "F"),
      context.adam   = new Person("Adam", 30, "M"),
      context.daniel = new Person("Daniel", 28, "M"),
      context.happy  = new Person("Happy", 25, "F")
    ];

    Person.reset(people);

    arraysCreated = 0;
  });

  beforeEach(function() {
    this.addMatchers({
      toPassToEach: function(argumentIndex, expectedValues) {
        var i = 0;
        this.actual.each(function() {
          expect(arguments[argumentIndex]).toEqual(expectedValues[i++]);
        });
        return true;
      }
    });
  });

  context.ensureLaziness = function(action) {
    it("doesn't eagerly iterate the collection", function() {
      action();
      expect(Person.accesses).toBe(0);
    });
  };

  context.createAsyncTest = function(description, options) {
    it(description, function() {
      var results = [];

      // This can be a function, in case what we want to expect is not defined at the time
      // createAsyncTest is called.
      var expected = typeof options.expected === "function" ?
        options.expected() :
        options.expected;

      runs(function() {
        options.getSequence().each(function(e) { results.push(e); });

        // Should not yet be populated.
        expect(results.length).toBe(0);
      });

      waitsFor(function() {
        return results.length === expected.length;
      });

      runs(function() {
        expect(results).toEqual(expected);
      });

      if (options.additionalExpectations) {
        runs(options.additionalExpectations);
      }
    });
  };

  // ----- Helpers, to make specs more concise -----

  context.increment = function(x) { return x + 1; }
  context.isEven    = function(x) { return x % 2 === 0; }

}(typeof global !== 'undefined' ? global : window));
