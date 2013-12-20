describe('AsyncSequence', function() {
  function testAsyncCallback(description, array, options) {
    testAllSequenceTypes(description, array, function(sequence) {
      var callback = jasmine.createSpy();

      options.setup(sequence.async(), callback);

      waitsFor(toBeCalled(callback));

      runs(function() {
        expect(callback.calls[0].args).toEqual(options.expectedArgs);
      });
    });
  }

  describe('reduce', function() {
    testAsyncCallback('passes the result to a callback', [1, 2, 3], {
      setup: function(sequence, callback) {
        sequence.reduce(add, 0).then(callback);
      },
      expectedArgs: [6]
    });
  });

  describe('other methods that translate to reduce', function() {
    testAsyncCallback('passes the result of max() to a callback', [1, 3, 2], {
      setup: function(sequence, callback) {
        sequence.max().then(callback);
      },
      expectedArgs: [3]
    });

    testAsyncCallback('passes the result of min() to a callback', [2, 1, 3], {
      setup: function(sequence, callback) {
        sequence.min().then(callback);
      },
      expectedArgs: [1]
    });

    testAsyncCallback('passes the result of sum() to a callback', [2, 1, 3], {
      setup: function(sequence, callback) {
        sequence.sum().then(callback);
      },
      expectedArgs: [6]
    });

    testAsyncCallback('passes the result of toArray() to a callback', ['a', 'b', 'c'], {
      setup: function(sequence, callback) {
        sequence.toArray().then(callback);
      },
      expectedArgs: [['a', 'b', 'c']]
    });

    testAsyncCallback('passes the result of toObject() to a callback', [['foo', 1], ['bar', 2]], {
      setup: function(sequence, callback) {
        sequence.toObject().then(callback);
      },
      expectedArgs: [{ foo: 1, bar: 2 }]
    });

    testAsyncCallback('passes the result of toString() to a callback', ['a', 'b', 'c'], {
      setup: function(sequence, callback) {
        sequence.toString(', ').then(callback);
      },
      expectedArgs: ['a, b, c']
    });
  });

  describe('find', function() {
    testAsyncCallback('passes the found element to a callback', [1, 3, 5, 6, 7], {
      setup: function(sequence, callback) {
        sequence.find(isEven).then(callback);
      },
      expectedArgs: [6]
    });
  });

  describe('indexOf', function() {
    testAsyncCallback('passes the found index to a callback', [1, 3, 5, 6, 7], {
      setup: function(sequence, callback) {
        sequence.indexOf(5).then(callback);
      },
      expectedArgs: [2]
    });

    testAsyncCallback("passes the -1 to the callback if the element isn't found", [1, 3, 5, 6, 7], {
      setup: function(sequence, callback) {
        sequence.indexOf(15).then(callback);
      },
      expectedArgs: [-1]
    });
  });

  describe('contains', function() {
    testAsyncCallback('passes true if the value is found', [1, 3, 5, 6, 7], {
      setup: function(sequence, callback) {
        sequence.contains(5).then(callback);
      },
      expectedArgs: [true]
    });

    testAsyncCallback("passes false if the value isn't found", [1, 3, 5, 6, 7], {
      setup: function(sequence, callback) {
        sequence.contains(15).then(callback);
      },
      expectedArgs: [false]
    });
  });

  createAsyncTest('supports reverse iteration', {
    getSequence: function() { return Lazy([1, 2, 3]).async().reverse(); },
    expected: [3, 2, 1]
  });
});
