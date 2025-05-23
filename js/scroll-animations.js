/**
 * 滚动触发动画效果
 * 为页面各个部分添加滚动显现动画
 */
document.addEventListener('DOMContentLoaded', function() {
    // 获取所有需要动画的部分
    const animatedSections = document.querySelectorAll('article > section');
    const article = document.querySelector('article');
    
    // 确保页面内容在加载时是可见的
    document.body.style.opacity = '1';
    
    // 确保所有基本元素先可见
    ensureContentVisible();
    
    // 初始化时先设置动画元素的初始状态
    prepareAnimations();
    
    // 初始化时检查哪些元素在视窗中
    checkVisibility();
    
    // 监听滚动事件 - 更频繁检查以使动画更流畅
    article.addEventListener('scroll', throttle(checkVisibility, 100));
    window.addEventListener('scroll', throttle(checkVisibility, 100));
    
    // 添加页面可见性变化监听，确保在切换回页面时动画正常
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            setTimeout(checkVisibility, 100);
        }
    });
    
    // 确保基本内容可见
    function ensureContentVisible() {
        // 确保主要内容区域可见
        const mainContent = document.querySelector('main');
        if (mainContent) mainContent.style.opacity = '1';
        
        // 确保article可见
        if (article) article.style.opacity = '1';
        
        // 确保所有section可见
        animatedSections.forEach(section => {
            section.style.opacity = '1';
            section.style.visibility = 'visible';
        });
    }
    
    // 初始化时准备所有section的动画
    function prepareAnimations() {
        animatedSections.forEach(section => {
            // 根据section的ID设置不同的初始状态
            const sectionId = section.getAttribute('id');
            
            if (sectionId === 'Home') {
                // 首页视频部分 - 确保视频背景可见
                const video = section.querySelector('.bg-video');
                if (video) video.style.opacity = '1';
                
                // 只对标题应用动画
                const titleBox = section.querySelector('.rough-box-title');
                if (titleBox) {
                    titleBox.style.opacity = '0';
                    titleBox.style.transform = 'translateY(40px)';
                    titleBox.style.transition = 'opacity 1.2s ease-out, transform 1.2s ease-out';
                }
            } 
            else if (sectionId === 'Intro-1') {
                // 图表介绍1动画 - 设置初始隐藏状态
                const chartElements = section.querySelectorAll('.chart-cell, .right-col > *');
                setInitialHiddenState(chartElements, 40, 0.15);
            } 
            else if (sectionId === 'Intro-2') {
                // Sankey图表部分动画
                const elements = [
                    section.querySelector('.header'),
                    section.querySelector('.year-selector'),
                    section.querySelector('.left-column'),
                    section.querySelector('.right-column')
                ];
                setInitialHiddenState(elements.filter(el => el), 40, 0.2);
            } 
            else if (sectionId === 'Intro-3') {
                // 气泡图部分动画
                const leftCol = section.querySelector('.left-col');
                const rightCol = section.querySelector('.right-col');
                
                if (leftCol) {
                    leftCol.style.opacity = '0';
                    leftCol.style.transform = 'translateX(-40px)';
                    leftCol.style.transition = 'opacity 1s ease-out, transform 1s ease-out';
                }
                if (rightCol) {
                    rightCol.style.opacity = '0';
                    rightCol.style.transform = 'translateX(40px)';
                    rightCol.style.transition = 'opacity 1s ease-out, transform 1s ease-out';
                }
            }
            else if (sectionId === 'chartArea') {
                // 地图部分动画 - 级联显示
                const mapElements = section.querySelectorAll('.chart, .right-side-div');
                setInitialHiddenState(mapElements, 30, 0.3);
            }
            else if (sectionId === 'finalMenu') {
                // 新闻卡片动画 - 每个卡片依次出现
                const newsItems = section.querySelectorAll('.news-item');
                setInitialHiddenState(newsItems, 50, 0.2);
                
                const titleBox = section.querySelector('.title-box');
                if (titleBox) {
                    titleBox.style.opacity = '0';
                    titleBox.style.transform = 'translateY(30px)';
                    titleBox.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
                }
            }
        });
    }
    
    // 设置元素的初始隐藏状态
    function setInitialHiddenState(elements, offset, delay) {
        elements.forEach((el, index) => {
            if (el) {
                el.style.opacity = '0';
                el.style.transform = `translateY(${offset}px)`;
                el.style.transition = `opacity 0.8s ease-out ${index * delay}s, transform 0.8s ease-out ${index * delay}s`;
            }
        });
    }
    
    // 检查元素可见性的函数 - 提前触发动画，让动画在滚动到元素前就开始
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
    
    // 判断元素是否在视窗内 - 更早触发动画
    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        
        // 当元素顶部进入视窗底部下方20%处就开始动画
        return (
            rect.top <= windowHeight * 0.9 &&
            rect.bottom >= 50
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
                titleBox.style.opacity = '1';
                titleBox.style.transform = 'translateY(0)';
            }
        } 
        else if (sectionId === 'Intro-1') {
            // 图表介绍1动画
            const chartElements = section.querySelectorAll('.chart-cell, .right-col > *');
            animateElements(chartElements);
        } 
        else if (sectionId === 'Intro-2') {
            // Sankey图表部分动画
            const elements = [
                section.querySelector('.header'),
                section.querySelector('.year-selector'),
                section.querySelector('.left-column'),
                section.querySelector('.right-column')
            ];
            animateElements(elements.filter(el => el));
        } 
        else if (sectionId === 'Intro-3') {
            // 气泡图部分动画
            const leftCol = section.querySelector('.left-col');
            const rightCol = section.querySelector('.right-col');
            
            if (leftCol) {
                leftCol.style.opacity = '1';
                leftCol.style.transform = 'translateX(0)';
            }
            if (rightCol) {
                rightCol.style.opacity = '1';
                rightCol.style.transform = 'translateX(0)';
            }
        }
        else if (sectionId === 'chartArea') {
            // 地图部分动画
            const mapElements = section.querySelectorAll('.chart, .right-side-div');
            animateElements(mapElements);
        }
        else if (sectionId === 'finalMenu') {
            // 新闻卡片动画
            const newsItems = section.querySelectorAll('.news-item');
            animateElements(newsItems);
            
            const titleBox = section.querySelector('.title-box');
            if (titleBox) {
                titleBox.style.opacity = '1';
                titleBox.style.transform = 'translateY(0)';
            }
        }
    }
    
    // 显示元素的动画
    function animateElements(elements) {
        elements.forEach(el => {
            if (el) {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }
        });
    }
    
    // 为chartArea区域添加特殊的交互效果
    const chartArea = document.getElementById('chartArea');
    if (chartArea) {
        const rightTexts = chartArea.querySelectorAll('.right-side-div');
        
        // 随着滚动逐渐显示文本块
        chartArea.addEventListener('scroll', function() {
            const scrollPosition = chartArea.scrollTop;
            const chartAreaHeight = chartArea.scrollHeight - chartArea.clientHeight;
            
            // 计算滚动百分比
            const scrollPercentage = scrollPosition / chartAreaHeight;
            
            // 根据滚动位置动态显示文本块
            rightTexts.forEach((text, index) => {
                const threshold = (index / (rightTexts.length - 1)) * 0.9;
                
                if (scrollPercentage >= threshold && !text.classList.contains('visible')) {
                    text.classList.add('visible');
                    text.style.opacity = '1';
                    text.style.transform = 'translateY(0)';
                }
            });
        });
        
        // 初始设置
        rightTexts.forEach((text, index) => {
            if (index > 0) {  // 第一个文本默认可见
                text.style.opacity = '0';
                text.style.transform = 'translateY(30px)';
                text.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
            } else {
                text.style.opacity = '1';
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
    
    // 初始检查一次
    setTimeout(checkVisibility, 500);
    
    // 另外，确保首页至少是可见的
    const homePage = document.getElementById('Home');
    if (homePage) {
        homePage.style.opacity = '1';
        homePage.style.visibility = 'visible';
        const titleElement = homePage.querySelector('.rough-box-title');
        if (titleElement) titleElement.style.opacity = '1';
    }
    
    // 每隔一段时间重新检查一次可见性，确保页面上的所有内容都能正确显示
    setInterval(checkVisibility, 2000);
}); 