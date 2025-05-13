(function ($) {
  
  "use strict";

    // Function to beautify section names
    function getSectionDisplayName(id) {
      switch(id) {
        case 'Home': return 'HOME';
        case 'Global': return 'GLOBAL';
        case 'Europe': case 'Europe​': return 'EUROPE';
        case 'WorldCup': return 'WORLD CUP';
        case 'Individual': return 'INDIVIDUAL';
        case 'Team': return 'TEAM';
        case 'References': case 'references': return 'REFERENCES';
        default: return id.toUpperCase();
      }
    }

    // 初始化sticky section标题
    function initStickySectionTitles() {
      const sectionTitles = document.querySelectorAll('.section-title');
      
      // 检查是否应该应用sticky
      function checkStickyTitles() {
        sectionTitles.forEach(titleEl => {
          const section = titleEl.closest('section');
          if (!section) return;
          
          const sectionId = section.getAttribute('id');
          const sectionTop = section.getBoundingClientRect().top;
          const sectionBottom = section.getBoundingClientRect().bottom;
          
          // 原始的标题位置相对于视窗
          const titleTop = titleEl.getBoundingClientRect().top;
          
          // 如果section可见并且标题需要sticky
          if (sectionTop <= 0 && sectionBottom > 100) {
            // 如果标题即将滚动出视窗，使其sticky
            if (titleTop <= 10) {
              if (!titleEl.classList.contains('sticky-title')) {
                titleEl.classList.add('sticky-title');
                section.classList.add('section-has-sticky-title');
              }
            }
          } else {
            // 否则，移除sticky
            titleEl.classList.remove('sticky-title');
            section.classList.remove('section-has-sticky-title');
          }
        });
      }
      
      // 初始检查
      checkStickyTitles();
      
      // 滚动时检查
      window.addEventListener('scroll', checkStickyTitles);
    }

    // NAVBAR
    $('.navbar-collapse a').on('click',function(){
      $(".navbar-collapse").collapse('hide');
    });

    // Initialize header on page load
    $(document).ready(function() {
      // Set initial section based on scroll position
      updateSectionBasedOnScroll();
      
      // 如果当前在某个section，立即更新显示
      if($(window).scrollTop() < 100) {
        $('#current-section-name').text('HOME');
      }
      
      // 初始化sticky section标题
      initStickySectionTitles();
      
      // Directly call animation functions when document is ready
      initAOSAnimations();
      
      // Initialize AOS
      AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        mirror: false
      });
    });
    
    // Scrollbar indicator click events
    $('.scrollbar-indicator li').on('click', function() {
      var target = $(this).data('target');
      if(target) {
        var targetElement = $(target);
        if(targetElement.length) {
          var headerHeight = 0; // 移除固定高度偏移
          var targetOffset = targetElement.offset().top - headerHeight;
      
      $('html, body').animate({
        scrollTop: targetOffset
          }, 500);
        }
      }
    });
    
    // Simplified navigation handling - 移除right-side-menu相关代码
    $('.nav-link, .smoothscroll').on('click', function(e) {
      e.preventDefault();
      
      var target = $(this).attr('href');
      if(target.length) {
        var targetElement = $(target);
        if(targetElement.length) {
          // 完全滚动到目标位置的顶部，只保留很小的偏移量
          var headerHeight = 0; // 移除固定高度偏移
          var targetOffset = targetElement.offset().top - headerHeight;
      
      $('html, body').animate({
        scrollTop: targetOffset
          }, 500);
          
          // Update active states
          $('.nav-link').removeClass('active');
          $('.nav-link[href="' + target + '"]').addClass('active');
          
          // Update header section name
          var sectionName = target.replace('#', '');
          $('#current-section-name').text(getSectionDisplayName(sectionName));
        }
      }
    });
    
    // Function to update section based on scroll position
    function updateSectionBasedOnScroll() {
      var scrollPosition = $(window).scrollTop();
      
      // Check each section
      $('section[id]').each(function() {
        var target = $(this);
        var id = target.attr('id');
        var offset = target.offset().top - 60; // 减少偏移量，更准确地检测section位置
        var height = target.outerHeight();
        
        if(scrollPosition >= offset && scrollPosition < offset + height) {
          // Update active menu items - 移除right-side-menu相关代码
          $('.nav-link').removeClass('active');
          $('.nav-link[href="#' + id + '"]').addClass('active');
          
          // Update scrollbar indicator
          $('.scrollbar-indicator li').removeClass('active');
          $('.scrollbar-indicator li[data-target="#' + id + '"]').addClass('active');
          
          // Update header section name
          $('#current-section-name').text(getSectionDisplayName(id));
        }
      });
    }
    
    // Update active state on scroll
    $(window).on('scroll', updateSectionBasedOnScroll);

    // 移除navbar-toggler的点击事件，使用hover效果代替
    $('.navbar-toggler').off('click');
    
    // 禁用bootstrap自带的collapse功能
    $('.navbar-toggler').attr('data-bs-toggle', '');
    $('.navbar-collapse').removeClass('collapse');
    
    // 添加触摸设备支持
    if('ontouchstart' in window) {
      // 触摸设备上使用点击切换
      $('.hamburger-menu').on('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).find('.navbar-collapse').toggleClass('show-mobile');
      });
      
      // 点击菜单外区域关闭菜单
      $(document).on('touchstart', function(e) {
        if (!$(e.target).closest('.hamburger-menu').length) {
          $('.navbar-collapse').removeClass('show-mobile');
        }
      });
    }

    // Add smooth transition effect between sections
    (function () {
        const heroSection = document.querySelector('.hero-section');
        const introSection = document.querySelector('#Introduction');
        const transitionOverlay = document.querySelector('.section-transition-overlay');
        const body = document.body;
        
        if (heroSection && introSection && transitionOverlay) {
            const heroHeight = heroSection.offsetHeight;
            const introOffset = introSection.offsetTop;
            
            window.addEventListener('scroll', function() {
                const scrollPosition = window.scrollY;
                
                // Calculate transition progress (0 to 1)
                let progress = 0;
                
                // Start transition at 70% of the hero section height
                if (scrollPosition > heroHeight * 0.7) {
                    // Calculate progress between 0 and 1
                    progress = Math.min(1, (scrollPosition - (heroHeight * 0.7)) / (heroHeight * 0.3));
                    
                    // Apply opacity to the transition overlay
                    transitionOverlay.style.opacity = progress;
                    
                    // Add class to body when scrolling down for additional effects
                    if (progress > 0.5) {
                        body.classList.add('scrolling-down');
                    } else {
                        body.classList.remove('scrolling-down');
                    }
                } else {
                    // Reset when scrolling back up
                    transitionOverlay.style.opacity = 0;
                    body.classList.remove('scrolling-down');
                }
            });
        }
    })();

    // Add AOS-like animation initialization
    (function() {
        // Initialize AOS-like animations
        function initAOSAnimations() {
            const animatedElements = document.querySelectorAll('[data-aos]');
            
            // Check if element is in viewport
            function isInViewport(element) {
                const rect = element.getBoundingClientRect();
                return (
                    rect.top <= (window.innerHeight * 0.75) &&
                    rect.bottom >= 0
                );
            }
            
            // Add animation class when element is in viewport
            function checkVisibility() {
                animatedElements.forEach(element => {
                    if (isInViewport(element) && !element.classList.contains('aos-animate')) {
                        element.classList.add('aos-animate');
                    }
                });
            }
            
            // Initial check
            checkVisibility();
            
            // Check on scroll
            window.addEventListener('scroll', checkVisibility);
        }

        // Initialize sticky section titles
        function initStickySectionTitles() {
            // Get all section titles
            const sectionTitles = document.querySelectorAll('.section-title');
            
            // Function to check if title should be sticky
            function checkStickyTitles() {
                sectionTitles.forEach(titleEl => {
                    const section = titleEl.closest('section');
                    if (!section) return;
                    
                    const sectionId = section.getAttribute('id');
                    const sectionTop = section.getBoundingClientRect().top;
                    const sectionBottom = section.getBoundingClientRect().bottom;
                    
                    // Title's original position relative to viewport
                    const titleTop = titleEl.getBoundingClientRect().top;
                    
                    // If section is visible and title should be sticky
                    if (sectionTop <= 0 && sectionBottom > 100) {
                        // If title is about to go off screen, make it sticky
                        if (titleTop <= 10) {
                            if (!titleEl.classList.contains('sticky-title')) {
                                titleEl.classList.add('sticky-title');
                                section.classList.add('section-has-sticky-title');
                            }
                        }
                    } else {
                        // Otherwise, remove sticky
                        titleEl.classList.remove('sticky-title');
                        section.classList.remove('section-has-sticky-title');
                    }
                });
            }
            
            // Initial check
            checkStickyTitles();
            
            // Check on scroll
            window.addEventListener('scroll', checkStickyTitles);
        }
        
        // Call both initialization functions
        initAOSAnimations();
        initStickySectionTitles();
    })();

    // Carbon Emissions Comparison Chart Animation
    (function() {
        // Initialize emissions chart
        function initEmissionsChart() {
            const jetsElement = document.getElementById('jets-icons');
            const carsElement = document.getElementById('cars-icons');
            const trainsElement = document.getElementById('trains-icons');
            
            if (jetsElement && carsElement && trainsElement) {
                // Set up icons (limited number for visual clarity)
                const jetsCount = 3; // Representing 315 private jets
                const carsCount = 27; // Representing 23,134 petrol cars
                const trainsCount = 33; // Representing 72,872 trains
                
                // Create icons with SVG
                createSvgIcons(jetsElement, jetsCount, 'plane', 'icon-jet');
                createSvgIcons(carsElement, carsCount, 'car', 'icon-car');
                createSvgIcons(trainsElement, trainsCount, 'train', 'icon-train');
                
                // Auto-trigger animation for first view
                animateChartOnScroll();
                
                // Make icons visible immediately for better visual effect
                setTimeout(() => {
                    makeIconsVisible(jetsElement);
                    setTimeout(() => {
                        makeIconsVisible(carsElement);
                        setTimeout(() => {
                            makeIconsVisible(trainsElement);
                        }, 300);
        }, 300);
                }, 500);
            }
        }
        
        // Helper function to make all icons visible
        function makeIconsVisible(container) {
            if (container) {
                const icons = container.querySelectorAll('.emission-icon');
                icons.forEach((icon, index) => {
                    setTimeout(() => {
                        icon.classList.add('visible');
                    }, index * 20);
                });
            }
        }
        
        // Helper function to create SVG icons
        function createSvgIcons(container, count, iconType, className) {
            let iconHTML = '';
            
            // Set appropriate SVG content based on icon type
            let svgContent = '';
            if (iconType === 'plane') {
                svgContent = `<svg class="svg-icon" viewBox="0 0 1024 1024" width="24" height="24"><path d="M499.260235 128.602353c-39.815529 19.877647-72.583529 70.475294-72.583529 136.824471l-0.030118 120.199529-262.806588 219.075765a26.352941 26.352941 0 0 0-9.487059 20.239058v70.264471l0.210824 3.403294a26.352941 26.352941 0 0 0 37.948235 20.178824l242.928941-121.494589v107.91153l-83.817412 134.174118-1.505882 2.68047c-10.059294 20.781176 10.480941 44.423529 33.099294 35.960471l131.282824-49.272471 131.312941 49.272471 2.921412 0.903529c22.377412 5.752471 41.472-19.094588 28.672-39.54447l-83.84753-134.174118v-107.91153l242.959059 121.494589a26.352941 26.352941 0 0 0 38.159059-23.582118V624.941176l-0.210824-3.312941a26.352941 26.352941 0 0 0-9.276235-16.926117L602.352941 385.626353v-120.169412c0-69.029647-35.448471-120.982588-77.402353-139.083294a26.352941 26.352941 0 0 0-20.871529 0l-4.818824 2.258824z" fill="#ffffff" /></svg>`;
            } else if (iconType === 'car') {
                svgContent = `<svg class="svg-icon" viewBox="0 0 1024 1024" width="20" height="20"><path d="M42.01503 482.831515a31.030303 31.030303 0 0 1 31.030303-31.030303h868.848485a31.030303 31.030303 0 1 1 0 62.060606h-868.848485a31.030303 31.030303 0 0 1-31.030303-31.030303zM724.681697 700.043636a31.030303 31.030303 0 0 1 31.030303 31.030303v93.090909h93.090909v-93.090909a31.030303 31.030303 0 1 1 62.060606 0v93.090909a62.060606 62.060606 0 0 1-62.060606 62.060607h-93.090909a62.060606 62.060606 0 0 1-62.060606-62.060607v-93.090909a31.030303 31.030303 0 0 1 31.030303-31.030303zM135.105939 700.043636a31.030303 31.030303 0 0 1 31.030303 31.030303v93.090909h93.09091v-93.090909a31.030303 31.030303 0 1 1 62.060606 0v93.090909a62.060606 62.060606 0 0 1-62.060606 62.060607h-93.09091a62.060606 62.060606 0 0 1-62.060606-62.060607v-93.090909a31.030303 31.030303 0 0 1 31.030303-31.030303zM228.196848 606.952727a31.030303 31.030303 0 0 1 31.030304-31.030303h62.060606a31.030303 31.030303 0 1 1 0 62.060606h-62.060606a31.030303 31.030303 0 0 1-31.030304-31.030303zM662.621091 606.952727a31.030303 31.030303 0 0 1 31.030303-31.030303h62.060606a31.030303 31.030303 0 1 1 0 62.060606h-62.060606a31.030303 31.030303 0 0 1-31.030303-31.030303z" fill="#ffffff" /><path d="M245.573818 182.551273a62.060606 62.060606 0 0 1 33.82303-10.022788h456.145455a62.060606 62.060606 0 0 1 56.723394 36.864l115.929212 260.840727a31.030303 31.030303 0 0 1 2.668606 12.598303v248.242424a31.030303 31.030303 0 0 1-31.030303 31.030303h-744.727273a31.030303 31.030303 0 0 1-31.030303-31.030303v-248.242424a31.030303 31.030303 0 0 1 2.668606-12.598303l115.929213-260.840727a62.060606 62.060606 0 0 1 22.900363-26.841212z" fill="#ffffff" /></svg>`;
            } else if (iconType === 'train') {
                svgContent = `<svg class="svg-icon" viewBox="0 0 1024 1024" width="20" height="20"><path d="M768 405.323294c13.432471 0 24.515765 10.059294 26.142118 23.070118l0.210823 3.312941v175.676235a166.912 166.912 0 0 1-160.346353 166.761412l-6.565647 0.120471h-245.940706a166.912 166.912 0 0 1-166.791529-160.346353l-0.120471-6.53553v-175.706353a26.352941 26.352941 0 0 1 52.495059-3.312941l0.210824 3.312941v175.706353a114.206118 114.206118 0 0 0 108.333176 114.025412l5.872941 0.150588h245.940706a114.206118 114.206118 0 0 0 114.05553-108.303059l0.150588-5.872941v-175.706353c0-14.546824 11.806118-26.352941 26.352941-26.352941z" fill="#ffffff" /><path d="M680.146824 721.558588c13.432471 0 24.545882 10.059294 26.172235 23.070118l0.180706 3.312941v70.264471a26.352941 26.352941 0 0 1-52.495059 3.312941l-0.210824-3.312941v-70.294589c0-14.546824 11.806118-26.352941 26.352942-26.352941zM328.794353 721.558588c13.432471 0 24.515765 10.059294 26.142118 23.070118l0.210823 3.312941v70.264471a26.352941 26.352941 0 0 1-52.525176 3.312941l-0.180706-3.312941v-70.294589c0-14.546824 11.776-26.352941 26.352941-26.352941zM574.735059 826.970353a26.352941 26.352941 0 0 1 3.312941 52.525176l-3.312941 0.180706h-140.528941a26.352941 26.352941 0 0 1-3.312942-52.495059l3.312942-0.210823h140.528941zM504.470588 124.235294c-147.757176 0-289.882353 144.564706-289.882353 243.531294v63.909647c0 14.576941 11.806118 26.352941 26.352941 26.352941h527.058824a26.352941 26.352941 0 0 0 26.352941-26.352941v-63.909647c0-98.966588-142.125176-243.531294-289.882353-243.531294z" fill="#ffffff" /></svg>`;
            }
            
            // Create specified number of icons
            for (let i = 0; i < count; i++) {
                iconHTML += `<span class="emission-icon ${className}">${svgContent}</span>`;
            }
            
            container.innerHTML = iconHTML;
        }
        
        // Animate chart when scrolled into view
        function animateChartOnScroll() {
            const introSection = document.getElementById('Introduction');
            
            if (introSection) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            // Animation will be handled by the makeIconsVisible function
                            observer.unobserve(introSection);
                        }
                    });
                }, { threshold: 0.3 });
                
                observer.observe(introSection);
            }
        }
        
        // Run on document ready
        document.addEventListener('DOMContentLoaded', initEmissionsChart);
    })();
  
  })(window.jQuery);


