// form-utilities.js - Form Utility Functions (FIXED)
// University of Eldoret Student Form - Utilities Module

/**
 * Handles utility functions for form operations including:
 * - Checkbox exclusivity management
 * - Form clearing and resetting
 * - Auto-save functionality
 * - Data export/import
 */

window.UoEForm = window.UoEForm || {};
window.UoEForm.Utilities = {
    
    // ========================================
    // CHECKBOX MANAGEMENT
    // ========================================
    
    setupCheckboxExclusivity(groupName) {
        const checkboxes = document.querySelectorAll(`input[name="${groupName}"]`);
        
        // Safety check - ensure checkboxes exist
        if (!checkboxes || checkboxes.length === 0) {
            console.warn(`⚠️ No checkboxes found for group: ${groupName}`);
            return;
        }
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    checkboxes.forEach(other => {
                        if (other !== this) {
                            other.checked = false;
                        }
                    });
                }
            });
        });
        
        console.log(`✅ Checkbox exclusivity set up for: ${groupName} (${checkboxes.length} checkboxes)`);
    },
    
    // ========================================
    // FORM MANAGEMENT
    // ========================================
    
    clearForm(formId = 'studentForm') {
        const form = document.getElementById(formId);
        if (!form) {
            console.warn(`⚠️ Form not found: ${formId}`);
            return false;
        }
        
        if (confirm('Are you sure you want to clear all form data? This action cannot be undone.')) {
            form.reset();
            
            // Clear validation styling
            const fields = form.querySelectorAll('.field-input, .location-dropdown, .inline-input');
            fields.forEach(field => {
                field.classList.remove('error', 'valid', 'location-error');
            });
            
            // Reset location dropdowns
            this.resetLocationDropdowns();
            
            // Clear localStorage
            localStorage.removeItem(window.UoEForm.config.localStorageKey);
            localStorage.removeItem('uoe_student_form');
            
            console.log(`✅ Form cleared: ${formId}`);
            return true;
        }
        
        return false;
    },
    
    resetLocationDropdowns() {
        const dropdowns = [
            { id: 'subCounty', message: 'Select county first' },
            { id: 'constituency', message: 'Select sub-county first' },
            { id: 'ward', message: 'Select constituency first' }
        ];
        
        dropdowns.forEach(dropdown => {
            const element = document.getElementById(dropdown.id);
            if (element) {
                element.disabled = true;
                element.innerHTML = `<option value="">${dropdown.message}</option>`;
                
                // Update help text
                const helpText = element.parentElement?.querySelector('.location-help-text');
                if (helpText) {
                    helpText.textContent = dropdown.message;
                    helpText.style.color = '#dc3545';
                }
            }
        });
    },
    
    // ========================================
    // VALIDATION UTILITIES
    // ========================================
    
    validateField(field) {
        if (!field) return false;
        
        if (field.hasAttribute('required')) {
            const isValid = field.value.trim() !== '';
            
            if (isValid) {
                field.classList.remove('error');
                field.classList.add('valid');
            } else {
                field.classList.add('error');
                field.classList.remove('valid');
            }
            
            return isValid;
        }
        
        return true;
    },
    
    validatePhone(phoneNumber) {
        const phoneRegex = window.UoEForm.constants.PHONE_REGEX;
        return phoneRegex.test(phoneNumber);
    },
    
    validateEmail(email) {
        const emailRegex = window.UoEForm.constants.EMAIL_REGEX;
        return emailRegex.test(email);
    },
    
    validateNationalId(nationalId) {
        const idRegex = window.UoEForm.constants.NATIONAL_ID_REGEX;
        return idRegex.test(nationalId);
    },
    
    validateAge(dateOfBirth) {
        if (!dateOfBirth) return false;
        
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        const actualAge = (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) 
            ? age - 1 : age;
        
        return actualAge >= window.UoEForm.constants.MIN_AGE && 
               actualAge <= window.UoEForm.constants.MAX_AGE;
    },
    
    // ========================================
    // DATA MANAGEMENT
    // ========================================
    
    saveFormData(formId = 'studentForm') {
        const form = document.getElementById(formId);
        if (!form) return false;
        
        const formData = {};
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (input.id) {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    formData[input.id] = input.checked;
                } else {
                    formData[input.id] = input.value;
                }
            }
        });
        
        // Add timestamp
        formData._timestamp = new Date().toISOString();
        formData._formId = formId;
        
        try {
            localStorage.setItem(`uoe_form_${formId}`, JSON.stringify(formData));
            console.log(`💾 Form data saved: ${formId}`);
            return true;
        } catch (error) {
            console.warn('Could not save form data:', error);
            return false;
        }
    },
    
    loadFormData(formId = 'studentForm') {
        try {
            const savedData = localStorage.getItem(`uoe_form_${formId}`);
            if (!savedData) return false;
            
            const formData = JSON.parse(savedData);
            const form = document.getElementById(formId);
            
            if (!form) return false;
            
            Object.keys(formData).forEach(fieldId => {
                if (fieldId.startsWith('_')) return; // Skip metadata
                
                const field = document.getElementById(fieldId);
                if (field) {
                    if (field.type === 'checkbox' || field.type === 'radio') {
                        field.checked = formData[fieldId];
                    } else {
                        field.value = formData[fieldId];
                    }
                }
            });
            
            console.log(`📥 Form data loaded: ${formId}`);
            return true;
        } catch (error) {
            console.warn('Could not load form data:', error);
            return false;
        }
    },
    
    exportFormData() {
        const studentData = this.extractFormData('studentForm');
        const mediaData = this.extractFormData('mediaConsentForm');
        
        const exportData = {
            timestamp: new Date().toISOString(),
            version: window.UoEForm.config.formVersion,
            student: studentData,
            media: mediaData
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `uoe_form_export_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        console.log('📤 Form data exported');
    },
    
    extractFormData(formId) {
        const form = document.getElementById(formId);
        if (!form) return {};
        
        const data = {};
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (input.id) {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    data[input.id] = input.checked;
                } else {
                    data[input.id] = input.value;
                }
            }
        });
        
        return data;
    },
    
    // ========================================
    // UI UTILITIES
    // ========================================
    
    showLoading(message = 'Processing...') {
        const overlay = document.getElementById('loadingOverlay');
        const text = document.getElementById('loadingText');
        
        if (overlay) {
            overlay.style.display = 'flex';
        }
        
        if (text) {
            text.textContent = message;
        }
    },
    
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },
    
    showMessage(message, type = 'info', duration = 5000) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: bold;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        
        const colors = {
            success: { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
            error: { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' },
            warning: { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' },
            info: { bg: '#d1ecf1', color: '#0c5460', border: '#b8e6f1' }
        };
        
        const style = colors[type] || colors.info;
        messageDiv.style.backgroundColor = style.bg;
        messageDiv.style.color = style.color;
        messageDiv.style.border = `1px solid ${style.border}`;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (document.body.contains(messageDiv)) {
                document.body.removeChild(messageDiv);
            }
        }, duration);
    },
    
    scrollToElement(elementId, behavior = 'smooth') {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior, block: 'center' });
            return true;
        }
        return false;
    },
    
    // ========================================
    // PRINT UTILITIES
    // ========================================
    
    generateFileName(baseName, studentName = '', admissionNumber = '') {
        const name = studentName.replace(/[^a-zA-Z0-9]/g, '_') || 'Student';
        const admission = admissionNumber.replace(/[^a-zA-Z0-9]/g, '_') || '';
        const timestamp = new Date().toISOString().split('T')[0];
        
        return `UoE_${baseName}_${name}_${admission}_${timestamp}.pdf`;
    },
    
    optimizeForPrint() {
        // Hide web-only elements
        const elementsToHide = document.querySelectorAll(`
            .form-navigation,
            .form-actions, 
            .success-message,
            .important-instructions,
            .data-protection-section,
            .loading-overlay
        `);
        
        elementsToHide.forEach(el => {
            if (el) {
                el.style.display = 'none';
            }
        });
        
        // Optimize input styling for print
        const inputs = document.querySelectorAll('.field-input, .location-dropdown, .inline-input');
        inputs.forEach(input => {
            input.classList.remove('error', 'valid', 'location-error');
            input.style.webkitBoxShadow = '0 0 0 30px white inset';
            input.style.boxShadow = '0 0 0 30px white inset';
            input.style.background = 'white';
            input.style.color = 'black';
            input.style.borderBottom = '1px solid #000';
        });
        
        return elementsToHide;
    },
    
    restoreAfterPrint(hiddenElements) {
        // Restore hidden elements
        hiddenElements.forEach(el => {
            if (el) {
                el.style.display = '';
            }
        });
        
        // Restore input styling
        const inputs = document.querySelectorAll('.field-input, .location-dropdown, .inline-input');
        inputs.forEach(input => {
            input.style.webkitBoxShadow = '';
            input.style.boxShadow = '';
            input.style.background = '';
            input.style.color = '';
        });
    },
    
    // ========================================
    // PERFORMANCE UTILITIES
    // ========================================
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // ========================================
    // INITIALIZATION
    // ========================================
    
    initialize() {
        console.log('🔧 Initializing Form Utilities...');
        
        // Setup checkbox exclusivity for known groups
        const checkboxGroups = window.UoEForm.config?.checkboxGroups || ['maritalStatus', 'fatherStatus', 'motherStatus'];
        
        checkboxGroups.forEach(groupName => {
            this.setupCheckboxExclusivity(groupName);
        });
        
        // Setup auto-save if enabled
        if (window.UoEForm.features?.enableAutoSave) {
            this.setupAutoSave();
        }
        
        console.log('✅ Form Utilities initialized');
    },
    
    setupAutoSave() {
        const autoSaveInterval = window.UoEForm.constants?.AUTO_SAVE_INTERVAL || 30000;
        
        // Auto-save for student form
        const studentForm = document.getElementById('studentForm');
        if (studentForm) {
            const debouncedSave = this.debounce(() => {
                this.saveFormData('studentForm');
            }, 1000);
            
            studentForm.addEventListener('input', debouncedSave);
            studentForm.addEventListener('change', debouncedSave);
        }
        
        // Auto-save for media form
        const mediaForm = document.getElementById('mediaConsentForm');
        if (mediaForm) {
            const debouncedSave = this.debounce(() => {
                this.saveFormData('mediaConsentForm');
            }, 1000);
            
            mediaForm.addEventListener('input', debouncedSave);
            mediaForm.addEventListener('change', debouncedSave);
        }
        
        // Periodic save
        setInterval(() => {
            this.saveFormData('studentForm');
            this.saveFormData('mediaConsentForm');
        }, autoSaveInterval);
        
        // Save on page unload
        window.addEventListener('beforeunload', () => {
            this.saveFormData('studentForm');
            this.saveFormData('mediaConsentForm');
        });
        
        console.log('💾 Auto-save enabled');
    }
};

console.log('🔧 Form Utilities module loaded');