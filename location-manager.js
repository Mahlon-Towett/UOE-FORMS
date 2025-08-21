// location-manager.js - Kenyan Administrative Location Management
// University of Eldoret Student Form - Location Module (FIXED VERSION)

/**
 * Handles loading and managing Kenyan administrative location data
 * Provides cascading dropdown functionality: County → Sub County → Constituency → Ward
 * FIXED: Now supports PHPMyAdmin export format
 */

window.UoEForm = window.UoEForm || {};
window.UoEForm.LocationManager = {
    data: null,
    isLoaded: false,
    
    // ========================================
    // DATA LOADING AND PROCESSING
    // ========================================
    
    async loadLocationData() {
        try {
            console.log('📍 Loading Kenyan administrative location data...');
            
            // Update county dropdown to show loading state
            const countySelect = document.getElementById('county');
            if (countySelect) {
                countySelect.innerHTML = '<option value="">Loading counties...</option>';
                countySelect.classList.add('loading-dropdown');
            }
            
            // Fetch data from JSON file
            const response = await fetch(window.UoEForm.config.locationDataUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                cache: 'default'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const rawData = await response.json();
            console.log('✅ Location data loaded successfully');
            
            // Process and store the data
            this.data = this.processLocationData(rawData);
            this.isLoaded = true;
            
            // Initialize county dropdown
            this.initializeCountyDropdown();
            
            return true;
            
        } catch (error) {
            console.error('❌ Error loading location data:', error);
            console.log('📍 Using fallback county list...');
            this.initializeFallbackCounties();
            return false;
        }
    },
    
    processLocationData(rawData) {
        console.log('🔄 Processing location data...');
        
        let counties = {};
        let subcounties = {}; // Back to subcounties (not constituencies)
        let wards = {};
        
        // Find the data tables in the JSON structure
        let countiesData = [];
        let subcountiesData = [];
        let wardsData = []; // This will be from "station" table
        
        // 🔧 FIXED: Handle PHPMyAdmin export format (array of tables)
        if (Array.isArray(rawData)) {
            console.log('📊 PHPMyAdmin array format detected');
            const tables = rawData.filter(item => item.type === 'table' && item.data);
            
            tables.forEach(table => {
                if (table.name === 'counties' && table.data) {
                    countiesData = table.data;
                    console.log(`📊 Found counties table: ${table.data.length} records`);
                } else if (table.name === 'subcounties' && table.data) {
                    subcountiesData = table.data;
                    console.log(`📊 Found subcounties table: ${table.data.length} records`);
                } else if (table.name === 'station' && table.data) {
                    wardsData = table.data; // Map station DB table to wards
                    console.log(`📊 Found wards table (from station): ${table.data.length} records`);
                }
            });
        }
        // Handle standard table format
        else if (rawData.tables) {
            rawData.tables.forEach(table => {
                if (table.name === 'counties' && table.data) {
                    countiesData = table.data;
                } else if (table.name === 'subcounties' && table.data) {
                    subcountiesData = table.data;
                } else if (table.name === 'station' && table.data) {
                    wardsData = table.data; // Map to wards
                }
            });
        } 
        // Handle direct object format
        else if (rawData.counties && rawData.subcounties && rawData.station) {
            countiesData = rawData.counties;
            subcountiesData = rawData.subcounties;
            wardsData = rawData.station; // Map to wards
        }
        
        // 🔧 FIXED: Process counties with proper data structure
        if (countiesData && countiesData.length > 0) {
            countiesData.forEach(county => {
                if (county.county_id && county.county_name) {
                    counties[county.county_id] = {
                        id: county.county_id,
                        name: county.county_name,
                        displayName: this.formatCountyName(county.county_name)
                    };
                }
            });
        }
        
        // 🔧 FIXED: Process subcounties with proper data structure
        if (subcountiesData && subcountiesData.length > 0) {
            subcountiesData.forEach(subcounty => {
                const countyId = subcounty.county_id;
                if (countyId && subcounty.subcounty_id) {
                    if (!subcounties[countyId]) {
                        subcounties[countyId] = {};
                    }
                    subcounties[countyId][subcounty.subcounty_id] = {
                        id: subcounty.subcounty_id,
                        name: subcounty.subcounty_name || subcounty.constituency_name,
                        displayName: this.formatSubcountyName(subcounty.subcounty_name || subcounty.constituency_name),
                        countyId: countyId
                    };
                }
            });
        }
        
        // 🔧 FIXED: Process wards (from station table) - link to subcounty_id and use "ward" field
        if (wardsData && wardsData.length > 0) {
            wardsData.forEach(station => {
                const subcountyId = station.subcounty_id; // Link wards to subcounties via subcounty_id
                if (subcountyId && station.station_id && station.ward) { // Use "ward" field, not "station_name"
                    if (!wards[subcountyId]) {
                        wards[subcountyId] = {};
                    }
                    wards[subcountyId][station.station_id] = {
                        id: station.station_id,
                        name: station.ward, // Use "ward" field
                        displayName: this.formatWardName(station.ward), // Use "ward" field
                        subcountyId: subcountyId,
                        constituency: station.constituency_name
                    };
                }
            });
        }
        
        console.log(`✅ Processed ${Object.keys(counties).length} counties, ${Object.keys(subcounties).length} county groups, ${Object.keys(wards).length} subcounty groups`);
        
        return {
            counties: counties,
            subcounties: subcounties, // Back to subcounties
            wards: wards
        };
    },
    
    // ========================================
    // FORMATTING FUNCTIONS
    // ========================================
    
    formatCountyName(name) {
        if (!name) return '';
        return name.toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
            .replace(/'/g, "'");
    },
    
    formatSubcountyName(name) {
        if (!name) return '';
        return name.toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
            .replace(/'/g, "'")
            .replace(/\//g, ' / ');
    },
    
    formatWardName(name) {
        if (!name) return '';
        return name.toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
            .replace(/'/g, "'")
            .replace(/\//g, ' / ')
            .replace(/\\/g, ' / ')
            .replace(/-/g, ' - ');
    },
    
    // ========================================
    // DROPDOWN INITIALIZATION
    // ========================================
    
    initializeCountyDropdown() {
        const countySelect = document.getElementById('county');
        if (!countySelect) return;
        
        countySelect.classList.remove('loading-dropdown');
        countySelect.innerHTML = '<option value="">Select County</option>';
        
        // Sort counties alphabetically by display name
        const sortedCounties = Object.values(this.data.counties)
            .sort((a, b) => a.displayName.localeCompare(b.displayName));
        
        // Add county options
        sortedCounties.forEach(county => {
            const option = document.createElement('option');
            option.value = county.id;
            option.textContent = county.displayName;
            option.setAttribute('data-original-name', county.name);
            countySelect.appendChild(option);
        });
        
        console.log(`✅ County dropdown initialized with ${sortedCounties.length} counties`);
    },
    
    initializeFallbackCounties() {
        const countySelect = document.getElementById('county');
        if (!countySelect) return;
        
        countySelect.classList.remove('loading-dropdown');
        
        const fallbackCounties = [
            'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 
            'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 
            'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 
            'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang\'a', 
            'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 
            'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans Nzoia', 
            'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
        ];
        
        countySelect.innerHTML = '<option value="">Select County</option>';
        
        fallbackCounties.forEach((countyName, index) => {
            const option = document.createElement('option');
            option.value = String(index + 1).padStart(3, '0');
            option.textContent = countyName;
            option.setAttribute('data-fallback', 'true');
            countySelect.appendChild(option);
        });
        
        console.log(`✅ Fallback county dropdown initialized`);
    },
    
    // ========================================
    // EVENT HANDLERS
    // ========================================
    
    handleCountyChange() {
        const countySelect = document.getElementById('county');
        const subCountySelect = document.getElementById('subCounty');
        const wardSelect = document.getElementById('ward');
        
        // Reset dependent dropdowns
        this.resetDropdown(subCountySelect, 'Select county first');
        this.resetDropdown(wardSelect, 'Select sub-county first');
        
        const selectedCountyId = countySelect.value;
        
        if (!selectedCountyId || !this.isLoaded) {
            return;
        }
        
        // Check if using fallback data
        const selectedOption = countySelect.querySelector(`option[value="${selectedCountyId}"]`);
        if (selectedOption && selectedOption.hasAttribute('data-fallback')) {
            this.disableDropdown(subCountySelect, 'Using basic county list - subcounty data unavailable');
            return;
        }
        
        // Populate subcounty dropdown
        this.populateSubCountyDropdown(selectedCountyId);
    },
    
    populateSubCountyDropdown(countyId) {
        const subCountySelect = document.getElementById('subCounty');
        
        subCountySelect.classList.add('loading-dropdown');
        
        setTimeout(() => {
            subCountySelect.classList.remove('loading-dropdown');
            subCountySelect.innerHTML = '<option value="">Select Sub County</option>';
            
            const subcounties = this.data.subcounties[countyId];
            if (subcounties) {
                // Sort subcounties alphabetically
                const sortedSubcounties = Object.values(subcounties)
                    .sort((a, b) => a.displayName.localeCompare(b.displayName));
                
                sortedSubcounties.forEach(subcounty => {
                    const option = document.createElement('option');
                    option.value = subcounty.id;
                    option.textContent = subcounty.displayName;
                    option.setAttribute('data-original-name', subcounty.name);
                    subCountySelect.appendChild(option);
                });
                
                subCountySelect.disabled = false;
                
                // Update help text
                const helpText = subCountySelect.parentElement.querySelector('.location-help-text');
                if (helpText) {
                    helpText.textContent = `${sortedSubcounties.length} subcounties available`;
                    helpText.style.color = '#28a745';
                }
            } else {
                this.disableDropdown(subCountySelect, 'No subcounties found for this county');
            }
        }, 300);
    },
    
    handleSubCountyChange() {
        const subCountySelect = document.getElementById('subCounty');
        const wardSelect = document.getElementById('ward');
        
        // Reset ward dropdown
        this.resetDropdown(wardSelect, 'Select sub-county first');
        
        const selectedSubCountyId = subCountySelect.value;
        
        if (!selectedSubCountyId || !this.isLoaded) {
            return;
        }
        
        // Populate ward dropdown using subcounty_id from station table
        this.populateWardDropdown(selectedSubCountyId);
    },
    
    populateWardDropdown(subcountyId) {
        const wardSelect = document.getElementById('ward');
        
        wardSelect.classList.add('loading-dropdown');
        
        setTimeout(() => {
            wardSelect.classList.remove('loading-dropdown');
            wardSelect.innerHTML = '<option value="">Select Ward</option>';
            
            const wards = this.data.wards[subcountyId];
            if (wards) {
                // Sort wards alphabetically
                const sortedWards = Object.values(wards)
                    .sort((a, b) => a.displayName.localeCompare(b.displayName));
                
                sortedWards.forEach(ward => {
                    const option = document.createElement('option');
                    option.value = ward.id;
                    option.textContent = ward.displayName;
                    option.setAttribute('data-original-name', ward.name);
                    wardSelect.appendChild(option);
                });
                
                wardSelect.disabled = false;
                
                // Update help text
                const helpText = wardSelect.parentElement.querySelector('.location-help-text');
                if (helpText) {
                    helpText.textContent = `${sortedWards.length} wards available`;
                    helpText.style.color = '#28a745';
                }
            } else {
                this.disableDropdown(wardSelect, 'No wards found for this sub-county');
            }
        }, 300);
    },
    
    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    
    resetDropdown(selectElement, placeholder) {
        if (!selectElement) return;
        
        selectElement.disabled = true;
        selectElement.innerHTML = `<option value="">${placeholder}</option>`;
        
        const helpText = selectElement.parentElement.querySelector('.location-help-text');
        if (helpText) {
            helpText.textContent = helpText.getAttribute('data-original-text') || 'Please select previous option first';
            helpText.style.color = '#666';
        }
    },
    
    disableDropdown(selectElement, message) {
        if (!selectElement) return;
        
        selectElement.disabled = true;
        selectElement.innerHTML = `<option value="">${message}</option>`;
        
        const helpText = selectElement.parentElement.querySelector('.location-help-text');
        if (helpText) {
            helpText.textContent = message;
            helpText.style.color = '#dc3545';
        }
    },
    
    // ========================================
    // DATA EXTRACTION
    // ========================================
    
    getSelectedLocationHierarchy() {
        const countySelect = document.getElementById('county');
        const subCountySelect = document.getElementById('subCounty');
        const wardSelect = document.getElementById('ward');
        
        let hierarchy = {
            county: null,
            subCounty: null,
            ward: null
        };
        
        // County information
        if (countySelect && countySelect.value) {
            const countyOption = countySelect.querySelector(`option[value="${countySelect.value}"]`);
            hierarchy.county = {
                id: countySelect.value,
                name: countyOption ? countyOption.getAttribute('data-original-name') || countyOption.textContent : null,
                displayName: countyOption ? countyOption.textContent : null,
                isFallback: countyOption ? countyOption.hasAttribute('data-fallback') : false
            };
        }
        
        // Sub County information
        if (subCountySelect && subCountySelect.value && !subCountySelect.disabled) {
            const subCountyOption = subCountySelect.querySelector(`option[value="${subCountySelect.value}"]`);
            hierarchy.subCounty = {
                id: subCountySelect.value,
                name: subCountyOption ? subCountyOption.getAttribute('data-original-name') || subCountyOption.textContent : null,
                displayName: subCountyOption ? subCountyOption.textContent : null,
                countyId: countySelect.value
            };
        }
        
        // Ward information
        if (wardSelect && wardSelect.value && !wardSelect.disabled) {
            const wardOption = wardSelect.querySelector(`option[value="${wardSelect.value}"]`);
            hierarchy.ward = {
                id: wardSelect.value,
                name: wardOption ? wardOption.getAttribute('data-original-name') || wardOption.textContent : null,
                displayName: wardOption ? wardOption.textContent : null,
                subcountyId: subCountySelect.value
            };
        }
        
        return hierarchy;
    },
    
    calculateLocationCompleteness(hierarchy) {
        let score = 0;
        let maxScore = 3;
        
        if (hierarchy.county) score += 1;
        if (hierarchy.subCounty) score += 1;
        if (hierarchy.ward) score += 1;
        
        return Math.round((score / maxScore) * 100);
    },
    
    // ========================================
    // INITIALIZATION
    // ========================================
    
    async initialize() {
        console.log('📍 Initializing Location Manager...');
        
        // Store original help text
        document.querySelectorAll('.location-help-text').forEach(text => {
            text.setAttribute('data-original-text', text.textContent);
        });
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load location data
        await this.loadLocationData();
        
        console.log('✅ Location Manager initialized');
    },
    
    setupEventListeners() {
        const countySelect = document.getElementById('county');
        const subCountySelect = document.getElementById('subCounty');
        
        if (countySelect) {
            countySelect.addEventListener('change', () => this.handleCountyChange());
        }
        
        if (subCountySelect) {
            subCountySelect.addEventListener('change', () => this.handleSubCountyChange());
        }
    }
};

console.log('📍 Location Manager module loaded');