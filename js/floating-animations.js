document.addEventListener('DOMContentLoaded', function() {
    console.log("Animation script loaded");
    
    // Elements
    const airplane1 = document.querySelector('.airplane-1');
    const airplane2 = document.querySelector('.airplane-2');
    const airplane3 = document.querySelector('.airplane-3');
    const airplane4 = document.querySelector('.airplane-4');
    const cloud1 = document.querySelector('.cloud-1');
    const cloud2 = document.querySelector('.cloud-2');
    const cloud3 = document.querySelector('.cloud-3');
    const cloud4 = document.querySelector('.cloud-4');
    const cloud5 = document.querySelector('.cloud-5');
    const cloud6 = document.querySelector('.cloud-6');
    
    // Check if elements exist
    if (!airplane1 || !airplane2 || !cloud1 || !cloud2 || !cloud3) {
        console.error("One or more required floating elements not found");
        return;
    }
    
    // Get reference header
    const referenceHeader = document.querySelector('.reference-header');
    let headerRect = null;
    let titleBarBottom = 100; // Fallback value
    
    if (referenceHeader) {
        headerRect = referenceHeader.getBoundingClientRect();
        titleBarBottom = headerRect.bottom;
        console.log("Header position:", headerRect);
    } else {
        console.warn("Reference header not found");
    }

    // Position elements in header
    placeInHeader(airplane1, 'right'); // airplane1 in header, right area
    placeInHeader(cloud1, 'left');     // cloud1 in header, left area
    
    // Position other elements in different page quadrants
    // Quadrant 1: Top Left (below navbar)
    placeInQuadrant(airplane3, 0.1, 0.45, 0.1, 0.45);
    placeInQuadrant(cloud4, 0.15, 0.4, 0.2, 0.4);
    
    // Quadrant 2: Top Right (below navbar)
    placeInQuadrant(cloud5, 0.55, 0.9, 0.1, 0.45);
    
    // Quadrant 3: Bottom Left
    placeInQuadrant(airplane2, 0.1, 0.45, 0.55, 0.9);
    placeInQuadrant(cloud3, 0.2, 0.4, 0.6, 0.85);
    
    // Quadrant 4: Bottom Right
    placeInQuadrant(airplane4, 0.55, 0.9, 0.55, 0.9);
    placeInQuadrant(cloud2, 0.6, 0.85, 0.65, 0.9);
    placeInQuadrant(cloud6, 0.65, 0.9, 0.5, 0.75);
    
    // Start animations with different intervals
    // Header elements
    setInterval(() => moveInHeader(airplane1, 'right'), 3000);
    setInterval(() => moveInHeader(cloud1, 'left'), 4000);
    
    // Quadrant 1: Top Left
    setInterval(() => moveInQuadrant(airplane3, 0.1, 0.45, 0.1, 0.45), 4200);
    setInterval(() => moveInQuadrant(cloud4, 0.15, 0.4, 0.2, 0.4), 3700);
    
    // Quadrant 2: Top Right
    setInterval(() => moveInQuadrant(cloud5, 0.55, 0.9, 0.1, 0.45), 5100);
    
    // Quadrant 3: Bottom Left
    setInterval(() => moveInQuadrant(airplane2, 0.1, 0.45, 0.55, 0.9), 4500);
    setInterval(() => moveInQuadrant(cloud3, 0.2, 0.4, 0.6, 0.85), 3800);
    
    // Quadrant 4: Bottom Right
    setInterval(() => moveInQuadrant(airplane4, 0.55, 0.9, 0.55, 0.9), 4300);
    setInterval(() => moveInQuadrant(cloud2, 0.6, 0.85, 0.65, 0.9), 5500);
    setInterval(() => moveInQuadrant(cloud6, 0.65, 0.9, 0.5, 0.75), 4700);
    
    // Mouse interaction
    document.addEventListener('mousemove', function(e) {
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        // Only react to mouse if mouse is in the element's designated area
        if (headerRect && mouseY <= headerRect.bottom + 10) {
            // Header area
            avoidMouse(airplane1, mouseX, mouseY, 'header-right');
            avoidMouse(cloud1, mouseX, mouseY, 'header-left');
        } else {
            // Quadrant areas - check each element's position
            const elements = [airplane2, airplane3, airplane4, cloud2, cloud3, cloud4, cloud5, cloud6];
            elements.forEach(element => {
                if (element) {
                    const rect = element.getBoundingClientRect();
                    // Only react if mouse is near element
                    const diffX = mouseX - (rect.left + rect.width/2);
                    const diffY = mouseY - (rect.top + rect.height/2);
                    const distance = Math.sqrt(diffX * diffX + diffY * diffY);
                    
                    if (distance < 150) {
                        avoidMouse(element, mouseX, mouseY, 'quadrant');
                    }
                }
            });
        }
    });
    
    // Functions for positioning
    function placeInHeader(element, position) {
        if (!headerRect) return placeInLowerArea(element, 0.3, 0.5);
        
        // Reset transition
        element.style.transition = 'none';
        
        // Get element dimensions
        // Apply a temporary position to get correct dimensions
        element.style.transform = `translate(-1000px, -1000px)`;
        element.offsetHeight; // Force reflow
        const tempRect = element.getBoundingClientRect();
        const elementWidth = tempRect.width;
        const elementHeight = tempRect.height;
        
        // Get the middle section of the header 
        // (avoiding the text which is usually in center)
        const textPadding = 100; // Estimate text width padding
        const centerX = headerRect.left + headerRect.width/2;
        
        // Try multiple positions to avoid overlap
        let x, y;
        let overlapping = true;
        let attempts = 0;
        const maxAttempts = 5;
        const otherElements = getAllFloatingElements().filter(e => e !== element);
        
        while (overlapping && attempts < maxAttempts) {
            // Determine position in header based on area
            if (position === 'right') {
                // Place in right half of header, avoiding center text
                x = centerX + textPadding/2 + Math.random() * 
                    ((headerRect.right - 20 - elementWidth) - (centerX + textPadding/2));
            } else {
                // Place in left half of header, avoiding center text
                x = (headerRect.left + 20) + Math.random() * 
                    ((centerX - textPadding/2 - elementWidth) - (headerRect.left + 20));
            }
            
            // Vertical position - keep below top nav bar, above text bottom
            const navBarHeight = 50; // Estimate of navbar height
            const textBottom = headerRect.bottom - 10;
            const textTop = headerRect.top + 10;
            
            // Calculate a random y position that is within header but doesn't overlap text
            // Use space between navbar and text top, or text bottom and header bottom
            const useTopArea = Math.random() > 0.5;
            if (useTopArea) {
                // Use space between navbar and text top
                y = navBarHeight + 5 + Math.random() * (textTop - (navBarHeight + 5) - elementHeight);
            } else {
                // Use space between text bottom and header bottom
                y = textBottom + Math.random() * (headerRect.bottom - 5 - textBottom - elementHeight);
            }
            
            // Check for overlap with other header elements
            overlapping = false;
            
            // Create a temporary rect to check for overlap
            const tryRect = {
                left: x,
                right: x + elementWidth,
                top: y,
                bottom: y + elementHeight
            };
            
            for (const otherElement of otherElements) {
                if (otherElement.style.transform && 
                    (otherElement === airplane1 || otherElement === cloud1)) {
                    // Only check other elements that are in the header
                    const otherRect = otherElement.getBoundingClientRect();
                    if (!(
                        tryRect.right + 30 < otherRect.left ||
                        tryRect.left > otherRect.right + 30 ||
                        tryRect.bottom + 30 < otherRect.top ||
                        tryRect.top > otherRect.bottom + 30
                    )) {
                        overlapping = true;
                        break;
                    }
                }
            }
            
            attempts++;
        }
        
        const rotation = Math.random() * 4 - 2;
        
        element.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
        
        // Force reflow
        element.offsetHeight;
        
        // Add transition back after placement
        setTimeout(() => {
            element.style.transition = 'transform 2s ease-in-out';
        }, 50);
    }
    
    function placeInLowerArea(element, minHeightFactor, maxHeightFactor) {
        // Get available lower area (below title bar)
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Calculate range with factors (0 = title bar bottom, 1 = bottom of viewport)
        const availableHeight = viewportHeight - titleBarBottom;
        const minY = titleBarBottom + (availableHeight * minHeightFactor);
        const maxY = titleBarBottom + (availableHeight * maxHeightFactor);
        
        // Random position within bounds
        const x = Math.random() * (viewportWidth - 200);
        const y = minY + Math.random() * (maxY - minY);
        const rotation = Math.random() * 8 - 4;
        
        element.style.transition = 'none';
        element.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
        
        // Force reflow
        element.offsetHeight;
        
        // Add transition back
        setTimeout(() => {
            element.style.transition = 'transform 3s ease-in-out';
        }, 50);
    }
    
    // Place element within a specific quadrant of the page
    function placeInQuadrant(element, minXFactor, maxXFactor, minYFactor, maxYFactor) {
        if (!element) return;
        
        // Apply position while preserving any transform properties like scale
        const currentTransform = window.getComputedStyle(element).transform;
        const hasFlip = element.classList.contains('airplane-3') || 
                       element.classList.contains('airplane-4') ||
                       element.classList.contains('cloud-4') ||
                       element.classList.contains('cloud-5') ||
                       element.classList.contains('cloud-6');
        
        // Reset just the transition property
        element.style.transition = 'none';
        
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const navBarHeight = 50; // Navbar height
        
        // Convert factors to actual coordinates
        // X is percentage of viewport width
        const minX = viewportWidth * minXFactor;
        const maxX = viewportWidth * maxXFactor;
        
        // Y is percentage of available height (below navbar)
        const availableHeight = viewportHeight - navBarHeight;
        const minY = navBarHeight + (availableHeight * minYFactor);
        const maxY = navBarHeight + (availableHeight * maxYFactor);
        
        // Try multiple positions to avoid overlap
        let x, y;
        let overlapping = true;
        let attempts = 0;
        const maxAttempts = 5; // Limit attempts to avoid infinite loops
        const otherElements = getAllFloatingElements().filter(e => e !== element);
        
        // First get element dimensions to check overlaps
        // Apply a temporary position to get correct dimensions
        element.style.transform = `translate(-1000px, -1000px)`;
        element.offsetHeight; // Force reflow
        const tempRect = element.getBoundingClientRect();
        const elementWidth = tempRect.width;
        const elementHeight = tempRect.height;
        
        while (overlapping && attempts < maxAttempts) {
            // Generate random position within quadrant
            x = minX + Math.random() * (maxX - minX - elementWidth);
            y = minY + Math.random() * (maxY - minY - elementHeight);
            
            // Check if this position would overlap with any other element
            overlapping = false;
            
            // Create a temporary rect to check for overlap
            const tryRect = {
                left: x,
                right: x + elementWidth,
                top: y,
                bottom: y + elementHeight
            };
            
            for (const otherElement of otherElements) {
                if (otherElement.style.transform) { // Only check elements that are already positioned
                    const otherRect = otherElement.getBoundingClientRect();
                    if (!(
                        tryRect.right + 30 < otherRect.left ||
                        tryRect.left > otherRect.right + 30 ||
                        tryRect.bottom + 30 < otherRect.top ||
                        tryRect.top > otherRect.bottom + 30
                    )) {
                        overlapping = true;
                        break;
                    }
                }
            }
            
            attempts++;
        }
        
        const rotation = Math.random() * 8 - 4;
        
        // Get the right transform based on element class
        let scaleX = 1, scaleY = 1;
        let extraRotation = 0;
        
        if (element.classList.contains('airplane-3') || 
            element.classList.contains('airplane-4') ||
            element.classList.contains('cloud-4')) {
            scaleX = -1;
        }
        
        if (element.classList.contains('cloud-5')) {
            scaleX = -1;
            extraRotation = 15;
        }
        
        if (element.classList.contains('cloud-6')) {
            scaleX = -1;
            extraRotation = -20;
        }
        
        // Apply transform with both position and scale
        element.style.transform = `translate(${x}px, ${y}px) rotate(${rotation + extraRotation}deg) scale(${scaleX}, ${scaleY})`;
        
        // Force reflow
        element.offsetHeight;
        
        // Add transition back
        setTimeout(() => {
            element.style.transition = 'transform 3s ease-in-out';
        }, 50);
    }
    
    // Move element within a specific quadrant
    function moveInQuadrant(element, minXFactor, maxXFactor, minYFactor, maxYFactor) {
        if (!element) return;
        
        // Get current position
        const rect = element.getBoundingClientRect();
        
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const navBarHeight = 50; // Navbar height
        
        // Convert factors to actual coordinates
        const minX = viewportWidth * minXFactor;
        const maxX = viewportWidth * maxXFactor;
        const availableHeight = viewportHeight - navBarHeight;
        const minY = navBarHeight + (availableHeight * minYFactor);
        const maxY = navBarHeight + (availableHeight * maxYFactor);
        
        // Calculate movement range (smaller than the quadrant size)
        const rangeX = (maxX - minX) * 0.3;
        const rangeY = (maxY - minY) * 0.3;
        
        // Try multiple positions to avoid overlap
        let newX, newY;
        let overlapping = true;
        let attempts = 0;
        const maxAttempts = 5; // Limit attempts to avoid infinite loops
        const otherElements = getAllFloatingElements().filter(e => e !== element);
        
        while (overlapping && attempts < maxAttempts) {
            // New position not too far from current but staying in quadrant bounds
            newX = Math.max(minX, Math.min(maxX, 
                     rect.left + (Math.random() * rangeX - rangeX/2)));
            newY = Math.max(minY, Math.min(maxY, 
                     rect.top + (Math.random() * rangeY - rangeY/2)));
            
            // Check if this position would overlap with any other element
            overlapping = false;
            
            // Create a temporary rect to check for overlap
            const tempRect = {
                left: newX,
                right: newX + rect.width,
                top: newY,
                bottom: newY + rect.height
            };
            
            for (const otherElement of otherElements) {
                const otherRect = otherElement.getBoundingClientRect();
                if (!(
                    tempRect.right + 30 < otherRect.left ||
                    tempRect.left > otherRect.right + 30 ||
                    tempRect.bottom + 30 < otherRect.top ||
                    tempRect.top > otherRect.bottom + 30
                )) {
                    overlapping = true;
                    break;
                }
            }
            
            attempts++;
        }
        
        // Small rotation
        const rotation = Math.random() * 8 - 4;
        
        // Get the right scale based on element class
        let scaleX = 1, scaleY = 1;
        let extraRotation = 0;
        
        if (element.classList.contains('airplane-3') || 
            element.classList.contains('airplane-4') ||
            element.classList.contains('cloud-4')) {
            scaleX = -1;
        }
        
        if (element.classList.contains('cloud-5')) {
            scaleX = -1;
            extraRotation = 15;
        }
        
        if (element.classList.contains('cloud-6')) {
            scaleX = -1;
            extraRotation = -20;
        }
        
        // Apply movement preserving scale and adding any extra rotation
        element.style.transition = 'transform 2.5s ease-in-out';
        element.style.transform = `translate(${newX}px, ${newY}px) rotate(${rotation + extraRotation}deg) scale(${scaleX}, ${scaleY})`;
    }
    
    // Functions for movement
    function moveInHeader(element, position) {
        if (!headerRect) return moveInLowerArea(element, 0.3, 0.5);
        
        // Update header position
        if (referenceHeader) {
            headerRect = referenceHeader.getBoundingClientRect();
        }
        
        // Get current element dimensions
        const rect = element.getBoundingClientRect();
        const elementWidth = rect.width;
        const elementHeight = rect.height;
        
        // Get the middle section of the header (avoiding the text in center)
        const textPadding = 100; // Estimate text width padding
        const centerX = headerRect.left + headerRect.width/2;
        
        // Try multiple positions to avoid overlap
        let x, y;
        let overlapping = true;
        let attempts = 0;
        const maxAttempts = 5;
        const otherElements = getAllFloatingElements().filter(e => e !== element);
        
        while (overlapping && attempts < maxAttempts) {
            // Keep position within the appropriate side of header
            if (position === 'right') {
                // Move within right portion of header, avoid center text
                const minX = centerX + textPadding/2;
                const maxX = headerRect.right - 40 - elementWidth;
                x = minX + Math.random() * (maxX - minX);
            } else {
                // Move within left portion of header, avoid center text
                const minX = headerRect.left + 40;
                const maxX = centerX - textPadding/2 - elementWidth;
                x = minX + Math.random() * (maxX - minX);
            }
            
            // Vertical position - ensure it stays within header and avoids text
            const navBarHeight = 50; // Estimate navbar height
            const textBottom = headerRect.bottom - 10;
            const textTop = headerRect.top + 10;
            
            // Random vertical position avoiding text
            if (Math.random() > 0.5) {
                // Use space between navbar and text top
                y = navBarHeight + 10 + Math.random() * (textTop - (navBarHeight + 10) - elementHeight);
            } else {
                // Use space between text bottom and header bottom
                y = textBottom + Math.random() * (headerRect.bottom - 10 - textBottom - elementHeight);
            }
            
            // Check for overlap with other header elements
            overlapping = false;
            
            // Create a temporary rect to check for overlap
            const tryRect = {
                left: x,
                right: x + elementWidth,
                top: y,
                bottom: y + elementHeight
            };
            
            for (const otherElement of otherElements) {
                if (otherElement.style.transform && 
                    (otherElement === airplane1 || otherElement === cloud1)) {
                    // Only check other elements that are in the header
                    const otherRect = otherElement.getBoundingClientRect();
                    if (!(
                        tryRect.right + 30 < otherRect.left ||
                        tryRect.left > otherRect.right + 30 ||
                        tryRect.bottom + 30 < otherRect.top ||
                        tryRect.top > otherRect.bottom + 30
                    )) {
                        overlapping = true;
                        break;
                    }
                }
            }
            
            attempts++;
        }
        
        const rotation = Math.random() * 4 - 2;
        
        element.style.transition = 'transform 2s ease-in-out';
        element.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
    }
    
    function moveInLowerArea(element, minHeightFactor, maxHeightFactor) {
        // Get current position
        const rect = element.getBoundingClientRect();
        
        // Available area
        const viewportWidth = window.innerWidth;
        const availableHeight = window.innerHeight - titleBarBottom;
        const minY = titleBarBottom + (availableHeight * minHeightFactor);
        const maxY = titleBarBottom + (availableHeight * maxHeightFactor);
        
        // Movement range
        const rangeX = 150;
        const rangeY = (maxY - minY) / 3;
        
        // New position not too far from current but staying in bounds
        const newX = Math.max(50, Math.min(viewportWidth - 150, 
                      rect.left + (Math.random() * rangeX - rangeX/2)));
        const newY = Math.max(minY, Math.min(maxY, 
                      rect.top + (Math.random() * rangeY - rangeY/2)));
        
        const rotation = Math.random() * 8 - 4;
        
        element.style.transition = 'transform 3s ease-in-out';
        element.style.transform = `translate(${newX}px, ${newY}px) rotate(${rotation}deg)`;
    }
    
    function avoidMouse(element, mouseX, mouseY, position) {
        const rect = element.getBoundingClientRect();
        const elementX = rect.left + rect.width/2;
        const elementY = rect.top + rect.height/2;
        
        // Distance to mouse
        const distance = Math.sqrt(
            Math.pow(mouseX - elementX, 2) + 
            Math.pow(mouseY - elementY, 2)
        );
        
        // Move away if mouse is close
        if (distance < 100) {
            // Direction away from mouse
            const moveX = elementX + (elementX - mouseX) * 0.8;
            const moveY = elementY + (elementY - mouseY) * 0.8;
            
            // Different behavior based on assigned position
            if (position === 'header-right' && headerRect) {
                // Stay in right side of header
                const textPadding = 100;
                const centerX = headerRect.left + headerRect.width/2;
                const navBarHeight = 50;
                
                // Constrain to right side of header, avoiding text
                const x = Math.max(centerX + textPadding/2, 
                          Math.min(headerRect.right - 40, moveX));
                          
                // Constrain vertically to avoid navbar and text
                let y;
                if (moveY < headerRect.top + headerRect.height/2) {
                    // Above text
                    y = Math.max(navBarHeight + 10, 
                          Math.min(headerRect.top + 10, moveY));
                } else {
                    // Below text
                    y = Math.max(headerRect.bottom - 10, 
                          Math.min(headerRect.bottom - 5, moveY));
                }
                
                element.style.transition = 'transform 1s ease-out';
                element.style.transform = `translate(${x - rect.width/2}px, ${y - rect.height/2}px) rotate(${Math.random() * 4 - 2}deg)`;
            } 
            else if (position === 'header-left' && headerRect) {
                // Stay in left side of header
                const textPadding = 100;
                const centerX = headerRect.left + headerRect.width/2;
                const navBarHeight = 50;
                
                // Constrain to left side of header, avoiding text
                const x = Math.max(headerRect.left + 40, 
                          Math.min(centerX - textPadding/2, moveX));
                          
                // Constrain vertically to avoid navbar and text
                let y;
                if (moveY < headerRect.top + headerRect.height/2) {
                    // Above text
                    y = Math.max(navBarHeight + 10, 
                          Math.min(headerRect.top + 10, moveY));
                } else {
                    // Below text
                    y = Math.max(headerRect.bottom - 10, 
                          Math.min(headerRect.bottom - 5, moveY));
                }
                
                element.style.transition = 'transform 1s ease-out';
                element.style.transform = `translate(${x - rect.width/2}px, ${y - rect.height/2}px) rotate(${Math.random() * 4 - 2}deg)`;
            } 
            else if (position === 'quadrant') {
                // Stay within the viewport but move away from mouse
                const navBarHeight = 50;
                
                // Ensure element stays within reasonable bounds and below navbar
                const safeX = Math.min(Math.max(moveX, 40), window.innerWidth - 40);
                const safeY = Math.min(Math.max(moveY, navBarHeight + 20), window.innerHeight - 20);
                
                // Get the right scale based on element class
                let scaleX = 1, scaleY = 1;
                let extraRotation = 0;
                
                if (element.classList.contains('airplane-3') || 
                    element.classList.contains('airplane-4') ||
                    element.classList.contains('cloud-4')) {
                    scaleX = -1;
                }
                if (element.classList.contains('cloud-5')) {
                    scaleX = -1;
                    extraRotation = 15;
                }
                if (element.classList.contains('cloud-6')) {
                    scaleX = -1;
                    extraRotation = -20;
                }
                
                element.style.transition = 'transform 1s ease-out';
                element.style.transform = `translate(${safeX - rect.width/2}px, ${safeY - rect.height/2}px) rotate(${Math.random() * 8 - 4 + extraRotation}deg) scale(${scaleX}, ${scaleY})`;
            }
            else {
                // Free movement but staying below title bar
                const safeX = Math.min(Math.max(moveX, 50), window.innerWidth - 50);
                const safeY = Math.min(Math.max(moveY, titleBarBottom + 50), window.innerHeight - 50);
                
                element.style.transition = 'transform 1s ease-out';
                element.style.transform = `translate(${safeX - rect.width/2}px, ${safeY - rect.height/2}px) rotate(${Math.random() * 8 - 4}deg)`;
            }
        }
    }

    // Add collision detection helper function
    function checkOverlap(element1, element2, padding = 30) {
        if (!element1 || !element2) return false;
        
        const rect1 = element1.getBoundingClientRect();
        const rect2 = element2.getBoundingClientRect();
        
        // Add padding to prevent elements from getting too close
        return !(
            rect1.right + padding < rect2.left ||
            rect1.left > rect2.right + padding ||
            rect1.bottom + padding < rect2.top ||
            rect1.top > rect2.bottom + padding
        );
    }
    
    // Get all floating elements as an array for collision checking
    function getAllFloatingElements() {
        return [
            airplane1, airplane2, airplane3, airplane4,
            cloud1, cloud2, cloud3, cloud4, cloud5, cloud6
        ].filter(el => el); // Filter out any undefined elements
    }
}); 