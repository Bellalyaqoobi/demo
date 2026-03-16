/**
 * Snapp - Utility Functions
 * Version: 1.0.0
 */

// ============================================================================
// Global Utilities Object
// ============================================================================

const Utils = {
    /**
     * Generate a unique ID
     * @returns {string} Unique identifier
     */
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Format currency
     * @param {number} amount - Amount to format
     * @param {string} currency - Currency code
     * @returns {string} Formatted currency
     */
    formatCurrency: (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },

    /**
     * Format date
     * @param {Date|string} date - Date to format
     * @param {object} options - Intl.DateTimeFormat options
     * @returns {string} Formatted date
     */
    formatDate: (date, options = {}) => {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options })
            .format(new Date(date));
    },

    /**
     * Format distance
     * @param {number} meters - Distance in meters
     * @returns {string} Formatted distance
     */
    formatDistance: (meters) => {
        if (meters < 1000) {
            return `${Math.round(meters)} m`;
        }
        return `${(meters / 1000).toFixed(1)} km`;
    },

    /**
     * Format duration
     * @param {number} seconds - Duration in seconds
     * @returns {string} Formatted duration
     */
    formatDuration: (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes} min`;
    },

    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle: (func, limit) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Deep clone object
     * @param {object} obj - Object to clone
     * @returns {object} Cloned object
     */
    deepClone: (obj) => {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Check if object is empty
     * @param {object} obj - Object to check
     * @returns {boolean} True if empty
     */
    isEmptyObject: (obj) => {
        return Object.keys(obj).length === 0 && obj.constructor === Object;
    },

    /**
     * Get random number between min and max
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random number
     */
    randomBetween: (min, max) => {
        return Math.random() * (max - min) + min;
    },

    /**
     * Get random integer between min and max
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random integer
     */
    randomIntBetween: (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Validate email
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid
     */
    validateEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * Validate phone number
     * @param {string} phone - Phone to validate
     * @returns {boolean} True if valid
     */
    validatePhone: (phone) => {
        const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
        return re.test(phone);
    },

    /**
     * Check password strength
     * @param {string} password - Password to check
     * @returns {object} Strength assessment
     */
    checkPasswordStrength: (password) => {
        let strength = 0;
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            numbers: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        };
        
        strength = Object.values(checks).filter(Boolean).length;
        
        let message = 'Weak';
        let color = '#dc3545';
        
        if (strength >= 4) {
            message = 'Strong';
            color = '#28a745';
        } else if (strength >= 3) {
            message = 'Medium';
            color = '#ffc107';
        }
        
        return {
            strength,
            checks,
            message,
            color
        };
    },

    /**
     * Show toast notification
     * @param {string} message - Message to show
     * @param {string} type - Type (success, error, warning, info)
     */
    showToast: (message, type = 'info') => {
        const toast = document.getElementById('toastNotification');
        if (!toast) return;
        
        const icon = toast.querySelector('i');
        const messageEl = toast.querySelector('.toast-message');
        
        icon.className = `fas fa-${type === 'success' ? 'check-circle' : 
                                  type === 'error' ? 'exclamation-circle' :
                                  type === 'warning' ? 'exclamation-triangle' :
                                  'info-circle'}`;
        messageEl.textContent = message;
        
        toast.classList.add('show', type);
        
        setTimeout(() => {
            toast.classList.remove('show', type);
        }, 3000);
    },

    /**
     * Show loading spinner
     * @param {HTMLElement} element - Element to show spinner on
     */
    showLoading: (element) => {
        if (!element) return;
        
        const btnText = element.querySelector('.btn-text');
        const btnLoader = element.querySelector('.btn-loader');
        
        if (btnText && btnLoader) {
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-block';
        }
        
        element.disabled = true;
    },

    /**
     * Hide loading spinner
     * @param {HTMLElement} element - Element to hide spinner on
     */
    hideLoading: (element) => {
        if (!element) return;
        
        const btnText = element.querySelector('.btn-text');
        const btnLoader = element.querySelector('.btn-loader');
        
        if (btnText && btnLoader) {
            btnText.style.display = 'inline-block';
            btnLoader.style.display = 'none';
        }
        
        element.disabled = false;
    },

    /**
     * Save data to localStorage
     * @param {string} key - Storage key
     * @param {any} data - Data to store
     */
    setStorage: (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    },

    /**
     * Get data from localStorage
     * @param {string} key - Storage key
     * @returns {any} Retrieved data
     */
    getStorage: (key) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return null;
        }
    },

    /**
     * Remove data from localStorage
     * @param {string} key - Storage key
     */
    removeStorage: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Error removing from localStorage:', e);
        }
    },

    /**
     * Clear all localStorage
     */
    clearStorage: () => {
        try {
            localStorage.clear();
        } catch (e) {
            console.error('Error clearing localStorage:', e);
        }
    },

    /**
     * Get current location
     * @returns {Promise} Promise with location coordinates
     */
    getCurrentLocation: () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        });
    },

    /**
     * Calculate distance between two points (Haversine formula)
     * @param {object} point1 - First point {lat, lng}
     * @param {object} point2 - Second point {lat, lng}
     * @returns {number} Distance in meters
     */
    calculateDistance: (point1, point2) => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = point1.lat * Math.PI / 180;
        const φ2 = point2.lat * Math.PI / 180;
        const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
        const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    },

    /**
     * Detect if element is in viewport
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} True if in viewport
     */
    isInViewport: (element) => {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    /**
     * Smooth scroll to element
     * @param {HTMLElement} element - Element to scroll to
     * @param {number} offset - Offset from element
     */
    scrollToElement: (element, offset = 0) => {
        if (!element) return;
        
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    },

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise} Promise that resolves when copied
     */
    copyToClipboard: async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Failed to copy:', err);
            return false;
        }
    },

    /**
     * Download data as file
     * @param {any} data - Data to download
     * @param {string} filename - File name
     * @param {string} type - File type
     */
    downloadFile: (data, filename, type = 'application/json') => {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = filename;
        link.click();
        
        URL.revokeObjectURL(url);
    },

    /**
     * Parse query string
     * @returns {object} Parsed query parameters
     */
    getQueryParams: () => {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        
        for (const [key, value] of params) {
            result[key] = value;
        }
        
        return result;
    },

    /**
     * Set query string parameter
     * @param {string} key - Parameter key
     * @param {string} value - Parameter value
     */
    setQueryParam: (key, value) => {
        const url = new URL(window.location.href);
        url.searchParams.set(key, value);
        window.history.pushState({}, '', url);
    },

    /**
     * Remove query string parameter
     * @param {string} key - Parameter key to remove
     */
    removeQueryParam: (key) => {
        const url = new URL(window.location.href);
        url.searchParams.delete(key);
        window.history.pushState({}, '', url);
    },

    /**
     * Detect if device is mobile
     * @returns {boolean} True if mobile
     */
    isMobile: () => {
        return window.innerWidth <= 768;
    },

    /**
     * Detect if device is tablet
     * @returns {boolean} True if tablet
     */
    isTablet: () => {
        return window.innerWidth > 768 && window.innerWidth <= 992;
    },

    /**
     * Detect if device is desktop
     * @returns {boolean} True if desktop
     */
    isDesktop: () => {
        return window.innerWidth > 992;
    },

    /**
     * Get device type
     * @returns {string} Device type (mobile, tablet, desktop)
     */
    getDeviceType: () => {
        if (window.innerWidth <= 768) return 'mobile';
        if (window.innerWidth <= 992) return 'tablet';
        return 'desktop';
    },

    /**
     * Check if online
     * @returns {boolean} True if online
     */
    isOnline: () => {
        return navigator.onLine;
    },

    /**
     * Add event listener with debounce
     * @param {HTMLElement} element - Element to listen to
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @param {number} wait - Debounce wait time
     */
    addDebouncedEventListener: (element, event, handler, wait = 300) => {
        const debouncedHandler = Utils.debounce(handler, wait);
        element.addEventListener(event, debouncedHandler);
        return debouncedHandler;
    },

    /**
     * Create and dispatch custom event
     * @param {string} eventName - Name of event
     * @param {any} detail - Event detail
     */
    dispatchEvent: (eventName, detail = {}) => {
        const event = new CustomEvent(eventName, { detail });
        window.dispatchEvent(event);
    },

    /**
     * Group array by key
     * @param {Array} array - Array to group
     * @param {string} key - Key to group by
     * @returns {object} Grouped object
     */
    groupBy: (array, key) => {
        return array.reduce((result, item) => {
            const groupKey = item[key];
            if (!result[groupKey]) {
                result[groupKey] = [];
            }
            result[groupKey].push(item);
            return result;
        }, {});
    },

    /**
     * Sort array by key
     * @param {Array} array - Array to sort
     * @param {string} key - Key to sort by
     * @param {string} order - Sort order (asc, desc)
     * @returns {Array} Sorted array
     */
    sortBy: (array, key, order = 'asc') => {
        return [...array].sort((a, b) => {
            if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
            return 0;
        });
    },

    /**
     * Filter array by search term
     * @param {Array} array - Array to filter
     * @param {string} term - Search term
     * @param {Array} keys - Keys to search in
     * @returns {Array} Filtered array
     */
    filterBySearch: (array, term, keys = []) => {
        if (!term) return array;
        
        const searchTerm = term.toLowerCase();
        return array.filter(item => {
            return keys.some(key => {
                const value = item[key];
                if (!value) return false;
                return value.toString().toLowerCase().includes(searchTerm);
            });
        });
    },

    /**
     * Paginate array
     * @param {Array} array - Array to paginate
     * @param {number} page - Page number
     * @param {number} perPage - Items per page
     * @returns {object} Paginated result
     */
    paginate: (array, page = 1, perPage = 10) => {
        const start = (page - 1) * perPage;
        const end = start + perPage;
        
        return {
            data: array.slice(start, end),
            currentPage: page,
            totalPages: Math.ceil(array.length / perPage),
            totalItems: array.length,
            perPage: perPage
        };
    },

    /**
     * Retry function on failure
     * @param {Function} fn - Function to retry
     * @param {number} maxAttempts - Maximum attempts
     * @param {number} delay - Delay between attempts
     * @returns {Promise} Promise with result
     */
    retry: async (fn, maxAttempts = 3, delay = 1000) => {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                if (attempt === maxAttempts) throw error;
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }
    },

    /**
     * Measure function performance
     * @param {Function} fn - Function to measure
     * @param {string} name - Measurement name
     * @returns {any} Function result
     */
    measurePerformance: (fn, name = 'Function') => {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${name} took ${end - start}ms`);
        return result;
    },

    /**
     * Cache function results
     * @param {Function} fn - Function to cache
     * @returns {Function} Cached function
     */
    memoize: (fn) => {
        const cache = new Map();
        return (...args) => {
            const key = JSON.stringify(args);
            if (cache.has(key)) {
                return cache.get(key);
            }
            const result = fn(...args);
            cache.set(key, result);
            return result;
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}