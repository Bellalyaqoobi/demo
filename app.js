/**
 * Snapp - Main Application File
 * Version: 1.0.0
 * Initializes all modules and handles global app state
 */

class SnappApp {
    constructor() {
        this.version = '1.0.0';
        this.modules = {};
        this.config = {
            apiKey: 'YOUR_GOOGLE_MAPS_API_KEY',
            appName: 'Snapp',
            defaultLanguage: 'en',
            supportedLanguages: ['en', 'fa'],
            ridePricePerKm: 1.2,
            baseFare: 2.5,
            driverShare: 0.7
        };
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log(`Snapp App v${this.version} initializing...`);
        
        try {
            // Check browser compatibility
            this.checkCompatibility();
            
            // Load configuration
            await this.loadConfig();
            
            // Initialize modules
            this.initModules();
            
            // Setup global event listeners
            this.setupGlobalListeners();
            
            // Check authentication status
            this.checkAuth();
            
            // Load user preferences
            this.loadPreferences();
            
            // Register service worker
            this.registerServiceWorker();
            
            console.log('Snapp App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.handleFatalError(error);
        }
    }

    /**
     * Check browser compatibility
     */
    checkCompatibility() {
        // Check for required features
        const requiredFeatures = [
            'localStorage',
            'sessionStorage',
            'Promise',
            'fetch',
            'geolocation'
        ];

        const missingFeatures = requiredFeatures.filter(feature => {
            if (feature === 'geolocation') {
                return !navigator.geolocation;
            }
            return !(feature in window);
        });

        if (missingFeatures.length > 0) {
            throw new Error(`Browser missing required features: ${missingFeatures.join(', ')}`);
        }

        // Check for Google Maps API
        if (typeof google === 'undefined') {
            console.warn('Google Maps API not loaded');
        }
    }

    /**
     * Load configuration
     */
    async loadConfig() {
        // Load from localStorage
        const savedConfig = Utils.getStorage('app_config');
        if (savedConfig) {
            this.config = { ...this.config, ...savedConfig };
        }

        // Load from URL params
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('lang')) {
            this.config.defaultLanguage = urlParams.get('lang');
        }
    }

    /**
     * Initialize all modules
     */
    initModules() {
        // Core modules
        this.modules.utils = Utils;
        this.modules.auth = window.auth || new Auth();
        this.modules.ui = window.uiManager || new UIManager();
        
        // Page-specific modules
        if (document.getElementById('map') || document.getElementById('driverMap')) {
            this.modules.map = window.mapManager || new MapManager();
        }
        
        if (document.querySelector('.ride-card')) {
            this.modules.ride = window.rideManager || new RideManager();
        }
        
        if (document.querySelector('.driver-dashboard')) {
            this.modules.driver = window.driverManager || new DriverManager();
        }
        
        if (document.querySelector('.admin-main')) {
            this.modules.admin = window.adminManager || new AdminManager();
        }
    }

