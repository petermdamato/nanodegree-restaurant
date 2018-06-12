(function(){
    var original = jQuery.fn.click;
    jQuery.fn.click = function(){
        var f = arguments[0];
        arguments[0] = function(e) {
            e.preventDefault();
            f(e);
        }
        original.apply( this, arguments );
    }
})();

$(document).ready(function() {
  $(window).scroll(function () {
    if ($(window).scrollTop() > 400 ) {
      $('#filter-bar').removeClass('filter-bar-unfixed');
      $('#filter-bar').addClass('filter-bar-fixed');
    }
    if ($(window).scrollTop() < 401) {
      $('#filter-bar').removeClass('filter-bar-fixed');
      $('#filter-bar').addClass('filter-bar-unfixed');
    }
  });

  $(window).scroll(function () {
  if ($(window).scrollTop() > 69) {
    $('#review-tease').addClass('fadeout');
    $('#map-container').addClass('fadeout');
    }
  if ($(window).scrollTop() < 70) {
      $('#review-tease').removeClass('fadeout');
      $('#map-container').removeClass('fadeout');
    }
  })
});

$(document).ready(function(){
    $(".button-collapse").click(function(){
          $("#special1").toggle()
    })
})