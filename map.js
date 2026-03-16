/**
 * Snapp - Google Maps Module
 * Version: 1.0.0
 * Handles all map-related functionality
 */

class MapManager {
    constructor() {
        this.map = null;
        this.driverMap = null;
        this.directionsService = null;
        this.directionsRenderer = null;
        this.pickupMarker = null;
        self.destinationMarker = null;
        this.driverMarkers = [];
        this.autocompleteService = null;
        this.placesService = null;
        this.geocoder = null;
        this.currentLocation = null;
        this.pickupLocation = null;
        self.destinationLocation = null;
        this.searchTimeout = null;
        this.heatmap = null;
        
        this.init();
    }

    /**
     * Initialize map services
     */
    init() {
        // Check if Google Maps API is loaded
        if (typeof google === 'undefined') {
            console.error('Google Maps API not loaded');
            Utils.showToast('Failed to load Google Maps', 'error');
            return;
        }

        // Initialize services
        this.directionsService = new google.maps.DirectionsService();
        this.directionsRenderer = new google.maps.DirectionsRenderer({
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: '#ff6b00',
                strokeWeight: 5,
                strokeOpacity: 0.8
            }
        });
        
        this.autocompleteService = new google.maps.places.AutocompleteService();
        this.placesService = new google.maps.places.PlacesService(
            document.createElement('div')
        );
        this.geocoder = new google.maps.Geocoder();

