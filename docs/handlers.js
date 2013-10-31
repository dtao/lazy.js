this.exampleHandlers = [
  {
    pattern: /the values (\[.*\]) in (?:any|some) order/,
    test: function(match, actual) {
      var expected = eval(match[1]);

      actual   = Lazy(actual).sortBy(Lazy.identity).toArray();
      expected = Lazy(expected).sortBy(Lazy.identity).toArray();

      expect(actual).toEqual(expected);
    }
  }
];
