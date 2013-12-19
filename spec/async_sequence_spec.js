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
  });

  describe('find', function() {
    testAsyncCallback('passes the found element to a callback', [1, 3, 5, 6, 7], {
      setup: function(sequence, callback) {
        sequence.find(isEven).then(callback);
      },
      expectedArgs: [6]
    });
  });
});
