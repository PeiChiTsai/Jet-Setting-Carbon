/**
 * 滚动触发动画效果
 * 为页面各个部分添加滚动显现动画
 */
document.addEventListener('DOMContentLoaded', function() {
    // 获取所有需要动画的部分
    const animatedSections = document.querySelectorAll('section');
    const article = document.querySelector('article');
    
    // 初始化时检查哪些元素在视窗中
    checkVisibility();
    
    // 监听滚动事件
    article.addEventListener('scroll', throttle(checkVisibility, 200));
    window.addEventListener('scroll', throttle(checkVisibility, 200));
    
    // 检查元素可见性的函数
    function checkVisibility() {
        animatedSections.forEach(section => {
            if (isElementInViewport(section) && !section.classList.contains('animated')) {
                // 为section添加动画类
                section.classList.add('animated');
                
                // 为section内的子元素添加动画
                animateChildren(section);
            }
        });
    }
    
    // 判断元素是否在视窗内
    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.8 &&
            rect.bottom >= 100
        );
    }
    
    // 为元素内的子元素添加动画
    function animateChildren(section) {
        // 针对不同的部分应用不同的动画
        const sectionId = section.getAttribute('id');
        
        if (sectionId === 'Home') {
            // 首页视频部分特殊处理
            const titleBox = section.querySelector('.rough-box-title');
            if (titleBox) {
                titleBox.style.animation = 'fadeInUp 1s ease-out forwards';
            }
        } 
        else if (sectionId === 'Intro-1') {
            // 图表介绍1动画
            const chartElements = section.querySelectorAll('.chart-cell, .right-col > *');
            animateElementsSequentially(chartElements, 'fadeInUp', 150);
        } 
        else if (sectionId === 'Intro-2') {
            // Sankey图表部分动画
            const elements = [
                section.querySelector('.header'),
                section.querySelector('.year-selector'),
                section.querySelector('.left-column'),
                section.querySelector('.right-column')
            ];
            animateElementsSequentially(elements.filter(el => el), 'fadeInUp', 200);
        } 
        else if (sectionId === 'Intro-3') {
            // 气泡图部分动画
            const leftCol = section.querySelector('.left-col');
            const rightCol = section.querySelector('.right-col');
            
            if (leftCol) {
                leftCol.style.animation = 'fadeInLeft 0.8s ease-out forwards';
            }
            if (rightCol) {
                rightCol.style.animation = 'fadeInRight 0.8s ease-out forwards';
            }
        }
        else if (sectionId === 'chartArea') {
            // 地图部分动画
            const mapElements = section.querySelectorAll('.chart, .right-side-div');
            animateElementsSequentially(mapElements, 'fadeIn', 300);
        }
        else {
            // 其他部分使用默认动画
            const childElements = section.querySelectorAll('.news-item, .title-box');
            animateElementsSequentially(childElements, 'fadeInUp', 200);
        }
    }
    
    // 序列动画函数 - 按顺序给元素添加动画
    function animateElementsSequentially(elements, animationName, delay) {
        elements.forEach((el, index) => {
            if (el) {
                setTimeout(() => {
                    el.style.opacity = '0';
                    el.style.animation = `${animationName} 0.8s ease-out forwards`;
                }, index * delay);
            }
        });
    }
    
    // 节流函数 - 限制函数调用频率
    function throttle(func, delay) {
        let lastCall = 0;
        return function(...args) {
            const now = new Date().getTime();
            if (now - lastCall >= delay) {
                lastCall = now;
                return func.apply(this, args);
            }
        };
    }
}); 