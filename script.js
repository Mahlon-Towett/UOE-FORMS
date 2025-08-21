// script.js - Fixed Original Working Version
// University of Eldoret Student Form - Main Script

// ========================================
// GLOBAL STATE VARIABLES
// ========================================

let isSubmitting = false;
let isLocationDataLoaded = false;
let locationData = null;

// ========================================
// FIREBASE SUBMISSION FUNCTIONS
// ========================================

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

// ========================================
// FIXED getFormDataForFirebase FUNCTION
// ========================================

function getFormDataForFirebase() {
    const now = new Date();
    
    // Safe field access function
    const getFieldValue = (fieldId) => {
        const element = document.getElementById(fieldId);
        return element ? element.value.trim() : '';
    };
    
    const getSelectValue = (fieldId) => {
        const element = document.getElementById(fieldId);
        return element ? element.value : '';
    };
    
    const getCheckedValue = (name) => {
        const checked = document.querySelector(`input[name="${name}"]:checked`);
        return checked ? checked.value : '';
    };
    
    // Get date of birth safely
    const dobString = getFieldValue('dateOfBirth');
    const age = dobString ? calculateAge(dobString) : null;
    
    // Get location hierarchy safely
    const locationHierarchy = typeof getSelectedLocationHierarchy === 'function' ? 
        getSelectedLocationHierarchy() : {};
    
    // Get siblings array safely
    const getSiblingsArray = () => {
        const siblings = [];
        for (let i = 1; i <= 6; i++) {
            const siblingName = getFieldValue(`sibling${i}`);
            if (siblingName) {
                siblings.push(siblingName);
            }
        }
        return siblings;
    };
    
    const getAgeGroup = (age) => {
        if (!age) return null;
        if (age <= 19) return "17-19";
        if (age <= 22) return "20-22";
        if (age <= 25) return "23-25";
        return "26+";
    };
    
    const calculateFormCompleteness = () => {
        const allFields = document.querySelectorAll('#studentForm input, #studentForm select');
        const filledFields = Array.from(allFields).filter(field => {
            if (field.type === 'checkbox') {
                return field.checked;
            }
            return field.value && field.value.trim() !== '';
        });
        
        return Math.round((filledFields.length / allFields.length) * 100);
    };

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
            fullName: getFieldValue('fullName').toUpperCase(),
            admissionNumber: getFieldValue('admissionNumber'),
            phoneNumber: getFieldValue('phoneNumber'),
            nationalId: getFieldValue('nationalId'),
            passportNo: getFieldValue('passportNo') || null,
            birthCertNo: getFieldValue('birthCertNo') || null,
            religion: getFieldValue('religion') || null,
            nationality: getFieldValue('nationality'),
            gender: getSelectValue('gender'),
            ethnicBackground: getFieldValue('ethnicBackground') || null,
            dateOfBirth: dobString,
            placeOfBirth: getFieldValue('placeOfBirth'),
            age: age
        },

        // Enhanced Location Information
        locationInfo: {
            // Administrative hierarchy (detailed)
            administrative: locationHierarchy,
            
            // Traditional fields (for compatibility)
            permanentResidence: getFieldValue('permanentResidence'),
            location: getFieldValue('location'),
            chiefName: getFieldValue('chiefName') || null,
            division: getFieldValue('division') || null,
            
            // For backward compatibility, store the display names
            county: locationHierarchy.county ? locationHierarchy.county.displayName : getSelectValue('county'),
            subCounty: locationHierarchy.subCounty ? locationHierarchy.subCounty.displayName : getSelectValue('subCounty'),
            constituency: locationHierarchy.constituency ? locationHierarchy.constituency.displayName : getSelectValue('constituency'),
            ward: locationHierarchy.ward ? locationHierarchy.ward.displayName : getSelectValue('ward'),
            
            // FIXED: Added the missing fields that are now in HTML
            nearestTown: getFieldValue('nearestTown') || null,
            nearestPolice: getFieldValue('nearestPolice') || null
        },

        // Marital Information
        maritalInfo: {
            status: getCheckedValue('maritalStatus') || null,
            spouseDetails: getFieldValue('spouseDetails') || null,
            spouseOccupation: getFieldValue('spouseOccupation') || null,
            numberOfChildren: parseInt(getFieldValue('numberOfChildren')) || 0
        },

        // Family Information
        familyInfo: {
            father: {
                fullName: getFieldValue('fatherName') || null,
                status: getCheckedValue('fatherStatus') || null,
                phoneNumber: getFieldValue('fatherPhone') || null,
                nationalId: getFieldValue('fatherIdNo') || null,
                occupation: getFieldValue('fatherOccupation') || null,
                dateOfBirth: getFieldValue('fatherDob') || null
            },
            mother: {
                fullName: getFieldValue('motherName') || null,
                status: getCheckedValue('motherStatus') || null,
                phoneNumber: getFieldValue('motherPhone') || null,
                nationalId: getFieldValue('motherIdNo') || null,
                occupation: getFieldValue('motherOccupation') || null,
                dateOfBirth: getFieldValue('motherDob') || null
            },
            siblings: getSiblingsArray(),
            siblingCount: getSiblingsArray().filter(s => s.trim()).length
        },

        // Emergency Contacts
        emergencyContacts: [
            {
                priority: 1,
                name: getFieldValue('emergency1Name') || null,
                relationship: getFieldValue('emergency1Relationship') || null,
                nationalId: getFieldValue('emergency1Id') || null,
                phoneNumber: getFieldValue('emergency1Phone') || null,
                address: getFieldValue('emergency1Address') || null
            },
            {
                priority: 2,
                name: getFieldValue('emergency2Name') || null,
                relationship: getFieldValue('emergency2Relationship') || null,
                nationalId: getFieldValue('emergency2Id') || null,
                phoneNumber: getFieldValue('emergency2Phone') || null,
                address: getFieldValue('emergency2Address') || null
            }
        ].filter(contact => contact.name),

        // Academic Information
        academicInfo: {
            secondarySchool: {
                name: getFieldValue('schoolAttended') || null,
                address: getFieldValue('schoolAddress') || null
            },
            kcse: {
                results: getFieldValue('kcseResults') || null,
                additionalResults: getFieldValue('kcseResults2') || null,
                indexNumber: getFieldValue('indexNumber') || null,
                year: parseInt(getFieldValue('kcseYear')) || null
            },
            otherQualifications: getFieldValue('otherInstitutions') || null
        },

        // Interests & Activities
        interests: {
            sports: getFieldValue('sportsInterests') || null,
            clubs: getFieldValue('clubsInterests') || null,
            hobbies: getFieldValue('clubsInterests') ? 
                getFieldValue('clubsInterests').split(',').map(s => s.trim()) : []
        },

        // Additional Information
        additionalInfo: {
            physicalImpairment: getFieldValue('physicalImpairment') || null,
            specialNeeds: getFieldValue('physicalImpairment') ? 
                getFieldValue('physicalImpairment').toLowerCase() !== 'none' : false,
            additionalComments: getFieldValue('additionalInfo') || null
        },

        // Consent & Compliance
        consent: {
            dataProcessing: document.getElementById('dataConsent') ? document.getElementById('dataConsent').checked : false,
            rightsAcknowledgment: document.getElementById('dataRights') ? document.getElementById('dataRights').checked : false,
            consentDate: now.toISOString()
        },

        // Enhanced Analytics Fields
        analytics: {
            ageGroup: getAgeGroup(age),
            academicYear: "2024/2025",
            semester: "1",
            locationCompleteness: typeof calculateLocationCompleteness === 'function' ? 
                calculateLocationCompleteness(locationHierarchy) : 0,
            genderCode: getSelectValue('gender') ? 
                getSelectValue('gender').charAt(0).toUpperCase() : null,
            formCompleteness: calculateFormCompleteness(),
            dataQuality: isLocationDataLoaded ? "complete" : "basic"
        }
    };
}

