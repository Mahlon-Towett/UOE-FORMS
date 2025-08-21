// form-validation.js - Form Validation Logic
// University of Eldoret Student Form - Validation Module

/**
 * Handles all form validation logic including:
 * - Required field validation
 * - Data consent verification
 * - Field-specific validation rules
 * - Visual feedback for validation states
 */

window.UoEForm = window.UoEForm || {};
window.UoEForm.Validator = {
    
    // ========================================
    // FIELD VALIDATION
    // ========================================
    
    validateField(field) {
        if (!field) return false;
        
        if (field.hasAttribute('required')) {
            if (field.value.trim() === '') {
                this.markFieldAsError(field);
                return false;
            } else {
                this.markFieldAsValid(field);
                return true;
            }
        }
        return true;
    },
    
    markFieldAsError(field) {
        field.classList.add('error');
        field.classList.remove('valid');
        
        if (field.classList.contains('location-dropdown')) {
            field.classList.add('location-error');
        }
    },
    
    markFieldAsValid(field) {
        field.classList.remove('error', 'location-error');
        field.classList.add('valid');
    },
    
    clearFieldValidation(field) {
        field.classList.remove('error', 'valid', 'location-error');
    },
    
    // ========================================
    // FORM-WIDE VALIDATION
    // ========================================
    
    validateForm() {
        const config = window.UoEForm.config;
        let isValid = true;
        let missingFields = [];
        
        // Check required fields
        config.requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !field.value.trim()) {
                this.markFieldAsError(field);
                isValid = false;
                missingFields.push(this.getFieldLabel(fieldId));
            } else if (field) {
                this.markFieldAsValid(field);
            }
        });
        
        // Special validation for county (location hierarchy)
        const countySelect = document.getElementById('county');
        if (!countySelect || !countySelect.value) {
            if (countySelect) {
                this.markFieldAsError(countySelect);
            }
            isValid = false;
            if (!missingFields.includes('County')) {
                missingFields.push('County');
            }
        }
        
        // Additional specific validations
        if (!this.validateAge()) {
            isValid = false;
            missingFields.push('Valid Date of Birth');
        }
        
        if (!this.validatePhoneNumbers()) {
            isValid = false;
            missingFields.push('Valid Phone Numbers');
        }
        
        if (!this.validateNationalId()) {
            isValid = false;
            missingFields.push('Valid National ID');
        }
        
        if (!isValid) {
            this.showValidationError(missingFields);
            this.focusFirstError();
        }
        
        return isValid;
    },
    
    // ========================================
    // SPECIFIC FIELD VALIDATIONS
    // ========================================
    
    validateAge() {
        const dobField = document.getElementById('dateOfBirth');
        if (!dobField || !dobField.value) return false;
        
        const dob = new Date(dobField.value);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        
        // Check if age is reasonable (between 15 and 100)
        if (age < 15 || age > 100) {
            this.markFieldAsError(dobField);
            return false;
        }
        
        this.markFieldAsValid(dobField);
        return true;
    },
    
    validatePhoneNumbers() {
        const phoneFields = ['phoneNumber', 'fatherPhone', 'motherPhone', 'emergency1Phone', 'emergency2Phone'];
        let isValid = true;
        
        phoneFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && field.value) {
                // Kenyan phone number validation (basic)
                const phoneRegex = /^(\+254|0)?[7][0-9]{8}$/;
                if (!phoneRegex.test(field.value.replace(/\s/g, ''))) {
                    this.markFieldAsError(field);
                    isValid = false;
                } else {
                    this.markFieldAsValid(field);
                }
            }
        });
        
        return isValid;
    },
    
    validateNationalId() {
        const nationalIdField = document.getElementById('nationalId');
        if (!nationalIdField || !nationalIdField.value) return false;
        
        // Kenyan National ID validation (basic - 8 digits)
        const idRegex = /^\d{8}$/;
        if (!idRegex.test(nationalIdField.value)) {
            this.markFieldAsError(nationalIdField);
            return false;
        }
        
        this.markFieldAsValid(nationalIdField);
        return true;
    },
    
    validateKCSEYear() {
        const kcseYearField = document.getElementById('kcseYear');
        if (!kcseYearField || !kcseYearField.value) return true; // Optional field
        
        const year = parseInt(kcseYearField.value);
        const currentYear = new Date().getFullYear();
        
        if (year < 1990 || year > currentYear + 1) {
            this.markFieldAsError(kcseYearField);
            return false;
        }
        
        this.markFieldAsValid(kcseYearField);
        return true;
    },
    
    // ========================================
    // DATA CONSENT VALIDATION
    // ========================================
    
    checkDataConsent() {
        const dataConsent = document.getElementById('dataConsent');
        const dataRights = document.getElementById('dataRights');
        
        if (!dataConsent || !dataRights) {
            console.error('Data consent checkboxes not found');
            return false;
        }
        
        if (!dataConsent.checked || !dataRights.checked) {
            let missingConsent = [];
            if (!dataConsent.checked) missingConsent.push('Data processing consent');
            if (!dataRights.checked) missingConsent.push('Rights acknowledgment');
            
            this.showConsentError(missingConsent);
            this.highlightConsentSection();
            
            return false;
        }
        
        return true;
    },
    
    // ========================================
    // ERROR DISPLAY AND FEEDBACK
    // ========================================
    
    showValidationError(missingFields) {
        const message = 'Please fill in all required fields:\n\n• ' + missingFields.join('\n• ');
        alert('⚠️ Form Validation Error\n\n' + message);
    },
    
    showConsentError(missingConsent) {
        const message = '⚠️ Data Protection Consent Required\n\n' +
            'You must read and accept both data protection statements before submitting:\n\n' +
            '• ' + missingConsent.join('\n• ') + '\n\n' +
            'Please scroll down and check both consent checkboxes.';
        alert(message);
    },
    
    highlightConsentSection() {
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
    },
    
    focusFirstError() {
        const firstError = document.querySelector('.field-input.error, .location-dropdown.location-error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstError.focus();
        }
    },
    
    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    
    getFieldLabel(fieldId) {
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
    },
    
    calculateAge(dateOfBirth) {
        if (!dateOfBirth) return null;
        
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    },
    
    // ========================================
    // EVENT LISTENERS SETUP
    // ========================================
    
    setupFieldValidation() {
        const config = window.UoEForm.config;
        
        // Set up validation for required fields
        config.requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => {
                    this.validateField(field);
                });
                
                field.addEventListener('input', () => {
                    // Clear error state on input
                    if (field.classList.contains('error')) {
                        this.clearFieldValidation(field);
                    }
                });
            }
        });
        
        // Set up specific field validations
        const kcseYearField = document.getElementById('kcseYear');
        if (kcseYearField) {
            kcseYearField.addEventListener('blur', () => {
                this.validateKCSEYear();
            });
        }
        
        // Set up data consent visual feedback
        const dataConsent = document.getElementById('dataConsent');
        const dataRights = document.getElementById('dataRights');
        
        [dataConsent, dataRights].forEach(checkbox => {
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    if (checkbox.checked) {
                        this.showConsentCheckedFeedback(checkbox);
                    }
                });
            }
        });
        
        console.log('✅ Field validation listeners set up');
    },
    
    showConsentCheckedFeedback(checkbox) {
        checkbox.parentElement.style.border = '2px solid #28a745';
        checkbox.parentElement.style.borderRadius = '5px';
        checkbox.parentElement.style.padding = '10px';
        
        setTimeout(() => {
            checkbox.parentElement.style.border = '';
            checkbox.parentElement.style.borderRadius = '';
            checkbox.parentElement.style.padding = '';
        }, 2000);
    },
    
    // ========================================
    // INITIALIZATION
    // ========================================
    
    initialize() {
        console.log('✅ Initializing Form Validator...');
        this.setupFieldValidation();
        console.log('✅ Form Validator initialized');
    }
};

console.log('✅ Form Validation module loaded');