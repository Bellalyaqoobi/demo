/**
 * Snapp - Driver Module
 * Version: 1.0.0
 * Handles driver functionality, ride requests, and earnings
 */

class DriverManager {
    constructor() {
        this.driver = null;
        this.currentRide = null;
        this.rideRequests = [];
        this.earnings = Utils.getStorage('driverEarnings') || { daily: 0, weekly: 0, monthly: 0 };
        this.trips = Utils.getStorage('driverTrips') || [];
        this.onlineTime = 0;
        this.onlineInterval = null;
        this.locationUpdateInterval = null;
        
        this.init();
    }

    /**
     * Initialize driver manager
     */
    init() {
        this.checkDriverAuth();
        this.setupEventListeners();
        this.loadDriverData();
        this.setupStatusToggle();
        this.startLocationTracking();
    }

    /**
     * Check driver authentication
     */
    checkDriverAuth() {
        const user = auth.getCurrentUser();
        
        if (!user || user.userType !== 'driver') {
            window.location.href = 'login.html';
            return;
        }

        this.driver = user;
        this.updateDriverUI();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Online/Offline toggle
        const onlineToggle = document.getElementById('onlineToggle');
        if (onlineToggle) {
            onlineToggle.addEventListener('change', (e) => {
                this.toggleOnlineStatus(e.target.checked);
            });
        }

        // Accept ride
        const acceptBtn = document.getElementById('acceptRide');
        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => this.acceptRide());
        }

        // Decline ride
        const declineBtn = document.getElementById('declineRide');
        if (declineBtn) {
            declineBtn.addEventListener('click', () => this.declineRide());
        }

        // Start trip
        const startTripBtn = document.getElementById('startTripBtn');
        if (startTripBtn) {
            startTripBtn.addEventListener('click', () => this.startTrip());
        }

        // Complete trip
        const completeTripBtn = document.getElementById('completeTripBtn');
        if (completeTripBtn) {
            completeTripBtn.addEventListener('click', () => this.completeTrip());
        }

        // Contact passenger
        const contactBtn = document.getElementById('contactPassenger');
        if (contactBtn) {
            contactBtn.addEventListener('click', () => this.contactPassenger());
        }

        // Settings button
        const settingsBtn = document.getElementById('driverSettings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }

        // Save settings
        const saveSettings = document.getElementById('saveSettings');
        if (saveSettings) {
            saveSettings.addEventListener('click', () => this.saveSettings());
        }
    }

    /**
     * Load driver data
     */
    loadDriverData() {
        // Load trips
        this.trips = Utils.getStorage('driverTrips') || [];
        
        // Load earnings
        this.earnings = Utils.getStorage('driverEarnings') || {
            daily: 0,
            weekly: 0,
            monthly: 0
        };

        // Update stats
        this.updateStats();
        
        // Load recent trips
        this.displayRecentTrips();
    }

    /**
     * Update driver UI with data
     */
    updateDriverUI() {
        if (!this.driver) return;

        // Update driver name
        const nameElements = document.querySelectorAll('[data-driver-name]');
        nameElements.forEach(el => {
            el.textContent = this.driver.fullName;
        });

        // Update vehicle info
        const vehicleElements = document.querySelectorAll('[data-driver-vehicle]');
        vehicleElements.forEach(el => {
            el.textContent = `${this.driver.vehicleModel} - ${this.driver.licensePlate}`;
        });

        // Update rating
        const ratingElements = document.querySelectorAll('[data-driver-rating]');
        ratingElements.forEach(el => {
            el.textContent = this.driver.rating || '5.0';
        });
    }

    /**
     * Setup status toggle
     */
    setupStatusToggle() {
        const toggle = document.getElementById('onlineToggle');
        const statusText = document.getElementById('statusText');
        
        if (toggle && statusText) {
            const wasOnline = localStorage.getItem('driverOnline') === 'true';
            
            toggle.checked = wasOnline;
            statusText.textContent = wasOnline ? 'Online' : 'Offline';
            
            if (wasOnline) {
                this.startOnlineTimer();
            }
        }
    }

    /**
     * Toggle online status
     * @param {boolean} online - Online status
     */
    toggleOnlineStatus(online) {
        const statusText = document.getElementById('statusText');
        
        if (statusText) {
            statusText.textContent = online ? 'Online' : 'Offline';
        }

        // Save status
        localStorage.setItem('driverOnline', online);

        if (online) {
            this.startOnlineTimer();
            this.startReceivingRequests();
        } else {
            this.stopOnlineTimer();
            this.stopReceivingRequests();
        }

        // Update driver status in storage
        const drivers = Utils.getStorage('drivers') || [];
        const driverIndex = drivers.findIndex(d => d.id === this.driver.id);
        
        if (driverIndex !== -1) {
            drivers[driverIndex].online = online;
            drivers[driverIndex].status = online ? 'available' : 'offline';
            Utils.setStorage('drivers', drivers);
        }

        Utils.showToast(online ? 'You are now online' : 'You are now offline', 
                       online ? 'success' : 'info');
    }

    /**
     * Start online timer
     */
    startOnlineTimer() {
        this.onlineTime = 0;
        
        this.onlineInterval = setInterval(() => {
            this.onlineTime++;
            
            // Update online time display
            const hours = Math.floor(this.onlineTime / 3600);
            const minutes = Math.floor((this.onlineTime % 3600) / 60);
            
            const timeElement = document.getElementById('statOnlineTime');
            if (timeElement) {
                timeElement.textContent = `${hours}h ${minutes}m`;
            }
        }, 1000);
    }

    /**
     * Stop online timer
     */
    stopOnlineTimer() {
        if (this.onlineInterval) {
            clearInterval(this.onlineInterval);
            this.onlineInterval = null;
        }
    }

    /**
     * Start receiving ride requests
     */
    startReceivingRequests() {
        // Simulate receiving ride requests
        this.requestInterval = setInterval(() => {
            if (this.driver?.online && !this.currentRide) {
                // 20% chance of getting a request
                if (Math.random() < 0.2) {
                    this.generateRideRequest();
                }
            }
        }, 10000); // Check every 10 seconds
    }

    /**
     * Stop receiving ride requests
     */
    stopReceivingRequests() {
        if (this.requestInterval) {
            clearInterval(this.requestInterval);
            this.requestInterval = null;
        }
    }

    /**
     * Generate a ride request
     */
    generateRideRequest() {
        const request = {
            id: Utils.generateId(),
            passenger: this.getRandomPassenger(),
            pickup: this.getRandomAddress(),
            destination: this.getRandomAddress(),
            distance: (Math.random() * 10 + 2).toFixed(1),
            price: Utils.formatCurrency(Math.random() * 15 + 5),
            passengerRating: (4 + Math.random()).toFixed(1),
            timestamp: new Date().toISOString()
        };

        this.rideRequests.push(request);
        this.showRideRequest(request);
    }

    /**
     * Show ride request
     * @param {object} request - Ride request
     */
    showRideRequest(request) {
        const requestCard = document.getElementById('rideRequestCard');
        if (!requestCard) return;

        // Update request details
        document.getElementById('requestPickup').textContent = request.pickup;
        document.getElementById('requestDestination').textContent = request.destination;
        document.getElementById('requestPassenger').textContent = request.passenger.name;
        document.getElementById('passengerRating').textContent = request.passengerRating;
        document.getElementById('requestDistance').textContent = `${request.distance} km away`;

        // Show card with animation
        requestCard.style.display = 'block';
        requestCard.classList.add('animate-slide-in');

        // Play notification sound (if available)
        this.playNotificationSound();

        // Store current request
        this.currentRequest = request;
    }

    /**
     * Accept ride request
     */
    acceptRide() {
        if (!this.currentRequest) return;

        // Create ride
        this.currentRide = {
            id: this.currentRequest.id,
            passenger: this.currentRequest.passenger,
            pickup: this.currentRequest.pickup,
            destination: this.currentRequest.destination,
            price: this.currentRequest.price,
            status: 'accepted',
            acceptedAt: new Date().toISOString()
        };

        // Hide request card
        document.getElementById('rideRequestCard').style.display = 'none';

        // Show active ride card
        this.showActiveRideCard();

        // Update driver status
        this.updateDriverStatus('on_ride');

        // Remove from requests
        this.rideRequests = this.rideRequests.filter(r => r.id !== this.currentRequest.id);

        // Notify passenger (simulated)
        setTimeout(() => {
            Utils.showToast('Passenger notified', 'success');
        }, 1000);

        Utils.showToast('Ride accepted! Head to pickup location', 'success');
    }

    /**
     * Decline ride request
     */
    declineRide() {
        if (!this.currentRequest) return;

        // Hide request card
        document.getElementById('rideRequestCard').style.display = 'none';

        // Remove from requests
        this.rideRequests = this.rideRequests.filter(r => r.id !== this.currentRequest.id);

        this.currentRequest = null;

        Utils.showToast('Ride declined', 'info');
    }

    /**
     * Show active ride card
     */
    showActiveRideCard() {
        const activeCard = document.getElementById('activeRideCard');
        if (!activeCard || !this.currentRide) return;

        // Update passenger info
        document.getElementById('activePassenger').textContent = this.currentRide.passenger.name;
        document.getElementById('activePassengerRating').textContent = 
            this.currentRide.passenger.rating || '4.9';
        document.getElementById('activeDestination').textContent = this.currentRide.destination;

        // Show card
        activeCard.style.display = 'block';

        // Update steps
        this.updateRideSteps('accepted');

        // Start navigation simulation
        this.simulateNavigation();
    }

    /**
     * Update ride steps
     * @param {string} status - Ride status
     */
    updateRideSteps(status) {
        const steps = {
            accepted: 'stepArriving',
            arrived: 'stepBoarding',
            started: 'stepEnRoute',
            completed: 'stepComplete'
        };

        if (!steps[status]) return;

        // Clear previous active steps
        document.querySelectorAll('.ride-steps .step').forEach(step => {
            step.classList.remove('active');
        });

        // Activate current step
        document.getElementById(steps[status]).classList.add('active');

        // Update status badge
        const statusBadge = document.getElementById('activeRideStatus');
        if (statusBadge) {
            const statusText = {
                accepted: 'Arriving',
                arrived: 'Boarding',
                started: 'En Route',
                completed: 'Completed'
            };
            statusBadge.textContent = statusText[status];
        }

        // Update buttons
        this.updateRideButtons(status);
    }

    /**
     * Update ride buttons based on status
     * @param {string} status - Ride status
     */
    updateRideButtons(status) {
        const startBtn = document.getElementById('startTripBtn');
        const completeBtn = document.getElementById('completeTripBtn');
        const contactBtn = document.getElementById('contactPassenger');

        switch(status) {
            case 'accepted':
                startBtn.style.display = 'block';
                completeBtn.style.display = 'none';
                startBtn.textContent = 'Start Trip';
                break;
            case 'arrived':
                startBtn.style.display = 'block';
                completeBtn.style.display = 'none';
                startBtn.textContent = 'Start Trip';
                break;
            case 'started':
                startBtn.style.display = 'none';
                completeBtn.style.display = 'block';
                break;
        }
    }

    /**
     * Simulate navigation to passenger
     */
    simulateNavigation() {
        if (!this.currentRide) return;

        let eta = 5; // 5 minutes
        const etaElement = document.getElementById('navEta');
        const distanceElement = document.getElementById('navDistance');

        const navigationInterval = setInterval(() => {
            eta -= 1;
            
            if (etaElement) {
                etaElement.textContent = `${eta} min`;
            }

            if (distanceElement) {
                const distance = (eta * 0.5).toFixed(1); // Rough estimate
                distanceElement.textContent = `${distance} km`;
            }

            // Arrived at pickup
            if (eta <= 0) {
                clearInterval(navigationInterval);
                this.arrivedAtPickup();
            }
        }, 60000); // Update every minute
    }

    /**
     * Arrived at pickup location
     */
    arrivedAtPickup() {
        this.currentRide.status = 'arrived';
        this.updateRideSteps('arrived');

        Utils.showToast('Arrived at pickup location', 'success');

        // Notify passenger
        this.sendNotification('I have arrived at your location');
    }

    /**
     * Start trip
     */
    startTrip() {
        this.currentRide.status = 'started';
        this.currentRide.startedAt = new Date().toISOString();
        
        this.updateRideSteps('started');

        Utils.showToast('Trip started', 'success');

        // Simulate trip duration
        setTimeout(() => {
            this.completeTrip();
        }, 300000); // 5 minutes
    }

    /**
     * Complete trip
     */
    completeTrip() {
        this.currentRide.status = 'completed';
        this.currentRide.completedAt = new Date().toISOString();
        
        // Add to trips
        this.trips.push(this.currentRide);
        Utils.setStorage('driverTrips', this.trips);

        // Update earnings
        this.updateEarnings(this.currentRide.price);

        // Update stats
        this.updateStats();

        // Update ride steps
        this.updateRideSteps('completed');

        Utils.showToast('Trip completed!', 'success');

        // Hide active ride card after 5 seconds
        setTimeout(() => {
            document.getElementById('activeRideCard').style.display = 'none';
            this.currentRide = null;
            
            // Reset driver status
            if (this.driver.online) {
                this.updateDriverStatus('available');
            }
        }, 5000);
    }

    /**
     * Update earnings
     * @param {string} priceString - Price string
     */
    updateEarnings(priceString) {
        const price = parseFloat(priceString.replace(/[^0-9.-]+/g, ''));
        
        // Update daily earnings
        this.earnings.daily += price;
        
        // Update weekly earnings
        this.earnings.weekly += price;
        
        // Update monthly earnings
        this.earnings.monthly += price;

        // Save to storage
        Utils.setStorage('driverEarnings', this.earnings);
    }

    /**
     * Update driver status
     * @param {string} status - New status
     */
    updateDriverStatus(status) {
        const drivers = Utils.getStorage('drivers') || [];
        const driverIndex = drivers.findIndex(d => d.id === this.driver.id);
        
        if (driverIndex !== -1) {
            drivers[driverIndex].status = status;
            Utils.setStorage('drivers', drivers);
        }
    }

    /**
     * Update statistics display
     */
    updateStats() {
        // Update earnings
        document.getElementById('statEarnings').textContent = 
            Utils.formatCurrency(this.earnings.daily);
        document.getElementById('todayEarnings').textContent = 
            Utils.formatCurrency(this.earnings.daily);
        
        // Update trips count
        document.getElementById('statTrips').textContent = this.trips.length;
        
        // Update rating
        const avgRating = this.calculateAverageRating();
        document.getElementById('statRating').textContent = avgRating;
    }

    /**
     * Calculate average rating
     * @returns {string} Average rating
     */
    calculateAverageRating() {
        const ratings = Utils.getStorage('ratings') || [];
        const driverRatings = ratings.filter(r => r.driverId === this.driver.id);
        
        if (driverRatings.length === 0) return '5.0';
        
        const sum = driverRatings.reduce((acc, r) => acc + r.rating, 0);
        return (sum / driverRatings.length).toFixed(1);
    }

    /**
     * Display recent trips
     */
    displayRecentTrips() {
        const tripsList = document.getElementById('recentTripsList');
        if (!tripsList) return;

        const recentTrips = this.trips.slice(-5).reverse();

        if (recentTrips.length === 0) {
            tripsList.innerHTML = '<div class="no-trips">No trips yet</div>';
            return;
        }

        tripsList.innerHTML = recentTrips.map(trip => `
            <div class="trip-item">
                <div class="trip-header">
                    <span class="trip-passenger">${trip.passenger.name}</span>
                    <span class="trip-price">${trip.price}</span>
                </div>
                <div class="trip-route">
                    <span class="pickup">${trip.pickup.substring(0, 30)}...</span>
                    <i class="fas fa-arrow-right"></i>
                    <span class="destination">${trip.destination.substring(0, 30)}...</span>
                </div>
                <div class="trip-time">
                    ${Utils.formatDate(trip.completedAt)}
                </div>
            </div>
        `).join('');
    }

    /**
     * Start location tracking
     */
    startLocationTracking() {
        if (!navigator.geolocation) return;

        this.locationUpdateInterval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    this.updateDriverLocation(location);
                },
                (error) => {
                    console.warn('Error getting location:', error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000
                }
            );
        }, 30000); // Update every 30 seconds
    }

    /**
     * Update driver location
     * @param {object} location - Current location
     */
    updateDriverLocation(location) {
        const drivers = Utils.getStorage('drivers') || [];
        const driverIndex = drivers.findIndex(d => d.id === this.driver.id);
        
        if (driverIndex !== -1) {
            drivers[driverIndex].location = location;
            Utils.setStorage('drivers', drivers);
        }

        // Update map marker
        if (window.mapManager) {
            window.mapManager.updateDriverPosition(this.driver.id, location);
        }
    }

    /**
     * Contact passenger
     */
    contactPassenger() {
        if (!this.currentRide) return;

        const passenger = this.currentRide.passenger;
        
        // Show contact options
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Contact ${passenger.name}</h3>
                <div class="contact-options">
                    <button class="btn btn-outline btn-block" onclick="driverManager.callPassenger()">
                        <i class="fas fa-phone"></i> Call
                    </button>
                    <button class="btn btn-outline btn-block" onclick="driverManager.textPassenger()">
                        <i class="fas fa-comment"></i> Text
                    </button>
                </div>
                <button class="btn btn-primary btn-block" onclick="this.closest('.modal').remove()">
                    Close
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    /**
     * Call passenger
     */
    callPassenger() {
        Utils.showToast('Calling passenger...', 'info');
        setTimeout(() => {
            Utils.showToast('Call connected', 'success');
        }, 2000);
        document.querySelector('.modal').remove();
    }

    /**
     * Text passenger
     */
    textPassenger() {
        const modal = document.querySelector('.modal');
        if (!modal) return;

        modal.innerHTML = `
            <div class="modal-content">
                <h3>Message Passenger</h3>
                <div class="chat-input">
                    <input type="text" placeholder="Type your message..." class="form-control" id="passengerMessage">
                    <button class="btn btn-primary" onclick="driverManager.sendMessage()">Send</button>
                </div>
                <button class="btn btn-outline btn-block" onclick="this.closest('.modal').remove()">
                    Close
                </button>
            </div>
        `;
    }

    /**
     * Send message to passenger
     */
    sendMessage() {
        const message = document.getElementById('passengerMessage')?.value;
        if (!message) return;

        Utils.showToast('Message sent', 'success');
        document.querySelector('.modal').remove();
    }

    /**
     * Send notification to passenger
     * @param {string} message - Notification message
     */
    sendNotification(message) {
        // Simulate sending notification
        console.log('Notification to passenger:', message);
        
        // In a real app, this would send a push notification
        Utils.showToast(`Notification sent: ${message}`, 'info');
    }

    /**
     * Play notification sound
     */
    playNotificationSound() {
        // Create audio context for notification sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            console.warn('Could not play notification sound:', e);
        }
    }

    /**
     * Show settings modal
     */
    showSettings() {
        const modal = document.getElementById('driverSettingsModal');
        if (!modal) return;

        // Populate current settings
        document.getElementById('settingsVehicleModel').value = this.driver.vehicleModel || '';
        document.getElementById('settingsLicensePlate').value = this.driver.licensePlate || '';
        document.getElementById('settingsVehicleColor').value = this.driver.vehicleColor || '';
        
        // Load preferences
        const preferences = Utils.getStorage('driverPreferences') || {};
        document.getElementById('acceptPets').checked = preferences.acceptPets || false;
        document.getElementById('acceptWheelchair').checked = preferences.acceptWheelchair || false;
        document.getElementById('acceptLuggage').checked = preferences.acceptLuggage || true;
        
        const radius = preferences.serviceRadius || 10;
        document.getElementById('serviceRadius').value = radius;
        document.getElementById('radiusValue').textContent = `${radius} km`;

        modal.style.display = 'flex';
    }

    /**
     * Save settings
     */
    saveSettings() {
        const preferences = {
            vehicleModel: document.getElementById('settingsVehicleModel').value,
            licensePlate: document.getElementById('settingsLicensePlate').value,
            vehicleColor: document.getElementById('settingsVehicleColor').value,
            acceptPets: document.getElementById('acceptPets').checked,
            acceptWheelchair: document.getElementById('acceptWheelchair').checked,
            acceptLuggage: document.getElementById('acceptLuggage').checked,
            serviceRadius: parseInt(document.getElementById('serviceRadius').value)
        };

        // Save to storage
        Utils.setStorage('driverPreferences', preferences);

        // Update driver object
        this.driver.vehicleModel = preferences.vehicleModel;
        this.driver.licensePlate = preferences.licensePlate;
        this.driver.vehicleColor = preferences.vehicleColor;

        // Update drivers in storage
        const drivers = Utils.getStorage('drivers') || [];
        const driverIndex = drivers.findIndex(d => d.id === this.driver.id);
        if (driverIndex !== -1) {
            drivers[driverIndex] = { ...drivers[driverIndex], ...this.driver };
            Utils.setStorage('drivers', drivers);
        }

        // Close modal
        document.getElementById('driverSettingsModal').style.display = 'none';

        Utils.showToast('Settings saved', 'success');
    }

    /**
     * Get random passenger
     * @returns {object} Passenger object
     */
    getRandomPassenger() {
        const names = [
            'Ali Ahmadi', 'Sara Mohammadi', 'Reza Karimi',
            'Maryam Hosseini', 'Amir Rezaei', 'Fatemeh Safari',
            'Hassan Moradi', 'Zahra Rahimi', 'Mohsen Alavi'
        ];
        
        return {
            name: names[Math.floor(Math.random() * names.length)],
            rating: (4 + Math.random()).toFixed(1)
        };
    }

    /**
     * Get random address
     * @returns {string} Random address
     */
    getRandomAddress() {
        const streets = [
            'Valiasr St', 'Taleghani Ave', 'Enghelab Ave',
            'Keshavarz Blvd', 'Motahhari Ave', 'Mirdamad Blvd',
            'Shariati St', 'Pasalaran Ave', 'Ferdowsi Sq',
            'Azadi St', 'Karimkhan St', 'Vanak Sq'
        ];
        
        return streets[Math.floor(Math.random() * streets.length)];
    }
}

// Initialize driver manager
document.addEventListener('DOMContentLoaded', () => {
    window.driverManager = new DriverManager();
});