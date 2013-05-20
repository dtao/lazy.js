context.Lazy.events = function(element, eventName) {
  return new EventSequence(element, eventName);
};
