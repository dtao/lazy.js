describe("join", function() {
  it("returns the empty string when passed the empty sequence", function() {
    expect(Lazy([]).join()).toEqual("");
  });

  it("returns the only element as a string when passed a one-element sequence", function() {
    expect(Lazy([1]).join()).toEqual("1");
  });

  it("uses comma as delimiter when no delimiter is given", function() {
    expect(Lazy(["a", "b", "c"]).join()).toEqual("a,b,c");
  });

  it("uses given delimiter instead of comma", function() {
    expect(Lazy(["a", "b", "c"]).join(":")).toEqual("a:b:c");
  });

  it("uses delimiter for ObjectLikeSequences, not only for ArrayLikeSequences", function() {
    expect(Lazy({ a: "aaron", b: "brad" }).values().join(':')).toEqual("aaron:brad");
  });
});
