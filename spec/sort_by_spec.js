describe("Lazy", function() {
  describe("sortBy", function() {
    ensureLaziness(function() { Lazy(people).sortBy(Person.getAge); });

    it("sorts the result by the specified selector", function() {
      var peopleByName = Lazy(people).sortBy(Person.getName).toArray();
      expect(peopleByName).toEqual([adam, daniel, david, happy, lauren, mary]);
    });

    createAsyncTest("supports asynchronous iteration", {
      getSequence: function() { return Lazy(people).sortBy(Person.getName).async(); },
      expected: function() { return [adam, daniel, david, happy, lauren, mary]; }
    });

    it("passes an index along with each element", function() {
      expect(Lazy(people).sortBy(Person.getName)).toPassToEach(1, [0, 1, 2, 3, 4, 5]);
    });
  });
});
