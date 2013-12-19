describe('AsyncSequence', function() {
  describe('reduce', function() {
    testAllSequenceTypes('passes the result to a callback', [1, 2, 3], function(sequence) {
      var callback = jasmine.createSpy();

      sequence.async().reduce(function(x, y) { return x + y; }, 0, callback);

      waitsFor(toBeCalled(callback));

      runs(function() {
        expect(callback.callCount).toBe(1);
        expect(callback.calls[0].args).toEqual([6]);
      });
    });
  });
});
