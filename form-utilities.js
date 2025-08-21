// form-utilities.js - Form Utilities and Data Management
// University of Eldoret Student Form - Utilities Module

/**
 * Handles form utilities including:
 * - Auto-save and restore functionality
 * - Form clearing and reset
 * - Checkbox exclusivity management
 * - Data persistence
 */

window.UoEForm = window.UoEForm || {};
window.UoEForm.Utilities = {
    
    // ========================================
    // CHECKBOX MANAGEMENT
    // ========================================
    
    setupCheckboxExclusivity() {
        const config = window.UoEForm.config;
        
        config.checkboxGroups.forEach(groupName => {
            this.setupCheckboxGroup(groupName);
        });
        
        console.log('✅ Checkbox exclusivity set up for groups:', config.checkboxGroups);
    },
    
    setupCheckboxGroup(groupName) {
        const checkboxes = document.querySelectorAll(`input[name="${groupName}"]`);
        
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
    },
    
    // ========================================
    // AUTO-SAVE FUNCTIONALITY
    // ========================================
    
    setupAutoSave() {
        const form = document.getElementById('studentForm');
        if (form) {
            form.addEventListener('input', () => {
                this.saveFormData();
            });
            
            // Also save on checkbox changes
            form.addEventListener('change', () => {
                this.saveFormData();
            });
            
            console.log('✅ Auto-save functionality enabled');
        }
    },
    
    saveFormData() {
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
            
            localStorage.setItem(window.UoEForm.config.localStorageKey, JSON.stringify(formData));
            
            // Show subtle save indicator
            this.showSaveIndicator();
            
        } catch (error) {
            console.log('Unable to save form data:', error);
        }
    },
    
    showSaveIndicator() {
        // Create or update save indicator
        let indicator = document.getElementById('autoSaveIndicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'autoSaveIndicator';
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                background: rgba(40, 167, 69, 0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            `;
            indicator.innerHTML = '💾 Auto-saved';
            document.body.appendChild(indicator);
        }
        
        // Show indicator briefly
        indicator.style.opacity = '1';
        
        setTimeout(() => {
            indicator.style.opacity = '0';
        }, 1500);
    },
    
    // ========================================
    // FORM DATA RESTORATION
    // ========================================
    
    loadSavedData() {
        try {
            const savedData = localStorage.getItem(window.UoEForm.config.localStorageKey);
            
            if (savedData) {
                const data = JSON.parse(savedData);
                this.restoreFormData(data);
                this.showDataRestoredNotification();
                console.log('✅ Saved form data restored');
            }
            
        } catch (error) {
            console.log('Unable to load saved data:', error);
        }
    },
    
    restoreFormData(data) {
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
        this.triggerLocationCascade(data);
    },
    
    triggerLocationCascade(data) {
        if (data.county && window.UoEForm.LocationManager) {
            setTimeout(() => {
                window.UoEForm.LocationManager.handleCountyChange();
                
                if (data.subCounty) {
                    setTimeout(() => {
                        const subCountySelect = document.getElementById('subCounty');
                        if (subCountySelect) {
                            subCountySelect.value = data.subCounty;
                            window.UoEForm.LocationManager.handleSubCountyChange();
                            
                            if (data.constituency) {
                                setTimeout(() => {
                                    const constituencySelect = document.getElementById('constituency');
                                    if (constituencySelect) {
                                        constituencySelect.value = data.constituency;
                                        window.UoEForm.LocationManager.handleConstituencyChange();
                                        
                                        if (data.ward) {
                                            setTimeout(() => {
                                                const wardSelect = document.getElementById('ward');
                                                if (wardSelect) {
                                                    wardSelect.value = data.ward;
                                                }
                                            }, 300);
                                        }
                                    }
                                }, 300);
                            }
                        }
                    }, 300);
                }
            }, 800); // Wait for location data to load
        }
    },
    
    showDataRestoredNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(13, 110, 253, 0.95);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 300px;
        `;
        notification.innerHTML = `
            <strong>📋 Data Restored</strong><br>
            <small>Your previously entered information has been restored.</small>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 4000);
    },
    
    // ========================================
    // FORM CLEARING
    // ========================================
    
    clearForm() {
        if (!confirm('Are you sure you want to clear all form data? This action cannot be undone.')) {
            return;
        }
        
        // Reset the form
        const form = document.getElementById('studentForm');
        if (form) {
            form.reset();
        }
        
        // Clear validation classes
        document.querySelectorAll('.field-input, .location-dropdown').forEach(field => {
            window.UoEForm.Validator.clearFieldValidation(field);
        });
        
        // Reset location dropdowns
        this.resetLocationDropdowns();
        
        // Clear consent checkboxes
        this.clearConsentCheckboxes();
        
        // Clear success message
        this.clearSuccessMessage();
        
        // Clear saved data
        localStorage.removeItem(window.UoEForm.config.localStorageKey);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        this.showFormClearedNotification();
        
        console.log('✅ Form cleared successfully');
    },
    
    resetLocationDropdowns() {
        if (window.UoEForm.LocationManager) {
            const subCountySelect = document.getElementById('subCounty');
            const constituencySelect = document.getElementById('constituency');
            const wardSelect = document.getElementById('ward');
            
            if (subCountySelect) {
                window.UoEForm.LocationManager.resetDropdown(subCountySelect, 'Select county first');
            }
            if (constituencySelect) {
                window.UoEForm.LocationManager.resetDropdown(constituencySelect, 'Select sub-county first');
            }
            if (wardSelect) {
                window.UoEForm.LocationManager.resetDropdown(wardSelect, 'Select constituency first');
            }
        }
    },
    
    clearConsentCheckboxes() {
        const dataConsent = document.getElementById('dataConsent');
        const dataRights = document.getElementById('dataRights');
        
        if (dataConsent) dataConsent.checked = false;
        if (dataRights) dataRights.checked = false;
    },
    
    clearSuccessMessage() {
        const successMessage = document.getElementById('successMessage');
        if (successMessage) {
            successMessage.style.display = 'none';
        }
    },
    
    showFormClearedNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(220, 53, 69, 0.95);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        notification.innerHTML = `
            <strong>🗑️ Form Cleared</strong><br>
            <small>All data has been removed.</small>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 3000);
    },
    
    // ========================================
    // FORM ENHANCEMENT
    // ========================================
    
    enhanceFormInteractivity() {
        // Store original help text for location fields
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
        
        // Add dynamic field counting
        this.setupFieldCounter();
        
        console.log('✅ Form interactivity enhanced');
    },
    
    setupFieldCounter() {
        const form = document.getElementById('studentForm');
        if (!form) return;
        
        const updateFieldCounter = () => {
            const allFields = form.querySelectorAll('input, select');
            const filledFields = Array.from(allFields).filter(field => {
                if (field.type === 'checkbox') {
                    return field.checked;
                }
                return field.value && field.value.trim() !== '';
            });
            
            const percentage = Math.round((filledFields.length / allFields.length) * 100);
            this.updateProgressIndicator(percentage, filledFields.length, allFields.length);
        };
        
        form.addEventListener('input', updateFieldCounter);
        form.addEventListener('change', updateFieldCounter);
        
        // Initial count
        setTimeout(updateFieldCounter, 1000);
    },
    
    updateProgressIndicator(percentage, filled, total) {
        let indicator = document.getElementById('formProgressIndicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'formProgressIndicator';
            indicator.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: rgba(255, 255, 255, 0.95);
                border: 2px solid #2a5298;
                border-radius: 8px;
                padding: 10px 15px;
                font-size: 12px;
                z-index: 1000;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                min-width: 200px;
            `;
            document.body.appendChild(indicator);
        }
        
        const color = percentage < 50 ? '#dc3545' : percentage < 80 ? '#ffc107' : '#28a745';
        
        indicator.innerHTML = `
            <div style="margin-bottom: 5px; font-weight: bold; color: ${color};">
                Form Progress: ${percentage}%
            </div>
            <div style="background: #e9ecef; height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="background: ${color}; height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
            </div>
            <div style="margin-top: 5px; font-size: 11px; color: #666;">
                ${filled} of ${total} fields completed
            </div>
        `;
    },
    
    // ========================================
    // DATA VALIDATION HELPERS
    // ========================================
    
    formatPhoneNumber(input) {
        // Auto-format Kenyan phone numbers
        let value = input.value.replace(/\D/g, '');
        
        if (value.startsWith('254')) {
            value = '+' + value;
        } else if (value.startsWith('0')) {
            value = '+254' + value.substring(1);
        } else if (value.length === 9) {
            value = '+254' + value;
        }
        
        input.value = value;
    },
    
    setupPhoneFormatting() {
        const phoneFields = ['phoneNumber', 'fatherPhone', 'motherPhone', 'emergency1Phone', 'emergency2Phone'];
        
        phoneFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => {
                    this.formatPhoneNumber(field);
                });
            }
        });
    },
    
    // ========================================
    // INITIALIZATION
    // ========================================
    
    initialize() {
        console.log('🔧 Initializing Form Utilities...');
        
        this.setupCheckboxExclusivity();
        this.setupAutoSave();
        this.enhanceFormInteractivity();
        this.setupPhoneFormatting();
        
        // Load saved data after a brief delay to allow other modules to initialize
        setTimeout(() => {
            this.loadSavedData();
        }, 500);
        
        console.log('✅ Form Utilities initialized');
    },
    
    // ========================================
    // PUBLIC INTERFACE
    // ========================================
    
    clear() {
        this.clearForm();
    },
    
    save() {
        this.saveFormData();
    }
};

console.log('🔧 Form Utilities module loaded');