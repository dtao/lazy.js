(function(context) {

  // If this is Node, then we're running jasmine-node, which will load this file
  // first (so we need to require Lazy right here right now).
  if (typeof require === 'function') {
    context.Lazy = require('../../lazy.node.js');

    // Also need to load this for a nicer jasmine async interface
    // (see https://github.com/derickbailey/jasmine.async).
    context.AsyncSpec = require('jasmine-async')(context.jasmine);

    // ...and also need this... at least until I refactor it on out of here.
    require('./person.js');
  }

  context.testSequence = function(names, options) {
    if (typeof name === 'string') {
      name = [name];
    }

    for (var i = 0; i < names.length; ++i) {
      for (var testCase in options.cases) {
        createComprehensiveTest(names[i], options.cases[testCase], options);
      }
    }
  };

  function createComprehensiveTest(name, testCase, options) {
    var label = '#' + name;

    if (testCase.label) {
      label += ' (' + testCase.label + ')';
    }

    describe(label, function() {
      var monitor, sequence;

      beforeEach(function() {
        monitor  = createMonitoredArray(testCase.input);
        sequence = Lazy(monitor);
      });

      function getResult() {
        return testCase.apply(sequence, name);
      }

      function iterateResult() {
        getResult().each(Lazy.noop);
      }

      function assertResult() {
        expect(getResult()).toComprise(testCase.result);
      }

      var sequenceTypes = [
        {
          label: 'an ArrayWrapper',
          transform: function() { return sequence; }
        },
        {
          label: 'an ArrayLikeSequence',
          transform: function() { return sequence.map(Lazy.identity); }
        },
        {
          label: 'an ordinary sequence',
          transform: function() { return sequence.filter(alwaysTrue); },
          arrayLike: false
        }
      ];

      for (var i = 0; i < sequenceTypes.length; ++i) {
        (function(sequenceType) {
          describe('for ' + sequenceType.label, function() {
            beforeEach(function() {
              sequence = sequenceType.transform();
            });

            it('works as expected', function() {
              assertResult();
            });

            it('is actually lazy', function() {
              getResult();
              expect(monitor.accessCount()).toBe(0);
            });

            it('supports early termination', function() {
              sequence = sequence.take(2);
              expect(getResult()).toComprise(testCase.result.slice(0, 2));
            });

            it('accesses the minimum number of elements from the source', function() {
              sequence = sequence.take(2);
              iterateResult();
              expect(monitor.accessCount()).toEqual(2);
            });

            describe('each', function() {
              it('returns true if the entire sequence is iterated', function() {
                var result = getResult().each(Lazy.noop);
                expect(result).toBe(true);
              });

              it('returns false if iteration is terminated early', function() {
                var result = getResult().each(alwaysFalse);
                expect(result).toBe(false);
              });
            });

            if (options.arrayLike && sequenceType.arrayLike !== false) {
              describe('indexed access', function() {
                it('is supported', function() {
                  expect(getResult()).toBeInstanceOf(Lazy.ArrayLikeSequence);
                });

                it('does not invoke full iteration', function() {
                  getResult().get(1);
                  expect(monitor.accessCount()).toEqual(1);
                });
              });
            }

            if (options.supportsAsync) {
              describe('async iteration', function() {
                var async = new AsyncSpec(this);

                function getAsyncResult() {
                  return getResult().async();
                }

                // Currently this tests if blah().async() works.
                // TODO: First, think about whether async().blah() should work.
                // TODO: IF it should work, then make it work (better)!

                async.it('is supported', function(done) {
                  getAsyncResult().toArray().onComplete(function(result) {
                    expect(result).toEqual(testCase.result);
                    done();
                  });
                });

                async.it('supports early termination', function(done) {
                  sequence = sequence.take(2);
                  getAsyncResult().toArray().onComplete(function(result) {
                    expect(result).toEqual(testCase.result.slice(0, 2));
                    done();
                  });
                });
              });
            }
          });
        }(sequenceTypes[i]));
      }
    });
  }

  function createMonitoredArray(array) {
    var monitor  = array.slice(0),
        accesses = {};

    function monitorProperty(i) {
      Object.defineProperty(monitor, i, {
        get: function() {
          accesses[i] = true;
          return array[i];
        }
      });
    }

    for (var i = 0, len = monitor.length; i < len; ++i) {
      monitorProperty(i);
    }

    monitor.accessCount = function() {
      return Object.keys(accesses).length;
    };

    monitor.accessedAt = function(i) {
      return !!accesses[i];
    };

    return monitor;
  }

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
      toComprise: function(elements) {
        expect(this.actual.toArray()).toEqual(elements);
        return true;
      },

      toBeInstanceOf: function(type) {
        var actual = this.actual;

        this.message = function() {
          return 'Expected ' + actual + ' to be a ' + (type.name || type);
        };

        return actual instanceof type;
      },

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

  // Example usage:
  // createAsyncTest('blah', {
  //   getSequence: function() { return Lazy([1, 2, 3]); },
  //   expected: [1, 2, 3]
  // });
  context.createAsyncTest = function(description, options) {
    it(description, function() {
      performAsyncSteps(options);
    });
  };

  context.performAsyncSteps = function(options) {
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
  };

  context.testAllSequenceTypes = function(description, array, expectation) {
    it(description + " for a wrapped array", function() {
      var arrayWrapper = Lazy(array);
      expectation(arrayWrapper);
    });

    it(description + " for an indexed sequence", function() {
      var indexedSequence = Lazy(array).map(identity);
      expectation(indexedSequence);
    });

    it(description + " for a non-indexed sequence", function() {
      var nonIndexedSequence = Lazy(array).filter(alwaysTrue);
      expectation(nonIndexedSequence);
    });
  };

  // ----- Helpers, to make specs more concise -----

  context.add         = function(x, y) { return x + y; };
  context.increment   = function(x) { return x + 1; };
  context.isEven      = function(x) { return x % 2 === 0; };
  context.identity    = function(x) { return x; };
  context.alwaysTrue  = function(x) { return true; };
  context.alwaysFalse = function(x) { return false; };

  // ----- Specifically for spies -----

  context.toBeCalled = function(callback) {
    return function() { return callback.callCount > 0; };
  };

  context.toBePopulated = function(collection, length) {
    return function() {
      if (length) {
        return collection.length === length;
      }

      return collection.length > 0;
    };
  };

}(typeof global !== 'undefined' ? global : window));