// ========================================
// ORIGINAL WORKING LOCATION FUNCTIONS
// ========================================

async function loadLocationData() {
    try {
        const response = await fetch('./kenyan_locations.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        locationData = await response.json();
        isLocationDataLoaded = true;
        populateCounties();
        console.log('✅ Location data loaded successfully');
    } catch (error) {
        console.error('❌ Error loading location data:', error);
        loadFallbackCounties();
    }
}

function populateCounties() {
    const countySelect = document.getElementById('county');
    if (!countySelect || !locationData) return;
    
    countySelect.innerHTML = '<option value="">Select County</option>';
    
    Object.keys(locationData).sort().forEach(countyName => {
        const option = document.createElement('option');
        option.value = locationData[countyName].id;
        option.textContent = countyName;
        option.setAttribute('data-original-name', countyName);
        countySelect.appendChild(option);
    });
}

function loadFallbackCounties() {
    const countySelect = document.getElementById('county');
    if (!countySelect) return;
    
    const fallbackCounties = [
        "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa", "Homa Bay",
        "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii",
        "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera",
        "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi", "Nakuru", "Nandi",
        "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita-Taveta", "Tana River",
        "Tharaka-Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"
    ];
    
    countySelect.innerHTML = '<option value="">Select County</option>';
    fallbackCounties.forEach((county, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = county;
        option.setAttribute('data-fallback', 'true');
        countySelect.appendChild(option);
    });
    
    console.log('⚠️ Loaded fallback counties');
}

function handleCountyChange() {
    const countySelect = document.getElementById('county');
    const subCountySelect = document.getElementById('subCounty');
    const constituencySelect = document.getElementById('constituency');
    const wardSelect = document.getElementById('ward');
    
    resetDropdown(subCountySelect, 'Select county first');
    resetDropdown(constituencySelect, 'Select sub-county first');
    resetDropdown(wardSelect, 'Select constituency first');
    
    if (!countySelect.value || !locationData) return;
    
    const selectedCountyOption = countySelect.selectedOptions[0];
    const countyName = selectedCountyOption.getAttribute('data-original-name') || selectedCountyOption.textContent;
    
    if (locationData[countyName] && locationData[countyName].subCounties) {
        populateSubCounties(locationData[countyName].subCounties);
    }
}

function populateSubCounties(subCounties) {
    const subCountySelect = document.getElementById('subCounty');
    if (!subCountySelect) return;
    
    subCountySelect.disabled = false;
    subCountySelect.innerHTML = '<option value="">Select Sub County</option>';
    
    Object.keys(subCounties).sort().forEach(subCountyName => {
        const option = document.createElement('option');
        option.value = subCounties[subCountyName].id;
        option.textContent = subCountyName;
        option.setAttribute('data-original-name', subCountyName);
        subCountySelect.appendChild(option);
    });
    
    updateHelpText(subCountySelect, 'Select your sub-county');
}

function handleSubCountyChange() {
    const countySelect = document.getElementById('county');
    const subCountySelect = document.getElementById('subCounty');
    const constituencySelect = document.getElementById('constituency');
    const wardSelect = document.getElementById('ward');
    
    resetDropdown(constituencySelect, 'Select sub-county first');
    resetDropdown(wardSelect, 'Select constituency first');
    
    if (!subCountySelect.value || !locationData) return;
    
    const selectedCountyOption = countySelect.selectedOptions[0];
    const countyName = selectedCountyOption.getAttribute('data-original-name') || selectedCountyOption.textContent;
    
    const selectedSubCountyOption = subCountySelect.selectedOptions[0];
    const subCountyName = selectedSubCountyOption.getAttribute('data-original-name') || selectedSubCountyOption.textContent;
    
    if (locationData[countyName] && 
        locationData[countyName].subCounties[subCountyName] && 
        locationData[countyName].subCounties[subCountyName].constituencies) {
        populateConstituencies(locationData[countyName].subCounties[subCountyName].constituencies);
    }
}

function populateConstituencies(constituencies) {
    const constituencySelect = document.getElementById('constituency');
    if (!constituencySelect) return;
    
    constituencySelect.disabled = false;
    constituencySelect.innerHTML = '<option value="">Select Constituency</option>';
    
    Object.keys(constituencies).sort().forEach(constituencyName => {
        const option = document.createElement('option');
        option.value = constituencies[constituencyName].id;
        option.textContent = constituencyName;
        option.setAttribute('data-original-name', constituencyName);
        constituencySelect.appendChild(option);
    });
    
    updateHelpText(constituencySelect, 'Select your constituency');
}

function handleConstituencyChange() {
    const countySelect = document.getElementById('county');
    const subCountySelect = document.getElementById('subCounty');
    const constituencySelect = document.getElementById('constituency');
    const wardSelect = document.getElementById('ward');
    
    resetDropdown(wardSelect, 'Select constituency first');
    
    if (!constituencySelect.value || !locationData) return;
    
    const selectedCountyOption = countySelect.selectedOptions[0];
    const countyName = selectedCountyOption.getAttribute('data-original-name') || selectedCountyOption.textContent;
    
    const selectedSubCountyOption = subCountySelect.selectedOptions[0];
    const subCountyName = selectedSubCountyOption.getAttribute('data-original-name') || selectedSubCountyOption.textContent;
    
    const selectedConstituencyOption = constituencySelect.selectedOptions[0];
    const constituencyName = selectedConstituencyOption.getAttribute('data-original-name') || selectedConstituencyOption.textContent;
    
    if (locationData[countyName] && 
        locationData[countyName].subCounties[subCountyName] &&
        locationData[countyName].subCounties[subCountyName].constituencies[constituencyName] &&
        locationData[countyName].subCounties[subCountyName].constituencies[constituencyName].wards) {
        populateWards(locationData[countyName].subCounties[subCountyName].constituencies[constituencyName].wards);
    }
}

function populateWards(wards) {
    const wardSelect = document.getElementById('ward');
    if (!wardSelect) return;
    
    wardSelect.disabled = false;
    wardSelect.innerHTML = '<option value="">Select Ward (Optional)</option>';
    
    Object.keys(wards).sort().forEach(wardName => {
        const option = document.createElement('option');
        option.value = wards[wardName].id;
        option.textContent = wardName;
        option.setAttribute('data-original-name', wardName);
        wardSelect.appendChild(option);
    });
    
    updateHelpText(wardSelect, 'Optional: Select your ward');
}

function resetDropdown(selectElement, message) {
    if (!selectElement) return;
    
    selectElement.disabled = true;
    selectElement.innerHTML = `<option value="">${message}</option>`;
    
    const helpText = selectElement.parentElement.querySelector('.location-help-text');
    if (helpText) {
        helpText.textContent = message;
        helpText.style.color = '#dc3545';
    }
}

function updateHelpText(selectElement, message) {
    const helpText = selectElement.parentElement.querySelector('.location-help-text');
    if (helpText) {
        helpText.textContent = message;
        helpText.style.color = '#666';
    }
}

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
}

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
// FORM VALIDATION FUNCTIONS
// ========================================

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
    if (!countySelect || !countySelect.value) {
        if (countySelect) {
            countySelect.classList.add('location-error');
        }
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

function checkDataConsent() {
    const dataConsent = document.getElementById('dataConsent');
    const dataRights = document.getElementById('dataRights');
    
    if (!dataConsent || !dataConsent.checked || !dataRights || !dataRights.checked) {
        alert('❌ Please accept both data protection consent terms before proceeding.');
        
        const consentSection = document.querySelector('.data-protection-section');
        if (consentSection) {
            consentSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            consentSection.style.border = '3px solid #dc3545';
            consentSection.style.borderRadius = '10px';
            consentSection.style.padding = '20px';
            
            setTimeout(() => {
                consentSection.style.border = '';
                consentSection.style.borderRadius = '';
                consentSection.style.padding = '';
            }, 5000);
        }
        
        return false;
    }
    
    return true;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

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

function showLoadingMessage(message) {
    const overlay = document.getElementById('loadingOverlay');
    const text = document.getElementById('loadingText');
    
    if (overlay) {
        overlay.style.display = 'flex';
    }
    
    if (text) {
        text.textContent = message;
    }
}

function hideLoadingMessage() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
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
        
        if (statsDoc.exists()) {
            await updateDoc(statsDocRef, {
                totalSubmissions: increment(1),
                lastSubmission: serverTimestamp(),
                [`counties.${county}`]: increment(1)
            });
        } else {
            await setDoc(statsDocRef, {
                date: dateKey,
                totalSubmissions: 1,
                firstSubmission: serverTimestamp(),
                lastSubmission: serverTimestamp(),
                counties: {
                    [county]: 1
                }
            });
        }
        
        console.log('✅ Submission statistics updated');
    } catch (error) {
        console.warn('⚠️ Could not update submission statistics:', error);
    }
}

