var EventSequence = Lazy.Sequence.inherit(function(element, eventName) {
  this.element = element;
  this.eventName = eventName;
});

EventSequence.prototype.each = function(fn) {
  var element = this.element,
      eventName = this.eventName;

  var listener = function(e) {
    if (fn(e) === false) {
      element.removeEventListener(eventName, listener);
    }
  };

  this.element.addEventListender(this.eventName, listener);
};
