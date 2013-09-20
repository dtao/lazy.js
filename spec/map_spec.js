describe("Lazy", function() {
  describe("map", function() {
    ensureLaziness(function() { Lazy(people).map(Person.getName); });

    it("maps the collection using a mapper function", function() {
      var names = Lazy(people).map(Person.getName).toArray();

      expect(names).toEqual([
        "David",
        "Mary",
        "Lauren",
        "Adam",
        "Daniel",
        "Happy"
      ]);
    });

    it("provides indexed access into the collection", function() {
      var lastName = Lazy(people).map(Person.getName).get(people.length - 1);
      expect(lastName).toEqual("Happy");
    });

    it("does not require iteration to index into the collection", function() {
      var lastName = Lazy(people).map(Person.getName).get(people.length - 1);
      expect(Person.objectsTouched).toEqual(1);
    });

    it("can also map objects", function() {
      var keyValuePairs = Lazy({ foo: "FOO", bar: "BAR" })
        .map(function(v, k) { return [k, v]; })
        .toArray();
      expect(keyValuePairs).toEqual([["foo", "FOO"], ["bar", "BAR"]]);
    });

    it("passes an index along with each element", function() {
      var indices = Lazy(people).map(function(x, i) { return i; }).toArray();
      expect(indices).toEqual([0, 1, 2, 3, 4, 5]);
    });

    describe("acts like 'pluck' when a string is passed instead of a function", function() {
      it("for a wrapped array", function() {
        var foos = Lazy([{ foo: 1 }, { foo: 2 }])
          .map('foo')
          .toArray();
        expect(foos).toEqual([1, 2]);
      });

      it("for an indexed sequence", function() {
        var foos = Lazy([{ foo: 1 }, { foo: 2 }])
          .map(identity)
          .map('foo')
          .toArray();
        expect(foos).toEqual([1, 2]);
      });

      it('for a non-indexed sequence', function() {
        var foos = Lazy([{ foo: 1 }, { foo: 2 }])
          .compact()
          .map('foo')
          .toArray();
        expect(foos).toEqual([1, 2]);
      });
    });

    describe("map -> min", function() {
      it("works as expected", function() {
        var min = Lazy([1, 2, 3]).map(increment).min();
        expect(min).toEqual(2);
      });

      it("returns undefined for an empty sequence", function() {
        var min = Lazy([]).map(function(d) { return d.foo; }).min();
        expect(min).toBeUndefined();
      });
    });

    describe("map -> max", function() {
      it("works as expected", function() {
        var max = Lazy([1, 2, 3]).map(increment).max();
        expect(max).toEqual(4);
      });

      it("returns undefined for an empty sequence", function() {
        var max = Lazy([]).map(function(d) { return d.foo; }).max();
        expect(max).toBeUndefined();
      });
    });
  });

  describe("pluck", function() {
    var peopleDtos;

    beforeEach(function() {
      peopleDtos = Lazy(people).map(Person.toDto).toArray();
      Person.reset(people);
    });

    it("extracts the specified property from every element in the collection", function() {
      var names = Lazy(peopleDtos).pluck("name").toArray();
      expect(names).toEqual(["David", "Mary", "Lauren", "Adam", "Daniel", "Happy"]);
    });
  });

  describe("invoke", function() {
    ensureLaziness(function() { Lazy(people).invoke("getName"); });

    it("invokes the named method on every element in the collection", function() {
      var names = Lazy(people).invoke("getName").toArray();
      expect(names).toEqual(["David", "Mary", "Lauren", "Adam", "Daniel", "Happy"]);
    });
  });
});