function showSuccessMessage() {
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.innerHTML = `
            <h3>✅ Form Submitted Successfully!</h3>
            <p>Your Student Personal Details form has been submitted to the University of Eldoret system.</p>
            <p><strong>Next Steps:</strong></p>
            <ul style="text-align: left; max-width: 500px; margin: 10px auto;">
                <li>Print 4 copies of this form using the Print button</li>
                <li>Attach passport photos (yellow background) to each copy</li>
                <li>Complete the Media Release form separately</li>
                <li>Submit all physical copies to the Registrar Academic office</li>
            </ul>
            <p>Thank you for choosing University of Eldoret!</p>
        `;
        successMessage.style.display = 'block';
        
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 15000);
    }
}

// ========================================
// PRINT AND PDF FUNCTIONS
// ========================================

function printForm() {
    if (!validateForm()) {
        return;
    }
    
    if (!checkDataConsent()) {
        return;
    }
    
    const webElements = document.querySelectorAll(`
        .form-navigation,
        .form-actions, 
        .success-message,
        .important-instructions,
        .data-protection-section
    `);
    
    webElements.forEach(el => {
        if (el) {
            el.style.display = 'none';
        }
    });
    
    const printNotice = document.createElement('div');
    printNotice.id = 'printNotice';
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
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    printNotice.innerHTML = `
        <strong>📋 Remember:</strong><br>
        Print <strong>4 copies</strong> and attach passport photos on yellow background to each copy.
    `;
    document.body.appendChild(printNotice);
    
    window.print();
    
    setTimeout(() => {
        webElements.forEach(el => {
            if (el) {
                el.style.display = '';
            }
        });
        
        const notice = document.getElementById('printNotice');
        if (notice && document.body.contains(notice)) {
            document.body.removeChild(notice);
        }
    }, 1000);
}

