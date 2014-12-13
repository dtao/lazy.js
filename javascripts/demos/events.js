(function() {
  function displayCoordinates(element, pos) {
    element.textContent = "(" + pos.join(", ") + ")";
  }

  function initializeDomExample() {
    var sourceElement = document.getElementById("dom-event-source");
    var leftElement   = document.querySelector("#dom-event-output .left p");
    var rightElement  = document.querySelector("#dom-event-output .right p");

    var mouseEvents = Lazy(sourceElement).on("mousemove");

    var coordinates = mouseEvents.map(function(e) {
      var elementRect = sourceElement.getBoundingClientRect();
      return [
        Math.floor(e.clientX - elementRect.left),
        Math.floor(e.clientY - elementRect.top)
      ];
    });

    coordinates
      .filter(function(pos) { return pos[0] < sourceElement.clientWidth / 2; })
      .each(function(pos) { displayCoordinates(leftElement, pos); });

    coordinates
      .filter(function(pos) { return pos[0] > sourceElement.clientWidth / 2; })
      .each(function(pos) { displayCoordinates(rightElement, pos); });
  }

  window.addEventListener('load', function() {
    initializeDomExample();
  });
}());
