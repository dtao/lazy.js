this.exampleHandlers = [
  {
    pattern: /sequence: \[(.*)\]$/,
    template: 'sequenceEquality'
  },
  {
    pattern: /sequence: \{(.*)\}$/,
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
