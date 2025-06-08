// public/js/performance-optimizations.js
// Advanced performance optimizations for Core Web Vitals

// Lazy Loading for Images
if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
        img.src = img.dataset.src;
    });
} else {
    // Fallback for browsers that don't support lazy loading
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
    document.body.appendChild(script);
}

// Preload critical resources
function preloadResource(href, as, type) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    document.head.appendChild(link);
}

// Web Font Loading Optimization
if ('fonts' in document) {
    Promise.all([
        document.fonts.load('400 1em Inter'),
        document.fonts.load('600 1em Inter'),
        document.fonts.load('700 1em Inter')
    ]).then(() => {
        document.documentElement.classList.add('fonts-loaded');
    });
}

// Intersection Observer for Animations
const animateOnScroll = () => {
    const elements = document.querySelectorAll('.animate-on-scroll');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '50px'
    });
    
    elements.forEach(element => observer.observe(element));
};

// Debounce function for scroll events
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

// Optimize scroll performance
let ticking = false;
function updateScrollProgress() {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            const scrollProgress = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
            document.documentElement.style.setProperty('--scroll-progress', scrollProgress);
            ticking = false;
        });
        ticking = true;
    }
}

// Service Worker Registration for PWA
if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered:', registration))
            .catch(error => console.log('SW registration failed:', error));
    });
}

// Prefetch internal links on hover
function prefetchLink(url) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
}

document.addEventListener('DOMContentLoaded', () => {
    const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="#"]');
    
    internalLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            if (link.href.startsWith(window.location.origin) && !link.href.includes('#')) {
                prefetchLink(link.href);
            }
        }, { once: true });
    });
});

// Resource Hints based on user interaction
const resourceHints = {
    '/calculator': ['https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.11.0/math.min.js'],
    '/templates': ['https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js']
};

function addResourceHint(type, url) {
    const link = document.createElement('link');
    link.rel = type;
    link.href = url;
    document.head.appendChild(link);
}

// Monitor Core Web Vitals
if ('PerformanceObserver' in window) {
    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
            console.log('LCP:', entry.startTime);
            // Send to analytics
            if (window.gtag) {
                gtag('event', 'web_vitals', {
                    name: 'LCP',
                    value: Math.round(entry.startTime),
                    event_category: 'Web Vitals',
                    event_label: 'LCP'
                });
            }
        }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // First Input Delay
    new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
            const fid = entry.processingStart - entry.startTime;
            console.log('FID:', fid);
            // Send to analytics
            if (window.gtag) {
                gtag('event', 'web_vitals', {
                    name: 'FID',
                    value: Math.round(fid),
                    event_category: 'Web Vitals',
                    event_label: 'FID'
                });
            }
        }
    }).observe({ type: 'first-input', buffered: true });

    // Cumulative Layout Shift
    let clsValue = 0;
    let clsEntries = [];

    const sessionValue = () => 
        clsEntries.reduce((acc, entry) => acc + entry.value, 0);

    new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
                clsEntries.push(entry);
                clsValue = sessionValue();
                console.log('CLS:', clsValue);
            }
        }
    }).observe({ type: 'layout-shift', buffered: true });
}

// Optimize form submissions
document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            const submitBtn = form.querySelector('[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'שולח...';
            }
        });
    });
});

// Progressive Enhancement for Interactive Elements
class ProgressiveCard {
    constructor(element) {
        this.element = element;
        this.header = element.querySelector('header');
        this.content = element.querySelector('.hidden-content');
        this.init();
    }
    
    init() {
        if (!this.header || !this.content) return;
        
        this.header.addEventListener('click', () => this.toggle());
        this.header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggle();
            }
        });
    }
    
    toggle() {
        const isHidden = this.content.classList.contains('hidden-content');
        this.content.classList.toggle('hidden-content');
        this.header.setAttribute('aria-expanded', !isHidden);
        
        // Smooth height animation
        if (!isHidden) {
            this.content.style.height = '0';
            this.content.style.overflow = 'hidden';
            setTimeout(() => {
                this.content.style.height = this.content.scrollHeight + 'px';
                setTimeout(() => {
                    this.content.style.height = '';
                    this.content.style.overflow = '';
                }, 300);
            }, 10);
        }
    }
}

// Initialize progressive enhancements
document.addEventListener('DOMContentLoaded', () => {
    // Progressive cards
    document.querySelectorAll('.interactive-card').forEach(card => {
        new ProgressiveCard(card);
    });
    
    // Animate on scroll
    animateOnScroll();
    
    // Scroll progress
    window.addEventListener('scroll', debounce(updateScrollProgress, 10));
});

// Memory leak prevention
window.addEventListener('beforeunload', () => {
    // Clean up event listeners and observers
    if (window.intersectionObserver) {
        window.intersectionObserver.disconnect();
    }
});