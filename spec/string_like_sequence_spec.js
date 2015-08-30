describe("StringLikeSequence", function() {
  function upcase(str) {
    return str.toUpperCase();
  }

  describe("toString", function() {
    it("joins together the elements of the sequence with no delimiter", function() {
      expect(Lazy("foo").toString()).toEqual("foo");
    });
  });

  describe("mapString", function() {
    it("returns a StringLikeSequence", function() {
      expect(Lazy("foo").mapString(upcase)).toBeInstanceOf(Lazy.StringLikeSequence);
    });
  });

  describe("first",function() {
    it("slices string",function() {
      var result = Lazy("hello").first(3).toString();
      expect(result).toEqual("hel");
    });

    it("returns again a StringLikeSequence and methods like split work",function() {
      var result = Lazy("hello").first(3).split(",").toArray();
      expect(result).toEqual(["hel"]);
    });
  });

  describe("split", function() {
    var values = Lazy.range(10).join(", ");

    it("returns a sequence that will iterate over 'split' portions of a string", function() {
      var result = Lazy(values).split(", ").toArray();
      expect(result).toEqual(values.split(", "));
    });

    it("works for regular expressions as well as strings", function() {
      var result = Lazy(values).split(/,\s*/).toArray();
      expect(result).toEqual(values.split(/,\s*/));
    });

    it("respects the specified flags on the regular expression", function() {
      var result = Lazy("a and b AND c").split(/\s*and\s*/i).toArray();
      expect(result).toEqual(["a", "b", "c"]);
    });

    it("works the same with or without the global flag on a regular expression", function() {
      var result = Lazy("a and b AND c").split(/\s*and\s*/gi).toArray();
      expect(result).toEqual(["a", "b", "c"]);
    });

    it("splits the string by character if an empty string is passed", function() {
      var result = Lazy("foo").split("").toArray();
      expect(result).toEqual(["f", "o", "o"]);
    });

    it("works for empty regular expressions as well as empty strings", function() {
      var result = Lazy("foo").split(/(?:)/).toArray();
      expect(result).toEqual(["f", "o", "o"]);
    });

    createAsyncTest("split(string) supports asynchronous iteration", {
      getSequence: function() { return Lazy(values).split(", ").async(); },
      expected: values.split(", ")
    });

    createAsyncTest("split(regexp) supports asynchronous iteration", {
      getSequence: function() { return Lazy(values).split(/,\s*/).async(); },
      expected: values.split(/,\s*/)
    });

    createAsyncTest("split('') supports asynchronous iteration", {
      getSequence: function() { return Lazy(values).split("").async(); },
      expected: values.split("")
    });
  });

  describe("match", function() {
    var source = "foo 123 bar 456 baz";

    it("returns a sequence that will iterate every match in the string", function() {
      var result = Lazy(source).match(/\d+/).toArray();
      expect(result).toEqual(source.match(/\d+/g));
    });

    createAsyncTest("supports asynchronous iteration", {
      getSequence: function() { return Lazy(source).match(/\d+/).async(); },
      expected: ["123", "456"]
    });
  });
});
