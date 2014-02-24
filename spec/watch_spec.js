describe("watch", function() {
  it("watches an object for changes to the specified property", function() {
    var object   = {},
        callback = jasmine.createSpy();

    Lazy(object).watch('foo').each(callback);

    object.foo = 1;
    object.foo = 'bar';
    object.foo = null;

    expect(callback.callCount).toBe(3);
    expect(callback.calls[0].args).toEqual([{ property: 'foo', value: 1 }, 0]);
    expect(callback.calls[1].args).toEqual([{ property: 'foo', value: 'bar' }, 1]);
    expect(callback.calls[2].args).toEqual([{ property: 'foo', value: null }, 2]);
  });

  it("can watch multiple properties", function() {
    var object   = {},
        callback = jasmine.createSpy();

    Lazy(object).watch(['foo', 'bar']).each(callback);

    object.foo = 1;
    object.bar = 2;

    expect(callback.callCount).toBe(2);
    expect(callback.calls[0].args).toEqual([{ property: 'foo', value: 1 }, 0]);
    expect(callback.calls[1].args).toEqual([{ property: 'bar', value: 2}, 1]);
  });

  it("does not exhibit infinite recursion on accesses (!)", function() {
    var object = { foo: 1 };
    Lazy(object).watch(['foo']).each(Lazy.noop);
    expect(function() { var foo = object.foo; }).not.toThrow();
  });

  it("does not override the original value", function() {
    var object = { foo: 1 };
    Lazy(object).watch('foo').each(Lazy.noop);
    expect(object.foo).toBe(1);
  });

  it("properly updates the value on sets", function() {
    var object = { foo: 1 };
    Lazy(object).watch('foo').each(Lazy.noop);
    object.foo = 2;
    expect(object.foo).toBe(2);
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

    Lazy(object)
      .watch('foo')
      .pluck('value')
      .compact()
      .map(upcase)
      .each(callback);

    object.foo = '';
    object.foo = 'bar';
    object.foo = null;

    expect(callback.callCount).toBe(1);

    // Given the implementation, I don't think there's a great way around
    // this? (Having to pass the index of the assignment rather than the
    // "adjusted" index.)
    expect(callback.calls[0].args).toEqual(['BAR', 0]);
  });

  it("works with multiple listeners", function() {
    var object = {},
        numberCallback = jasmine.createSpy(),
        stringCallback = jasmine.createSpy();

    var values = Lazy(object).watch('foo').pluck('value');
    values.ofType('number').each(numberCallback);
    values.ofType('string').each(stringCallback);

    object.foo = 5;
    object.foo = 'bar';
    object.foo = 10;
    object.foo = 'baz';

    expect(numberCallback.callCount).toBe(2);
    expect(numberCallback.calls[0].args).toEqual([5, 0]);
    expect(numberCallback.calls[1].args).toEqual([10, 1]);

    expect(stringCallback.callCount).toBe(2);
    expect(stringCallback.calls[0].args).toEqual(['bar', 0]);
    expect(stringCallback.calls[1].args).toEqual(['baz', 1]);
  });

  it("defaults to all of an object's current properties", function() {
    var object   = { foo: 1, bar: 2, baz: 3 },
        callback = jasmine.createSpy();

    Lazy(object).watch().each(callback);

    object.foo = 'yada';
    object.bar = 'blah';
    object.baz = 'boo';
    object.moo = 'woof';

    expect(callback.callCount).toBe(3);
    expect(callback.calls[0].args).toEqual([{ property: 'foo', value: 'yada' }, 0]);
    expect(callback.calls[1].args).toEqual([{ property: 'bar', value: 'blah' }, 1]);
    expect(callback.calls[2].args).toEqual([{ property: 'baz', value: 'boo' }, 2]);
  });

  it("allows some listeners to exit early without affecting others", function() {
    var object = {},
        firstCallback = jasmine.createSpy(),
        secondCallback = jasmine.createSpy();

    var values = Lazy(object).watch('foo').pluck('value');
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
