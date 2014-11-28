comprehensiveSequenceTest('filter', {
  cases: [
    {
      input: [1, 2, 3, 4, 5],
      params: [isEven],
      result: [2, 4],
      accessCountForTake2: 4
    },
    {
      label: 'pluck-style',
      input: [{ foo: true }, { foo: false }, { foo: true }, { foo: false }],
      params: ['foo'],
      result: [{ foo: true }, { foo: true }],
      accessCountForTake2: 3
    },
    {
      label: 'where-style',
      input: [
        { foo: 'blub', bar: 1 },
        { foo: 'glub', bar: 2 },
        { foo: 'blub', bar: 3 }
      ],
      params: [{ foo: 'blub' }],
      result: [{ foo: 'blub', bar: 1 }, { foo: 'blub', bar: 3 }],
      accessCountForTake2: 3
    }
  ],

  aliases: ['select', 'where'],
  arrayLike: false,
  supportsAsync: true
});

describe("filter", function() {
  it("combines with previous filters", function() {
    var sons = Lazy(people)
      .filter(Person.isMale)
      .filter(function(p) { return p.getName() !== "David"; })
      .toArray();
    expect(sons).toEqual([adam, daniel]);
  });

  describe("ObjectLikeSequence#filter", function() {
    var object, result;

    beforeEach(function() {
      object = {
        a: {a: 'a'},
        b: {a: 'b'},
        c: {a: 'a'}
      };

      result = Lazy(object).filter({a: 'a'});
    });

    it("produces an ObjectLikeSequence", function() {
      expect(result.toObject()).toEqual({
        a: {a: 'a'},
        c: {a: 'a'}
      });
    });

    it("result supports #get", function() {
      expect(result.get('b')).toEqual(undefined);
      expect(result.get('c')).toEqual({a: 'a'});
    });
  });
});

describe("filter -> reverse", function() {
  it("iterates over the filtered elements in reverse order", function() {
    var evensBackwards = Lazy([1, 2, 3, 4]).filter(isEven).reverse().toArray();
    expect(evensBackwards).toEqual([4, 2]);
  });

  it("reverses before filtering", function() {
    var lastMale = Lazy(people).filter(Person.isMale).reverse().first();
    expect(lastMale).toBe(daniel);
    expect(Person.accesses).toBe(2);
  });
});

describe("reject", function() {
  ensureLaziness(function() { Lazy(people).reject(Person.isMale); });

  it("does the opposite of filter", function() {
    var girls = Lazy(people).reject(Person.isMale).toArray();
    expect(girls).toEqual([mary, lauren, happy]);
  });
});

describe("compact", function() {
  var mostlyFalsy = ["foo", false, null, 0, "", undefined, NaN];

  ensureLaziness(function() { Lazy(mostlyFalsy).compact(); });

  it("removes all falsy values from an array", function() {
    var compacted = Lazy(mostlyFalsy).compact().toArray();
    expect(compacted).toEqual(["foo"]);
  });
});