        // Initialize maps based on current page
        this.initMaps();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Get user's current location
        this.getCurrentLocation();
    }

    /**
     * Initialize maps for different pages
     */
    initMaps() {
        // User dashboard map
        const mapElement = document.getElementById('map');
        if (mapElement) {
            this.initUserMap(mapElement);
        }

        // Driver map
        const driverMapElement = document.getElementById('driverMap');
        if (driverMapElement) {
            this.initDriverMap(driverMapElement);
        }
    }

    /**
     * Initialize user dashboard map
     * @param {HTMLElement} mapElement - Map container
     */
    initUserMap(mapElement) {
        const defaultLocation = { lat: 35.6892, lng: 51.3890 }; // Tehran
        
        this.map = new google.maps.Map(mapElement, {
            center: defaultLocation,
            zoom: 15,
            styles: this.getMapStyles(),
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            zoomControl: false
        });

        this.directionsRenderer.setMap(this.map);

        // Add click listener to set pickup/destination
        this.map.addListener('click', (e) => {
            this.handleMapClick(e.latLng);
        });

        // Setup map controls
        this.setupMapControls();
    }

    /**
     * Initialize driver map
     * @param {HTMLElement} mapElement - Map container
     */
    initDriverMap(mapElement) {
        const defaultLocation = { lat: 35.6892, lng: 51.3890 };
        
        this.driverMap = new google.maps.Map(mapElement, {
            center: defaultLocation,
            zoom: 14,
            styles: this.getMapStyles(),
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            zoomControl: false
        });

        // Add driver marker
        this.addDriverMarker(defaultLocation);

        // Setup driver map controls
        this.setupDriverMapControls();
    }

    /**
     * Get custom map styles
     * @returns {Array} Map styles
     */
    getMapStyles() {
        return [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'transit',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'road',
                elementType: 'geometry',
                stylers: [{ color: '#ffffff' }]
            },
            {
                featureType: 'road',
                elementType: 'labels',
                stylers: [{ visibility: 'on' }]
            },
            {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#e9ecef' }]
            }
        ];
    }

    /**
     * Setup map controls
     */
    setupMapControls() {
        // Center location button
        const centerBtn = document.getElementById('centerLocation');
        if (centerBtn) {
            centerBtn.addEventListener('click', () => {
                this.centerOnUserLocation();
            });
        }

        // Toggle map type
        const toggleBtn = document.getElementById('toggleMapType');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const mapType = this.map.getMapTypeId();
                this.map.setMapTypeId(
                    mapType === 'roadmap' ? 'satellite' : 'roadmap'
                );
            });
        }

        // Zoom in
        const zoomInBtn = document.getElementById('zoomIn');
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                this.map.setZoom(this.map.getZoom() + 1);
            });
        }

        // Zoom out
        const zoomOutBtn = document.getElementById('zoomOut');
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                this.map.setZoom(this.map.getZoom() - 1);
            });
        }
    }

    /**
     * Setup driver map controls
     */
    setupDriverMapControls() {
        // Center on driver
        const centerBtn = document.getElementById('centerDriver');
        if (centerBtn) {
            centerBtn.addEventListener('click', () => {
                if (this.currentLocation) {
                    this.driverMap.setCenter(this.currentLocation);
                    this.driverMap.setZoom(16);
                }
            });
        }

        // Toggle heatmap
        const heatmapBtn = document.getElementById('toggleHeatmap');
        if (heatmapBtn) {
            heatmapBtn.addEventListener('click', () => {
                this.toggleHeatmap();
            });
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Pickup input
        const pickupInput = document.getElementById('pickupInput');
        if (pickupInput) {
            pickupInput.addEventListener('input', 
                Utils.debounce(() => this.handleSearchInput('pickup'), 500)
            );
            pickupInput.addEventListener('focus', () => {
                this.showSearchResults('pickup');
            });
        }

        // Destination input
        const destInput = document.getElementById('destinationInput');
        if (destInput) {
            destInput.addEventListener('input', 
                Utils.debounce(() => this.handleSearchInput('destination'), 500)
            );
            destInput.addEventListener('focus', () => {
                this.showSearchResults('destination');
            });
        }

        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-box') && !e.target.closest('.search-results')) {
                this.hideSearchResults();
            }
        });
    }

    /**
     * Get user's current location
     */
    getCurrentLocation() {
        Utils.getCurrentLocation()
            .then(location => {
                this.currentLocation = location;
                this.map.setCenter(location);
                this.addPickupMarker(location, 'Current Location');
                
                // Update pickup input
                const pickupInput = document.getElementById('pickupInput');
                if (pickupInput) {
                    pickupInput.value = 'Current Location';
                }
                
                // Reverse geocode to get address
                this.geocodeLocation(location, 'pickup');
            })
            .catch(error => {
                console.warn('Error getting location:', error);
                // Use default location
                this.map.setCenter({ lat: 35.6892, lng: 51.3890 });
            });
    }

    /**
     * Handle map click
     * @param {google.maps.LatLng} latLng - Clicked location
     */
    handleMapClick(latLng) {
        const location = {
            lat: latLng.lat(),
            lng: latLng.lng()
        };

        // If no pickup set, set as pickup
        if (!this.pickupLocation) {
            this.geocodeLocation(location, 'pickup');
        } 
        // If pickup set but no destination, set as destination
        else if (!this.destinationLocation) {
            this.geocodeLocation(location, 'destination');
        }
        // If both set, ask user what to update
        else {
            this.showLocationOptions(location);
        }
    }

    /**
     * Handle search input
     * @param {string} type - Search type (pickup/destination)
     */
    handleSearchInput(type) {
        const input = document.getElementById(`${type}Input`);
        const query = input.value;

        if (query.length < 3) {
            this.hideSearchResults();
            return;
        }

        this.autocompleteService.getPlacePredictions(
            {
                input: query,
                componentRestrictions: { country: 'ir' }
            },
            (predictions, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    this.displaySearchResults(predictions, type);
                }
            }
        );
    }

    /**
     * Display search results
     * @param {Array} predictions - Place predictions
     * @param {string} type - Search type
     */
    displaySearchResults(predictions, type) {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = '';
        resultsContainer.style.display = 'block';

        predictions.forEach(prediction => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <i class="fas fa-map-marker-alt"></i>
                <div class="result-details">
                    <div class="result-main">${prediction.structured_formatting.main_text}</div>
                    <div class="result-secondary">${prediction.structured_formatting.secondary_text}</div>
                </div>
            `;

            item.addEventListener('click', () => {
                this.selectPlace(prediction.place_id, type);
            });

            resultsContainer.appendChild(item);
        });
    }

    /**
     * Select a place from search results
     * @param {string} placeId - Google Place ID
     * @param {string} type - Place type (pickup/destination)
     */
    selectPlace(placeId, type) {
        this.placesService.getDetails(
            { placeId: placeId },
            (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    const location = {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng()
                    };

                    if (type === 'pickup') {
                        this.addPickupMarker(location, place.formatted_address);
                        document.getElementById('pickupInput').value = place.formatted_address;
                    } else {
                        this.addDestinationMarker(location, place.formatted_address);
                        document.getElementById('destinationInput').value = place.formatted_address;
                    }

                    this.hideSearchResults();
                    
                    // If both locations are set, calculate route
                    if (this.pickupLocation && this.destinationLocation) {
                        this.calculateRoute();
                    }
                }
            }
        );
    }

    /**
     * Add pickup marker
     * @param {object} location - Marker location
     * @param {string} address - Location address
     */
    addPickupMarker(location, address) {
        if (this.pickupMarker) {
            this.pickupMarker.setMap(null);
        }

        this.pickupMarker = new google.maps.Marker({
            position: location,
            map: this.map,
            icon: {
                url: 'assets/images/pickup-marker.png',
                scaledSize: new google.maps.Size(40, 40),
                anchor: new google.maps.Point(20, 40)
            },
            title: 'Pickup Location',
            animation: google.maps.Animation.DROP
        });

        this.pickupLocation = location;
        
        // Add info window
        const infoWindow = new google.maps.InfoWindow({
            content: `<div class="map-info-window"><strong>Pickup:</strong> ${address}</div>`
        });

        this.pickupMarker.addListener('click', () => {
            infoWindow.open(this.map, this.pickupMarker);
        });

        // Update ride card
        document.getElementById('pickupAddress').textContent = address;
    }

    /**
     * Add destination marker
     * @param {object} location - Marker location
     * @param {string} address - Location address
     */
    addDestinationMarker(location, address) {
        if (this.destinationMarker) {
            this.destinationMarker.setMap(null);
        }

        this.destinationMarker = new google.maps.Marker({
            position: location,
            map: this.map,
            icon: {
                url: 'assets/images/destination-marker.png',
                scaledSize: new google.maps.Size(40, 40),
                anchor: new google.maps.Point(20, 40)
            },
            title: 'Destination',
            animation: google.maps.Animation.DROP
        });

        this.destinationLocation = location;
        
        // Add info window
        const infoWindow = new google.maps.InfoWindow({
            content: `<div class="map-info-window"><strong>Destination:</strong> ${address}</div>`
        });

        this.destinationMarker.addListener('click', () => {
            infoWindow.open(this.map, this.destinationMarker);
        });

        // Update ride card
        document.getElementById('destinationAddress').textContent = address;
    }

    /**
     * Add driver marker
     * @param {object} location - Driver location
     * @param {object} driverInfo - Driver information
     */
    addDriverMarker(location, driverInfo = null) {
        const marker = new google.maps.Marker({
            position: location,
            map: this.driverMap || this.map,
            icon: {
                url: driverInfo ? 'assets/images/driver-marker.png' : 'assets/images/driver-marker.png',
                scaledSize: new google.maps.Size(50, 50),
                anchor: new google.maps.Point(25, 50)
            },
            title: driverInfo ? `${driverInfo.name} - ${driverInfo.vehicle}` : 'Driver',
            animation: google.maps.Animation.DROP
        });

        if (driverInfo) {
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div class="driver-info-window">
                        <img src="${driverInfo.avatar}" alt="Driver" class="driver-avatar-small">
                        <div class="driver-details">
                            <strong>${driverInfo.name}</strong>
                            <span>${driverInfo.vehicle}</span>
                            <span class="rating">⭐ ${driverInfo.rating}</span>
                        </div>
                    </div>
                `
            });

            marker.addListener('click', () => {
                infoWindow.open(this.map, marker);
            });
        }

        this.driverMarkers.push(marker);
        return marker;
    }

    /**
     * Update driver position with animation
     * @param {object} driverId - Driver ID
     * @param {object} newPosition - New position
     */
    updateDriverPosition(driverId, newPosition) {
        const marker = this.driverMarkers.find(m => m.driverId === driverId);
        if (!marker) return;

        // Animate marker movement
        const duration = 2000; // 2 seconds
        const start = marker.getPosition();
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const lat = start.lat() + (newPosition.lat - start.lat()) * progress;
            const lng = start.lng() + (newPosition.lng - start.lng()) * progress;

            marker.setPosition({ lat, lng });

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Calculate route between pickup and destination
     */
    calculateRoute() {
        if (!this.pickupLocation || !this.destinationLocation) return;

        this.directionsService.route(
            {
                origin: this.pickupLocation,
                destination: this.destinationLocation,
                travelMode: google.maps.TravelMode.DRIVING
            },
            (response, status) => {
                if (status === google.maps.DirectionsStatus.OK) {
                    this.directionsRenderer.setDirections(response);
                    
                    // Get route info
                    const route = response.routes[0].legs[0];
                    const distance = route.distance.value;
                    const duration = route.duration.value;
                    
                    // Update ride details
                    this.updateRideDetails(distance, duration);
                    
                    // Enable request button
                    document.getElementById('requestRideBtn').disabled = false;
                } else {
                    console.error('Directions request failed:', status);
                    Utils.showToast('Could not calculate route', 'error');
                }
            }
        );
    }

    /**
     * Update ride details in UI
     * @param {number} distance - Distance in meters
     * @param {number} duration - Duration in seconds
     */
    updateRideDetails(distance, duration) {
        const rideDetails = document.getElementById('rideDetails');
        const distanceEl = document.getElementById('distance');
        const durationEl = document.getElementById('duration');
        const priceEl = document.getElementById('estimatedPrice');

        // Calculate price (base fare + per km rate)
        const baseFare = 2.5;
        const perKmRate = 1.2;
        const distanceKm = distance / 1000;
        const price = baseFare + (distanceKm * perKmRate);

        distanceEl.textContent = Utils.formatDistance(distance);
        durationEl.textContent = Utils.formatDuration(duration);
        priceEl.textContent = Utils.formatCurrency(price);

        rideDetails.style.display = 'block';
    }

    /**
     * Geocode location to address
     * @param {object} location - Location coordinates
     * @param {string} type - Location type
     */
    geocodeLocation(location, type) {
        this.geocoder.geocode({ location: location }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK) {
                const address = results[0].formatted_address;
                
                if (type === 'pickup') {
                    this.addPickupMarker(location, address);
                    document.getElementById('pickupInput').value = address;
                } else {
                    this.addDestinationMarker(location, address);
                    document.getElementById('destinationInput').value = address;
                }

                if (this.pickupLocation && this.destinationLocation) {
                    this.calculateRoute();
                }
            }
        });
    }

    /**
     * Center map on user location
     */
    centerOnUserLocation() {
        if (this.currentLocation) {
            this.map.setCenter(this.currentLocation);
            this.map.setZoom(16);
        } else {
            this.getCurrentLocation();
        }
    }

    /**
     * Show search results
     * @param {string} type - Search type
     */
    showSearchResults(type) {
        const results = document.getElementById('searchResults');
        if (results && results.children.length > 0) {
            results.style.display = 'block';
            results.dataset.type = type;
        }
    }

    /**
     * Hide search results
     */
    hideSearchResults() {
        const results = document.getElementById('searchResults');
        if (results) {
            results.style.display = 'none';
        }
    }

    /**
     * Show location options when both markers exist
     * @param {object} location - Clicked location
     */
    showLocationOptions(location) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Select Location Type</h3>
                <p>What would you like to update?</p>
                <div class="modal-actions">
                    <button class="btn btn-outline" onclick="mapManager.updatePickup(${JSON.stringify(location)})">
                        Update Pickup
                    </button>
                    <button class="btn btn-outline" onclick="mapManager.updateDestination(${JSON.stringify(location)})">
                        Update Destination
                    </button>
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove()">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    /**
     * Update pickup location
     * @param {object} location - New pickup location
     */
    updatePickup(location) {
        this.geocodeLocation(location, 'pickup');
        document.querySelector('.modal').remove();
    }

    /**
     * Update destination location
     * @param {object} location - New destination location
     */
    updateDestination(location) {
        this.geocodeLocation(location, 'destination');
        document.querySelector('.modal').remove();
    }

    /**
     * Clear route
     */
    clearRoute() {
        this.directionsRenderer.setDirections({ routes: [] });
        this.pickupLocation = null;
        this.destinationLocation = null;
        document.getElementById('rideDetails').style.display = 'none';
        document.getElementById('requestRideBtn').disabled = true;
    }

    /**
     * Toggle heatmap for driver map
     */
    toggleHeatmap() {
        if (!this.heatmap) {
            // Generate random demand points
            const points = this.generateDemandPoints();
            
            this.heatmap = new google.maps.visualization.HeatmapLayer({
                data: points,
                map: this.driverMap,
                radius: 50,
                opacity: 0.6
            });
            
            document.getElementById('heatmapLegend').style.display = 'flex';
        } else {
            this.heatmap.setMap(this.heatmap.getMap() ? null : this.driverMap);
            document.getElementById('heatmapLegend').style.display = 
                this.heatmap.getMap() ? 'flex' : 'none';
        }
    }

    /**
     * Generate random demand points for heatmap
     * @returns {Array} Heatmap points
     */
    generateDemandPoints() {
        const center = this.currentLocation || { lat: 35.6892, lng: 51.3890 };
        const points = [];

        for (let i = 0; i < 100; i++) {
            const lat = center.lat + (Math.random() - 0.5) * 0.1;
            const lng = center.lng + (Math.random() - 0.5) * 0.1;
            const weight = Math.random() * 10;

            points.push({
                location: new google.maps.LatLng(lat, lng),
                weight: weight
            });
        }

        return points;
    }

    /**
     * Get distance between two points using Google Maps
     * @param {object} origin - Origin location
     * @param {object} destination - Destination location
     * @returns {Promise} Distance and duration
     */
    getDistanceMatrix(origin, destination) {
        return new Promise((resolve, reject) => {
            const service = new google.maps.DistanceMatrixService();
            
            service.getDistanceMatrix(
                {
                    origins: [origin],
                    destinations: [destination],
                    travelMode: google.maps.TravelMode.DRIVING,
                    unitSystem: google.maps.UnitSystem.METRIC
                },
                (response, status) => {
                    if (status === google.maps.DistanceMatrixStatus.OK) {
                        const result = response.rows[0].elements[0];
                        resolve({
                            distance: result.distance.value,
                            duration: result.duration.value,
                            distanceText: result.distance.text,
                            durationText: result.duration.text
                        });
                    } else {
                        reject(status);
                    }
                }
            );
        });
    }

    /**
     * Search for places near location
     * @param {object} location - Center location
     * @param {string} type - Place type
     * @param {number} radius - Search radius
     * @returns {Promise} Nearby places
     */
    searchNearby(location, type = 'establishment', radius = 1000) {
        return new Promise((resolve, reject) => {
            this.placesService.nearbySearch(
                {
                    location: location,
                    radius: radius,
                    type: type
                },
                (results, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        resolve(results);
                    } else {
                        reject(status);
                    }
                }
            );
        });
    }

    /**
     * Fit map bounds to include all markers
     */
    fitBounds() {
        const bounds = new google.maps.LatLngBounds();
        
        if (this.pickupLocation) {
            bounds.extend(this.pickupLocation);
        }
        
        if (this.destinationLocation) {
            bounds.extend(this.destinationLocation);
        }
        
        this.driverMarkers.forEach(marker => {
            bounds.extend(marker.getPosition());
        });

        if (!bounds.isEmpty()) {
            this.map.fitBounds(bounds);
        }
    }

    /**
     * Reset map to default view
     */
    resetMap() {
        this.clearRoute();
        
        if (this.pickupMarker) {
            this.pickupMarker.setMap(null);
            this.pickupMarker = null;
        }
        
        if (this.destinationMarker) {
            this.destinationMarker.setMap(null);
            this.destinationMarker = null;
        }
        
        this.driverMarkers.forEach(marker => marker.setMap(null));
        this.driverMarkers = [];
        
        this.centerOnUserLocation();
    }
}

// Initialize map manager
document.addEventListener('DOMContentLoaded', () => {
    window.mapManager = new MapManager();
});