async function downloadPDF() {
    if (!validateForm()) {
        return;
    }
    
    if (!checkDataConsent()) {
        return;
    }

    try {
        showLoadingMessage('Generating PDF... Please wait');

        const webElements = document.querySelectorAll(`
            .form-navigation,
            .form-actions, 
            .success-message,
            .important-instructions,
            .data-protection-section
        `);
        
        webElements.forEach(el => {
            if (el) {
                el.style.display = 'none';
            }
        });

        const container = document.querySelector('.container');
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
            input.removeAttribute('data-validation-state');
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = await html2canvas(container, {
            scale: 1.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: 794,
            height: container.scrollHeight * 1.5,
            logging: false
        });

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        const fileName = generateFileName('Student_Personal_Details');
        pdf.save(fileName);

        hideLoadingMessage();
        showPDFSuccessMessage();

    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        hideLoadingMessage();
        alert('❌ Error generating PDF. Please try again or use the Print option.');
    } finally {
        webElements.forEach(el => {
            if (el) {
                el.style.display = '';
            }
        });
        
        const container = document.querySelector('.container');
        if (container) {
            container.classList.remove('pdf-generation');
        }
    }
}

function generateFileName(baseFileName) {
    const fullNameField = document.getElementById('fullName');
    const admissionField = document.getElementById('admissionNumber');
    
    const name = fullNameField && fullNameField.value ? 
        fullNameField.value.replace(/[^a-zA-Z0-9]/g, '_') : 'Student';
    const admission = admissionField && admissionField.value ? 
        admissionField.value.replace(/[^a-zA-Z0-9]/g, '_') : '';
    
    const timestamp = new Date().toISOString().split('T')[0];
    
    return `UoE_${baseFileName}_${name}_${admission}_${timestamp}.pdf`;
}

