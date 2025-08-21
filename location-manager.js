// location-manager.js - Kenyan Administrative Location Management
// University of Eldoret Student Form - Location Module

/**
 * Handles loading and managing Kenyan administrative location data
 * Provides cascading dropdown functionality: County → Sub County → Constituency → Ward
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
        let subcounties = {};
        let wards = {};
        
        // Find the data tables in the JSON structure
        let countiesData = [];
        let subcountiesData = [];
        let wardsData = [];
        
        // Handle different JSON structures
        if (rawData.tables) {
            rawData.tables.forEach(table => {
                if (table.name === 'counties' && table.data) {
                    countiesData = table.data;
                } else if (table.name === 'subcounties' && table.data) {
                    subcountiesData = table.data;
                } else if (table.name === 'station' && table.data) {
                    wardsData = table.data;
                }
            });
        } else if (rawData.counties && rawData.subcounties && rawData.station) {
            countiesData = rawData.counties;
            subcountiesData = rawData.subcounties;
            wardsData = rawData.station;
        }
        
        // Process counties
        countiesData.forEach(county => {
            counties[county.county_id] = {
                id: county.county_id,
                name: county.county_name,
                displayName: this.formatCountyName(county.county_name)
            };
        });
        
        // Process subcounties/constituencies
        subcountiesData.forEach(subcounty => {
            const countyId = subcounty.county_id;
            if (!subcounties[countyId]) {
                subcounties[countyId] = {};
            }
            subcounties[countyId][subcounty.subcounty_id] = {
                id: subcounty.subcounty_id,
                name: subcounty.constituency_name,
                displayName: this.formatSubcountyName(subcounty.constituency_name),
                countyId: countyId
            };
        });
        
        // Process wards
        wardsData.forEach(ward => {
            if (ward.subcounty_id && ward.subcounty_id !== "0" && ward.ward && ward.ward.trim() !== "") {
                const subcountyId = ward.subcounty_id;
                if (!wards[subcountyId]) {
                    wards[subcountyId] = {};
                }
                wards[subcountyId][ward.station_id] = {
                    id: ward.station_id,
                    name: ward.ward,
                    displayName: this.formatWardName(ward.ward),
                    subcountyId: subcountyId,
                    constituency: ward.constituency_name
                };
            }
        });
        
        console.log(`✅ Processed ${Object.keys(counties).length} counties, ${Object.keys(subcounties).length} county groups, ${Object.keys(wards).length} subcounty groups`);
        
        return {
            counties: counties,
            subcounties: subcounties,
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
        
        console.log('✅ Fallback county dropdown initialized');
        this.showLocationDataWarning();
    },
    
    showLocationDataWarning() {
        const helpText = document.querySelector('#county').parentElement.querySelector('.location-help-text');
        if (helpText) {
            helpText.textContent = 'Using basic county list - subcounty data unavailable';
            helpText.style.color = '#dc3545';
        }
    },
    
    // ========================================
    // CASCADING DROPDOWN HANDLERS
    // ========================================
    
    handleCountyChange() {
        const countySelect = document.getElementById('county');
        const subCountySelect = document.getElementById('subCounty');
        const constituencySelect = document.getElementById('constituency');
        const wardSelect = document.getElementById('ward');
        
        // Reset dependent dropdowns
        this.resetDropdown(subCountySelect, 'Select county first');
        this.resetDropdown(constituencySelect, 'Select sub-county first');
        this.resetDropdown(wardSelect, 'Select constituency first');
        
        const selectedCountyId = countySelect.value;
        
        if (!selectedCountyId) {
            return;
        }
        
        if (!this.isLoaded || !this.data) {
            this.disableDropdown(subCountySelect, 'County selected - subcounty data unavailable');
            return;
        }
        
        // Get subcounties for selected county
        const subcountiesForCounty = this.data.subcounties[selectedCountyId];
        
        if (!subcountiesForCounty || Object.keys(subcountiesForCounty).length === 0) {
            this.disableDropdown(subCountySelect, 'No subcounties found for this county');
            return;
        }
        
        // Populate subcounty dropdown
        this.populateSubCountyDropdown(subcountiesForCounty);
    },
    
    populateSubCountyDropdown(subcounties) {
        const subCountySelect = document.getElementById('subCounty');
        
        subCountySelect.disabled = false;
        subCountySelect.classList.add('loading-dropdown');
        subCountySelect.innerHTML = '<option value="">Loading subcounties...</option>';
        
        setTimeout(() => {
            subCountySelect.classList.remove('loading-dropdown');
            subCountySelect.innerHTML = '<option value="">Select Sub County</option>';
            
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
            
            // Update help text
            const helpText = subCountySelect.parentElement.querySelector('.location-help-text');
            if (helpText) {
                helpText.textContent = `${sortedSubcounties.length} subcounties available`;
                helpText.style.color = '#28a745';
            }
        }, 300);
    },
    
    handleSubCountyChange() {
        const subCountySelect = document.getElementById('subCounty');
        const constituencySelect = document.getElementById('constituency');
        const wardSelect = document.getElementById('ward');
        
        // Reset dependent dropdowns
        this.resetDropdown(constituencySelect, 'Select sub-county first');
        this.resetDropdown(wardSelect, 'Select constituency first');
        
        const selectedSubCountyId = subCountySelect.value;
        
        if (!selectedSubCountyId || !this.isLoaded) {
            return;
        }
        
        // Populate constituency dropdown
        this.populateConstituencyDropdown(selectedSubCountyId);
    },
    
    populateConstituencyDropdown(subcountyId) {
        const constituencySelect = document.getElementById('constituency');
        const subCountySelect = document.getElementById('subCounty');
        
        // Get the selected subcounty info
        const selectedOption = subCountySelect.querySelector(`option[value="${subcountyId}"]`);
        const constituencyName = selectedOption ? selectedOption.textContent : 'Unknown';
        
        constituencySelect.disabled = false;
        constituencySelect.innerHTML = '<option value="">Select Constituency</option>';
        
        // Add the constituency (same as subcounty in most cases)
        const option = document.createElement('option');
        option.value = subcountyId;
        option.textContent = constituencyName;
        constituencySelect.appendChild(option);
        
        // Auto-select the constituency
        constituencySelect.value = subcountyId;
        
        // Update help text
        const helpText = constituencySelect.parentElement.querySelector('.location-help-text');
        if (helpText) {
            helpText.textContent = 'Constituency selected automatically';
            helpText.style.color = '#28a745';
        }
        
        // Trigger ward loading
        this.handleConstituencyChange();
    },
    
    handleConstituencyChange() {
        const constituencySelect = document.getElementById('constituency');
        const wardSelect = document.getElementById('ward');
        
        this.resetDropdown(wardSelect, 'Select constituency first');
        
        const selectedConstituencyId = constituencySelect.value;
        
        if (!selectedConstituencyId || !this.isLoaded) {
            return;
        }
        
        // Get wards for selected constituency/subcounty
        const wardsForConstituency = this.data.wards[selectedConstituencyId];
        
        if (!wardsForConstituency || Object.keys(wardsForConstituency).length === 0) {
            this.disableDropdown(wardSelect, 'No wards found for this constituency');
            return;
        }
        
        this.populateWardDropdown(wardsForConstituency);
    },
    
    populateWardDropdown(wards) {
        const wardSelect = document.getElementById('ward');
        
        wardSelect.disabled = false;
        wardSelect.classList.add('loading-dropdown');
        wardSelect.innerHTML = '<option value="">Loading wards...</option>';
        
        setTimeout(() => {
            wardSelect.classList.remove('loading-dropdown');
            wardSelect.innerHTML = '<option value="">Select Ward (Optional)</option>';
            
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
            
            // Update help text
            const helpText = wardSelect.parentElement.querySelector('.location-help-text');
            if (helpText) {
                helpText.textContent = `${sortedWards.length} wards available`;
                helpText.style.color = '#28a745';
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
        const constituencySelect = document.getElementById('constituency');
        const wardSelect = document.getElementById('ward');
        
        let hierarchy = {
            county: null,
            subCounty: null,
            constituency: null,
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
        
        // SubCounty information
        if (subCountySelect && subCountySelect.value && !subCountySelect.disabled) {
            const subCountyOption = subCountySelect.querySelector(`option[value="${subCountySelect.value}"]`);
            hierarchy.subCounty = {
                id: subCountySelect.value,
                name: subCountyOption ? subCountyOption.getAttribute('data-original-name') || subCountyOption.textContent : null,
                displayName: subCountyOption ? subCountyOption.textContent : null,
                countyId: countySelect.value
            };
        }
        
        // Constituency information
        if (constituencySelect && constituencySelect.value && !constituencySelect.disabled) {
            const constituencyOption = constituencySelect.querySelector(`option[value="${constituencySelect.value}"]`);
            hierarchy.constituency = {
                id: constituencySelect.value,
                name: constituencyOption ? constituencyOption.getAttribute('data-original-name') || constituencyOption.textContent : null,
                displayName: constituencyOption ? constituencyOption.textContent : null,
                subcountyId: subCountySelect.value
            };
        }
        
        // Ward information
        if (wardSelect && wardSelect.value && !wardSelect.disabled) {
            const wardOption = wardSelect.querySelector(`option[value="${wardSelect.value}"]`);
            hierarchy.ward = {
                id: wardSelect.value,
                name: wardOption ? wardOption.getAttribute('data-original-name') || wardOption.textContent : null,
                displayName: wardOption ? wardOption.textContent : null,
                constituencyId: constituencySelect.value
            };
        }
        
        return hierarchy;
    },
    
    calculateLocationCompleteness(hierarchy) {
        let score = 0;
        let maxScore = 4;
        
        if (hierarchy.county) score += 1;
        if (hierarchy.subCounty) score += 1;
        if (hierarchy.constituency) score += 1;
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
        const constituencySelect = document.getElementById('constituency');
        
        if (countySelect) {
            countySelect.addEventListener('change', () => this.handleCountyChange());
        }
        
        if (subCountySelect) {
            subCountySelect.addEventListener('change', () => this.handleSubCountyChange());
        }
        
        if (constituencySelect) {
            constituencySelect.addEventListener('change', () => this.handleConstituencyChange());
        }
    }
};

console.log('📍 Location Manager module loaded');