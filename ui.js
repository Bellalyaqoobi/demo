/**
 * Snapp - UI Management Module
 * Version: 1.0.0
 * Handles UI interactions, animations, and dynamic content
 */

class UIManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.notifications = [];
        this.modals = [];
        
        this.init();
    }

    /**
     * Initialize UI manager
     */
    init() {
        this.setupTheme();
        this.setupMobileMenu();
        this.setupUserMenu();
        this.setupNotifications();
        this.setupScrollEffects();
        this.setupAnimations();
        this.setupTooltips();
        this.loadUserProfile();
    }

    /**
     * Setup theme (light/dark mode)
     */
    setupTheme() {
        // Set initial theme
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        const toggle = document.getElementById('darkModeToggle');
        if (toggle) {
            const icon = toggle.querySelector('i');
            icon.className = this.currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            
            toggle.addEventListener('click', () => {
                this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', this.currentTheme);
                localStorage.setItem('theme', this.currentTheme);
                
                icon.className = this.currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
                
                Utils.showToast(`${this.currentTheme === 'dark' ? 'Dark' : 'Light'} mode activated`, 'info');
            });
        }
    }

    /**
     * Setup mobile menu toggle
     */
    setupMobileMenu() {
        const toggle = document.getElementById('mobileToggle');
        const menu = document.getElementById('navMenu');
        
        if (toggle && menu) {
            toggle.addEventListener('click', () => {
                menu.classList.toggle('active');
                
                const icon = toggle.querySelector('i');
                if (menu.classList.contains('active')) {
                    icon.className = 'fas fa-times';
                } else {
                    icon.className = 'fas fa-bars';
                }
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target) && !toggle.contains(e.target)) {
                    menu.classList.remove('active');
                    toggle.querySelector('i').className = 'fas fa-bars';
                }
            });
        }
    }

    /**
     * Setup user menu dropdown
     */
    setupUserMenu() {
        const userMenu = document.getElementById('userMenu');
        if (!userMenu) return;

        const dropdown = document.createElement('div');
        dropdown.className = 'user-dropdown';
        dropdown.innerHTML = `
            <a href="#" class="dropdown-item"><i class="fas fa-user"></i> Profile</a>
            <a href="#" class="dropdown-item"><i class="fas fa-cog"></i> Settings</a>
            <a href="#" class="dropdown-item"><i class="fas fa-wallet"></i> Wallet</a>
            <div class="dropdown-divider"></div>
            <a href="#" class="dropdown-item" id="logoutDropdown"><i class="fas fa-sign-out-alt"></i> Logout</a>
        `;

        userMenu.appendChild(dropdown);

        // Toggle dropdown
        userMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdown.classList.remove('show');
        });

        // Logout from dropdown
        document.getElementById('logoutDropdown')?.addEventListener('click', (e) => {
            e.preventDefault();
            auth.handleLogout(e);
        });
    }

    /**
     * Setup notifications panel
     */
    setupNotifications() {
        const notifBtn = document.getElementById('notificationsBtn');
        if (!notifBtn) return;

        // Load notifications
        this.loadNotifications();

        notifBtn.addEventListener('click', () => {
            this.toggleNotificationPanel();
        });
    }

    /**
     * Load notifications
     */
    loadNotifications() {
        // Sample notifications - in real app, this would come from server
        this.notifications = [
            {
                id: 1,
                title: 'Ride Completed',
                message: 'Your ride has been completed successfully',
                time: new Date(Date.now() - 3600000),
                read: false,
                icon: 'fa-check-circle',
                color: 'success'
            },
            {
                id: 2,
                title: 'Payment Received',
                message: 'You received $12.50 for your last ride',
                time: new Date(Date.now() - 7200000),
                read: false,
                icon: 'fa-dollar-sign',
                color: 'info'
            },
            {
                id: 3,
                title: 'New Driver Nearby',
                message: 'A driver is available 2 minutes away',
                time: new Date(Date.now() - 86400000),
                read: true,
                icon: 'fa-taxi',
                color: 'primary'
            }
        ];

        this.updateNotificationBadge();
    }

    /**
     * Update notification badge
     */
    updateNotificationBadge() {
        const badge = document.querySelector('.notification-badge');
        if (!badge) return;

        const unread = this.notifications.filter(n => !n.read).length;
        
        if (unread > 0) {
            badge.textContent = unread;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    /**
     * Toggle notification panel
     */
    toggleNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        if (!panel) return;

        if (panel.style.display === 'none' || !panel.style.display) {
            this.showNotificationPanel(panel);
        } else {
            panel.style.display = 'none';
        }
    }

    /**
     * Show notification panel
     * @param {HTMLElement} panel - Notification panel element
     */
    showNotificationPanel(panel) {
        // Populate notifications
        const list = panel.querySelector('.notification-list');
        list.innerHTML = this.notifications.map(notif => `
            <div class="notification-item ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
                <div class="notification-icon ${notif.color}">
                    <i class="fas ${notif.icon}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notif.title}</div>
                    <div class="notification-message">${notif.message}</div>
                    <div class="notification-time">${Utils.formatDate(notif.time)}</div>
                </div>
            </div>
        `).join('');

        panel.style.display = 'block';

        // Mark all as read when opening
        this.markAllNotificationsAsRead();
    }

    /**
     * Mark all notifications as read
     */
    markAllNotificationsAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.updateNotificationBadge();
    }

    /**
     * Setup scroll effects
     */
    setupScrollEffects() {
        const navbar = document.querySelector('.navbar');
        
        window.addEventListener('scroll', () => {
            // Navbar scroll effect
            if (navbar) {
                if (window.scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            }

            // Scroll to top button
            this.toggleScrollTopButton();
        });
    }

    /**
     * Toggle scroll to top button
     */
    toggleScrollTopButton() {
        let scrollBtn = document.getElementById('scrollTopBtn');
        
        if (!scrollBtn) {
            scrollBtn = document.createElement('button');
            scrollBtn.id = 'scrollTopBtn';
            scrollBtn.className = 'scroll-top-btn';
            scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
            scrollBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            document.body.appendChild(scrollBtn);
        }

        if (window.scrollY > 500) {
            scrollBtn.classList.add('show');
        } else {
            scrollBtn.classList.remove('show');
        }
    }

    /**
     * Setup animations on scroll
     */
    setupAnimations() {
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                }
            });
        }, { threshold: 0.1 });

        animatedElements.forEach(el => observer.observe(el));
    }

    /**
     * Setup tooltips
     */
    setupTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(el => {
            el.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = e.target.dataset.tooltip;
                
                const rect = e.target.getBoundingClientRect();
                tooltip.style.top = `${rect.top - 30}px`;
                tooltip.style.left = `${rect.left + rect.width / 2}px`;
                
                document.body.appendChild(tooltip);
                
                setTimeout(() => tooltip.classList.add('show'), 10);
                
                e.target.addEventListener('mouseleave', () => {
                    tooltip.remove();
                }, { once: true });
            });
        });
    }

    /**
     * Load user profile information
     */
    loadUserProfile() {
        const user = auth.getCurrentUser();
        if (!user) return;

        // Update user name in UI
        const userNameElements = document.querySelectorAll('[data-user-name]');
        userNameElements.forEach(el => {
            el.textContent = user.fullName;
        });

        // Update user email
        const userEmailElements = document.querySelectorAll('[data-user-email]');
        userEmailElements.forEach(el => {
            el.textContent = user.email;
        });

        // Update avatar
        const avatarElements = document.querySelectorAll('.user-avatar');
        avatarElements.forEach(el => {
            el.src = user.avatar || 'assets/images/default-avatar.png';
        });
    }

    /**
     * Show loading overlay
     */
    showLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-circle-notch fa-spin"></i>
                <span>Loading...</span>
            </div>
        `;
        document.body.appendChild(overlay);
        
        return overlay;
    }

    /**
     * Hide loading overlay
     */
    hideLoadingOverlay(overlay) {
        if (overlay) {
            overlay.remove();
        }
    }

    /**
     * Show modal
     * @param {object} options - Modal options
     */
    showModal(options) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content ${options.size || ''}">
                ${options.title ? `
                    <div class="modal-header">
                        <h3>${options.title}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                ` : ''}
                <div class="modal-body">
                    ${options.content}
                </div>
                ${options.buttons ? `
                    <div class="modal-footer">
                        ${options.buttons.map(btn => `
                            <button class="btn ${btn.class}" data-action="${btn.action}">
                                ${btn.text}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        // Close button
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => modal.remove());
        }

        // Action buttons
        if (options.buttons) {
            options.buttons.forEach(btn => {
                const btnEl = modal.querySelector(`[data-action="${btn.action}"]`);
                if (btnEl && btn.callback) {
                    btnEl.addEventListener('click', () => {
                        btn.callback();
                        modal.remove();
                    });
                }
            });
        }

        document.body.appendChild(modal);
        
        return modal;
    }

    /**
     * Show confirmation dialog
     * @param {string} message - Confirmation message
     * @param {Function} onConfirm - Confirm callback
     * @param {Function} onCancel - Cancel callback
     */
    showConfirm(message, onConfirm, onCancel) {
        this.showModal({
            title: 'Confirm Action',
            content: `<p>${message}</p>`,
            buttons: [
                { text: 'Cancel', class: 'btn-outline', action: 'cancel', callback: onCancel },
                { text: 'Confirm', class: 'btn-primary', action: 'confirm', callback: onConfirm }
            ]
        });
    }

    /**
     * Show alert
     * @param {string} message - Alert message
     * @param {string} type - Alert type
     */
    showAlert(message, type = 'info') {
        this.showModal({
            title: type.charAt(0).toUpperCase() + type.slice(1),
            content: `<p class="alert-${type}">${message}</p>`,
            buttons: [
                { text: 'OK', class: 'btn-primary', action: 'ok' }
            ]
        });
    }

    /**
     * Update progress bar
     * @param {HTMLElement} progressBar - Progress bar element
     * @param {number} percentage - Progress percentage
     */
    updateProgressBar(progressBar, percentage) {
        if (!progressBar) return;
        
        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute('aria-valuenow', percentage);
    }

    /**
     * Animate counter
     * @param {HTMLElement} element - Element to animate
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} duration - Animation duration
     */
    animateCounter(element, start, end, duration = 1000) {
        const range = end - start;
        const increment = range / (duration / 10);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            element.textContent = Math.round(current);
            
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                element.textContent = end;
                clearInterval(timer);
            }
        }, 10);
    }

    /**
     * Create ripple effect
     * @param {Event} e - Mouse event
     */
    createRipple(e) {
        const button = e.currentTarget;
        
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        
        button.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }

    /**
     * Toggle element visibility with animation
     * @param {HTMLElement} element - Element to toggle
     * @param {string} animation - Animation class
     */
    toggleWithAnimation(element, animation = 'fade') {
        if (element.style.display === 'none') {
            element.style.display = 'block';
            element.classList.add(`animate-${animation}-in`);
        } else {
            element.classList.add(`animate-${animation}-out`);
            setTimeout(() => {
                element.style.display = 'none';
                element.classList.remove(`animate-${animation}-in`, `animate-${animation}-out`);
            }, 300);
        }
    }

    /**
     * Initialize draggable element
     * @param {HTMLElement} element - Element to make draggable
     * @param {HTMLElement} handle - Drag handle
     */
    makeDraggable(element, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        
        handle = handle || element;
        handle.style.cursor = 'move';
        
        handle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            element.style.top = (element.offsetTop - pos2) + 'px';
            element.style.left = (element.offsetLeft - pos1) + 'px';
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    /**
     * Initialize tabs
     * @param {string} containerId - Tabs container ID
     */
    initTabs(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const tabs = container.querySelectorAll('.tab');
        const panels = container.querySelectorAll('.tab-panel');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                
                // Update tabs
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update panels
                panels.forEach(panel => {
                    if (panel.id === target) {
                        panel.classList.add('active');
                    } else {
                        panel.classList.remove('active');
                    }
                });
            });
        });
    }

    /**
     * Initialize accordion
     * @param {string} containerId - Accordion container ID
     */
    initAccordion(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const items = container.querySelectorAll('.accordion-item');

        items.forEach(item => {
            const header = item.querySelector('.accordion-header');
            const content = item.querySelector('.accordion-content');

            header.addEventListener('click', () => {
                const isOpen = item.classList.contains('open');
                
                // Close all items
                items.forEach(i => {
                    i.classList.remove('open');
                    i.querySelector('.accordion-content').style.display = 'none';
                });
                
                // Open current if it wasn't open
                if (!isOpen) {
                    item.classList.add('open');
                    content.style.display = 'block';
                }
            });
        });
    }

    /**
     * Initialize carousel
     * @param {string} containerId - Carousel container ID
     */
    initCarousel(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const slides = container.querySelectorAll('.carousel-slide');
        const prevBtn = container.querySelector('.carousel-prev');
        const nextBtn = container.querySelector('.carousel-next');
        const indicators = container.querySelector('.carousel-indicators');

        let currentSlide = 0;

        // Create indicators
        if (indicators) {
            for (let i = 0; i < slides.length; i++) {
                const dot = document.createElement('span');
                dot.className = 'carousel-dot';
                dot.addEventListener('click', () => goToSlide(i));
                indicators.appendChild(dot);
            }
        }

        const showSlide = (index) => {
            slides.forEach(slide => slide.classList.remove('active'));
            slides[index].classList.add('active');
            
            if (indicators) {
                const dots = indicators.querySelectorAll('.carousel-dot');
                dots.forEach(dot => dot.classList.remove('active'));
                dots[index].classList.add('active');
            }
        };

        const nextSlide = () => {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        };

        const prevSlide = () => {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(currentSlide);
        };

        const goToSlide = (index) => {
            currentSlide = index;
            showSlide(currentSlide);
        };

        if (prevBtn) prevBtn.addEventListener('click', prevSlide);
        if (nextBtn) nextBtn.addEventListener('click', nextSlide);

        // Auto advance
        setInterval(nextSlide, 5000);
    }

    /**
     * Initialize lazy loading images
     */
    initLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    /**
     * Create skeleton loader
     * @param {string} type - Skeleton type
     * @param {number} count - Number of items
     * @returns {string} Skeleton HTML
     */
    createSkeleton(type = 'text', count = 1) {
        const skeletons = [];
        
        for (let i = 0; i < count; i++) {
            switch(type) {
                case 'text':
                    skeletons.push('<div class="skeleton skeleton-text"></div>');
                    break;
                case 'avatar':
                    skeletons.push('<div class="skeleton skeleton-avatar"></div>');
                    break;
                case 'card':
                    skeletons.push(`
                        <div class="skeleton-card">
                            <div class="skeleton skeleton-image"></div>
                            <div class="skeleton skeleton-title"></div>
                            <div class="skeleton skeleton-text"></div>
                            <div class="skeleton skeleton-text"></div>
                        </div>
                    `);
                    break;
                case 'table':
                    skeletons.push(`
                        <div class="skeleton-table">
                            <div class="skeleton skeleton-row"></div>
                            <div class="skeleton skeleton-row"></div>
                            <div class="skeleton skeleton-row"></div>
                        </div>
                    `);
                    break;
            }
        }
        
        return skeletons.join('');
    }

    /**
     * Initialize infinite scroll
     * @param {Function} loadMore - Function to load more content
     */
    initInfiniteScroll(loadMore) {
        const options = {
            root: null,
            rootMargin: '100px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadMore();
                }
            });
        }, options);

        // Create sentinel element
        const sentinel = document.createElement('div');
        sentinel.className = 'infinite-scroll-sentinel';
        document.body.appendChild(sentinel);

        observer.observe(sentinel);
    }

    /**
     * Create toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type
     * @param {number} duration - Display duration
     */
    createToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas ${this.getToastIcon(type)}"></i>
            <span>${message}</span>
            <button class="toast-close">&times;</button>
        `;

        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto hide
        const timer = setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);

        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(timer);
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });
    }

    /**
     * Get toast icon based on type
     * @param {string} type - Toast type
     * @returns {string} Icon class
     */
    getToastIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * Format file size
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Debounced resize handler
     */
    handleResize() {
        let resizeTimer;
        
        window.addEventListener('resize', () => {
            document.body.classList.add('resize-animation-stopper');
            
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                document.body.classList.remove('resize-animation-stopper');
            }, 400);
        });
    }
}

// Initialize UI manager
document.addEventListener('DOMContentLoaded', () => {
    window.uiManager = new UIManager();
});