function showPDFSuccessMessage() {
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.innerHTML = `
            <h3>📄 PDF Generated Successfully!</h3>
            <p>Your Student Personal Details form has been downloaded as a PDF.</p>
            <p><strong>Remember:</strong> Print 4 copies and attach passport photos before submitting to the Registrar Academic office.</p>
        `;
        successMessage.style.display = 'block';
        
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 10000);
    }
}

function clearForm() {
    if (confirm('Are you sure you want to clear all form data? This action cannot be undone.')) {
        const studentForm = document.getElementById('studentForm');
        if (studentForm) {
            studentForm.reset();
        }
        
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
        
        const successMessage = document.getElementById('successMessage');
        if (successMessage) {
            successMessage.style.display = 'none';
        }
        
        localStorage.removeItem('uoe_student_form');
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log('✅ Form cleared');
    }
}

// ========================================
// FORM INITIALIZATION
// ========================================

function initializeForm() {
    setupCheckboxExclusivity('maritalStatus');
    setupCheckboxExclusivity('fatherStatus');
    setupCheckboxExclusivity('motherStatus');
    
    // Setup location dropdown event listeners
    const countySelect = document.getElementById('county');
    const subCountySelect = document.getElementById('subCounty');
    const constituencySelect = document.getElementById('constituency');
    
    if (countySelect) {
        countySelect.addEventListener('change', handleCountyChange);
    }
    
    if (subCountySelect) {
        subCountySelect.addEventListener('change', handleSubCountyChange);
    }
    
    if (constituencySelect) {
        constituencySelect.addEventListener('change', handleConstituencyChange);
    }
    
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
    
    // Load location data
    loadLocationData();
    
    console.log('✅ Form initialized successfully');
}

