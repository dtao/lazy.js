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

    it("works with multiple listeners", function() {
      var object = {},
          numberCallback = jasmine.createSpy(),
          stringCallback = jasmine.createSpy();

      var values = Lazy(object).watch('foo');
      values.ofType('number').each(numberCallback);
      values.ofType('string').each(stringCallback);

      object.foo = 5;
      object.foo = 'bar';
      object.foo = 10;
      object.foo = 'baz';

      expect(numberCallback.callCount).toBe(2);
      expect(numberCallback.calls[0].args).toEqual([5, 0]);
      expect(numberCallback.calls[1].args).toEqual([10, 2]);

      expect(stringCallback.callCount).toBe(2);
      expect(stringCallback.calls[0].args).toEqual(['bar', 1]);
      expect(stringCallback.calls[1].args).toEqual(['baz', 3]);
    });

    it("allows some listeners to exit early without affecting others", function() {
      var object = {},
          firstCallback = jasmine.createSpy(),
          secondCallback = jasmine.createSpy();

      var values = Lazy(object).watch('foo');
      values.take(2).each(firstCallback);
      values.each(secondCallback);

      object.foo = 'yabba';
      object.foo = 'dabba';
      object.foo = 'doo!';

      expect(firstCallback.callCount).toBe(2);
      expect(secondCallback.callCount).toBe(3);
      expect(secondCallback.calls[2].args).toEqual(['doo!', 2]);
    });
  });
});
