// 一个更健壮的滚动处理脚本
$(document).ready(function(){
    // 验证必要的元素存在
    function validateElement(selector) {
        return $(selector).length > 0;
    }
    
    // 安全地获取元素偏移
    function safeOffset(selector) {
        var $el = $(selector);
        if ($el.length === 0) return null;
        
        var offset = $el.offset();
        return offset ? offset.top : null;
    }
    
    // 初始化导航
    function initNavigation() {
        if (validateElement('.header-menu .nav-item .nav-link')) {
            $('.header-menu .nav-item .nav-link:link').addClass('inactive');
            $('.header-menu .nav-item .nav-link').eq(0).addClass('active');
            $('.header-menu .nav-item .nav-link:link').eq(0).removeClass('inactive');
        }
    }
    
    // 处理滚动事件
    function handleScroll() {
        var docScroll = $(document).scrollTop();
        
        // 对每个section检查
        $('section[id^="section_"]').each(function(index) {
            var sectionId = $(this).attr('id');
            if (!sectionId) return;
            
            var offsetSection = safeOffset('#' + sectionId);
            if (offsetSection === null) return;
            
            // 调整偏移量
            offsetSection = offsetSection - 154;
            
            if (docScroll >= offsetSection) {
                // 如果导航菜单存在
                if (validateElement('.header-menu .nav-link')) {
                    $('.header-menu .nav-link').removeClass('active');
                    $('.header-menu .nav-link:link').addClass('inactive');
                    $('.header-menu .nav-item .nav-link').eq(index).addClass('active');
                    $('.header-menu .nav-item .nav-link').eq(index).removeClass('inactive');
                }
            }
        });
    }
    
    // 点击滚动处理
    function setupClickHandlers() {
        $('.click-scroll').each(function(index) {
            $(this).click(function(e) {
                e.preventDefault();
                
                // 找到对应的section
                var targetSection = $('section[id^="section_"]').eq(index);
                if (targetSection.length === 0) return;
                
                var offsetClick = safeOffset('#' + targetSection.attr('id'));
                if (offsetClick === null) return;
                
                // 调整偏移量并滚动
                offsetClick = offsetClick - 154;
                $('html, body').animate({
                    'scrollTop': offsetClick
                }, 300);
            });
        });
    }
    
    // 初始化
    initNavigation();
    
    // 设置事件监听
    $(document).scroll(handleScroll);
    setupClickHandlers();
});