comprehensiveSequenceTest('initial', {
  cases: [
    {
      input: [1, 2, 3, 4, 5],
      result: [1, 2, 3, 4]
    },
    {
      input: [1, 2, 3, 4, 5],
      params: [2],
      result: [1, 2, 3]
    }
  ],

  supportsAsync: true,

  // #initial uses #getIndex, so access counts won't be consistent between cases
  // based on ArrayLikeSequences vs. normal sequences. That said, I do NOT like
  // this property and yes it's definitely a hack. Really I want to completely
  // refactor these tests... soon.
  skipAccessCounts: true
});
