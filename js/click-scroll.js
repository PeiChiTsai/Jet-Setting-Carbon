var sectionArray = [1, 2, 3, 4, 5];

$.each(sectionArray, function(index, value){
          
     $(document).scroll(function(){
         var offsetSection = $('#' + 'section_' + value).offset().top - 154;
         var docScroll = $(document).scrollTop();
         var docScroll1 = docScroll + 1;
         
        
         if ( docScroll1 >= offsetSection ){
             $('.header-menu .nav-link').removeClass('active');
             $('.header-menu .nav-link:link').addClass('inactive');  
             $('.header-menu .nav-item .nav-link').eq(index).addClass('active');
             $('.header-menu .nav-item .nav-link').eq(index).removeClass('inactive');
         }
         
     });
    
    $('.click-scroll').eq(index).click(function(e){
        var offsetClick = $('#' + 'section_' + value).offset().top - 154;
        e.preventDefault();
        $('html, body').animate({
            'scrollTop':offsetClick
        }, 300)
    });
    
});

$(document).ready(function(){
    $('.header-menu .nav-item .nav-link:link').addClass('inactive');    
    $('.header-menu .nav-item .nav-link').eq(0).addClass('active');
    $('.header-menu .nav-item .nav-link:link').eq(0).removeClass('inactive');
});