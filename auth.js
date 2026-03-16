/**
 * Snapp - Authentication Module
 * Version: 1.0.0
 */

// ============================================================================
// Auth Class - Handles all authentication related functionality
// ============================================================================

class Auth {
    constructor() {
        this.currentUser = null;
        this.users = Utils.getStorage('users') || [];
        this.drivers = Utils.getStorage('drivers') || [];
        this.session = Utils.getStorage('session') || null;
        
        this.init();
    }

    /**
     * Initialize authentication
     */
    init() {
        this.checkSession();
        this.setupEventListeners();
        this.setupPasswordToggles();
        this.setupPasswordStrength();
        this.setupUserTypeToggle();
    }

    /**
     * Check if user is logged in
     */
    checkSession() {
        if (this.session) {
            this.currentUser = this.session;
            
            // Redirect based on user type
            if (window.location.pathname.includes('login.html') || 
                window.location.pathname.includes('register.html')) {
                this.redirectBasedOnUserType(this.currentUser.userType);
            }
        }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Login form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form submission
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
        }

        // Input validation
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', (e) => this.validateEmail(e.target));
        }

        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('blur', (e) => this.validatePhone(e.target));
        }
    }

    /**
     * Setup password toggle visibility buttons
     */
    setupPasswordToggles() {
        document.querySelectorAll('.password-toggle').forEach(button => {
            button.addEventListener('click', (e) => {
                const input = e.target.closest('.password-field').querySelector('input');
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                e.target.querySelector('i').className = `fas fa-${type === 'password' ? 'eye' : 'eye-slash'}`;
            });
        });
    }

    /**
     * Setup password strength checker
     */
    setupPasswordStrength() {
        const passwordInput = document.getElementById('password');
        if (!passwordInput) return;

        passwordInput.addEventListener('input', (e) => {
            const password = e.target.value;
            const strength = Utils.checkPasswordStrength(password);
            
            const strengthBars = document.querySelectorAll('.strength-bar');
            const strengthText = document.getElementById('strengthText');
            
            if (strengthBars.length) {
                strengthBars.forEach((bar, index) => {
                    if (index < strength.strength) {
                        bar.style.backgroundColor = strength.color;
                        bar.style.opacity = '1';
                    } else {
                        bar.style.opacity = '0.3';
                    }
                });
            }
            
            if (strengthText) {
                strengthText.textContent = strength.message;
                strengthText.style.color = strength.color;
            }
        });
    }

    /**
     * Setup user type toggle for registration
     */
    setupUserTypeToggle() {
        const userTypeRadios = document.querySelectorAll('input[name="userType"]');
        const driverFields = document.getElementById('driverFields');
        
        if (!userTypeRadios.length || !driverFields) return;
        
        userTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'driver') {
                    driverFields.style.display = 'block';
                    this.setDriverFieldsRequired(true);
                } else {
                    driverFields.style.display = 'none';
                    this.setDriverFieldsRequired(false);
                }
            });
        });
    }

    /**
     * Set driver fields required attribute
     * @param {boolean} required - Whether fields are required
     */
    setDriverFieldsRequired(required) {
        const fields = ['licenseNumber', 'vehicleModel', 'licensePlate'];
        fields.forEach(field => {
            const input = document.getElementById(field);
            if (input) {
                input.required = required;
            }
        });
    }

    /**
     * Handle login form submission
     * @param {Event} e - Form submit event
     */
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const userType = document.querySelector('input[name="userType"]:checked').value;
        const rememberMe = document.getElementById('rememberMe')?.checked || false;
        
        const loginBtn = document.getElementById('loginBtn');
        Utils.showLoading(loginBtn);
        
        try {
            // Validate inputs
            if (!this.validateLoginForm(email, password)) {
                throw new Error('Please fill in all fields correctly');
            }
            
            // Find user based on type
            let user = null;
            if (userType === 'driver') {
                user = this.drivers.find(d => d.email === email && d.password === password);
            } else {
                user = this.users.find(u => u.email === email && u.password === password);
            }
            
            if (!user) {
                throw new Error('Invalid email or password');
            }
            
            // Check if user is blocked
            if (user.status === 'blocked') {
                throw new Error('Your account has been blocked. Please contact support.');
            }
            
            // Set session
            this.currentUser = {
                ...user,
                userType,
                lastLogin: new Date().toISOString()
            };
            
            this.session = this.currentUser;
            
            if (rememberMe) {
                Utils.setStorage('session', this.session);
            } else {
                sessionStorage.setItem('session', JSON.stringify(this.session));
            }
            
            // Log login event
            this.logAuthEvent('login', user.email);
            
            Utils.showToast('Login successful! Redirecting...', 'success');
            
            // Redirect based on user type
            setTimeout(() => {
                this.redirectBasedOnUserType(userType);
            }, 1500);
            
        } catch (error) {
            Utils.showToast(error.message, 'error');
        } finally {
            Utils.hideLoading(loginBtn);
        }
    }

    /**
     * Handle registration form submission
     * @param {Event} e - Form submit event
     */
    async handleRegister(e) {
        e.preventDefault();
        
        const formData = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirmPassword').value,
            userType: document.querySelector('input[name="userType"]:checked').value,
            terms: document.getElementById('terms').checked
        };
        
        // Add driver fields if applicable
        if (formData.userType === 'driver') {
            formData.licenseNumber = document.getElementById('licenseNumber')?.value;
            formData.vehicleModel = document.getElementById('vehicleModel')?.value;
            formData.licensePlate = document.getElementById('licensePlate')?.value;
        }
        
        const registerBtn = document.getElementById('registerBtn');
        Utils.showLoading(registerBtn);
        
        try {
            // Validate form
            this.validateRegistrationForm(formData);
            
            // Check if user already exists
            const existingUser = [...this.users, ...this.drivers].find(u => u.email === formData.email);
            if (existingUser) {
                throw new Error('Email already registered');
            }
            
            // Create new user object
            const newUser = {
                id: Utils.generateId(),
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                userType: formData.userType,
                status: 'active',
                createdAt: new Date().toISOString(),
                rides: 0,
                rating: 5.0
            };
            
            // Add driver-specific fields
            if (formData.userType === 'driver') {
                newUser.licenseNumber = formData.licenseNumber;
                newUser.vehicleModel = formData.vehicleModel;
                newUser.licensePlate = formData.licensePlate;
                newUser.verified = false;
                newUser.online = false;
                newUser.earnings = 0;
                newUser.location = null;
                
                this.drivers.push(newUser);
                Utils.setStorage('drivers', this.drivers);
            } else {
                this.users.push(newUser);
                Utils.setStorage('users', this.users);
            }
            
            // Log registration event
            this.logAuthEvent('register', newUser.email);
            
            Utils.showToast('Registration successful!', 'success');
            
            // Show success modal
            const modal = document.getElementById('successModal');
            if (modal) {
                modal.style.display = 'flex';
            } else {
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
            
        } catch (error) {
            Utils.showToast(error.message, 'error');
        } finally {
            Utils.hideLoading(registerBtn);
        }
    }

    /**
     * Handle logout
     * @param {Event} e - Click event
     */
    handleLogout(e) {
        e.preventDefault();
        
        // Log logout event
        if (this.currentUser) {
            this.logAuthEvent('logout', this.currentUser.email);
        }
        
        // Clear session
        this.currentUser = null;
        this.session = null;
        Utils.removeStorage('session');
        sessionStorage.removeItem('session');
        
        Utils.showToast('Logged out successfully', 'success');
        
        // Redirect to login
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }

    /**
     * Validate login form
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {boolean} True if valid
     */
    validateLoginForm(email, password) {
        let isValid = true;
        
        // Validate email
        if (!Utils.validateEmail(email)) {
            this.showFieldError('email', 'Please enter a valid email address');
            isValid = false;
        } else {
            this.clearFieldError('email');
        }
        
        // Validate password
        if (!password || password.length < 6) {
            this.showFieldError('password', 'Password must be at least 6 characters');
            isValid = false;
        } else {
            this.clearFieldError('password');
        }
        
        return isValid;
    }

    /**
     * Validate registration form
     * @param {object} formData - Form data to validate
     */
    validateRegistrationForm(formData) {
        // Validate full name
        if (!formData.fullName || formData.fullName.length < 2) {
            throw new Error('Please enter your full name');
        }
        
        // Validate email
        if (!Utils.validateEmail(formData.email)) {
            throw new Error('Please enter a valid email address');
        }
        
        // Validate phone
        if (!Utils.validatePhone(formData.phone)) {
            throw new Error('Please enter a valid phone number');
        }
        
        // Validate password
        const passwordStrength = Utils.checkPasswordStrength(formData.password);
        if (passwordStrength.strength < 3) {
            throw new Error('Password is too weak. Please use a stronger password');
        }
        
        // Validate password confirmation
        if (formData.password !== formData.confirmPassword) {
            throw new Error('Passwords do not match');
        }
        
        // Validate terms
        if (!formData.terms) {
            throw new Error('You must agree to the Terms of Service');
        }
        
        // Validate driver fields if applicable
        if (formData.userType === 'driver') {
            if (!formData.licenseNumber) {
                throw new Error('Please enter your driver license number');
            }
            if (!formData.vehicleModel) {
                throw new Error('Please enter your vehicle model');
            }
            if (!formData.licensePlate) {
                throw new Error('Please enter your license plate');
            }
        }
    }

    /**
     * Validate email field
     * @param {HTMLElement} field - Email input field
     */
    validateEmail(field) {
        if (!Utils.validateEmail(field.value)) {
            this.showFieldError('email', 'Please enter a valid email address');
        } else {
            this.clearFieldError('email');
        }
    }

    /**
     * Validate phone field
     * @param {HTMLElement} field - Phone input field
     */
    validatePhone(field) {
        if (!Utils.validatePhone(field.value)) {
            this.showFieldError('phone', 'Please enter a valid phone number');
        } else {
            this.clearFieldError('phone');
        }
    }

    /**
     * Show field error message
     * @param {string} fieldId - Field ID
     * @param {string} message - Error message
     */
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorEl = document.getElementById(`${fieldId}Error`);
        
        if (field && errorEl) {
            field.classList.add('error');
            errorEl.textContent = message;
        }
    }

    /**
     * Clear field error message
     * @param {string} fieldId - Field ID
     */
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        const errorEl = document.getElementById(`${fieldId}Error`);
        
        if (field && errorEl) {
            field.classList.remove('error');
            errorEl.textContent = '';
        }
    }

    /**
     * Log authentication event
     * @param {string} event - Event type
     * @param {string} email - User email
     */
    logAuthEvent(event, email) {
        const logs = Utils.getStorage('auth_logs') || [];
        logs.push({
            event,
            email,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ip: '127.0.0.1' // In real app, this would come from server
        });
        
        // Keep only last 100 logs
        if (logs.length > 100) {
            logs.shift();
        }
        
        Utils.setStorage('auth_logs', logs);
    }

    /**
     * Redirect based on user type
     * @param {string} userType - Type of user
     */
    redirectBasedOnUserType(userType) {
        switch(userType) {
            case 'admin':
                window.location.href = 'admin.html';
                break;
            case 'driver':
                window.location.href = 'driver.html';
                break;
            default:
                window.location.href = 'dashboard.html';
        }
    }

    /**
     * Get current user
     * @returns {object|null} Current user
     */
    getCurrentUser() {
        return this.currentUser || this.session;
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if authenticated
     */
    isAuthenticated() {
        return !!(this.currentUser || this.session);
    }

    /**
     * Check if user is admin
     * @returns {boolean} True if admin
     */
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.userType === 'admin';
    }

    /**
     * Check if user is driver
     * @returns {boolean} True if driver
     */
    isDriver() {
        const user = this.getCurrentUser();
        return user && user.userType === 'driver';
    }

    /**
     * Check if user is rider
     * @returns {boolean} True if rider
     */
    isRider() {
        const user = this.getCurrentUser();
        return user && user.userType === 'user';
    }

    /**
     * Update user profile
     * @param {string} userId - User ID
     * @param {object} updates - Profile updates
     */
    updateProfile(userId, updates) {
        const userType = this.getCurrentUser()?.userType;
        const storage = userType === 'driver' ? 'drivers' : 'users';
        const users = Utils.getStorage(storage) || [];
        
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            Utils.setStorage(storage, users);
            
            // Update session if current user
            if (this.currentUser?.id === userId) {
                this.currentUser = { ...this.currentUser, ...updates };
                this.session = this.currentUser;
                Utils.setStorage('session', this.session);
            }
            
            return true;
        }
        
        return false;
    }
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new Auth();
});