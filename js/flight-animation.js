/**
 * Flight Animation between Global, Europe and World Cup sections
 * Implements an animated flight path that transforms between places
 */

(function() {
    'use strict';
    
    // DOM Elements
    let animationContainer = null;
    let plane = null;
    let person = null;
    let globe = null;
    let flightPath = null;
    
    // Animation states
    const ANIMATION_STATES = {
        INITIAL: 'initial',
        INTRO_ANIMATION: 'intro-animation',
        GLOBAL_TO_EUROPE: 'global-to-europe',
        EUROPE_TO_WORLDCUP: 'europe-to-worldcup',
        TRANSFORM_TO_PERSON: 'transform-to-person',
        PERSON_CIRCLING: 'person-circling'
    };
    
    let currentState = ANIMATION_STATES.INITIAL;
    let animationActive = false;
    
    // Animation coordinates
    const PATHS = {
        INTRO_ANIMATION: [
            { x: 10, y: 40 },  // Starting point
            { x: 30, y: 20 },  // Control point 1
            { x: 70, y: 60 },  // Control point 2
            { x: 90, y: 40 }   // End point
        ],
        GLOBAL_TO_EUROPE: [
            { x: 20, y: 50 },  // Starting point (Global)
            { x: 45, y: 30 },  // Control point 1
            { x: 50, y: 40 },  // Control point 2
            { x: 60, y: 30 }   // End point (Europe)
        ],
        EUROPE_TO_WORLDCUP: [
            { x: 60, y: 30 },  // Starting point (Europe)
            { x: 70, y: 40 },  // Control point 1
            { x: 75, y: 50 },  // Control point 2
            { x: 80, y: 45 }   // End point (Russia/World Cup)
        ],
        PERSON_CIRCLE: [
            { x: 50, y: 50 },  // Center point
            { r: 40 }          // Radius
        ]
    };
    
    // Initialize the animation
    function init() {
        // Create container for animation
        createAnimationContainer();
        
        // Create SVG elements
        createSvgElements();
        
        // Setup scroll triggers for animation states
        setupScrollTriggers();
        
        // Setup click handlers for manual triggering
        setupClickHandlers();
        
        // Automatically show intro animation when page loads
        setTimeout(animateIntroduction, 1000);
    }
    
    // Create container for the animation
    function createAnimationContainer() {
        animationContainer = document.createElement('div');
        animationContainer.className = 'flight-animation-container';
        
        // Style the container
        animationContainer.style.position = 'fixed';
        animationContainer.style.top = '0';
        animationContainer.style.left = '0';
        animationContainer.style.width = '100%';
        animationContainer.style.height = '100%';
        animationContainer.style.zIndex = '999';
        animationContainer.style.pointerEvents = 'none';
        animationContainer.style.opacity = '0';
        animationContainer.style.transition = 'opacity 0.5s ease';
        
        // Create SVG container
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.id = 'flight-animation-svg';
        
        animationContainer.appendChild(svg);
        document.body.appendChild(animationContainer);
    }
    
    // Create SVG elements for the animation
    function createSvgElements() {
        const svg = document.getElementById('flight-animation-svg');
        
        // Create globe background
        globe = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        globe.setAttribute('cx', '50%');
        globe.setAttribute('cy', '50%');
        globe.setAttribute('r', '45%');
        globe.setAttribute('fill', 'transparent');
        globe.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
        globe.setAttribute('stroke-width', '1');
        globe.classList.add('world-globe');
        globe.style.opacity = '0';
        globe.style.fill = 'transparent';
        
        // Create flight path
        flightPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        flightPath.setAttribute('stroke', 'rgba(255, 255, 255, 0.7)');
        flightPath.setAttribute('stroke-width', '2');
        flightPath.setAttribute('stroke-dasharray', '5,5');
        flightPath.setAttribute('fill', 'none');
        flightPath.classList.add('flight-path');
        
        // Create airplane element
        plane = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        plane.setAttribute('d', 'M25,0 L35,10 L25,20 L5,15 L0,10 L5,5 Z');
        plane.setAttribute('fill', 'white');
        plane.setAttribute('stroke', 'rgba(255, 255, 255, 0.8)');
        plane.setAttribute('stroke-width', '1');
        plane.setAttribute('transform', 'translate(20, 50) scale(0.5) rotate(0)');
        plane.classList.add('plane-icon');
        
        // Create person element (initially hidden)
        person = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        person.setAttribute('d', 'M10,0 C15,0 15,5 10,5 C5,5 5,0 10,0 M5,10 C15,10 15,20 5,25 M15,10 C5,10 5,20 15,25 M10,5 L10,15 M10,15 L5,30 M10,15 L15,30');
        person.setAttribute('stroke', 'white');
        person.setAttribute('stroke-width', '2');
        person.setAttribute('fill', 'none');
        person.setAttribute('transform', 'translate(80, 45) scale(0.5)');
        person.style.opacity = '0';
        person.classList.add('person-icon');
        
        // Add elements to SVG
        svg.appendChild(globe);
        svg.appendChild(flightPath);
        svg.appendChild(plane);
        svg.appendChild(person);
    }
    
    // Setup scroll triggers for the animation
    function setupScrollTriggers() {
        window.addEventListener('scroll', function() {
            const scrollPosition = window.scrollY;
            const windowHeight = window.innerHeight;
            
            // Get section positions
            const introSection = document.getElementById('Introduction');
            const globalSection = document.getElementById('Global');
            const europeSection = document.getElementById('Europe') || document.getElementById('Europe​');
            const worldCupSection = document.getElementById('WorldCup');
            
            if (!introSection || !globalSection || !europeSection || !worldCupSection) {
                return;
            }
            
            const introTop = introSection.getBoundingClientRect().top + scrollPosition;
            const globalTop = globalSection.getBoundingClientRect().top + scrollPosition;
            const europeTop = europeSection.getBoundingClientRect().top + scrollPosition;
            const worldCupTop = worldCupSection.getBoundingClientRect().top + scrollPosition;
            
            // Determine current section based on scroll position
            if (scrollPosition >= introTop - windowHeight/2 && scrollPosition < globalTop - windowHeight/2) {
                // In Introduction section
                if (currentState !== ANIMATION_STATES.INTRO_ANIMATION) {
                    animateIntroduction();
                }
            } else if (scrollPosition >= globalTop - windowHeight/2 && scrollPosition < europeTop - windowHeight/2) {
                // In Global section
                if (currentState !== ANIMATION_STATES.GLOBAL_TO_EUROPE) {
                    animateGlobalToEurope();
                }
            } else if (scrollPosition >= europeTop - windowHeight/2 && scrollPosition < worldCupTop - windowHeight/2) {
                // In Europe section
                if (currentState !== ANIMATION_STATES.EUROPE_TO_WORLDCUP) {
                    animateEuropeToWorldCup();
                }
            } else if (scrollPosition >= worldCupTop - windowHeight/2) {
                // In World Cup section
                if (currentState !== ANIMATION_STATES.TRANSFORM_TO_PERSON) {
                    animateTransformToPerson();
                    
                    // After a short delay, start circling
                    setTimeout(function() {
                        if (currentState === ANIMATION_STATES.TRANSFORM_TO_PERSON) {
                            animatePersonCircling();
                        }
                    }, 1000);
                }
            }
        });
    }
    
    // Setup click handlers for manual triggering
    function setupClickHandlers() {
        // Menu click handlers to trigger animations when clicking the navigation
        const introLink = document.querySelector('a[href="#Introduction"]');
        const globalLink = document.querySelector('a[href="#Global"]');
        const europeLink = document.querySelector('a[href="#Europe"]') || document.querySelector('a[href="#Europe​"]');
        const worldCupLink = document.querySelector('a[href="#WorldCup"]');
        
        if (introLink) {
            introLink.addEventListener('click', function(e) {
                setTimeout(function() {
                    animateIntroduction();
                }, 500);
            });
        }
        
        if (globalLink) {
            globalLink.addEventListener('click', function(e) {
                setTimeout(function() {
                    animateGlobalToEurope();
                }, 500);
            });
        }
        
        if (europeLink) {
            europeLink.addEventListener('click', function(e) {
                setTimeout(function() {
                    animateEuropeToWorldCup();
                }, 500);
            });
        }
        
        if (worldCupLink) {
            worldCupLink.addEventListener('click', function(e) {
                setTimeout(function() {
                    animateTransformToPerson();
                    
                    // After a short delay, start circling
                    setTimeout(function() {
                        animatePersonCircling();
                    }, 1000);
                }, 500);
            });
        }
    }
    
    // Animate introduction sequence
    function animateIntroduction() {
        if (animationActive) return;
        
        currentState = ANIMATION_STATES.INTRO_ANIMATION;
        animationActive = true;
        
        // Show the animation container
        animationContainer.style.opacity = '1';
        
        // Reset the plane and person state
        plane.style.opacity = '1';
        person.style.opacity = '0';
        
        // Create a more interesting path for the intro animation
        const path = PATHS.INTRO_ANIMATION;
        const pathData = `M${path[0].x}%,${path[0].y}% C${path[1].x}%,${path[1].y}% ${path[2].x}%,${path[2].y}% ${path[3].x}%,${path[3].y}%`;
        flightPath.setAttribute('d', pathData);
        
        // Position the plane at the start of the path
        plane.setAttribute('transform', `translate(${path[0].x}%, ${path[0].y}%) scale(0.5) rotate(0)`);
        
        // Animate the plane along the path
        const pathLength = flightPath.getTotalLength();
        let start = null;
        const duration = 5000; // 5 seconds for a longer intro animation
        
        function animatePlane(timestamp) {
            if (!start) start = timestamp;
            const elapsed = timestamp - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // Get point at current position
            const point = flightPath.getPointAtLength(progress * pathLength);
            
            // Calculate angle for rotation
            let angle = 0;
            if (progress < 1) {
                const pointAhead = flightPath.getPointAtLength((progress + 0.01) * pathLength);
                angle = Math.atan2(pointAhead.y - point.y, pointAhead.x - point.x) * 180 / Math.PI;
            }
            
            // Update plane position and rotation
            plane.setAttribute('transform', `translate(${point.x}, ${point.y}) scale(0.5) rotate(${angle})`);
            
            // Continue animation if not finished
            if (progress < 1) {
                requestAnimationFrame(animatePlane);
            } else {
                // When complete, loop back to the start with a fade effect
                setTimeout(function() {
                    if (currentState === ANIMATION_STATES.INTRO_ANIMATION) {
                        // Fade out
                        animationContainer.style.opacity = '0';
                        
                        // Wait and then restart the animation
                        setTimeout(function() {
                            if (currentState === ANIMATION_STATES.INTRO_ANIMATION) {
                                animationActive = false;
                                animateIntroduction();
                            }
                        }, 1000);
                    } else {
                        animationActive = false;
                    }
                }, 1000);
            }
        }
        
        requestAnimationFrame(animatePlane);
    }
    
    // Animate plane from Global to Europe
    function animateGlobalToEurope() {
        if (animationActive) return;
        
        currentState = ANIMATION_STATES.GLOBAL_TO_EUROPE;
        animationActive = true;
        
        // Show the animation container
        animationContainer.style.opacity = '1';
        
        // Set the flight path
        const path = PATHS.GLOBAL_TO_EUROPE;
        const pathData = `M${path[0].x}%,${path[0].y}% C${path[1].x}%,${path[1].y}% ${path[2].x}%,${path[2].y}% ${path[3].x}%,${path[3].y}%`;
        flightPath.setAttribute('d', pathData);
        
        // Animate the plane along the path
        const pathLength = flightPath.getTotalLength();
        let start = null;
        const duration = 3000; // 3 seconds
        
        function animatePlane(timestamp) {
            if (!start) start = timestamp;
            const elapsed = timestamp - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // Get point at current position
            const point = flightPath.getPointAtLength(progress * pathLength);
            
            // Calculate angle for rotation
            let angle = 0;
            if (progress < 1) {
                const pointAhead = flightPath.getPointAtLength((progress + 0.01) * pathLength);
                angle = Math.atan2(pointAhead.y - point.y, pointAhead.x - point.x) * 180 / Math.PI;
            }
            
            // Update plane position and rotation
            plane.setAttribute('transform', `translate(${point.x}, ${point.y}) scale(0.5) rotate(${angle})`);
            
            // Continue animation if not finished
            if (progress < 1) {
                requestAnimationFrame(animatePlane);
            } else {
                animationActive = false;
                
                // Hide animation after completing
                setTimeout(function() {
                    animationContainer.style.opacity = '0';
                }, 1000);
            }
        }
        
        requestAnimationFrame(animatePlane);
    }
    
    // Animate plane from Europe to World Cup
    function animateEuropeToWorldCup() {
        if (animationActive) return;
        
        currentState = ANIMATION_STATES.EUROPE_TO_WORLDCUP;
        animationActive = true;
        
        // Show the animation container
        animationContainer.style.opacity = '1';
        
        // Set the flight path
        const path = PATHS.EUROPE_TO_WORLDCUP;
        const pathData = `M${path[0].x}%,${path[0].y}% C${path[1].x}%,${path[1].y}% ${path[2].x}%,${path[2].y}% ${path[3].x}%,${path[3].y}%`;
        flightPath.setAttribute('d', pathData);
        
        // Position the plane at the start of the path
        plane.setAttribute('transform', `translate(${path[0].x}%, ${path[0].y}%) scale(0.5) rotate(0)`);
        
        // Animate the plane along the path
        const pathLength = flightPath.getTotalLength();
        let start = null;
        const duration = 3000; // 3 seconds
        
        function animatePlane(timestamp) {
            if (!start) start = timestamp;
            const elapsed = timestamp - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // Get point at current position
            const point = flightPath.getPointAtLength(progress * pathLength);
            
            // Calculate angle for rotation
            let angle = 0;
            if (progress < 1) {
                const pointAhead = flightPath.getPointAtLength((progress + 0.01) * pathLength);
                angle = Math.atan2(pointAhead.y - point.y, pointAhead.x - point.x) * 180 / Math.PI;
            }
            
            // Update plane position and rotation
            plane.setAttribute('transform', `translate(${point.x}, ${point.y}) scale(0.5) rotate(${angle})`);
            
            // Continue animation if not finished
            if (progress < 1) {
                requestAnimationFrame(animatePlane);
            } else {
                animationActive = false;
                
                // Don't hide animation as we'll transform into a person next
            }
        }
        
        requestAnimationFrame(animatePlane);
    }
    
    // Transform plane into person
    function animateTransformToPerson() {
        if (animationActive) return;
        
        currentState = ANIMATION_STATES.TRANSFORM_TO_PERSON;
        animationActive = true;
        
        // Show the animation container
        animationContainer.style.opacity = '1';
        
        // Get final plane position
        const path = PATHS.EUROPE_TO_WORLDCUP;
        const finalX = path[3].x;
        const finalY = path[3].y;
        
        // Animate the transformation
        let start = null;
        const duration = 1500; // 1.5 seconds
        
        function animateTransform(timestamp) {
            if (!start) start = timestamp;
            const elapsed = timestamp - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // Fade out plane
            plane.style.opacity = 1 - progress;
            
            // Fade in person
            person.style.opacity = progress;
            
            // Move and scale person
            person.setAttribute('transform', `translate(${finalX}%, ${finalY}%) scale(${0.5 + progress * 0.5})`);
            
            // Continue animation if not finished
            if (progress < 1) {
                requestAnimationFrame(animateTransform);
            } else {
                animationActive = false;
            }
        }
        
        requestAnimationFrame(animateTransform);
    }
    
    // Animate person circling the globe
    function animatePersonCircling() {
        currentState = ANIMATION_STATES.PERSON_CIRCLING;
        animationActive = true;
        
        // Set up the circular path
        const center = PATHS.PERSON_CIRCLE[0];
        const radius = PATHS.PERSON_CIRCLE[1].r;
        
        // Create a circular path for animation
        const circlePathData = `M${center.x + radius}%,${center.y}% a${radius}%,${radius}% 0 1,1 -${radius * 2}%,0 a${radius}%,${radius}% 0 1,1 ${radius * 2}%,0`;
        flightPath.setAttribute('d', circlePathData);
        
        // Position the person at the start of the path
        person.setAttribute('transform', `translate(${center.x + radius}%, ${center.y}%) scale(1) rotate(90)`);
        
        // Animate the person along the circular path
        const pathLength = flightPath.getTotalLength();
        let start = null;
        const duration = 10000; // 10 seconds for a full circle
        
        function animatePersonOnCircle(timestamp) {
            if (!start) start = timestamp;
            const elapsed = (timestamp - start) % duration;
            const progress = elapsed / duration;
            
            // Get point at current position
            const point = flightPath.getPointAtLength(progress * pathLength);
            
            // Calculate angle for rotation - person should face tangent to circle
            let angle = 90 + progress * 360; // Rotate around the circle
            
            // Update person position and rotation
            person.setAttribute('transform', `translate(${point.x}, ${point.y}) scale(1) rotate(${angle})`);
            
            // Continue animation indefinitely
            if (currentState === ANIMATION_STATES.PERSON_CIRCLING) {
                requestAnimationFrame(animatePersonOnCircle);
            } else {
                animationActive = false;
            }
        }
        
        requestAnimationFrame(animatePersonOnCircle);
    }
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', init);
})(); 