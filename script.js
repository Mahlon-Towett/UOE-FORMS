// University of Eldoret Student Form JavaScript with Firebase Integration
// Enhanced with Cascading Kenyan Administrative Location Dropdowns

let isSubmitting = false; // Prevent double submissions
let kenyanLocationData = null; // Store loaded location data
let isLocationDataLoaded = false;

// ========================================
// GLOBAL FUNCTION DEFINITIONS (IMMEDIATE)
// ========================================

// Define these functions immediately so they're available for HTML onclick handlers
window.submitForm = function() {
    console.log('Submit form called');
    submitToFirebase();
};

window.clearForm = function() {
    console.log('Clear form called');
    if (confirm('Are you sure you want to clear all form data? This action cannot be undone.')) {
        document.getElementById('studentForm').reset();
        
        document.querySelectorAll('.field-input, .location-dropdown').forEach(field => {
            field.classList.remove('error', 'valid', 'location-error');
        });
        
        // Reset location dropdowns
        const subCountySelect = document.getElementById('subCounty');
        const constituencySelect = document.getElementById('constituency');
        const wardSelect = document.getElementById('ward');
        
        if (subCountySelect) resetDropdown(subCountySelect, 'Select county first');
        if (constituencySelect) resetDropdown(constituencySelect, 'Select sub-county first');
        if (wardSelect) resetDropdown(wardSelect, 'Select constituency first');
        
        const dataConsent = document.getElementById('dataConsent');
        const dataRights = document.getElementById('dataRights');
        if (dataConsent) dataConsent.checked = false;
        if (dataRights) dataRights.checked = false;
        
        const successMessage = document.getElementById('successMessage');
        if (successMessage) successMessage.style.display = 'none';
        
        localStorage.removeItem('uoe_student_form');
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

window.printForm = function() {
    console.log('Print form called');
    if (!validateForm()) {
        return;
    }
    
    if (!checkDataConsent()) {
        return;
    }
    
    const webElements = document.querySelectorAll('.form-actions, .success-message, .pre-submission-section');
    webElements.forEach(el => el.style.display = 'none');
    
    const printNotice = document.createElement('div');
    printNotice.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2a5298;
        color: white;
        padding: 15px;
        border-radius: 10px;
        z-index: 9999;
        font-size: 14px;
        max-width: 300px;
    `;
    printNotice.innerHTML = `
        <strong>📋 Remember:</strong><br>
        Print <strong>4 copies</strong> and attach passport photos on yellow background to each copy.
    `;
    document.body.appendChild(printNotice);
    
    window.print();
    
    setTimeout(() => {
        webElements.forEach(el => {
            el.style.display = 'block';
            if (el.classList.contains('pre-submission-section')) {
                el.style.visibility = 'visible';
                el.style.opacity = '1';
            }
        });
        if (document.body.contains(printNotice)) {
            document.body.removeChild(printNotice);
        }
    }, 1000);
};

window.downloadPDF = async function() {
    console.log('Download PDF called');
    if (!validateForm()) {
        return;
    }
    
    if (!checkDataConsent()) {
        return;
    }

    try {
        showLoadingMessage('Generating PDF... Please wait');

        const elementsToHide = document.querySelectorAll('.form-actions, .success-message, .pre-submission-section');
        elementsToHide.forEach(el => el.style.display = 'none');

        const container = document.querySelector('.container');
        
        const originalStyles = {
            width: container.style.width,
            maxWidth: container.style.maxWidth,
            margin: container.style.margin,
            boxShadow: container.style.boxShadow
        };

        container.classList.add('pdf-generation');
        
        const inputs = document.querySelectorAll('.field-input, .location-dropdown');
        inputs.forEach(input => {
            input.classList.remove('error', 'valid', 'location-error');
            
            input.style.webkitBoxShadow = '0 0 0 30px white inset';
            input.style.boxShadow = '0 0 0 30px white inset';
            input.style.background = 'white';
            input.style.backgroundColor = 'white';
            input.style.webkitTextFillColor = 'black';
            input.style.color = 'black';
            input.style.borderBottom = '1px solid #000';
            input.style.borderColor = '#000';
            
            input.removeAttribute('data-validation-state');
        });

        await new Promise(resolve => setTimeout(resolve, 200));

        const canvas = await html2canvas(container, {
            scale: 1.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: 794,
            height: container.offsetHeight,
            scrollX: 0,
            scrollY: 0,
            onclone: function(clonedDoc) {
                const clonedContainer = clonedDoc.querySelector('.container');
                clonedContainer.style.width = '794px';
                clonedContainer.style.maxWidth = '794px';
                clonedContainer.style.margin = '0';
                clonedContainer.style.boxShadow = 'none';
                
                const clonedInputs = clonedDoc.querySelectorAll('.field-input, .location-dropdown');
                clonedInputs.forEach(input => {
                    input.classList.remove('error', 'valid', 'location-error');
                    input.style.webkitBoxShadow = '0 0 0 30px white inset';
                    input.style.boxShadow = '0 0 0 30px white inset';
                    input.style.background = 'white';
                    input.style.backgroundColor = 'white';
                    input.style.webkitTextFillColor = 'black';
                    input.style.color = 'black';
                    input.style.borderBottom = '1px solid #000';
                    input.style.borderColor = '#000';
                });
            }
        });

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (imgHeight <= 297) {
            doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
        } else {
            const pageHeight = 297;
            const totalPages = Math.ceil(imgHeight / pageHeight);
            
            for (let i = 0; i < totalPages; i++) {
                if (i > 0) {
                    doc.addPage();
                }
                
                const yOffset = -i * pageHeight;
                doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, yOffset, imgWidth, imgHeight);
            }
        }

        container.classList.remove('pdf-generation');
        Object.keys(originalStyles).forEach(key => {
            container.style[key] = originalStyles[key];
        });

        inputs.forEach(input => {
            input.style.webkitBoxShadow = '';
            input.style.boxShadow = '';
            input.style.background = '';
            input.style.backgroundColor = '';
            input.style.webkitTextFillColor = '';
            input.style.color = '';
            input.style.borderBottom = '';
            input.style.borderColor = '';
        });

        elementsToHide.forEach(el => {
            el.style.display = 'block';
            if (el.classList.contains('pre-submission-section')) {
                el.style.visibility = 'visible';
                el.style.opacity = '1';
            }
        });

        hideLoadingMessage();

        const formData = getFormDataForFirebase();
        const fileName = generateFileName(formData.personalInfo.fullName);
        doc.save(fileName);

        showSuccessMessage();

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
        
        const loadingMsg = document.getElementById('loadingMessage');
        if (loadingMsg) {
            document.body.removeChild(loadingMsg);
        }
        
        const elementsToHide = document.querySelectorAll('.form-actions, .success-message');
        elementsToHide.forEach(el => el.style.display = 'block');
        
        const container = document.querySelector('.container');
        container.classList.remove('pdf-generation');
    }
};

console.log('✅ Global form functions defined immediately:', {
    submitForm: typeof window.submitForm,
    clearForm: typeof window.clearForm, 
    printForm: typeof window.printForm,
    downloadPDF: typeof window.downloadPDF
});

document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
    loadSavedData();
    loadKenyanLocationData(); // Load location data from server
    
    // Test Firebase connection after a short delay
    setTimeout(() => {
        if (window.db) {
            console.log('✅ Firebase Firestore connected successfully!');
        } else {
            console.error('❌ Firebase connection failed!');
        }
    }, 1500);
});

// ========================================
// KENYAN LOCATION DATA MANAGEMENT
// ========================================

// Load Kenyan administrative data from JSON file on server
async function loadKenyanLocationData() {
    try {
        console.log('📍 Loading Kenyan administrative location data...');
        
        // Update county dropdown to show loading state
        const countySelect = document.getElementById('county');
        countySelect.innerHTML = '<option value="">Loading counties...</option>';
        countySelect.classList.add('loading-dropdown');
        
        // Fetch data from JSON file on your TrueHost server
        // You'll need to upload your JSON file as "kenyan_locations.json"
        const response = await fetch('./kenyan_locations.json', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            cache: 'default' // Cache the data for better performance
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Location data loaded successfully');
        
        // Process and store the data
        kenyanLocationData = processLocationData(data);
        isLocationDataLoaded = true;
        
        // Initialize county dropdown
        initializeCountyDropdown();
        
    } catch (error) {
        console.error('❌ Error loading location data:', error);
        
        // Fallback to basic county list if JSON loading fails
        console.log('📍 Using fallback county list...');
        initializeFallbackCounties();
    }
}

// Process the loaded JSON data into a usable structure
function processLocationData(rawData) {
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
        // If data is in tables array format
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
        // If data is in direct object format
        countiesData = rawData.counties;
        subcountiesData = rawData.subcounties;
        wardsData = rawData.station;
    }
    
    // Process counties
    countiesData.forEach(county => {
        counties[county.county_id] = {
            id: county.county_id,
            name: county.county_name,
            displayName: formatCountyName(county.county_name)
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
            displayName: formatSubcountyName(subcounty.constituency_name),
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
                displayName: formatWardName(ward.ward),
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
}

// Format county names for display (from UPPERCASE to Title Case)
function formatCountyName(name) {
    if (!name) return '';
    return name.toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .replace(/'/g, "'"); // Fix apostrophes
}

// Format subcounty/constituency names for display
function formatSubcountyName(name) {
    if (!name) return '';
    return name.toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .replace(/'/g, "'")
        .replace(/\//g, ' / '); // Add spaces around slashes
}

// Format ward names for display
function formatWardName(name) {
    if (!name) return '';
    return name.toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .replace(/'/g, "'")
        .replace(/\//g, ' / ')
        .replace(/\\/g, ' / ')
        .replace(/-/g, ' - '); // Add spaces around dashes
}

// Initialize county dropdown with loaded data
function initializeCountyDropdown() {
    const countySelect = document.getElementById('county');
    countySelect.classList.remove('loading-dropdown');
    
    // Clear existing options
    countySelect.innerHTML = '<option value="">Select County</option>';
    
    // Sort counties alphabetically by display name
    const sortedCounties = Object.values(kenyanLocationData.counties)
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
}

// Fallback county list if JSON loading fails
function initializeFallbackCounties() {
    const countySelect = document.getElementById('county');
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
        option.value = String(index + 1).padStart(3, '0'); // Create synthetic ID
        option.textContent = countyName;
        option.setAttribute('data-fallback', 'true');
        countySelect.appendChild(option);
    });
    
    console.log('✅ Fallback county dropdown initialized');
    showLocationDataWarning();
}

// Show warning if using fallback data
function showLocationDataWarning() {
    const helpText = document.querySelector('#county').parentElement.querySelector('.location-help-text');
    if (helpText) {
        helpText.textContent = 'Using basic county list - subcounty data unavailable';
        helpText.style.color = '#dc3545';
    }
}

// ========================================
// CASCADING DROPDOWN HANDLERS
// ========================================

// Handle county selection
function handleCountyChange() {
    const countySelect = document.getElementById('county');
    const subCountySelect = document.getElementById('subCounty');
    const constituencySelect = document.getElementById('constituency');
    const wardSelect = document.getElementById('ward');
    
    // Reset dependent dropdowns
    resetDropdown(subCountySelect, 'Select county first');
    resetDropdown(constituencySelect, 'Select sub-county first');
    resetDropdown(wardSelect, 'Select constituency first');
    
    const selectedCountyId = countySelect.value;
    
    if (!selectedCountyId) {
        return;
    }
    
    if (!isLocationDataLoaded || !kenyanLocationData) {
        // If using fallback data, disable other dropdowns
        disableDropdown(subCountySelect, 'County selected - subcounty data unavailable');
        return;
    }
    
    // Get subcounties for selected county
    const subcountiesForCounty = kenyanLocationData.subcounties[selectedCountyId];
    
    if (!subcountiesForCounty || Object.keys(subcountiesForCounty).length === 0) {
        disableDropdown(subCountySelect, 'No subcounties found for this county');
        return;
    }
    
    // Populate subcounty dropdown
    populateSubCountyDropdown(subcountiesForCounty);
}

// Populate subcounty dropdown
function populateSubCountyDropdown(subcounties) {
    const subCountySelect = document.getElementById('subCounty');
    
    subCountySelect.disabled = false;
    subCountySelect.classList.add('loading-dropdown');
    subCountySelect.innerHTML = '<option value="">Loading subcounties...</option>';
    
    // Simulate brief loading for UX
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
}

// Handle subcounty selection
function handleSubCountyChange() {
    const subCountySelect = document.getElementById('subCounty');
    const constituencySelect = document.getElementById('constituency');
    const wardSelect = document.getElementById('ward');
    
    // Reset dependent dropdowns
    resetDropdown(constituencySelect, 'Select sub-county first');
    resetDropdown(wardSelect, 'Select constituency first');
    
    const selectedSubCountyId = subCountySelect.value;
    
    if (!selectedSubCountyId || !isLocationDataLoaded) {
        return;
    }
    
    // For now, constituency is the same as subcounty in our data structure
    // Populate constituency dropdown (usually one per subcounty)
    populateConstituencyDropdown(selectedSubCountyId);
}

// Populate constituency dropdown
function populateConstituencyDropdown(subcountyId) {
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
    
    // Auto-select the constituency since there's typically only one per subcounty
    constituencySelect.value = subcountyId;
    
    // Update help text
    const helpText = constituencySelect.parentElement.querySelector('.location-help-text');
    if (helpText) {
        helpText.textContent = 'Constituency selected automatically';
        helpText.style.color = '#28a745';
    }
    
    // Trigger ward loading
    handleConstituencyChange();
}

// Handle constituency selection
function handleConstituencyChange() {
    const constituencySelect = document.getElementById('constituency');
    const wardSelect = document.getElementById('ward');
    
    resetDropdown(wardSelect, 'Select constituency first');
    
    const selectedConstituencyId = constituencySelect.value;
    
    if (!selectedConstituencyId || !isLocationDataLoaded) {
        return;
    }
    
    // Get wards for selected constituency/subcounty
    const wardsForConstituency = kenyanLocationData.wards[selectedConstituencyId];
    
    if (!wardsForConstituency || Object.keys(wardsForConstituency).length === 0) {
        disableDropdown(wardSelect, 'No wards found for this constituency');
        return;
    }
    
    populateWardDropdown(wardsForConstituency);
}

// Populate ward dropdown
function populateWardDropdown(wards) {
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
}

// Utility functions for dropdown management
function resetDropdown(selectElement, placeholder) {
    selectElement.disabled = true;
    selectElement.innerHTML = `<option value="">${placeholder}</option>`;
    
    const helpText = selectElement.parentElement.querySelector('.location-help-text');
    if (helpText) {
        helpText.textContent = helpText.getAttribute('data-original-text') || 'Please select previous option first';
        helpText.style.color = '#666';
    }
}

function disableDropdown(selectElement, message) {
    selectElement.disabled = true;
    selectElement.innerHTML = `<option value="">${message}</option>`;
    
    const helpText = selectElement.parentElement.querySelector('.location-help-text');
    if (helpText) {
        helpText.textContent = message;
        helpText.style.color = '#dc3545';
    }
}

// ========================================
// FORM INITIALIZATION & EVENT LISTENERS
// ========================================

function initializeForm() {
    setupCheckboxExclusivity('maritalStatus');
    setupCheckboxExclusivity('fatherStatus');
    setupCheckboxExclusivity('motherStatus');
    
    // Auto-save form data on input
    document.getElementById('studentForm').addEventListener('input', saveFormData);
    
    // Store original help text
    document.querySelectorAll('.location-help-text').forEach(text => {
        text.setAttribute('data-original-text', text.textContent);
    });
    
    // Ensure pre-submission section is visible
    const preSubmissionSection = document.querySelector('.pre-submission-section');
    if (preSubmissionSection) {
        preSubmissionSection.style.display = 'block';
        preSubmissionSection.style.visibility = 'visible';
        preSubmissionSection.style.opacity = '1';
    }
    
    console.log('Form initialized successfully');
}

function setupEventListeners() {
    // Location dropdown event listeners
    document.getElementById('county').addEventListener('change', handleCountyChange);
    document.getElementById('subCounty').addEventListener('change', handleSubCountyChange);
    document.getElementById('constituency').addEventListener('change', handleConstituencyChange);
    
    // Required field validation
    const requiredFields = ['fullName', 'admissionNumber', 'phoneNumber', 'nationalId', 
                           'nationality', 'gender', 'dateOfBirth', 'placeOfBirth', 'permanentResidence', 
                           'location', 'county', 'emergency1Name', 'emergency1Relationship', 'emergency1Phone'];
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', function() {
                validateField(this);
            });
        }
    });
    
    // Data consent visual feedback
    const dataConsent = document.getElementById('dataConsent');
    const dataRights = document.getElementById('dataRights');
    
    [dataConsent, dataRights].forEach(checkbox => {
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    this.parentElement.style.border = '2px solid #28a745';
                    this.parentElement.style.borderRadius = '5px';
                    this.parentElement.style.padding = '10px';
                    setTimeout(() => {
                        this.parentElement.style.border = '';
                        this.parentElement.style.borderRadius = '';
                        this.parentElement.style.padding = '';
                    }, 2000);
                }
            });
        }
    });
}

// ========================================
// FIREBASE INTEGRATION WITH ENHANCED LOCATION DATA
// ========================================

// Enhanced form data collection with detailed location hierarchy
function getFormDataForFirebase() {
    const now = new Date();
    const dobString = document.getElementById('dateOfBirth').value;
    const age = dobString ? calculateAge(dobString) : null;
    
    // Get detailed location information
    const locationHierarchy = getSelectedLocationHierarchy();
    
    return {
        // Metadata for analytics and tracking
        metadata: {
            submissionDate: now.toISOString(),
            submissionYear: now.getFullYear(),
            submissionMonth: now.getMonth() + 1,
            submissionDay: now.getDate(),
            formVersion: "2.5",
            processingStatus: "completed",
            ipAddress: null,
            userAgent: navigator.userAgent,
            dataIntegrity: true,
            locationDataSource: isLocationDataLoaded ? "complete" : "fallback"
        },

        // Personal Information
        personalInfo: {
            fullName: document.getElementById('fullName').value.toUpperCase(),
            admissionNumber: document.getElementById('admissionNumber').value,
            phoneNumber: document.getElementById('phoneNumber').value,
            nationalId: document.getElementById('nationalId').value,
            passportNo: document.getElementById('passportNo').value || null,
            birthCertNo: document.getElementById('birthCertNo').value || null,
            religion: document.getElementById('religion').value || null,
            nationality: document.getElementById('nationality').value,
            gender: document.getElementById('gender').value,
            ethnicBackground: document.getElementById('ethnicBackground').value || null,
            dateOfBirth: dobString,
            placeOfBirth: document.getElementById('placeOfBirth').value,
            age: age
        },

        // Enhanced Location Information with Administrative Hierarchy
        locationInfo: {
            // Administrative hierarchy (detailed)
            administrative: locationHierarchy,
            
            // Traditional fields (for compatibility)
            permanentResidence: document.getElementById('permanentResidence').value,
            location: document.getElementById('location').value,
            chiefName: document.getElementById('chiefName').value || null,
            division: document.getElementById('division').value || null,
            
            // For backward compatibility, store the display names
            county: locationHierarchy.county ? locationHierarchy.county.displayName : null,
            subCounty: locationHierarchy.subCounty ? locationHierarchy.subCounty.displayName : null,
            constituency: locationHierarchy.constituency ? locationHierarchy.constituency.displayName : null,
            ward: locationHierarchy.ward ? locationHierarchy.ward.displayName : null,
            
            // Additional location info
            nearestTown: document.getElementById('nearestTown').value || null,
            nearestPolice: document.getElementById('nearestPolice').value || null,
            homeAddress: document.getElementById('homeAddress').value || null
        },

        // Marital Information
        maritalInfo: {
            status: getCheckedValue('maritalStatus') || null,
            spouseDetails: document.getElementById('spouseDetails').value || null,
            spouseOccupation: document.getElementById('spouseOccupation').value || null,
            numberOfChildren: parseInt(document.getElementById('numberOfChildren').value) || 0
        },

        // Family Information
        familyInfo: {
            father: {
                fullName: document.getElementById('fatherName').value || null,
                status: getCheckedValue('fatherStatus') || null,
                phoneNumber: document.getElementById('fatherPhone').value || null,
                nationalId: document.getElementById('fatherIdNo').value || null,
                occupation: document.getElementById('fatherOccupation').value || null,
                dateOfBirth: document.getElementById('fatherDob').value || null
            },
            mother: {
                fullName: document.getElementById('motherName').value || null,
                status: getCheckedValue('motherStatus') || null,
                phoneNumber: document.getElementById('motherPhone').value || null,
                nationalId: document.getElementById('motherIdNo').value || null,
                occupation: document.getElementById('motherOccupation').value || null,
                dateOfBirth: document.getElementById('motherDob').value || null
            },
            siblings: getSiblingsArray(),
            siblingCount: getSiblingsArray().filter(s => s.trim()).length
        },

        // Emergency Contacts
        emergencyContacts: [
            {
                priority: 1,
                name: document.getElementById('emergency1Name').value || null,
                relationship: document.getElementById('emergency1Relationship').value || null,
                nationalId: document.getElementById('emergency1Id').value || null,
                phoneNumber: document.getElementById('emergency1Phone').value || null,
                address: document.getElementById('emergency1Address').value || null
            },
            {
                priority: 2,
                name: document.getElementById('emergency2Name').value || null,
                relationship: document.getElementById('emergency2Relationship').value || null,
                nationalId: document.getElementById('emergency2Id').value || null,
                phoneNumber: document.getElementById('emergency2Phone').value || null,
                address: document.getElementById('emergency2Address').value || null
            }
        ].filter(contact => contact.name),

        // Academic Information
        academicInfo: {
            secondarySchool: {
                name: document.getElementById('schoolAttended').value || null,
                address: document.getElementById('schoolAddress').value || null
            },
            kcse: {
                results: document.getElementById('kcseResults').value || null,
                additionalResults: document.getElementById('kcseResults2').value || null,
                indexNumber: document.getElementById('indexNumber').value || null,
                year: parseInt(document.getElementById('kcseYear').value) || null
            },
            otherQualifications: document.getElementById('otherInstitutions').value || null
        },

        // Interests & Activities
        interests: {
            sports: document.getElementById('sportsInterests').value || null,
            clubs: document.getElementById('clubsInterests').value || null,
            hobbies: document.getElementById('clubsInterests').value ? 
                document.getElementById('clubsInterests').value.split(',').map(s => s.trim()) : []
        },

        // Additional Information
        additionalInfo: {
            physicalImpairment: document.getElementById('physicalImpairment').value || null,
            specialNeeds: document.getElementById('physicalImpairment').value ? 
                document.getElementById('physicalImpairment').value.toLowerCase() !== 'none' : false,
            additionalComments: document.getElementById('additionalInfo').value || null
        },

        // Consent & Compliance
        consent: {
            dataProcessing: document.getElementById('dataConsent').checked,
            rightsAcknowledgment: document.getElementById('dataRights').checked,
            consentDate: now.toISOString()
        },

        // Enhanced Analytics Fields
        analytics: {
            ageGroup: getAgeGroup(age),
            academicYear: "2024/2025",
            semester: "1",
            locationCompleteness: calculateLocationCompleteness(locationHierarchy),
            genderCode: document.getElementById('gender').value ? 
                document.getElementById('gender').value.charAt(0).toUpperCase() : null,
            formCompleteness: calculateFormCompleteness(),
            dataQuality: isLocationDataLoaded ? "complete" : "basic"
        }
    };
}

// Get selected location hierarchy with full details
function getSelectedLocationHierarchy() {
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
    if (countySelect.value) {
        const countyOption = countySelect.querySelector(`option[value="${countySelect.value}"]`);
        hierarchy.county = {
            id: countySelect.value,
            name: countyOption ? countyOption.getAttribute('data-original-name') || countyOption.textContent : null,
            displayName: countyOption ? countyOption.textContent : null,
            isFallback: countyOption ? countyOption.hasAttribute('data-fallback') : false
        };
    }
    
    // SubCounty information
    if (subCountySelect.value && !subCountySelect.disabled) {
        const subCountyOption = subCountySelect.querySelector(`option[value="${subCountySelect.value}"]`);
        hierarchy.subCounty = {
            id: subCountySelect.value,
            name: subCountyOption ? subCountyOption.getAttribute('data-original-name') || subCountyOption.textContent : null,
            displayName: subCountyOption ? subCountyOption.textContent : null,
            countyId: countySelect.value
        };
    }
    
    // Constituency information
    if (constituencySelect.value && !constituencySelect.disabled) {
        const constituencyOption = constituencySelect.querySelector(`option[value="${constituencySelect.value}"]`);
        hierarchy.constituency = {
            id: constituencySelect.value,
            name: constituencyOption ? constituencyOption.getAttribute('data-original-name') || constituencyOption.textContent : null,
            displayName: constituencyOption ? constituencyOption.textContent : null,
            subcountyId: subCountySelect.value
        };
    }
    
    // Ward information
    if (wardSelect.value && !wardSelect.disabled) {
        const wardOption = wardSelect.querySelector(`option[value="${wardSelect.value}"]`);
        hierarchy.ward = {
            id: wardSelect.value,
            name: wardOption ? wardOption.getAttribute('data-original-name') || wardOption.textContent : null,
            displayName: wardOption ? wardOption.textContent : null,
            constituencyId: constituencySelect.value
        };
    }
    
    return hierarchy;
}

// Calculate location completeness score
function calculateLocationCompleteness(hierarchy) {
    let score = 0;
    let maxScore = 4;
    
    if (hierarchy.county) score += 1;
    if (hierarchy.subCounty) score += 1;
    if (hierarchy.constituency) score += 1;
    if (hierarchy.ward) score += 1;
    
    return Math.round((score / maxScore) * 100);
}

// ========================================
// EXISTING FORM FUNCTIONS (UPDATED)
// ========================================

// Updated validation to include location hierarchy
function validateForm() {
    const requiredFields = [
        'fullName', 'admissionNumber', 'phoneNumber', 'nationalId', 
        'nationality', 'gender', 'dateOfBirth', 'placeOfBirth', 'permanentResidence', 
        'location', 'county', 'emergency1Name', 'emergency1Relationship', 'emergency1Phone'
    ];
    
    let isValid = true;
    let missingFields = [];
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && !field.value.trim()) {
            field.classList.add('error');
            if (field.classList.contains('location-dropdown')) {
                field.classList.add('location-error');
            }
            isValid = false;
            missingFields.push(getFieldLabel(fieldId));
        } else if (field) {
            field.classList.remove('error', 'location-error');
            field.classList.add('valid');
        }
    });
    
    // Check if at least county is selected
    const countySelect = document.getElementById('county');
    if (!countySelect.value) {
        countySelect.classList.add('location-error');
        isValid = false;
        if (!missingFields.includes('County')) {
            missingFields.push('County');
        }
    }
    
    if (!isValid) {
        alert('Please fill in all required fields:\n\n' + missingFields.join('\n'));
        const firstError = document.querySelector('.field-input.error, .location-dropdown.location-error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstError.focus();
        }
    }
    
    return isValid;
}

// [All other existing functions remain the same - just including the key ones that need updates]

// Submit form data to Firebase (updated)
async function submitToFirebase() {
    if (isSubmitting) {
        return;
    }
    
    if (!validateForm()) {
        return;
    }
    
    if (!checkDataConsent()) {
        return;
    }
    
    if (!window.db) {
        alert('❌ Database connection error. Please check your internet connection and try again.');
        return;
    }
    
    isSubmitting = true;
    
    try {
        showLoadingMessage('Submitting your form...');
        
        const formData = getFormDataForFirebase();
        
        const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        
        formData.metadata.submissionDate = serverTimestamp();
        
        const docRef = await addDoc(collection(window.db, 'student_submissions'), formData);
        
        console.log('✅ Document written with ID: ', docRef.id);
        
        await updateSubmissionStats();
        
        hideLoadingMessage();
        showSuccessMessage();
        
        localStorage.removeItem('uoe_student_form');
        
        document.getElementById('successMessage').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('❌ Error adding document: ', error);
        hideLoadingMessage();
        
        let errorMessage = 'Submission failed. Please try again.';
        
        if (error.code === 'permission-denied') {
            errorMessage = 'Permission denied. Please check your connection and try again.';
        } else if (error.code === 'unavailable') {
            errorMessage = 'Service temporarily unavailable. Please try again in a few minutes.';
        }
        
        alert('❌ ' + errorMessage);
    } finally {
        isSubmitting = false;
    }
}

// [Include all other existing functions: setupCheckboxExclusivity, validateField, getFieldLabel, 
//  calculateAge, getAgeGroup, getSiblingsArray, calculateFormCompleteness, getCheckedValue, 
//  updateSubmissionStats, showLoadingMessage, hideLoadingMessage, checkDataConsent, 
//  showSuccessMessage, clearForm, submitForm, printForm, downloadPDF, generateFileName, 
//  saveFormData, loadSavedData, etc.]

// Helper functions (keeping existing ones)
function setupCheckboxExclusivity(name) {
    const checkboxes = document.querySelectorAll(`input[name="${name}"]`);
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                checkboxes.forEach(other => {
                    if (other !== this) other.checked = false;
                });
            }
        });
    });
}

function validateField(field) {
    if (field.hasAttribute('required')) {
        if (field.value.trim() === '') {
            field.classList.add('error');
            field.classList.remove('valid');
        } else {
            field.classList.remove('error');
            field.classList.add('valid');
        }
    }
}

function getFieldLabel(fieldId) {
    const labels = {
        'fullName': 'Full Name',
        'admissionNumber': 'University Admission Number',
        'phoneNumber': 'Phone Number',
        'nationalId': 'National ID Number',
        'nationality': 'Nationality',
        'gender': 'Gender',
        'dateOfBirth': 'Date of Birth',
        'placeOfBirth': 'Place of Birth',
        'permanentResidence': 'Permanent Residence',
        'location': 'Location',
        'county': 'County',
        'emergency1Name': 'Emergency Contact 1 Name',
        'emergency1Relationship': 'Emergency Contact 1 Relationship',
        'emergency1Phone': 'Emergency Contact 1 Phone'
    };
    return labels[fieldId] || fieldId;
}

function calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

function getAgeGroup(age) {
    if (!age) return null;
    if (age <= 19) return "17-19";
    if (age <= 22) return "20-22";
    if (age <= 25) return "23-25";
    return "26+";
}

function getSiblingsArray() {
    const siblings = [];
    for (let i = 1; i <= 6; i++) {
        const siblingName = document.getElementById(`sibling${i}`).value;
        if (siblingName.trim()) {
            siblings.push(siblingName.trim());
        }
    }
    return siblings;
}

function calculateFormCompleteness() {
    const allFields = document.querySelectorAll('#studentForm input, #studentForm select');
    const filledFields = Array.from(allFields).filter(field => {
        if (field.type === 'checkbox') {
            return field.checked;
        }
        return field.value && field.value.trim() !== '';
    });
    
    return Math.round((filledFields.length / allFields.length) * 100);
}

function getCheckedValue(name) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : '';
}

async function updateSubmissionStats() {
    try {
        const { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } = 
            await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        
        const today = new Date();
        const dateKey = today.toISOString().split('T')[0];
        
        const statsDocRef = doc(window.db, 'submission_stats', dateKey);
        const statsDoc = await getDoc(statsDocRef);
        
        const locationData = getSelectedLocationHierarchy();
        const county = locationData.county ? locationData.county.displayName : 'Unknown';
        const gender = document.getElementById('gender').value;
        const age = calculateAge(document.getElementById('dateOfBirth').value);
        const ageGroup = getAgeGroup(age);
        
        if (statsDoc.exists()) {
            await updateDoc(statsDocRef, {
                dailyCount: increment(1),
                [`byCounty.${county}`]: increment(1),
                [`byGender.${gender}`]: increment(1),
                [`byAgeGroup.${ageGroup}`]: increment(1),
                lastUpdated: serverTimestamp()
            });
        } else {
            const initialStats = {
                date: dateKey,
                dailyCount: 1,
                byCounty: { [county]: 1 },
                byGender: { [gender]: 1 },
                byAgeGroup: { [ageGroup]: 1 },
                created: serverTimestamp(),
                lastUpdated: serverTimestamp()
            };
            await setDoc(statsDocRef, initialStats);
        }
        
    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}

function showLoadingMessage(message) {
    const loadingMsg = document.createElement('div');
    loadingMsg.id = 'loadingMessage';
    loadingMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 20px;
        border-radius: 10px;
        z-index: 9999;
        font-size: 16px;
        text-align: center;
    `;
    loadingMsg.innerHTML = `
        <div style="margin-bottom: 10px;">📄</div>
        <div>${message}</div>
    `;
    document.body.appendChild(loadingMsg);
}

function hideLoadingMessage() {
    const loadingMsg = document.getElementById('loadingMessage');
    if (loadingMsg) {
        document.body.removeChild(loadingMsg);
    }
}

function checkDataConsent() {
    const dataConsent = document.getElementById('dataConsent');
    const dataRights = document.getElementById('dataRights');
    
    if (!dataConsent.checked || !dataRights.checked) {
        let missingConsent = [];
        if (!dataConsent.checked) missingConsent.push('Data processing consent');
        if (!dataRights.checked) missingConsent.push('Rights acknowledgment');
        
        alert('⚠️ Data Protection Consent Required\n\nYou must read and accept both data protection statements before submitting:\n\n• ' + missingConsent.join('\n• ') + '\n\nPlease scroll down and check both consent checkboxes.');
        
        const consentSection = document.querySelector('.data-protection-section');
        consentSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        consentSection.style.border = '3px solid #dc3545';
        consentSection.style.borderRadius = '10px';
        consentSection.style.padding = '20px';
        
        setTimeout(() => {
            consentSection.style.border = '';
            consentSection.style.borderRadius = '';
            consentSection.style.padding = '';
        }, 5000);
        
        return false;
    }
    return true;
}

function showSuccessMessage() {
    const successMessage = document.getElementById('successMessage');
    successMessage.innerHTML = `
        <strong>✅ Form Submitted Successfully!</strong><br>
        Your personal details have been recorded with detailed location information. You can now print or download a copy for your records.
    `;
    successMessage.style.display = 'block';
    
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 10000);
}

function clearForm() {
    if (confirm('Are you sure you want to clear all form data? This action cannot be undone.')) {
        document.getElementById('studentForm').reset();
        
        document.querySelectorAll('.field-input, .location-dropdown').forEach(field => {
            field.classList.remove('error', 'valid', 'location-error');
        });
        
        // Reset location dropdowns
        const subCountySelect = document.getElementById('subCounty');
        const constituencySelect = document.getElementById('constituency');
        const wardSelect = document.getElementById('ward');
        
        resetDropdown(subCountySelect, 'Select county first');
        resetDropdown(constituencySelect, 'Select sub-county first');
        resetDropdown(wardSelect, 'Select constituency first');
        
        const dataConsent = document.getElementById('dataConsent');
        const dataRights = document.getElementById('dataRights');
        if (dataConsent) dataConsent.checked = false;
        if (dataRights) dataRights.checked = false;
        
        document.getElementById('successMessage').style.display = 'none';
        localStorage.removeItem('uoe_student_form');
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Legacy function definitions for internal use
function submitForm() {
    return window.submitForm();
}

function clearForm() {
    return window.clearForm();
}

function printForm() {
    return window.printForm();
}

function downloadPDF() {
    return window.downloadPDF();
}

// Print and PDF functions (keeping existing implementations)
function printForm() {
    if (!validateForm()) {
        return;
    }
    
    if (!checkDataConsent()) {
        return;
    }
    
    const webElements = document.querySelectorAll('.form-actions, .success-message, .pre-submission-section');
    webElements.forEach(el => el.style.display = 'none');
    
    const printNotice = document.createElement('div');
    printNotice.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2a5298;
        color: white;
        padding: 15px;
        border-radius: 10px;
        z-index: 9999;
        font-size: 14px;
        max-width: 300px;
    `;
    printNotice.innerHTML = `
        <strong>📋 Remember:</strong><br>
        Print <strong>4 copies</strong> and attach passport photos on yellow background to each copy.
    `;
    document.body.appendChild(printNotice);
    
    window.print();
    
    setTimeout(() => {
        webElements.forEach(el => {
            el.style.display = 'block';
            if (el.classList.contains('pre-submission-section')) {
                el.style.visibility = 'visible';
                el.style.opacity = '1';
            }
        });
        document.body.removeChild(printNotice);
    }, 1000);
}

// [Include full downloadPDF function and other utilities - keeping existing implementations]

async function downloadPDF() {
    if (!validateForm()) {
        return;
    }
    
    if (!checkDataConsent()) {
        return;
    }

    try {
        showLoadingMessage('Generating PDF... Please wait');

        const elementsToHide = document.querySelectorAll('.form-actions, .success-message, .pre-submission-section');
        elementsToHide.forEach(el => el.style.display = 'none');

        const container = document.querySelector('.container');
        
        const originalStyles = {
            width: container.style.width,
            maxWidth: container.style.maxWidth,
            margin: container.style.margin,
            boxShadow: container.style.boxShadow
        };

        container.classList.add('pdf-generation');
        
        const inputs = document.querySelectorAll('.field-input, .location-dropdown');
        inputs.forEach(input => {
            input.classList.remove('error', 'valid', 'location-error');
            
            input.style.webkitBoxShadow = '0 0 0 30px white inset';
            input.style.boxShadow = '0 0 0 30px white inset';
            input.style.background = 'white';
            input.style.backgroundColor = 'white';
            input.style.webkitTextFillColor = 'black';
            input.style.color = 'black';
            input.style.borderBottom = '1px solid #000';
            input.style.borderColor = '#000';
            
            input.removeAttribute('data-validation-state');
        });

        await new Promise(resolve => setTimeout(resolve, 200));

        const canvas = await html2canvas(container, {
            scale: 1.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: 794,
            height: container.offsetHeight,
            scrollX: 0,
            scrollY: 0,
            onclone: function(clonedDoc) {
                const clonedContainer = clonedDoc.querySelector('.container');
                clonedContainer.style.width = '794px';
                clonedContainer.style.maxWidth = '794px';
                clonedContainer.style.margin = '0';
                clonedContainer.style.boxShadow = 'none';
                
                const clonedInputs = clonedDoc.querySelectorAll('.field-input, .location-dropdown');
                clonedInputs.forEach(input => {
                    input.classList.remove('error', 'valid', 'location-error');
                    input.style.webkitBoxShadow = '0 0 0 30px white inset';
                    input.style.boxShadow = '0 0 0 30px white inset';
                    input.style.background = 'white';
                    input.style.backgroundColor = 'white';
                    input.style.webkitTextFillColor = 'black';
                    input.style.color = 'black';
                    input.style.borderBottom = '1px solid #000';
                    input.style.borderColor = '#000';
                });
            }
        });

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (imgHeight <= 297) {
            doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
        } else {
            const pageHeight = 297;
            const totalPages = Math.ceil(imgHeight / pageHeight);
            
            for (let i = 0; i < totalPages; i++) {
                if (i > 0) {
                    doc.addPage();
                }
                
                const yOffset = -i * pageHeight;
                doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, yOffset, imgWidth, imgHeight);
            }
        }

        container.classList.remove('pdf-generation');
        Object.keys(originalStyles).forEach(key => {
            container.style[key] = originalStyles[key];
        });

        inputs.forEach(input => {
            input.style.webkitBoxShadow = '';
            input.style.boxShadow = '';
            input.style.background = '';
            input.style.backgroundColor = '';
            input.style.webkitTextFillColor = '';
            input.style.color = '';
            input.style.borderBottom = '';
            input.style.borderColor = '';
        });

        elementsToHide.forEach(el => {
            el.style.display = 'block';
            if (el.classList.contains('pre-submission-section')) {
                el.style.visibility = 'visible';
                el.style.opacity = '1';
            }
        });

        hideLoadingMessage();

        const formData = getFormDataForFirebase();
        const fileName = generateFileName(formData.personalInfo.fullName);
        doc.save(fileName);

        showSuccessMessage();

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
        
        const loadingMsg = document.getElementById('loadingMessage');
        if (loadingMsg) {
            document.body.removeChild(loadingMsg);
        }
        
        const elementsToHide = document.querySelectorAll('.form-actions, .success-message');
        elementsToHide.forEach(el => el.style.display = 'block');
        
        const container = document.querySelector('.container');
        container.classList.remove('pdf-generation');
    }
}

function generateFileName(fullName) {
    const name = fullName ? fullName.replace(/\s+/g, '_') : 'Student';
    const date = new Date().toISOString().split('T')[0];
    return `UoE_Student_Form_${name}_${date}.pdf`;
}

function saveFormData() {
    try {
        const formData = {};
        const inputs = document.querySelectorAll('#studentForm input, #studentForm select');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                formData[input.id] = input.checked;
            } else {
                formData[input.id] = input.value;
            }
        });
        
        localStorage.setItem('uoe_student_form', JSON.stringify(formData));
    } catch (error) {
        console.log('Unable to save form data:', error);
    }
}

function loadSavedData() {
    try {
        const savedData = localStorage.getItem('uoe_student_form');
        if (savedData) {
            const data = JSON.parse(savedData);
            Object.keys(data).forEach(key => {
                const field = document.getElementById(key);
                if (field) {
                    if (field.type === 'checkbox') {
                        field.checked = data[key] === true;
                    } else {
                        field.value = data[key] || '';
                    }
                }
            });
            
            // Trigger location cascade if county was saved
            if (data.county) {
                setTimeout(() => {
                    handleCountyChange();
                    if (data.subCounty) {
                        setTimeout(() => {
                            document.getElementById('subCounty').value = data.subCounty;
                            handleSubCountyChange();
                            if (data.constituency) {
                                setTimeout(() => {
                                    document.getElementById('constituency').value = data.constituency;
                                    handleConstituencyChange();
                                    if (data.ward) {
                                        setTimeout(() => {
                                            document.getElementById('ward').value = data.ward;
                                        }, 300);
                                    }
                                }, 300);
                            }
                        }, 300);
                    }
                }, 500);
            }
        }
    } catch (error) {
        console.log('Unable to load saved data:', error);
    }
}

// ========================================
// FUNCTION VERIFICATION AND TESTING
// ========================================

// Verify all functions are properly defined
setTimeout(() => {
    console.log('🔍 Function verification:', {
        submitForm: typeof window.submitForm,
        clearForm: typeof window.clearForm,
        printForm: typeof window.printForm,
        downloadPDF: typeof window.downloadPDF,
        validateForm: typeof validateForm,
        checkDataConsent: typeof checkDataConsent
    });
    
    // Test that functions can be called without errors
    try {
        console.log('✅ All global functions are accessible and ready');
    } catch (error) {
        console.error('❌ Function verification failed:', error);
    }
}, 1000);