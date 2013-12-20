Benchmark.options.maxTime = 1;

// This is a totally unnecessary bit of fanciness that I just felt like writing.
$(window).on('scroll', function() {
  $('.index nav').css('top', Math.max(110 - window.pageYOffset, 0) + 'px');
});

$(document).on('click', 'a[href^="#"]', function(e) {
  var navLink = $('.index nav li a[href="' + $(this).attr('href') + '"]');

  if (navLink.length > 0) {
    $('.index nav li.selected').removeClass('selected');
    navLink.parent().addClass('selected');
  }
});
