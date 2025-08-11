// VoiceBat Website JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Radio overlay click handlers
    document.querySelectorAll('.radio-overlay').forEach(overlay => {
        overlay.addEventListener('click', function() {
            const link = this.getAttribute('data-link');
            if (link) {
                // Add a visual feedback
                this.style.transform = 'scale(1.2) rotate(360deg)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 600);
                
                // Check if it's a page link or section link
                if (link.includes('.html')) {
                    // Navigate to page
                    setTimeout(() => {
                        window.location.href = link;
                    }, 300);
                } else {
                    // Scroll to section (for single page navigation)
                    const targetElement = document.querySelector(link);
                    if (targetElement) {
                        const headerHeight = document.querySelector('.navbar').offsetHeight;
                        const targetPosition = targetElement.offsetTop - headerHeight - 20;
                        
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }
                }
            }
        });
    });
    
    // Keep navbar transparent at all times
    const navbar = document.querySelector('.navbar');
    
    // Ensure navbar stays transparent
    navbar.style.background = 'transparent';
    navbar.style.boxShadow = 'none';
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                
                // Add stagger effect for grid items
                if (entry.target.classList.contains('content-card') || 
                    entry.target.classList.contains('problem-card') ||
                    entry.target.classList.contains('why-card') ||
                    entry.target.classList.contains('edge-card') ||
                    entry.target.classList.contains('product-card') ||
                    entry.target.classList.contains('stat-card')) {
                    
                    const siblings = entry.target.parentElement.children;
                    const index = Array.from(siblings).indexOf(entry.target);
                    entry.target.style.animationDelay = `${index * 0.1}s`;
                }
            }
        });
    }, observerOptions);
    
    // Observe all animated elements
    document.querySelectorAll('.content-card, .problem-card, .why-card, .edge-card, .product-card, .stat-card, .feature').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
    
    // Parallax effect for background images
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.bg-image');
        
        parallaxElements.forEach(element => {
            const speed = 0.5;
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    });
    
    // Contact form enhancement
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            const submitBtn = this.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'Sending... 🦇';
            submitBtn.disabled = true;
            
            // Re-enable after a short delay (since this is a mailto form)
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 3000);
        });
        
        // Form field animations
        const formInputs = contactForm.querySelectorAll('input, select, textarea');
        formInputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.style.transform = 'translateY(-2px)';
            });
            
            input.addEventListener('blur', function() {
                this.parentElement.style.transform = 'translateY(0)';
            });
        });
    }
    
    // Logo animations
    document.querySelectorAll('.logo, .section-logo, .contact-logo, .footer-logo-img').forEach(logo => {
        logo.addEventListener('mouseenter', function() {
            this.style.animation = 'batWing 0.6s ease-in-out';
        });
        
        logo.addEventListener('animationend', function() {
            this.style.animation = '';
        });
    });
    
    // Card hover effects with sound simulation
    document.querySelectorAll('.content-card, .problem-card, .why-card, .edge-card, .product-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            // Create a subtle scale effect
            this.style.transform = 'translateY(-10px) scale(1.02)';
            
            // Add a subtle glow effect
            this.style.boxShadow = '0 25px 60px rgba(108, 99, 255, 0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
        });
    });
    
    // Typing effect for hero subtitle
    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle) {
        const text = heroSubtitle.textContent;
        heroSubtitle.textContent = '';
        
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                heroSubtitle.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        };
        
        // Start typing effect after a short delay
        setTimeout(typeWriter, 1000);
    }
    
    // Easter egg: Konami code for special bat animation
    let konamiCode = [];
    const correctCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]; // Up Up Down Down Left Right Left Right B A
    
    document.addEventListener('keydown', function(e) {
        konamiCode.push(e.keyCode);
        if (konamiCode.length > correctCode.length) {
            konamiCode.shift();
        }
        
        if (konamiCode.length === correctCode.length && 
            konamiCode.every((code, index) => code === correctCode[index])) {
            
            // Easter egg activated!
            document.body.style.animation = 'batWing 2s ease-in-out infinite';
            
            // Show a fun message
            const message = document.createElement('div');
            message.innerHTML = '🦇 VoiceBat Easter Egg Activated! 🦇';
            message.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #6c63ff, #4ecdc4);
                color: white;
                padding: 20px 40px;
                border-radius: 20px;
                font-size: 1.5rem;
                font-weight: bold;
                z-index: 10000;
                animation: fadeInUp 0.5s ease-out;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            `;
            
            document.body.appendChild(message);
            
            setTimeout(() => {
                message.remove();
                document.body.style.animation = '';
                konamiCode = [];
            }, 3000);
        }
    });
    
    // Performance optimization: Throttle scroll events
    let ticking = false;
    
    function updateOnScroll() {
        // Scroll-based animations go here
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateOnScroll);
            ticking = true;
        }
    }
    
    // Add loading screen fade out
    window.addEventListener('load', function() {
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease-in';
        
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);
    });
    
    // Add bat sounds simulation on radio clicks (visual feedback only)
    document.querySelectorAll('.radio-overlay').forEach(radio => {
        radio.addEventListener('click', function() {
            // Create ripple effect
            const ripple = document.createElement('div');
            ripple.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                background: rgba(108, 99, 255, 0.5);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Add CSS for ripple animation
    if (!document.querySelector('#ripple-style')) {
        const style = document.createElement('style');
        style.id = 'ripple-style';
        style.textContent = `
            @keyframes ripple {
                to {
                    width: 100px;
                    height: 100px;
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
});

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}
