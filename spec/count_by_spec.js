describe("Lazy", function() {
  describe("countBy", function() {
    ensureLaziness(function() { Lazy(people).countBy(Person.getGender); });

    it("counts the collection by a specified selector function", function() {
      var byGender = Lazy(people).countBy(Person.getGender).toArray();
      expect(byGender).toEqual([["M", 3], ["F", 3]]);
    });
  });
});
