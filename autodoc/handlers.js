this.exampleHandlers = [
  {
    pattern: /sequence: \[([\s\S]*)\]$/,
    template: 'sequenceEquality'
  },
  {
    pattern: /sequence: \{([\s\S]*)\}$/,
    template: 'objectSequenceEquality'
  },
  {
    pattern: /sequence: ["'](.*)['"]$/,
    template: 'stringSequenceEquality'
  },
  {
    pattern: /the values (\[.*\]) in (?:any|some) order/,
    template: 'setEquality'
  },
  {
    pattern: /^NaN$/,
    template: 'nan'
  }
];
