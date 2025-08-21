// location-manager.js - Location Management System (FIXED)
// University of Eldoret Student Form - Location Module

/**
 * Handles Kenyan administrative location data including:
 * - County, Sub-County, Constituency, and Ward hierarchies
 * - Dynamic dropdown population
 * - Fallback data when API is unavailable
 * - Location validation and completion scoring
 */

window.UoEForm = window.UoEForm || {};
window.UoEForm.LocationManager = {
    
    // ========================================
    // STATE MANAGEMENT
    // ========================================
    
    data: null,
    isLoaded: false,
    loadingPromise: null,
    
    // ========================================
    // DATA LOADING
    // ========================================
    
    async loadLocationData() {
        if (this.loadingPromise) {
            return this.loadingPromise;
        }
        
        this.loadingPromise = this.performLoad();
        return this.loadingPromise;
    },
    
    async performLoad() {
        console.log('📍 Loading Kenyan administrative location data...');
        
        try {
            // Try to load from multiple possible locations
            const possiblePaths = [
                './kenyan_locations.json',
                './data/kenyan_locations.json',
                './assets/kenyan_locations.json',
                'kenyan_locations.json'
            ];
            
            let response = null;
            let loadedFrom = null;
            
            for (const path of possiblePaths) {
                try {
                    response = await fetch(path);
                    if (response.ok) {
                        loadedFrom = path;
                        break;
                    }
                } catch (error) {
                    console.warn(`⚠️ Could not load from ${path}:`, error.message);
                }
            }
            
            if (!response || !response.ok) {
                throw new Error('Location data file not found in any expected location');
            }
            
            this.data = await response.json();
            this.isLoaded = true;
            
            console.log(`✅ Location data loaded successfully from: ${loadedFrom}`);
            console.log(`📊 Counties available: ${Object.keys(this.data).length}`);
            
            this.populateCountyDropdown();
            return true;
            
        } catch (error) {
            console.error('❌ Error loading location data:', error);
            console.log('📍 Using fallback county list...');
            
            this.loadFallbackData();
            return false;
        }
    },
    
    loadFallbackData() {
        // Comprehensive list of Kenyan counties with basic structure
        const fallbackCounties = {
            "Baringo": { id: "1", subCounties: {} },
            "Bomet": { id: "2", subCounties: {} },
            "Bungoma": { id: "3", subCounties: {} },
            "Busia": { id: "4", subCounties: {} },
            "Elgeyo-Marakwet": { id: "5", subCounties: {} },
            "Embu": { id: "6", subCounties: {} },
            "Garissa": { id: "7", subCounties: {} },
            "Homa Bay": { id: "8", subCounties: {} },
            "Isiolo": { id: "9", subCounties: {} },
            "Kajiado": { id: "10", subCounties: {} },
            "Kakamega": { id: "11", subCounties: {} },
            "Kericho": { id: "12", subCounties: {} },
            "Kiambu": { id: "13", subCounties: {} },
            "Kilifi": { id: "14", subCounties: {} },
            "Kirinyaga": { id: "15", subCounties: {} },
            "Kisii": { id: "16", subCounties: {} },
            "Kisumu": { id: "17", subCounties: {} },
            "Kitui": { id: "18", subCounties: {} },
            "Kwale": { id: "19", subCounties: {} },
            "Laikipia": { id: "20", subCounties: {} },
            "Lamu": { id: "21", subCounties: {} },
            "Machakos": { id: "22", subCounties: {} },
            "Makueni": { id: "23", subCounties: {} },
            "Mandera": { id: "24", subCounties: {} },
            "Marsabit": { id: "25", subCounties: {} },
            "Meru": { id: "26", subCounties: {} },
            "Migori": { id: "27", subCounties: {} },
            "Mombasa": { id: "28", subCounties: {} },
            "Murang'a": { id: "29", subCounties: {} },
            "Nairobi": { id: "30", subCounties: {} },
            "Nakuru": { id: "31", subCounties: {} },
            "Nandi": { id: "32", subCounties: {} },
            "Narok": { id: "33", subCounties: {} },
            "Nyamira": { id: "34", subCounties: {} },
            "Nyandarua": { id: "35", subCounties: {} },
            "Nyeri": { id: "36", subCounties: {} },
            "Samburu": { id: "37", subCounties: {} },
            "Siaya": { id: "38", subCounties: {} },
            "Taita-Taveta": { id: "39", subCounties: {} },
            "Tana River": { id: "40", subCounties: {} },
            "Tharaka-Nithi": { id: "41", subCounties: {} },
            "Trans Nzoia": { id: "42", subCounties: {} },
            "Turkana": { id: "43", subCounties: {} },
            "Uasin Gishu": { id: "44", subCounties: {} },
            "Vihiga": { id: "45", subCounties: {} },
            "Wajir": { id: "46", subCounties: {} },
            "West Pokot": { id: "47", subCounties: {} }
        };
        
        this.data = fallbackCounties;
        this.isLoaded = false; // Mark as fallback
        
        this.populateCountyDropdown();
        console.log('✅ Fallback county dropdown initialized');
    },
    
    // ========================================
    // DROPDOWN POPULATION
    // ========================================
    
    populateCountyDropdown() {
        const countySelect = document.getElementById('county');
        if (!countySelect || !this.data) {
            console.warn('⚠️ County dropdown or data not available');
            return;
        }
        
        countySelect.innerHTML = '<option value="">Select County</option>';
        
        const sortedCounties = Object.keys(this.data).sort();
        
        sortedCounties.forEach(countyName => {
            const option = document.createElement('option');
            option.value = this.data[countyName].id;
            option.textContent = countyName;
            option.setAttribute('data-original-name', countyName);
            
            if (!this.isLoaded) {
                option.setAttribute('data-fallback', 'true');
            }
            
            countySelect.appendChild(option);
        });
        
        console.log(`✅ County dropdown populated with ${sortedCounties.length} counties`);
    },
    
    populateSubCountyDropdown(countyName) {
        const subCountySelect = document.getElementById('subCounty');
        if (!subCountySelect || !this.data[countyName]) {
            console.warn(`⚠️ Sub-county data not available for: ${countyName}`);
            return;
        }
        
        const subCounties = this.data[countyName].subCounties;
        
        if (!subCounties || Object.keys(subCounties).length === 0) {
            this.resetDropdown('subCounty', 'No sub-counties available');
            return;
        }
        
        subCountySelect.disabled = false;
        subCountySelect.innerHTML = '<option value="">Select Sub County</option>';
        
        const sortedSubCounties = Object.keys(subCounties).sort();
        
        sortedSubCounties.forEach(subCountyName => {
            const option = document.createElement('option');
            option.value = subCounties[subCountyName].id;
            option.textContent = subCountyName;
            option.setAttribute('data-original-name', subCountyName);
            subCountySelect.appendChild(option);
        });
        
        this.updateHelpText('subCounty', 'Select your sub-county');
        console.log(`✅ Sub-county dropdown populated for ${countyName}`);
    },
    
    populateConstituencyDropdown(countyName, subCountyName) {
        const constituencySelect = document.getElementById('constituency');
        if (!constituencySelect || !this.data[countyName] || !this.data[countyName].subCounties[subCountyName]) {
            console.warn(`⚠️ Constituency data not available for: ${countyName} > ${subCountyName}`);
            return;
        }
        
        const constituencies = this.data[countyName].subCounties[subCountyName].constituencies;
        
        if (!constituencies || Object.keys(constituencies).length === 0) {
            this.resetDropdown('constituency', 'No constituencies available');
            return;
        }
        
        constituencySelect.disabled = false;
        constituencySelect.innerHTML = '<option value="">Select Constituency</option>';
        
        const sortedConstituencies = Object.keys(constituencies).sort();
        
        sortedConstituencies.forEach(constituencyName => {
            const option = document.createElement('option');
            option.value = constituencies[constituencyName].id;
            option.textContent = constituencyName;
            option.setAttribute('data-original-name', constituencyName);
            constituencySelect.appendChild(option);
        });
        
        this.updateHelpText('constituency', 'Select your constituency');
        console.log(`✅ Constituency dropdown populated for ${subCountyName}`);
    },
    
    populateWardDropdown(countyName, subCountyName, constituencyName) {
        const wardSelect = document.getElementById('ward');
        if (!wardSelect || 
            !this.data[countyName] || 
            !this.data[countyName].subCounties[subCountyName] ||
            !this.data[countyName].subCounties[subCountyName].constituencies[constituencyName]) {
            console.warn(`⚠️ Ward data not available for: ${countyName} > ${subCountyName} > ${constituencyName}`);
            return;
        }
        
        const wards = this.data[countyName].subCounties[subCountyName].constituencies[constituencyName].wards;
        
        if (!wards || Object.keys(wards).length === 0) {
            this.resetDropdown('ward', 'No wards available');
            return;
        }
        
        wardSelect.disabled = false;
        wardSelect.innerHTML = '<option value="">Select Ward (Optional)</option>';
        
        const sortedWards = Object.keys(wards).sort();
        
        sortedWards.forEach(wardName => {
            const option = document.createElement('option');
            option.value = wards[wardName].id;
            option.textContent = wardName;
            option.setAttribute('data-original-name', wardName);
            wardSelect.appendChild(option);
        });
        
        this.updateHelpText('ward', 'Optional: Select your ward');
        console.log(`✅ Ward dropdown populated for ${constituencyName}`);
    },
    
    // ========================================
    // EVENT HANDLERS
    // ========================================
    
    handleCountyChange() {
        const countySelect = document.getElementById('county');
        if (!countySelect || !countySelect.value) {
            this.resetDependentDropdowns(['subCounty', 'constituency', 'ward']);
            return;
        }
        
        const selectedOption = countySelect.selectedOptions[0];
        const countyName = selectedOption.getAttribute('data-original-name') || selectedOption.textContent;
        
        // Reset dependent dropdowns
        this.resetDependentDropdowns(['constituency', 'ward']);
        
        // Populate sub-counties
        this.populateSubCountyDropdown(countyName);
    },
    
    handleSubCountyChange() {
        const countySelect = document.getElementById('county');
        const subCountySelect = document.getElementById('subCounty');
        
        if (!countySelect || !subCountySelect || !subCountySelect.value) {
            this.resetDependentDropdowns(['constituency', 'ward']);
            return;
        }
        
        const countyOption = countySelect.selectedOptions[0];
        const subCountyOption = subCountySelect.selectedOptions[0];
        
        const countyName = countyOption.getAttribute('data-original-name') || countyOption.textContent;
        const subCountyName = subCountyOption.getAttribute('data-original-name') || subCountyOption.textContent;
        
        // Reset dependent dropdowns
        this.resetDependentDropdowns(['ward']);
        
        // Populate constituencies
        this.populateConstituencyDropdown(countyName, subCountyName);
    },
    
    handleConstituencyChange() {
        const countySelect = document.getElementById('county');
        const subCountySelect = document.getElementById('subCounty');
        const constituencySelect = document.getElementById('constituency');
        
        if (!countySelect || !subCountySelect || !constituencySelect || !constituencySelect.value) {
            this.resetDependentDropdowns(['ward']);
            return;
        }
        
        const countyOption = countySelect.selectedOptions[0];
        const subCountyOption = subCountySelect.selectedOptions[0];
        const constituencyOption = constituencySelect.selectedOptions[0];
        
        const countyName = countyOption.getAttribute('data-original-name') || countyOption.textContent;
        const subCountyName = subCountyOption.getAttribute('data-original-name') || subCountyOption.textContent;
        const constituencyName = constituencyOption.getAttribute('data-original-name') || constituencyOption.textContent;
        
        // Populate wards
        this.populateWardDropdown(countyName, subCountyName, constituencyName);
    },
    
    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    
    resetDropdown(dropdownId, message) {
        const element = document.getElementById(dropdownId);
        if (!element) return;
        
        element.disabled = true;
        element.innerHTML = `<option value="">${message}</option>`;
        
        this.updateHelpText(dropdownId, message, '#dc3545');
    },
    
    resetDependentDropdowns(dropdownIds) {
        const messages = {
            'subCounty': 'Select county first',
            'constituency': 'Select sub-county first',
            'ward': 'Select constituency first'
        };
        
        dropdownIds.forEach(id => {
            this.resetDropdown(id, messages[id] || 'Please select previous option');
        });
    },
    
    updateHelpText(dropdownId, message, color = '#666') {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;
        
        const helpText = dropdown.parentElement?.querySelector('.location-help-text');
        if (helpText) {
            helpText.textContent = message;
            helpText.style.color = color;
        }
    },
    
    // ========================================
    // DATA RETRIEVAL
    // ========================================
    
    getSelectedLocationHierarchy() {
        const countySelect = document.getElementById('county');
        const subCountySelect = document.getElementById('subCounty');
        const constituencySelect = document.getElementById('constituency');
        const wardSelect = document.getElementById('ward');
        
        const hierarchy = {
            county: null,
            subCounty: null,
            constituency: null,
            ward: null
        };
        
        // County information
        if (countySelect && countySelect.value) {
            const countyOption = countySelect.selectedOptions[0];
            hierarchy.county = {
                id: countySelect.value,
                name: countyOption.getAttribute('data-original-name') || countyOption.textContent,
                displayName: countyOption.textContent,
                isFallback: countyOption.hasAttribute('data-fallback')
            };
        }
        
        // Sub County information
        if (subCountySelect && subCountySelect.value && !subCountySelect.disabled) {
            const subCountyOption = subCountySelect.selectedOptions[0];
            hierarchy.subCounty = {
                id: subCountySelect.value,
                name: subCountyOption.getAttribute('data-original-name') || subCountyOption.textContent,
                displayName: subCountyOption.textContent,
                countyId: countySelect ? countySelect.value : null
            };
        }
        
        // Constituency information
        if (constituencySelect && constituencySelect.value && !constituencySelect.disabled) {
            const constituencyOption = constituencySelect.selectedOptions[0];
            hierarchy.constituency = {
                id: constituencySelect.value,
                name: constituencyOption.getAttribute('data-original-name') || constituencyOption.textContent,
                displayName: constituencyOption.textContent,
                subCountyId: subCountySelect ? subCountySelect.value : null
            };
        }
        
        // Ward information
        if (wardSelect && wardSelect.value && !wardSelect.disabled) {
            const wardOption = wardSelect.selectedOptions[0];
            hierarchy.ward = {
                id: wardSelect.value,
                name: wardOption.getAttribute('data-original-name') || wardOption.textContent,
                displayName: wardOption.textContent,
                constituencyId: constituencySelect ? constituencySelect.value : null
            };
        }
        
        return hierarchy;
    },
    
    calculateLocationCompleteness(hierarchy = null) {
        if (!hierarchy) {
            hierarchy = this.getSelectedLocationHierarchy();
        }
        
        let score = 0;
        const maxScore = 4;
        
        if (hierarchy.county) score += 1;
        if (hierarchy.subCounty) score += 1;
        if (hierarchy.constituency) score += 1;
        if (hierarchy.ward) score += 1;
        
        return Math.round((score / maxScore) * 100);
    },
    
    getLocationDisplayText() {
        const hierarchy = this.getSelectedLocationHierarchy();
        const parts = [];
        
        if (hierarchy.ward) parts.push(hierarchy.ward.displayName);
        if (hierarchy.constituency) parts.push(hierarchy.constituency.displayName);
        if (hierarchy.subCounty) parts.push(hierarchy.subCounty.displayName);
        if (hierarchy.county) parts.push(hierarchy.county.displayName);
        
        return parts.join(', ') || 'No location selected';
    },
    
    // ========================================
    // VALIDATION
    // ========================================
    
    validateLocationSelection() {
        const hierarchy = this.getSelectedLocationHierarchy();
        
        if (!hierarchy.county) {
            return {
                isValid: false,
                message: 'Please select a county',
                field: 'county'
            };
        }
        
        return {
            isValid: true,
            message: 'Location selection is valid',
            completeness: this.calculateLocationCompleteness(hierarchy)
        };
    },
    
    // ========================================
    // EVENT LISTENER SETUP
    // ========================================
    
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
        
        console.log('✅ Location dropdown event listeners set up');
    },
    
    // ========================================
    // INITIALIZATION
    // ========================================
    
    async initialize() {
        console.log('📍 Initializing Location Manager...');
        
        try {
            // Load location data
            await this.loadLocationData();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('✅ Location Manager initialized');
            return true;
            
        } catch (error) {
            console.error('❌ Location Manager initialization failed:', error);
            
            // Still setup event listeners even if data loading failed
            this.setupEventListeners();
            return false;
        }
    }
};

// ========================================
// GLOBAL FUNCTIONS FOR BACKWARD COMPATIBILITY
// ========================================

// These functions maintain compatibility with existing code
window.loadLocationData = function() {
    return window.UoEForm.LocationManager.loadLocationData();
};

window.handleCountyChange = function() {
    return window.UoEForm.LocationManager.handleCountyChange();
};

window.handleSubCountyChange = function() {
    return window.UoEForm.LocationManager.handleSubCountyChange();
};

window.handleConstituencyChange = function() {
    return window.UoEForm.LocationManager.handleConstituencyChange();
};

window.getSelectedLocationHierarchy = function() {
    return window.UoEForm.LocationManager.getSelectedLocationHierarchy();
};

window.calculateLocationCompleteness = function(hierarchy) {
    return window.UoEForm.LocationManager.calculateLocationCompleteness(hierarchy);
};

console.log('📍 Location Manager module loaded');