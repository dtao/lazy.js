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

  /**
   * Tests many requirements of a sequence in one fell swoop. (See
   * comprehensiveTestCase for more details.) Also verifies that aliases
   * delegate properly.
   *
   * @param {string} name The name of the method under test.
   * @param {Object} options A whole bunch of configuration options specifying
   *     what should be tested. Here are the important ones:
   *
   *     {
   *       cases: [
   *         {
   *           input:  (the object, e.g., an array, to serve as the underlying
   *                    source of the sequence),
   *           params: (the parameters to pass to the method, called on a
   *                    sequence based on the underlying source),
   *           result: (the expected result of applying this method to the
   *                    sequence, after calling .value())
   *         },
   *         ...
   *       ],
   *
   *       aliases: (an array of other names this method can be called by),
   *       arrayLike: (whether the result should provide indexed access),
   *       supportsAsync: (just what it sounds like)
   *     }
   */
  context.comprehensiveSequenceTest = function(name, options) {
    var cases = options.cases;
    Lazy(cases).each(function(testCase) {
      comprehensiveTestCase(name, testCase, options);
    });

    var aliases = options.aliases || [];
    Lazy(aliases).each(function(alias) {
      describe('#' + alias, function() {
        it('is an alias for #' + name, function() {
          var verifyDelegation = function(sequence) {
            spyOn(sequence, name).andCallThrough();
            iterate(sequence[alias].apply(sequence, cases[0].params));
            expect(sequence[name]).toHaveBeenCalled();
          };

          verifyDelegation(Lazy(cases[0].input));
          verifyDelegation(Lazy(cases[0].input).map(Lazy.identity));
          verifyDelegation(Lazy(cases[0].input).filter(alwaysTrue));
        });
      });
    });
  };

  /**
   * Verifies the following for a given sequence method, for a specified case
   * (input/output):
   *
   * - the actual sequence behavior (result matches expected output)
   * - consistent behavior among different base sequence types (e.g., wrapped
   *   array, array-like, and vanilla Sequence)
   * - true laziness (does not iterate until `each` is called)
   * - support for early termination
   * - support for async iteration
   */
  function comprehensiveTestCase(name, testCase, options) {
    var label = '#' + name;

    if (testCase.label) {
      label += ' (' + testCase.label + ')';
    }

    describe(label, function() {
      var monitor, sequence;

      beforeEach(function() {
        monitor  = createMonitor(testCase.input);
        sequence = Lazy(monitor);
      });

      function getResult() {
        return sequence[name].apply(sequence, testCase.params || []);
      }

      function iterateResult() {
        return iterate(getResult());
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

      Lazy(sequenceTypes).each(function(sequenceType) {
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
            expect(getResult().take(2)).toComprise(testCase.result.slice(0, 2));
          });

          // For something like Lazy([...]).take(N), we only need to access N
          // elements; however, some sequence types may require > N accesses
          // to produce N results. An obvious example is #filter.
          if (!lookupValue('skipAccessCounts', [sequenceType, options])) {
            it('accesses the minimum number of elements from the source', function() {
              var expectedAccessCount = testCase.accessCountForTake2 || 2;

              iterate(getResult().take(2));
              expect(monitor.accessCount()).toEqual(expectedAccessCount);
            });
          }

          it('passes along the index with each element during iteration', function() {
            indexes = getResult().map(function(e, i) { return i; }).toArray();
            expect(indexes).toComprise(Lazy.range(indexes.length));
          });

          describe('each', function() {
            it('returns true if the entire sequence is iterated', function() {
              var result = iterateResult();
              expect(result).toBe(true);
            });

            it('returns false if iteration is terminated early', function() {
              var result = getResult().each(alwaysFalse);
              expect(result).toBe(false);
            });

            it('returns false if the last iteration returns false', function() {
              var length = getResult().value().length;
              var result = getResult().each(function(e, i) {
                if (i === length - 1) {
                  return false;
                }
              });
              expect(result).toBe(false);
            });
          });

          describe('indexed access', function() {
            it('is supported', function() {
              expect(getResult().get(1)).toEqual(testCase.result[1]);
            });

            if (lookupValue('arrayLike', [sequenceType, options])) {
              it('does not invoke full iteration', function() {
                getResult().get(1);
                expect(monitor.accessCount()).toEqual(1);
              });
            }
          });

          if (lookupValue('supportsAsync', [sequenceType, options])) {
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
                var expectedAccessCount = testCase.accessCountForTake2 || 2;

                getAsyncResult().take(2).toArray().onComplete(function(result) {
                  expect(result).toEqual(testCase.result.slice(0, 2));
                  done();
                });
              });
            });
          }
        });
      });
    });
  }

  /**
   * Takes an object (e.g. an array) and returns a copy of that object that
   * monitors its properties so that it can tell when one has been accessed.
   * This is useful for tests that want to ensure certain elements of an array
   * haven't been looked at.
   */
  function createMonitor(target) {
    var monitor  = Lazy.clone(target),
        accesses = {};

    function monitorProperty(property) {
      Object.defineProperty(monitor, property, {
        get: function() {
          accesses[property] = true;
          return target[property];
        }
      });
    }

    Lazy(target).each(function(value, property) {
      monitorProperty(property);
    });

    monitor.accessCount = function() {
      return Object.keys(accesses).length;
    };

    monitor.accessedAt = function(property) {
      return !!accesses[property];
    };

    return monitor;
  }

  /**
   * Forces iteration over a sequence.
   */
  function iterate(sequence) {
    return sequence.each(Lazy.noop);
  }

  /**
   * Given the name of a property, iterates over a list of objects until finding
   * one with the given property. Returns the first value found.
   *
   * This is to allow the options supplied to a call to
   * #comprehensiveSequenceTest to include properties at the top level, and also
   * to override those at the case level.
   */
  function lookupValue(property, objects) {
    for (var i = 0; i < objects.length; ++i) {
      if (property in objects[i]) {
        return objects[i][property];
      }
    }
  }

  // This is basically to allow verifying that certain methods don't create
  // intermediate arrays. Not sure if it's really sensible to test this; but
  // anyway, that's the purpose.
  context.arraysCreated = 0;

  var originalToArray = Lazy.Sequence.prototype.toArray;
  Lazy.Sequence.prototype.toArray = function() {
    var result = originalToArray.apply(this);
    arraysCreated += 1;
    return result;
  };

  beforeEach(function() {
    var people = [
      context.david  = new Person("David", 63, "M"),
      context.mary   = new Person("Mary", 62, "F"),
      context.lauren = new Person("Lauren", 32, "F"),
      context.adam   = new Person("Adam", 30, "M"),
      context.daniel = new Person("Daniel", 28, "M"),
      context.happy  = new Person("Happy", 25, "F")
    ];

    context.people = people.slice(0);

    var personsAccessed = [
      false,
      false,
      false,
      false,
      false,
      false
    ];

    context.personsAccessed = function() {
      return Lazy(personsAccessed).compact().value().length;
    };

    Lazy.range(context.people.length).forEach(function(index) {
      Object.defineProperty(context.people, index, {
        get: function() {
          personsAccessed[index] = true;
          return people[index];
        }
      });
    });

    Person.reset(people);

    arraysCreated = 0;
  });

  beforeEach(function() {
    this.addMatchers({
      toComprise: function(elements) {
        var actual = this.actual;

        if (actual instanceof Lazy.Sequence) {
          actual = actual.value();
        }

        if (elements instanceof Lazy.Sequence) {
          elements = elements.value();
        }

        expect(actual).toEqual(elements);

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

  /**
   * Populates a collection.
   */
  context.populate = function(collection, contents) {
    if (collection instanceof Array) {
      for (var i = 0, len = contents.length; i < len; ++i) {
        collection.push(contents[i]);
      }
      return;
    }

    for (var key in contents) {
      collection[key] = contents[key];
    }
  };

  // --------------------------------------------------------------------------
  // I think most of the stuff below here is deprecated. It's more specialized
  // stuff duplicating what comprehensiveSequenceTest provides.
  // --------------------------------------------------------------------------

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
      var indexedSequence = Lazy(array).map(Lazy.identity);
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
  context.alwaysTrue  = function(x) { return true; };
  context.alwaysFalse = function(x) { return false; };

  // ----- Specifically for spies -----

  context.toBeCalled = function(callback) {
    return function() { return callback.callCount > 0; };
  };

  context.toBePopulated = function(collection, length) {
    return function() {
      if (!collection) {
        return false;
      }

      var size = typeof collection.length === 'number' ?
        collection.length :
        Object.keys(collection).length;

      if (length) {
        return size === length;
      }

      return size > 0;
    };
  };

}(typeof global !== 'undefined' ? global : window));
