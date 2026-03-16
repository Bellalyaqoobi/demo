/**
 * Snapp - Admin Module
 * Version: 1.0.0
 * Handles admin functionality, statistics, and user management
 */

class AdminManager {
    constructor() {
        this.users = [];
        this.drivers = [];
        this.rides = [];
        this.statistics = {};
        this.charts = {};
        
        this.init();
    }

    /**
     * Initialize admin manager
     */
    init() {
        this.checkAdminAuth();
        this.loadData();
        this.setupEventListeners();
        this.initializeCharts();
        this.setupSidebar();
        this.loadDashboardData();
    }

    /**
     * Check admin authentication
     */
    checkAdminAuth() {
        const user = auth.getCurrentUser();
        
        if (!user || user.userType !== 'admin') {
            window.location.href = 'login.html';
            return;
        }

        this.admin = user;
    }

    /**
     * Load data from storage
     */
    loadData() {
        this.users = Utils.getStorage('users') || [];
        this.drivers = Utils.getStorage('drivers') || [];
        this.rides = Utils.getStorage('rideHistory') || [];
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.switchSection(e.currentTarget.dataset.section);
            });
        });

        // Refresh button
        const refreshBtn = document.getElementById('refreshData');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        // Search inputs
        const userSearch = document.getElementById('userSearch');
        if (userSearch) {
            userSearch.addEventListener('input', 
                Utils.debounce(() => this.searchUsers(), 500));
        }

        const driverSearch = document.getElementById('driverSearch');
        if (driverSearch) {
            driverSearch.addEventListener('input',
                Utils.debounce(() => this.searchDrivers(), 500));
        }

        // Filters
        const userFilter = document.getElementById('userFilter');
        if (userFilter) {
            userFilter.addEventListener('change', () => this.filterUsers());
        }

        const driverFilter = document.getElementById('driverStatusFilter');
        if (driverFilter) {
            driverFilter.addEventListener('change', () => this.filterDrivers());
        }

        // Add user button
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.showAddUserModal());
        }

        // User form submit
        const userForm = document.getElementById('userForm');
        if (userForm) {
            userForm.addEventListener('submit', (e) => this.saveUser(e));
        }

        // Close modal
        const closeModal = document.getElementById('closeUserModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                document.getElementById('userModal').style.display = 'none';
            });
        }

        // Verify drivers button
        const verifyBtn = document.getElementById('verifyDriversBtn');
        if (verifyBtn) {
            verifyBtn.addEventListener('click', () => this.showPendingVerifications());
        }

        // Date range filter
        const filterRides = document.getElementById('filterRides');
        if (filterRides) {
            filterRides.addEventListener('click', () => this.filterRidesByDate());
        }

        // Logout
        const logoutBtn = document.getElementById('adminLogout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => auth.handleLogout(new Event('click')));
        }
    }

    /**
     * Setup sidebar
     */
    setupSidebar() {
        // Set active section based on URL hash
        const hash = window.location.hash.substring(1) || 'dashboard';
        this.switchSection(hash);
    }

    /**
     * Switch admin section
     * @param {string} section - Section name
     */
    switchSection(section) {
        // Update sidebar
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === section) {
                item.classList.add('active');
            }
        });

        // Update sections
        document.querySelectorAll('.admin-section').forEach(sectionEl => {
            sectionEl.classList.remove('active');
        });

        const targetSection = document.getElementById(`${section}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update URL hash
        window.location.hash = section;

        // Load section data
        switch(section) {
            case 'users':
                this.loadUsersTable();
                break;
            case 'drivers':
                this.loadDriversTable();
                break;
            case 'rides':
                this.loadRidesTable();
                break;
            case 'earnings':
                this.loadEarningsData();
                break;
        }
    }

    /**
     * Load dashboard data
     */
    loadDashboardData() {
        this.updateStats();
        this.loadRecentActivity();
        this.updateCharts();
    }

    /**
     * Update statistics
     */
    updateStats() {
        document.getElementById('totalUsers').textContent = this.users.length;
        document.getElementById('activeDrivers').textContent = 
            this.drivers.filter(d => d.online).length;
        document.getElementById('totalRides').textContent = this.rides.length;
        
        const revenue = this.calculateTotalRevenue();
        document.getElementById('revenue').textContent = Utils.formatCurrency(revenue);
    }

    /**
     * Calculate total revenue
     * @returns {number} Total revenue
     */
    calculateTotalRevenue() {
        return this.rides.reduce((sum, ride) => {
            const price = parseFloat(ride.price?.replace(/[^0-9.-]+/g, '') || 0);
            return sum + price;
        }, 0);
    }

    /**
     * Initialize charts
     */
    initializeCharts() {
        // Rides chart
        const ridesCtx = document.getElementById('ridesChart')?.getContext('2d');
        if (ridesCtx) {
            this.charts.rides = new Chart(ridesCtx, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Rides',
                        data: [65, 59, 80, 81, 56, 55, 40],
                        borderColor: '#ff6b00',
                        backgroundColor: 'rgba(255, 107, 0, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // Revenue chart
        const revenueCtx = document.getElementById('revenueChart')?.getContext('2d');
        if (revenueCtx) {
            this.charts.revenue = new Chart(revenueCtx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Revenue',
                        data: [1200, 1900, 3000, 5000, 2300, 3400],
                        backgroundColor: '#28a745'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // Earnings chart
        const earningsCtx = document.getElementById('earningsChart')?.getContext('2d');
        if (earningsCtx) {
            this.charts.earnings = new Chart(earningsCtx, {
                type: 'line',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [{
                        label: 'Platform Revenue',
                        data: [2500, 3200, 2800, 4100],
                        borderColor: '#ff6b00',
                        backgroundColor: 'rgba(255, 107, 0, 0.1)'
                    }, {
                        label: 'Driver Payouts',
                        data: [1800, 2300, 2000, 3000],
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }

    /**
     * Update charts with real data
     */
    updateCharts() {
        // Group rides by day
        const ridesByDay = this.getRidesByDay();
        
        if (this.charts.rides) {
            this.charts.rides.data.datasets[0].data = ridesByDay;
            this.charts.rides.update();
        }

        // Group revenue by month
        const revenueByMonth = this.getRevenueByMonth();
        
        if (this.charts.revenue) {
            this.charts.revenue.data.datasets[0].data = revenueByMonth;
            this.charts.revenue.update();
        }
    }

    /**
     * Get rides grouped by day
     * @returns {Array} Rides per day
     */
    getRidesByDay() {
        const days = Array(7).fill(0);
        const now = new Date();
        
        this.rides.forEach(ride => {
            const rideDate = new Date(ride.requestedAt);
            const diffDays = Math.floor((now - rideDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays < 7) {
                const dayIndex = rideDate.getDay();
                days[dayIndex]++;
            }
        });

        return days;
    }

    /**
     * Get revenue by month
     * @returns {Array} Revenue per month
     */
    getRevenueByMonth() {
        const months = Array(6).fill(0);
        
        this.rides.forEach(ride => {
            const rideDate = new Date(ride.requestedAt);
            const now = new Date();
            const diffMonths = (now.getFullYear() - rideDate.getFullYear()) * 12 + 
                               (now.getMonth() - rideDate.getMonth());
            
            if (diffMonths < 6) {
                const monthIndex = 5 - diffMonths;
                const price = parseFloat(ride.price?.replace(/[^0-9.-]+/g, '') || 0);
                months[monthIndex] += price;
            }
        });

        return months;
    }

    /**
     * Load recent activity
     */
    loadRecentActivity() {
        const activityList = document.getElementById('recentActivity');
        if (!activityList) return;

        const activities = [];

        // Add recent rides
        this.rides.slice(-5).forEach(ride => {
            activities.push({
                type: 'ride',
                description: `New ride completed`,
                user: ride.userId,
                time: ride.completedAt || ride.requestedAt,
                icon: 'fa-route'
            });
        });

        // Add new users
        this.users.slice(-3).forEach(user => {
            activities.push({
                type: 'user',
                description: `New user registered: ${user.fullName}`,
                user: user.email,
                time: user.createdAt,
                icon: 'fa-user-plus'
            });
        });

        // Add new drivers
        this.drivers.slice(-3).forEach(driver => {
            activities.push({
                type: 'driver',
                description: `New driver registered: ${driver.fullName}`,
                user: driver.email,
                time: driver.createdAt,
                icon: 'fa-taxi'
            });
        });

        // Sort by time (most recent first)
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));

        // Display activities
        activityList.innerHTML = activities.slice(0, 10).map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    <i class="fas ${activity.icon}"></i>
                </div>
                <div class="activity-details">
                    <p class="activity-description">${activity.description}</p>
                    <span class="activity-time">${Utils.formatDate(activity.time)}</span>
                </div>
            </div>
        `).join('');
    }

    /**
     * Load users table
     */
    loadUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.users.map(user => `
            <tr>
                <td>${user.id.substring(0, 8)}</td>
                <td>${user.fullName}</td>
                <td>${user.email}</td>
                <td>${user.phone}</td>
                <td>${user.rides || 0}</td>
                <td>
                    <span class="status-badge ${user.status}">
                        ${user.status}
                    </span>
                </td>
                <td>${Utils.formatDate(user.createdAt, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                <td>
                    <button class="action-btn edit" onclick="adminManager.editUser('${user.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn ${user.status === 'blocked' ? 'unblock' : 'block'}" 
                            onclick="adminManager.toggleUserStatus('${user.id}')">
                        <i class="fas ${user.status === 'blocked' ? 'fa-check' : 'fa-ban'}"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Load drivers table
     */
    loadDriversTable() {
        const tbody = document.getElementById('driversTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.drivers.map(driver => `
            <tr>
                <td>${driver.id.substring(0, 8)}</td>
                <td>${driver.fullName}</td>
                <td>${driver.vehicleModel || 'N/A'}</td>
                <td>${driver.licenseNumber || 'N/A'}</td>
                <td>
                    <span class="status-badge ${driver.status || 'offline'}">
                        ${driver.status || 'offline'}
                    </span>
                </td>
                <td>${driver.rating || '5.0'} ⭐</td>
                <td>${Utils.formatCurrency(driver.earnings || 0)}</td>
                <td>
                    <button class="action-btn view" onclick="adminManager.viewDriver('${driver.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn ${driver.verified ? 'unblock' : 'verify'}" 
                            onclick="adminManager.toggleDriverVerification('${driver.id}')">
                        <i class="fas ${driver.verified ? 'fa-check-circle' : 'fa-certificate'}"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Load rides table
     */
    loadRidesTable() {
        const tbody = document.getElementById('ridesTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.rides.slice(-20).map(ride => `
            <tr>
                <td>${ride.id.substring(0, 8)}</td>
                <td>${this.getUserName(ride.userId)}</td>
                <td>${ride.driver?.name || 'N/A'}</td>
                <td>${ride.pickup?.address?.substring(0, 30) || 'N/A'}</td>
                <td>${ride.destination?.address?.substring(0, 30) || 'N/A'}</td>
                <td>${ride.distance || '0'}</td>
                <td>${ride.price || '$0'}</td>
                <td>
                    <span class="status-badge ${ride.status}">
                        ${ride.status}
                    </span>
                </td>
                <td>${Utils.formatDate(ride.requestedAt)}</td>
            </tr>
        `).join('');
    }

    /**
     * Load earnings data
     */
    loadEarningsData() {
        const totalRevenue = this.calculateTotalRevenue();
        const driverPayouts = this.calculateDriverPayouts();
        const platformFee = totalRevenue - driverPayouts;

        document.getElementById('totalRevenue').textContent = Utils.formatCurrency(totalRevenue);
        document.getElementById('driverPayouts').textContent = Utils.formatCurrency(driverPayouts);
        document.getElementById('platformFee').textContent = Utils.formatCurrency(platformFee);

        this.loadPayoutsTable();
    }

    /**
     * Calculate driver payouts
     * @returns {number} Total driver payouts
     */
    calculateDriverPayouts() {
        // Assuming drivers get 70% of ride price
        return this.rides.reduce((sum, ride) => {
            const price = parseFloat(ride.price?.replace(/[^0-9.-]+/g, '') || 0);
            return sum + (price * 0.7);
        }, 0);
    }

    /**
     * Load payouts table
     */
    loadPayoutsTable() {
        const tbody = document.getElementById('payoutTableBody');
        if (!tbody) return;

        // Group rides by driver
        const driverEarnings = {};
        
        this.rides.forEach(ride => {
            if (ride.driver?.id) {
                if (!driverEarnings[ride.driver.id]) {
                    driverEarnings[ride.driver.id] = {
                        driver: ride.driver,
                        amount: 0,
                        rides: 0
                    };
                }
                const price = parseFloat(ride.price?.replace(/[^0-9.-]+/g, '') || 0);
                driverEarnings[ride.driver.id].amount += price * 0.7;
                driverEarnings[ride.driver.id].rides++;
            }
        });

        tbody.innerHTML = Object.values(driverEarnings).map(earning => `
            <tr>
                <td>${earning.driver.name}</td>
                <td>${Utils.formatCurrency(earning.amount)}</td>
                <td>Last 7 days</td>
                <td><span class="status-badge pending">Pending</span></td>
                <td>
                    <button class="btn btn-small btn-primary" onclick="adminManager.processPayout('${earning.driver.id}')">
                        Process
                    </button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Search users
     */
    searchUsers() {
        const searchTerm = document.getElementById('userSearch').value.toLowerCase();
        
        const filtered = this.users.filter(user => 
            user.fullName?.toLowerCase().includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm) ||
            user.phone?.includes(searchTerm)
        );

        this.displayFilteredUsers(filtered);
    }

    /**
     * Display filtered users
     * @param {Array} users - Filtered users
     */
    displayFilteredUsers(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id.substring(0, 8)}</td>
                <td>${user.fullName}</td>
                <td>${user.email}</td>
                <td>${user.phone}</td>
                <td>${user.rides || 0}</td>
                <td>
                    <span class="status-badge ${user.status}">
                        ${user.status}
                    </span>
                </td>
                <td>${Utils.formatDate(user.createdAt)}</td>
                <td>
                    <button class="action-btn edit" onclick="adminManager.editUser('${user.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn ${user.status === 'blocked' ? 'unblock' : 'block'}" 
                            onclick="adminManager.toggleUserStatus('${user.id}')">
                        <i class="fas ${user.status === 'blocked' ? 'fa-check' : 'fa-ban'}"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Filter users
     */
    filterUsers() {
        const filter = document.getElementById('userFilter').value;
        
        let filtered = this.users;
        if (filter !== 'all') {
            filtered = this.users.filter(user => user.status === filter);
        }

        this.displayFilteredUsers(filtered);
    }

    /**
     * Search drivers
     */
    searchDrivers() {
        const searchTerm = document.getElementById('driverSearch').value.toLowerCase();
        
        const filtered = this.drivers.filter(driver => 
            driver.fullName?.toLowerCase().includes(searchTerm) ||
            driver.vehicleModel?.toLowerCase().includes(searchTerm) ||
            driver.licensePlate?.toLowerCase().includes(searchTerm)
        );

        this.displayFilteredDrivers(filtered);
    }

    /**
     * Filter drivers
     */
    filterDrivers() {
        const filter = document.getElementById('driverStatusFilter').value;
        
        let filtered = this.drivers;
        if (filter !== 'all') {
            filtered = this.drivers.filter(driver => driver.status === filter);
        }

        this.displayFilteredDrivers(filtered);
    }

    /**
     * Display filtered drivers
     * @param {Array} drivers - Filtered drivers
     */
    displayFilteredDrivers(drivers) {
        const tbody = document.getElementById('driversTableBody');
        if (!tbody) return;

        tbody.innerHTML = drivers.map(driver => `
            <tr>
                <td>${driver.id.substring(0, 8)}</td>
                <td>${driver.fullName}</td>
                <td>${driver.vehicleModel || 'N/A'}</td>
                <td>${driver.licenseNumber || 'N/A'}</td>
                <td>
                    <span class="status-badge ${driver.status || 'offline'}">
                        ${driver.status || 'offline'}
                    </span>
                </td>
                <td>${driver.rating || '5.0'} ⭐</td>
                <td>${Utils.formatCurrency(driver.earnings || 0)}</td>
                <td>
                    <button class="action-btn view" onclick="adminManager.viewDriver('${driver.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn ${driver.verified ? 'unblock' : 'verify'}" 
                            onclick="adminManager.toggleDriverVerification('${driver.id}')">
                        <i class="fas ${driver.verified ? 'fa-check-circle' : 'fa-certificate'}"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Filter rides by date
     */
    filterRidesByDate() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (!startDate || !endDate) return;

        const filtered = this.rides.filter(ride => {
            const rideDate = new Date(ride.requestedAt).toISOString().split('T')[0];
            return rideDate >= startDate && rideDate <= endDate;
        });

        this.displayFilteredRides(filtered);
    }

    /**
     * Display filtered rides
     * @param {Array} rides - Filtered rides
     */
    displayFilteredRides(rides) {
        const tbody = document.getElementById('ridesTableBody');
        if (!tbody) return;

        tbody.innerHTML = rides.map(ride => `
            <tr>
                <td>${ride.id.substring(0, 8)}</td>
                <td>${this.getUserName(ride.userId)}</td>
                <td>${ride.driver?.name || 'N/A'}</td>
                <td>${ride.pickup?.address?.substring(0, 30) || 'N/A'}</td>
                <td>${ride.destination?.address?.substring(0, 30) || 'N/A'}</td>
                <td>${ride.distance || '0'}</td>
                <td>${ride.price || '$0'}</td>
                <td>
                    <span class="status-badge ${ride.status}">
                        ${ride.status}
                    </span>
                </td>
                <td>${Utils.formatDate(ride.requestedAt)}</td>
            </tr>
        `).join('');
    }

    /**
     * Get user name by ID
     * @param {string} userId - User ID
     * @returns {string} User name
     */
    getUserName(userId) {
        const user = this.users.find(u => u.id === userId);
        return user ? user.fullName : 'Unknown';
    }

    /**
     * Show add user modal
     */
    showAddUserModal() {
        document.getElementById('userModalTitle').textContent = 'Add New User';
        document.getElementById('userForm').reset();
        document.getElementById('userModal').style.display = 'flex';
    }

    /**
     * Save user
     * @param {Event} e - Form submit event
     */
    saveUser(e) {
        e.preventDefault();

        const userData = {
            id: Utils.generateId(),
            fullName: document.getElementById('modalUserName').value,
            email: document.getElementById('modalUserEmail').value,
            phone: document.getElementById('modalUserPhone').value,
            status: document.getElementById('modalUserStatus').value,
            userType: 'user',
            createdAt: new Date().toISOString(),
            rides: 0,
            rating: 5.0
        };

        this.users.push(userData);
        Utils.setStorage('users', this.users);

        document.getElementById('userModal').style.display = 'none';

        this.loadUsersTable();
        Utils.showToast('User added successfully', 'success');
    }

    /**
     * Edit user
     * @param {string} userId - User ID
     */
    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        document.getElementById('userModalTitle').textContent = 'Edit User';
        document.getElementById('modalUserName').value = user.fullName;
        document.getElementById('modalUserEmail').value = user.email;
        document.getElementById('modalUserPhone').value = user.phone;
        document.getElementById('modalUserStatus').value = user.status;

        // Store user ID for update
        this.editingUserId = userId;

        document.getElementById('userModal').style.display = 'flex';
    }

    /**
     * Toggle user status (block/unblock)
     * @param {string} userId - User ID
     */
    toggleUserStatus(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        user.status = user.status === 'blocked' ? 'active' : 'blocked';
        
        Utils.setStorage('users', this.users);
        this.loadUsersTable();
        
        Utils.showToast(`User ${user.status === 'blocked' ? 'blocked' : 'unblocked'}`, 'success');
    }

    /**
     * View driver details
     * @param {string} driverId - Driver ID
     */
    viewDriver(driverId) {
        const driver = this.drivers.find(d => d.id === driverId);
        if (!driver) return;

        // Show driver details modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Driver Details</h3>
                <div class="driver-details-view">
                    <p><strong>Name:</strong> ${driver.fullName}</p>
                    <p><strong>Email:</strong> ${driver.email}</p>
                    <p><strong>Phone:</strong> ${driver.phone}</p>
                    <p><strong>Vehicle:</strong> ${driver.vehicleModel || 'N/A'}</p>
                    <p><strong>License Plate:</strong> ${driver.licensePlate || 'N/A'}</p>
                    <p><strong>License Number:</strong> ${driver.licenseNumber || 'N/A'}</p>
                    <p><strong>Status:</strong> ${driver.status || 'offline'}</p>
                    <p><strong>Rating:</strong> ${driver.rating || '5.0'} ⭐</p>
                    <p><strong>Total Earnings:</strong> ${Utils.formatCurrency(driver.earnings || 0)}</p>
                    <p><strong>Joined:</strong> ${Utils.formatDate(driver.createdAt)}</p>
                </div>
                <button class="btn btn-primary btn-block" onclick="this.closest('.modal').remove()">
                    Close
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    /**
     * Toggle driver verification
     * @param {string} driverId - Driver ID
     */
    toggleDriverVerification(driverId) {
        const driver = this.drivers.find(d => d.id === driverId);
        if (!driver) return;

        driver.verified = !driver.verified;
        
        Utils.setStorage('drivers', this.drivers);
        this.loadDriversTable();
        
        Utils.showToast(`Driver ${driver.verified ? 'verified' : 'unverified'}`, 'success');
    }

    /**
     * Show pending verifications
     */
    showPendingVerifications() {
        const pending = this.drivers.filter(d => !d.verified);
        
        if (pending.length === 0) {
            Utils.showToast('No pending verifications', 'info');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Pending Driver Verifications (${pending.length})</h3>
                <div class="pending-list">
                    ${pending.map(driver => `
                        <div class="pending-item">
                            <div class="pending-info">
                                <strong>${driver.fullName}</strong>
                                <span>${driver.vehicleModel} - ${driver.licensePlate}</span>
                            </div>
                            <div class="pending-actions">
                                <button class="btn btn-small btn-success" 
                                        onclick="adminManager.verifyDriver('${driver.id}')">
                                    Verify
                                </button>
                                <button class="btn btn-small btn-danger"
                                        onclick="adminManager.rejectDriver('${driver.id}')">
                                    Reject
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-outline btn-block" onclick="this.closest('.modal').remove()">
                    Close
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    /**
     * Verify driver
     * @param {string} driverId - Driver ID
     */
    verifyDriver(driverId) {
        const driver = this.drivers.find(d => d.id === driverId);
        if (driver) {
            driver.verified = true;
            Utils.setStorage('drivers', this.drivers);
            Utils.showToast('Driver verified', 'success');
            
            // Refresh modal
            document.querySelector('.modal').remove();
            this.showPendingVerifications();
        }
    }

    /**
     * Reject driver
     * @param {string} driverId - Driver ID
     */
    rejectDriver(driverId) {
        // Remove driver from list
        this.drivers = this.drivers.filter(d => d.id !== driverId);
        Utils.setStorage('drivers', this.drivers);
        
        Utils.showToast('Driver rejected', 'warning');
        
        // Refresh modal
        document.querySelector('.modal').remove();
        this.showPendingVerifications();
    }

    /**
     * Process payout for driver
     * @param {string} driverId - Driver ID
     */
    processPayout(driverId) {
        Utils.showToast('Payout processed successfully', 'success');
        
        // Update driver earnings
        const driver = this.drivers.find(d => d.id === driverId);
        if (driver) {
            driver.earnings = 0;
            Utils.setStorage('drivers', this.drivers);
        }

        this.loadEarningsData();
    }

    /**
     * Refresh all data
     */
    refreshData() {
        this.loadData();
        this.loadDashboardData();
        this.loadUsersTable();
        this.loadDriversTable();
        this.loadRidesTable();
        this.loadEarningsData();
        
        Utils.showToast('Data refreshed', 'success');
    }

    /**
     * Export data to CSV
     * @param {string} type - Data type to export
     */
    exportData(type) {
        let data = [];
        let filename = '';

        switch(type) {
            case 'users':
                data = this.users;
                filename = 'users.csv';
                break;
            case 'drivers':
                data = this.drivers;
                filename = 'drivers.csv';
                break;
            case 'rides':
                data = this.rides;
                filename = 'rides.csv';
                break;
        }

        // Convert to CSV
        const csv = this.convertToCSV(data);
        
        // Download
        Utils.downloadFile(csv, filename, 'text/csv');
        
        Utils.showToast('Data exported successfully', 'success');
    }

    /**
     * Convert array to CSV
     * @param {Array} data - Data to convert
     * @returns {string} CSV string
     */
    convertToCSV(data) {
        if (data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvRows = [];

        // Add headers
        csvRows.push(headers.join(','));

        // Add data
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header] || '';
                return `"${value.toString().replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    }
}

// Initialize admin manager
document.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminManager();
});