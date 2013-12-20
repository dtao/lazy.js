(function(context) {

  /**
   * Default example handlers. These come AFTER any custom handlers --
   * that gives you the ability to override them, effectively. (Of course you
   * could also always just obliterate this property.)
   */
  this.exampleHandlers = (context.exampleHandlers || []).concat([
    {
      pattern: /^(\w[\w\.\(\)\[\]'"]*)\s*===?\s*(.*)$/,
      template: 'equality'
    },
    {
      pattern: /^(\w[\w\.\(\)\[\]'"]*)\s*!==?\s*(.*)$/,
      template: 'inequality'
    },
    {
      pattern: /^instanceof (.*)$/,
      template: 'instanceof'
    },
    {
      pattern: /^NaN$/,
      template: 'nan'
    },
    {
      pattern: /^throws$/,
      template: 'throws'
    },
    {
      pattern: /^calls\s+(\w+)\s+(\d+)\s+times?$/,
      template: 'calls'
    },
    {
      pattern: /^calls\s+(\w+)\s+(\d+)\s+times? asynchronously$/,
      template: 'calls_async'
    }
  ]);

  // A client library may have defined a custom assertEquality method, e.g.
  // in doc_helper.js; so we'll only use this default implementation if
  // necessary.
  this.assertEquality = context.assertEquality || function(expected, actual) {
    expect(actual).toEqual(expected);
  };

}.call(this, typeof global !== 'undefined' ? global : this));
