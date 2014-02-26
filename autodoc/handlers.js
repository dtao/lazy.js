this.exampleHandlers = [
  {
    pattern: /sequence: ([\[\{'"][\s\S]*[\]\}'"])$/,
    template: 'sequenceEquality',
    data: function(match) {
      return {
        value: match[1]
      };
    }
  }
];
