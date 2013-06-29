$(document).ready(function() {
  var hashMatcher = /#.*$/;

  function sameFile(leftPath, rightPath) {
    return leftPath.replace(hashMatcher, "") === rightPath.replace(hashMatcher, "");
  }

  // If we've come to this page via a targeted link, let's show the proper
  // section immediately.
  if (window.location.hash) {
    $(".method").hide();
    $(window.location.hash).show();
  }

  // YES, I AM BASICALLY DUPLICATING THE CODE FROM COMMON.JS BELOW.
  // LEAVE ME ALONE, OK? IT IS NOT A HIGH PRIORITY TO REFACTOR THIS!
  //
  // ...
  //
  // Sorry for shouting.

  $("a.internal-link").click(function() {
    // If the link points to a separate file, let it through.
    if (!sameFile(this.href, window.location.href)) {
      return;
    }

    var targetId = $(this).attr("href").split("#").pop();

    // Highlight the proper link.
    $("nav ul li").removeClass("selected");
    $("nav ul li a[href='#" + targetId + "']").each(function() {
      $(this).parent().addClass("selected");
    });

    // Show the proper section.
    $(".method").hide();
    $("#" + targetId).show();

    // Scroll back up to the top (otherwise the content could be hidden).
    window.scrollTo(0, 0);

    return false;
  });
});

// This is a totally unnecessary bit of fanciness that I just felt like writing.
$(window).on("scroll", function() {
  $("nav.doc-list").css("top", Math.max(171 - window.pageYOffset, 0) + "px");
});