    /**
     * Setup global event listeners
     */
    setupGlobalListeners() {
        // Online/Offline detection
        window.addEventListener('online', () => {
            Utils.showToast('You are back online', 'success');
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            Utils.showToast('You are offline. Some features may be limited.', 'warning');
        });

        // Visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.onAppVisible();
            } else {
                this.onAppHidden();
            }
        });

        // Before unload
        window.addEventListener('beforeunload', (e) => {
            this.onBeforeUnload(e);
        });

        // Error handling
        window.addEventListener('error', (e) => {
            this.handleGlobalError(e);
        });

        window.addEventListener('unhandledrejection', (e) => {
            this.handleUnhandledRejection(e);
        });
    }

    /**
     * Check authentication status
     */
    checkAuth() {
        const isLoggedIn = this.modules.auth?.isAuthenticated();
        const currentPath = window.location.pathname;

        // Define public routes
        const publicRoutes = ['/', '/index.html', '/login.html', '/register.html'];
        
        // Check if current route requires authentication
        const requiresAuth = !publicRoutes.some(route => 
            currentPath.endsWith(route)
        );

        if (requiresAuth && !isLoggedIn) {
            window.location.href = '/login.html';
        }

        if (isLoggedIn) {
            this.updateUserInterface();
        }
    }

    /**
     * Load user preferences
     */
    loadPreferences() {
        // Load theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        }

        // Load language preference
        const savedLang = localStorage.getItem('language') || this.config.defaultLanguage;
        this.setLanguage(savedLang);

        // Load notification preferences
        const notifications = localStorage.getItem('notifications') !== 'false';
        if (!notifications && 'Notification' in window) {
            Notification.requestPermission();
        }
    }

    /**
     * Register service worker for PWA
     */
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registered:', registration);
                })
                .catch(error => {
                    console.error('ServiceWorker registration failed:', error);
                });
        }
    }

    /**
     * Set application language
     * @param {string} lang - Language code
     */
    setLanguage(lang) {
        if (!this.config.supportedLanguages.includes(lang)) {
            lang = this.config.defaultLanguage;
        }

        document.documentElement.lang = lang;
        localStorage.setItem('language', lang);

        // Dispatch event for language change
        window.dispatchEvent(new CustomEvent('languagechange', { detail: { language: lang } }));
    }

    /**
     * Update user interface based on auth status
     */
    updateUserInterface() {
        const user = this.modules.auth?.getCurrentUser();
        if (!user) return;

        // Update user name in UI
        document.querySelectorAll('[data-user-name]').forEach(el => {
            el.textContent = user.fullName;
        });

        // Update user avatar
        document.querySelectorAll('[data-user-avatar]').forEach(el => {
            el.src = user.avatar || '/assets/images/default-avatar.png';
        });
    }

    /**
     * Sync offline data when back online
     */
    async syncOfflineData() {
        const offlineData = Utils.getStorage('offline_data');
        if (!offlineData) return;

        Utils.showToast('Syncing offline data...', 'info');

        try {
            // Process offline data
            for (const item of offlineData) {
                await this.processOfflineItem(item);
            }

            // Clear offline data
            Utils.removeStorage('offline_data');
            Utils.showToast('Offline data synced successfully', 'success');
        } catch (error) {
            console.error('Failed to sync offline data:', error);
            Utils.showToast('Failed to sync some offline data', 'error');
        }
    }

    /**
     * Process offline data item
     * @param {object} item - Offline data item
     */
    async processOfflineItem(item) {
        // Implement based on item type
        switch(item.type) {
            case 'ride_request':
                // Process offline ride request
                break;
            case 'rating':
                // Process offline rating
                break;
            default:
                console.warn('Unknown offline item type:', item.type);
        }
    }

    /**
     * Handle app becoming visible
     */
    onAppVisible() {
        console.log('App became visible');
        
        // Refresh data
        if (this.modules.ride) {
            this.modules.ride.loadAvailableDrivers();
        }

        if (this.modules.admin) {
            this.modules.admin.refreshData();
        }
    }

    /**
     * Handle app being hidden
     */
    onAppHidden() {
        console.log('App hidden');
        
        // Save state
        this.saveAppState();
    }

    /**
     * Handle before unload event
     * @param {Event} e - Before unload event
     */
    onBeforeUnload(e) {
        this.saveAppState();
    }

    /**
     * Save application state
     */
    saveAppState() {
        const state = {
            lastVisited: window.location.pathname,
            timestamp: Date.now(),
            theme: document.documentElement.getAttribute('data-theme'),
            language: document.documentElement.lang
        };

        Utils.setStorage('app_state', state);
    }

    /**
     * Handle global errors
     * @param {ErrorEvent} e - Error event
     */
    handleGlobalError(e) {
        console.error('Global error:', e.error);
        
        // Log error
        this.logError({
            type: 'global',
            message: e.message,
            stack: e.error?.stack,
            url: window.location.href,
            timestamp: Date.now()
        });

        // Show user-friendly message
        if (!e.message.includes('ResizeObserver')) {
            Utils.showToast('An error occurred. Please try again.', 'error');
        }
    }

    /**
     * Handle unhandled promise rejections
     * @param {PromiseRejectionEvent} e - Rejection event
     */
    handleUnhandledRejection(e) {
        console.error('Unhandled rejection:', e.reason);
        
        // Log error
        this.logError({
            type: 'promise',
            message: e.reason?.message || 'Unknown promise error',
            stack: e.reason?.stack,
            url: window.location.href,
            timestamp: Date.now()
        });

        Utils.showToast('An error occurred. Please try again.', 'error');
    }

    /**
     * Handle fatal errors
     * @param {Error} error - Fatal error
     */
    handleFatalError(error) {
        // Show fatal error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fatal-error';
        errorDiv.innerHTML = `
            <div class="fatal-error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Something went wrong</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()">Reload Page</button>
            </div>
        `;
        document.body.innerHTML = '';
        document.body.appendChild(errorDiv);
    }

    /**
     * Log error to server (in real app)
     * @param {object} errorData - Error data
     */
    logError(errorData) {
        // In production, send to logging service
        console.log('Error logged:', errorData);
        
        // Store locally for debugging
        const errors = Utils.getStorage('error_logs') || [];
        errors.push(errorData);
        if (errors.length > 50) errors.shift();
        Utils.setStorage('error_logs', errors);
    }

    /**
     * Get module instance
     * @param {string} name - Module name
     * @returns {object} Module instance
     */
    getModule(name) {
        return this.modules[name];
    }

    /**
     * Get configuration value
     * @param {string} key - Config key
     * @returns {any} Config value
     */
    getConfig(key) {
        return key ? this.config[key] : this.config;
    }

    /**
     * Update configuration
     * @param {object} newConfig - New configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        Utils.setStorage('app_config', this.config);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SnappApp();
});