// ========================================
// AUTO-SAVE FUNCTIONALITY
// ========================================

function saveFormData() {
    const formData = {};
    const form = document.getElementById('studentForm');
    
    if (form) {
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            if (input.id) {
                if (input.type === 'checkbox') {
                    formData[input.id] = input.checked;
                } else {
                    formData[input.id] = input.value;
                }
            }
        });
        
        // Save consent data
        const dataConsent = document.getElementById('dataConsent');
        const dataRights = document.getElementById('dataRights');
        
        if (dataConsent) formData.dataConsent = dataConsent.checked;
        if (dataRights) formData.dataRights = dataRights.checked;
        
        try {
            localStorage.setItem('uoe_student_form', JSON.stringify(formData));
        } catch (error) {
            console.warn('Could not save form data:', error);
        }
    }
}

function loadSavedData() {
    try {
        const savedData = localStorage.getItem('uoe_student_form');
        if (savedData) {
            const formData = JSON.parse(savedData);
            
            Object.keys(formData).forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    if (field.type === 'checkbox') {
                        field.checked = formData[fieldId];
                    } else {
                        field.value = formData[fieldId];
                    }
                }
            });
            
            console.log('✅ Saved form data restored');
        }
    } catch (error) {
        console.warn('Could not load saved form data:', error);
    }
}

// ========================================
// GLOBAL FUNCTION DEFINITIONS
// ========================================

window.submitForm = submitToFirebase;
window.printForm = printForm;
window.downloadPDF = downloadPDF;
window.clearForm = clearForm;
window.validateForm = validateForm;

// ========================================
// INITIALIZATION
// ========================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeForm();
        loadSavedData();
        
        // Auto-save every 30 seconds
        setInterval(saveFormData, 30000);
        
        // Save on page unload
        window.addEventListener('beforeunload', saveFormData);
    });
} else {
    initializeForm();
    loadSavedData();
    
    // Auto-save every 30 seconds
    setInterval(saveFormData, 30000);
    
    // Save on page unload
    window.addEventListener('beforeunload', saveFormData);
}

console.log('✅ Original working script loaded with fixes applied');