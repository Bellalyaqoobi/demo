/**
 * Snapp - Ride Management Module
 * Version: 1.0.0
 * Handles ride requests, status tracking, and driver matching
 */

class RideManager {
    constructor() {
        this.currentRide = null;
        this.availableDrivers = [];
        this.rideHistory = Utils.getStorage('rideHistory') || [];
        this.rideTypes = {
            economy: {
                name: 'Economy',
                baseFare: 2.5,
                perKm: 1.2,
                perMinute: 0.3,
                icon: 'fa-car',
                color: '#28a745'
            },
            comfort: {
                name: 'Comfort',
                baseFare: 3.5,
                perKm: 1.8,
                perMinute: 0.4,
                icon: 'fa-car-side',
                color: '#ff6b00'
            },
            premium: {
                name: 'Premium',
                baseFare: 5.0,
                perKm: 2.5,
                perMinute: 0.5,
                icon: 'fa-taxi',
                color: '#dc3545'
            }
        };
        
        this.statusFlow = [
            'searching',
            'driver_assigned',
            'driver_arriving',
            'trip_started',
            'trip_completed'
        ];
        
        this.init();
    }

    /**
     * Initialize ride manager
     */
    init() {
        this.setupEventListeners();
        this.loadAvailableDrivers();
        this.setupRideTypeSelector();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Request ride button
        const requestBtn = document.getElementById('requestRideBtn');
        if (requestBtn) {
            requestBtn.addEventListener('click', () => this.requestRide());
        }

        // Cancel ride button
        const cancelBtn = document.getElementById('cancelRideBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelRide());
        }

        // Confirm ride modal
        const confirmBtn = document.getElementById('confirmRide');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirmRide());
        }

        // Submit rating
        const submitRating = document.getElementById('submitRating');
        if (submitRating) {
            submitRating.addEventListener('click', () => this.submitRating());
        }

        // Call driver
        const callDriver = document.getElementById('callDriver');
        if (callDriver) {
            callDriver.addEventListener('click', () => this.callDriver());
        }

        // Message driver
        const messageDriver = document.getElementById('messageDriver');
        if (messageDriver) {
            messageDriver.addEventListener('click', () => this.messageDriver());
        }
    }

    /**
     * Setup ride type selector
     */
    setupRideTypeSelector() {
        const rideTypes = document.querySelectorAll('.ride-type');
        
        rideTypes.forEach(type => {
            type.addEventListener('click', (e) => {
                rideTypes.forEach(t => t.classList.remove('active'));
                type.classList.add('active');
                
                const rideType = type.dataset.type;
                this.updatePriceForType(rideType);
            });
        });
    }

    /**
     * Update price based on ride type
     * @param {string} type - Ride type
     */
    updatePriceForType(type) {
        const rideType = this.rideTypes[type];
        const distance = parseFloat(document.getElementById('distance')?.textContent) || 0;
        const duration = parseFloat(document.getElementById('duration')?.textContent) || 0;
        
        if (distance && duration) {
            const price = this.calculatePrice(distance, duration, type);
            document.getElementById('estimatedPrice').textContent = Utils.formatCurrency(price);
        }
    }

    /**
     * Calculate ride price
     * @param {number} distance - Distance in km
     * @param {number} duration - Duration in minutes
     * @param {string} type - Ride type
     * @returns {number} Calculated price
     */
    calculatePrice(distance, duration, type = 'economy') {
        const rideType = this.rideTypes[type];
        const distanceKm = parseFloat(distance) || 0;
        const durationMin = parseFloat(duration) || 0;
        
        return rideType.baseFare + 
               (distanceKm * rideType.perKm) + 
               (durationMin * rideType.perMinute);
    }

    /**
     * Request a ride
     */
    requestRide() {
        // Show confirmation modal
        const modal = document.getElementById('confirmationModal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Update modal with ride details
            const pickup = document.getElementById('pickupAddress').textContent;
            const destination = document.getElementById('destinationAddress').textContent;
            const price = document.getElementById('estimatedPrice').textContent;
            
            modal.querySelector('.modal-content p').innerHTML = `
                Pickup: ${pickup}<br>
                Destination: ${destination}<br>
                Price: ${price}
            `;
        }
    }

    /**
     * Confirm ride request
     */
    confirmRide() {
        const modal = document.getElementById('confirmationModal');
        modal.style.display = 'none';

        // Create ride object
        this.currentRide = {
            id: Utils.generateId(),
            userId: auth.getCurrentUser()?.id,
            pickup: {
                address: document.getElementById('pickupAddress').textContent,
                location: mapManager.pickupLocation
            },
            destination: {
                address: document.getElementById('destinationAddress').textContent,
                location: mapManager.destinationLocation
            },
            type: document.querySelector('.ride-type.active').dataset.type,
            price: document.getElementById('estimatedPrice').textContent,
            distance: document.getElementById('distance').textContent,
            duration: document.getElementById('duration').textContent,
            status: 'searching',
            requestedAt: new Date().toISOString(),
            driver: null
        };

        // Hide ride request card, show ride status
        document.querySelector('.ride-card .card-header').style.display = 'none';
        document.querySelector('.ride-locations').style.display = 'none';
        document.getElementById('rideDetails').style.display = 'none';
        document.getElementById('requestRideBtn').style.display = 'none';
        document.getElementById('rideStatus').style.display = 'block';

        // Start searching for drivers
        this.searchForDrivers();

        Utils.showToast('Searching for nearby drivers...', 'info');
    }

    /**
     * Search for available drivers
     */
    searchForDrivers() {
        // Simulate driver search
        let searchTime = 0;
        const searchInterval = setInterval(() => {
            searchTime += 1000;
            
            // Update status text
            const statusBadge = document.getElementById('statusBadge');
            if (statusBadge) {
                const dots = '.'.repeat(Math.floor(searchTime / 1000) % 4);
                statusBadge.textContent = `Searching${dots}`;
            }

            // Simulate finding a driver after 3 seconds
            if (searchTime >= 3000) {
                clearInterval(searchInterval);
                this.assignDriver();
            }
        }, 1000);
    }

    /**
     * Assign a driver to the ride
     */
    assignDriver() {
        // Generate random driver
        const driver = {
            id: Utils.generateId(),
            name: this.getRandomDriverName(),
            rating: (4 + Math.random()).toFixed(1),
            vehicle: this.getRandomVehicle(),
            licensePlate: this.getRandomPlate(),
            location: this.getRandomLocationNear(this.currentRide.pickup.location),
            avatar: 'assets/images/driver-avatar.png',
            eta: Math.floor(Math.random() * 5) + 3 // 3-7 minutes
        };

        this.currentRide.driver = driver;
        this.currentRide.status = 'driver_assigned';
        this.currentRide.driverAssignedAt = new Date().toISOString();

        // Update UI
        this.updateRideStatus('driver_assigned');
        
        // Show driver info
        this.showDriverInfo(driver);
        
        // Add driver marker to map
        mapManager.addDriverMarker(driver.location, driver);
        
        // Simulate driver movement
        this.simulateDriverMovement(driver);

        Utils.showToast(`Driver ${driver.name} assigned to your ride!`, 'success');
    }

    /**
     * Update ride status in UI
     * @param {string} status - New status
     */
    updateRideStatus(status) {
        const statusBadge = document.getElementById('statusBadge');
        const steps = {
            driver_assigned: 'stepDriver',
            driver_arriving: 'stepArriving',
            trip_started: 'stepTrip'
        };

        // Update status badge
        if (statusBadge) {
            const statusText = {
                'driver_assigned': 'Driver Assigned',
                'driver_arriving': 'Driver Arriving',
                'trip_started': 'Trip Started',
                'trip_completed': 'Completed'
            };
            statusBadge.textContent = statusText[status] || status;
        }

        // Update progress step
        if (steps[status]) {
            document.getElementById(steps[status]).classList.add('completed');
        }

        // Show/hide appropriate elements
        if (status === 'driver_arriving') {
            document.getElementById('etaInfo').style.display = 'flex';
        }

        if (status === 'trip_started') {
            document.getElementById('etaInfo').style.display = 'none';
            document.getElementById('stepArriving').classList.add('completed');
        }

        if (status === 'trip_completed') {
            this.completeRide();
        }
    }

    /**
     * Show driver information
     * @param {object} driver - Driver object
     */
    showDriverInfo(driver) {
        const driverInfo = document.getElementById('driverInfo');
        
        document.getElementById('driverName').textContent = driver.name;
        document.getElementById('driverRating').textContent = driver.rating;
        document.getElementById('driverCar').textContent = `${driver.vehicle} • ${driver.licensePlate}`;
        document.getElementById('driverEta').textContent = driver.eta;

        driverInfo.style.display = 'flex';
    }

    /**
     * Simulate driver movement toward passenger
     * @param {object} driver - Driver object
     */
    simulateDriverMovement(driver) {
        let eta = driver.eta;
        const etaElement = document.getElementById('driverEta');
        
        const movementInterval = setInterval(() => {
            eta -= 1;
            
            if (etaElement) {
                etaElement.textContent = eta;
            }

            // Update driver position (simplified)
            if (eta <= 2) {
                // Driver is very close
                if (eta === 2) {
                    this.updateRideStatus('driver_arriving');
                }
                
                // Driver arrived
                if (eta <= 0) {
                    clearInterval(movementInterval);
                    this.driverArrived();
                }
            }
        }, 60000); // Update every minute
    }

    /**
     * Handle driver arrival
     */
    driverArrived() {
        this.currentRide.status = 'driver_arriving';
        this.currentRide.driverArrivedAt = new Date().toISOString();
        
        Utils.showToast('Your driver has arrived!', 'success');
        
        // Show notification
        this.showNotification('Driver Arrived', 'Your driver is waiting for you');
    }

    /**
     * Start trip
     */
    startTrip() {
        this.currentRide.status = 'trip_started';
        this.currentRide.tripStartedAt = new Date().toISOString();
        
        this.updateRideStatus('trip_started');
        
        Utils.showToast('Trip started! Safe journey!', 'success');
    }

    /**
     * Complete ride
     */
    completeRide() {
        this.currentRide.status = 'trip_completed';
        this.currentRide.tripCompletedAt = new Date().toISOString();
        
        // Add to ride history
        this.rideHistory.push(this.currentRide);
        Utils.setStorage('rideHistory', this.rideHistory);
        
        // Update user ride count
        this.updateUserRideCount();
        
        // Show rating modal
        setTimeout(() => {
            this.showRatingModal();
        }, 1000);
        
        // Reset UI after 5 seconds
        setTimeout(() => {
            this.resetRideUI();
        }, 5000);
    }

    /**
     * Cancel ride
     */
    cancelRide() {
        if (!this.currentRide) return;

        // Add cancellation fee if applicable
        const cancelTime = new Date() - new Date(this.currentRide.requestedAt);
        const cancelFee = cancelTime < 120000 ? 0 : 2.5; // Free within 2 minutes

        if (cancelFee > 0) {
            Utils.showToast(`Ride cancelled. Cancellation fee: ${Utils.formatCurrency(cancelFee)}`, 'warning');
        } else {
            Utils.showToast('Ride cancelled successfully', 'info');
        }

        // Reset UI
        this.resetRideUI();
        
        // Clear current ride
        this.currentRide = null;
    }

    /**
     * Reset ride UI
     */
    resetRideUI() {
        document.querySelector('.ride-card .card-header').style.display = 'block';
        document.querySelector('.ride-locations').style.display = 'block';
        document.getElementById('rideStatus').style.display = 'none';
        document.getElementById('rideDetails').style.display = 'none';
        document.getElementById('requestRideBtn').style.display = 'block';
        document.getElementById('requestRideBtn').disabled = true;
        
        // Clear driver markers
        mapManager.driverMarkers.forEach(marker => marker.setMap(null));
        mapManager.driverMarkers = [];
    }

    /**
     * Show rating modal
     */
    showRatingModal() {
        const modal = document.getElementById('ratingModal');
        if (!modal) return;

        const driverName = document.getElementById('ratingDriverName');
        if (driverName && this.currentRide?.driver) {
            driverName.textContent = this.currentRide.driver.name;
        }

        modal.style.display = 'flex';

        // Setup rating stars
        const stars = modal.querySelectorAll('.rating-stars i');
        stars.forEach(star => {
            star.addEventListener('mouseover', () => {
                const rating = star.dataset.rating;
                this.highlightStars(rating, stars);
            });

            star.addEventListener('mouseout', () => {
                this.highlightStars(0, stars);
            });

            star.addEventListener('click', () => {
                const rating = star.dataset.rating;
                this.selectRating(rating, stars);
            });
        });
    }

    /**
     * Highlight rating stars
     * @param {number} rating - Selected rating
     * @param {NodeList} stars - Star elements
     */
    highlightStars(rating, stars) {
        stars.forEach(star => {
            const starRating = star.dataset.rating;
            if (starRating <= rating) {
                star.className = 'fas fa-star';
            } else {
                star.className = 'far fa-star';
            }
        });
    }

    /**
     * Select rating
     * @param {number} rating - Selected rating
     * @param {NodeList} stars - Star elements
     */
    selectRating(rating, stars) {
        this.selectedRating = rating;
        this.highlightStars(rating, stars);
    }

    /**
     * Submit rating
     */
    submitRating() {
        if (!this.selectedRating) {
            Utils.showToast('Please select a rating', 'warning');
            return;
        }

        const comment = document.querySelector('.rating-comment')?.value || '';
        
        // Save rating
        const rating = {
            rideId: this.currentRide?.id,
            driverId: this.currentRide?.driver?.id,
            rating: this.selectedRating,
            comment: comment,
            timestamp: new Date().toISOString()
        };

        const ratings = Utils.getStorage('ratings') || [];
        ratings.push(rating);
        Utils.setStorage('ratings', ratings);

        // Update driver rating
        this.updateDriverRating(this.currentRide?.driver?.id, this.selectedRating);

        // Close modal
        document.getElementById('ratingModal').style.display = 'none';
        
        Utils.showToast('Thank you for your feedback!', 'success');
        
        this.selectedRating = null;
        this.currentRide = null;
    }

    /**
     * Update driver rating
     * @param {string} driverId - Driver ID
     * @param {number} newRating - New rating
     */
    updateDriverRating(driverId, newRating) {
        const drivers = Utils.getStorage('drivers') || [];
        const driver = drivers.find(d => d.id === driverId);
        
        if (driver) {
            const ratings = Utils.getStorage('ratings') || [];
            const driverRatings = ratings.filter(r => r.driverId === driverId);
            
            const avgRating = driverRatings.reduce((sum, r) => sum + r.rating, 0) / driverRatings.length;
            driver.rating = avgRating.toFixed(1);
            
            Utils.setStorage('drivers', drivers);
        }
    }

    /**
     * Load available drivers from storage
     */
    loadAvailableDrivers() {
        const drivers = Utils.getStorage('drivers') || [];
        this.availableDrivers = drivers.filter(d => d.online && d.status === 'available');
    }

    /**
     * Get random driver name
     * @returns {string} Random name
     */
    getRandomDriverName() {
        const names = [
            'Ali Rezaei', 'Mohammad Karimi', 'Hossein Ahmadi',
            'Reza Mohammadi', 'Mehdi Hosseini', 'Saeed Safari',
            'Amir Hosseini', 'Hamid Rezaei', 'Majid Alavi',
            'Farhad Moradi', 'Behzad Rahimi', 'Kaveh Golestan'
        ];
        return names[Math.floor(Math.random() * names.length)];
    }

    /**
     * Get random vehicle
     * @returns {string} Random vehicle
     */
    getRandomVehicle() {
        const vehicles = [
            'Pride', 'Peugeot 206', 'Peugeot 405',
            'Samand', 'Renault Logan', 'Kia Cerato',
            'Hyundai Elantra', 'Toyota Camry', 'Mazda 3',
            'Dena', 'Pars Tondar', 'Tiba'
        ];
        return vehicles[Math.floor(Math.random() * vehicles.length)];
    }

    /**
     * Get random license plate
     * @returns {string} Random plate
     */
    getRandomPlate() {
        const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const numbers = '0123456789';
        
        let plate = '';
        for (let i = 0; i < 3; i++) {
            plate += letters[Math.floor(Math.random() * letters.length)];
        }
        plate += ' ';
        for (let i = 0; i < 3; i++) {
            plate += numbers[Math.floor(Math.random() * numbers.length)];
        }
        plate += ' ';
        plate += numbers[Math.floor(Math.random() * numbers.length)];
        plate += numbers[Math.floor(Math.random() * numbers.length)];
        
        return plate;
    }

    /**
     * Get random location near point
     * @param {object} point - Center point
     * @returns {object} Random location
     */
    getRandomLocationNear(point) {
        if (!point) return { lat: 35.6892, lng: 51.3890 };
        
        const lat = point.lat + (Math.random() - 0.5) * 0.02;
        const lng = point.lng + (Math.random() - 0.5) * 0.02;
        
        return { lat, lng };
    }

    /**
     * Update user ride count
     */
    updateUserRideCount() {
        const user = auth.getCurrentUser();
        if (!user) return;

        const users = Utils.getStorage('users') || [];
        const userIndex = users.findIndex(u => u.id === user.id);
        
        if (userIndex !== -1) {
            users[userIndex].rides = (users[userIndex].rides || 0) + 1;
            Utils.setStorage('users', users);
        }
    }

    /**
     * Call driver
     */
    callDriver() {
        if (!this.currentRide?.driver) return;
        
        // Simulate call
        Utils.showToast(`Calling ${this.currentRide.driver.name}...`, 'info');
        
        // In a real app, this would initiate a call
        setTimeout(() => {
            Utils.showToast('Call connected', 'success');
        }, 2000);
    }

    /**
     * Message driver
     */
    messageDriver() {
        if (!this.currentRide?.driver) return;
        
        // Show chat modal (simplified)
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Message Driver</h3>
                <div class="chat-messages" style="height: 200px; overflow-y: auto; margin-bottom: 1rem;">
                    <div class="message system">You are now connected with ${this.currentRide.driver.name}</div>
                </div>
                <div class="chat-input">
                    <input type="text" placeholder="Type your message..." class="form-control">
                    <button class="btn btn-primary">Send</button>
                </div>
                <button class="btn btn-outline btn-block" onclick="this.closest('.modal').remove()">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    /**
     * Show notification
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     */
    showNotification(title, message) {
        // Check if notifications are supported
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            new Notification(title, { body: message });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, { body: message });
                }
            });
        }
    }

    /**
     * Get ride history for user
     * @param {string} userId - User ID
     * @returns {Array} User's ride history
     */
    getUserRideHistory(userId) {
        return this.rideHistory
            .filter(ride => ride.userId === userId)
            .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
    }

    /**
     * Get active ride for user
     * @param {string} userId - User ID
     * @returns {object|null} Active ride
     */
    getActiveRide(userId) {
        return this.currentRide?.userId === userId ? this.currentRide : null;
    }

    /**
     * Calculate ride statistics
     * @param {string} userId - User ID
     * @returns {object} Ride statistics
     */
    getRideStatistics(userId) {
        const userRides = this.getUserRideHistory(userId);
        
        const totalRides = userRides.length;
        const totalSpent = userRides.reduce((sum, ride) => {
            const price = parseFloat(ride.price.replace(/[^0-9.-]+/g, ''));
            return sum + price;
        }, 0);
        
        const avgRating = userRides.reduce((sum, ride) => sum + (ride.rating || 0), 0) / totalRides || 0;
        
        const ridesByType = userRides.reduce((acc, ride) => {
            acc[ride.type] = (acc[ride.type] || 0) + 1;
            return acc;
        }, {});

        return {
            totalRides,
            totalSpent,
            avgRating: avgRating.toFixed(1),
            ridesByType,
            lastRide: userRides[0]
        };
    }
}

// Initialize ride manager
document.addEventListener('DOMContentLoaded', () => {
    window.rideManager = new RideManager();
});