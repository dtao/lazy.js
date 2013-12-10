describe("Lazy", function() {
  describe("watch", function() {
    it("watches an object for changes to the specified property", function() {
      var object   = {},
          callback = jasmine.createSpy();

      Lazy(object).watch('foo').each(callback);

      object.foo = 1;
      object.foo = 'bar';
      object.foo = null;

      expect(callback.callCount).toBe(3);
      expect(callback.calls[0].args).toEqual([1, 0]);
      expect(callback.calls[1].args).toEqual(['bar', 1]);
      expect(callback.calls[2].args).toEqual([null, 2]);
    });

    it("provides access to map, filter, etc.", function() {
      function upcase(str) {
        return str.toUpperCase();
      }

      function blank(str) {
        return str.length === 0;
      }

      var object   = {},
          callback = jasmine.createSpy();

      Lazy(object).watch('foo').compact().map(upcase).each(callback);

      object.foo = '';
      object.foo = 'bar';
      object.foo = null;

      expect(callback.callCount).toBe(1);

      // Given the implementation, I don't think there's a great way around
      // this? (Having to pass the index of the assignment rather than the
      // "adjusted" index.)
      expect(callback.calls[0].args).toEqual(['BAR', 1]);
    });
  });
});
