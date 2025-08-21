// main.js - Main Application Controller
// University of Eldoret Student Form - Complete Modular System

/**
 * Main application controller that:
 * - Coordinates all modules
 * - Provides global functions for HTML buttons
 * - Manages initialization sequence
 * - Handles error reporting and diagnostics
 */

// ========================================
// GLOBAL NAMESPACE AND CONFIG
// ========================================

window.UoEForm = window.UoEForm || {};

// Application configuration
window.UoEForm.config = {
    formVersion: "2.5",
    isSubmitting: false,
    debug: true,
    firebaseInitialized: false,
    
    // Field configurations
    siblingFields: ['sibling1', 'sibling2', 'sibling3', 'sibling4', 'sibling5'],
    locationDataURL: 'kenyan_locations.json',
    
    // Required fields for validation
    requiredFields: [
        'fullName', 'admissionNumber', 'phoneNumber', 'nationalId', 
        'nationality', 'gender', 'dateOfBirth', 'placeOfBirth', 
        'permanentResidence', 'location', 'county', 'emergency1Name', 
        'emergency1Relationship', 'emergency1Phone'
    ]
};

// ========================================
// FIREBASE INITIALIZATION HELPER
// ========================================

window.UoEForm.initializeFirebase = async function() {
    console.log('🔥 Checking Firebase initialization...');
    
    // Wait for Firebase to be available
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max
    
    while (!window.db && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (window.db) {
        console.log('✅ Firebase connected successfully');
        window.UoEForm.config.firebaseInitialized = true;
        return true;
    } else {
        console.error('❌ Firebase initialization timeout');
        return false;
    }
};

window.UoEForm.checkFirebaseReady = function() {
    return window.db && window.UoEForm.config.firebaseInitialized;
};

// ========================================
// GLOBAL FUNCTION DEFINITIONS (IMMEDIATE)
// ========================================

// Define these functions immediately so they're available for HTML onclick handlers
window.submitForm = function() {
    console.log('🚀 Submit form triggered');
    if (window.UoEForm && window.UoEForm.Firebase) {
        window.UoEForm.Firebase.submitToFirebase();
    } else {
        console.error('❌ Firebase module not ready');
        alert('System not ready. Please wait a moment and try again.');
    }
};

window.clearForm = function() {
    console.log('🗑️ Clear form triggered');
    if (window.UoEForm && window.UoEForm.Utilities) {
        window.UoEForm.Utilities.clearForm();
    } else {
        console.error('❌ Utilities module not ready');
        // Fallback basic clear
        if (confirm('Clear all form data?')) {
            document.getElementById('studentForm').reset();
            localStorage.removeItem('uoe_student_form_data');
        }
    }
};

window.printForm = function() {
    console.log('🖨️ Print form triggered');
    if (window.UoEForm && window.UoEForm.PDFGenerator) {
        window.UoEForm.PDFGenerator.printForm();
    } else {
        console.error('❌ PDF Generator module not ready');
        // Fallback browser print
        window.print();
    }
};

window.downloadPDF = function() {
    console.log('📄 Download PDF triggered');
    if (window.UoEForm && window.UoEForm.PDFGenerator) {
        window.UoEForm.PDFGenerator.generatePDF();
    } else {
        console.error('❌ PDF Generator module not ready');
        alert('PDF generation not available. Please try printing instead.');
    }
};

// Legacy function support from original script.js
window.validateForm = function() {
    if (window.UoEForm && window.UoEForm.Validator) {
        return window.UoEForm.Validator.validateForm();
    }
    return false;
};

window.checkDataConsent = function() {
    if (window.UoEForm && window.UoEForm.Validator) {
        return window.UoEForm.Validator.checkDataConsent();
    }
    return false;
};

console.log('✅ Global functions defined immediately:', {
    submitForm: typeof window.submitForm,
    clearForm: typeof window.clearForm,
    printForm: typeof window.printForm,
    downloadPDF: typeof window.downloadPDF,
    validateForm: typeof window.validateForm,
    checkDataConsent: typeof window.checkDataConsent
});

// ========================================
// MAIN APPLICATION CONTROLLER
// ========================================

window.UoEForm.App = {
    
    initialized: false,
    modules: {},
    
    // ========================================
    // INITIALIZATION SEQUENCE
    // ========================================
    
    async initialize() {
        console.log('🚀 Starting University of Eldoret Form Application...');
        
        try {
            // Check if we're ready to initialize
            if (document.readyState === 'loading') {
                console.log('⏳ Waiting for DOM to be ready...');
                return; // Will be called again by DOMContentLoaded
            }
            
            this.showInitializationProgress('Initializing application...');
            
            // Initialize modules in correct order
            await this.initializeModulesSequence();
            
            // Verify all modules are ready
            this.verifyModules();
            
            // Setup event listeners
            this.setupGlobalEventListeners();
            
            // Load saved data if available
            this.loadSavedFormData();
            
            // Mark as initialized
            this.initialized = true;
            
            this.hideInitializationProgress();
            this.showReadyNotification();
            
            console.log('✅ University of Eldoret Form Application initialized successfully');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.handleInitializationError(error);
        }
    },
    
    async initializeModulesSequence() {
        // Step 1: Initialize Firebase connection
        this.updateInitializationProgress('Connecting to Firebase...');
        const firebaseReady = await window.UoEForm.initializeFirebase();
        this.modules.firebase = firebaseReady;
        
        // Step 2: Initialize Location Manager
        this.updateInitializationProgress('Loading location data...');
        if (window.UoEForm.LocationManager) {
            await window.UoEForm.LocationManager.initialize();
            this.modules.locationManager = true;
        }
        
        // Step 3: Initialize Form Validator
        this.updateInitializationProgress('Setting up form validation...');
        if (window.UoEForm.Validator) {
            window.UoEForm.Validator.initialize();
            this.modules.validator = true;
        }
        
        // Step 4: Initialize Form Utilities
        this.updateInitializationProgress('Configuring form utilities...');
        if (window.UoEForm.Utilities) {
            window.UoEForm.Utilities.initialize();
            this.modules.utilities = true;
        }
        
        // Step 5: Mark PDF Generator as ready (no async initialization needed)
        if (window.UoEForm.PDFGenerator) {
            this.modules.pdfGenerator = true;
        }
        
        // Step 6: Mark Firebase Integration as ready (no async initialization needed)
        if (window.UoEForm.Firebase) {
            this.modules.firebaseIntegration = true;
        }
    },
    
    verifyModules() {
        const requiredModules = {
            'Firebase Connection': this.modules.firebase,
            'Location Manager': this.modules.locationManager,
            'Form Validator': this.modules.validator,
            'Form Utilities': this.modules.utilities,
            'PDF Generator': this.modules.pdfGenerator,
            'Firebase Integration': this.modules.firebaseIntegration
        };
        
        const failed = [];
        Object.entries(requiredModules).forEach(([name, status]) => {
            if (!status) {
                failed.push(name);
            }
        });
        
        if (failed.length > 0) {
            throw new Error(`Module initialization failed: ${failed.join(', ')}`);
        }
        
        console.log('✅ All modules verified:', requiredModules);
    },
    
    // ========================================
    // EVENT LISTENERS SETUP
    // ========================================
    
    setupGlobalEventListeners() {
        // Auto-save functionality
        document.addEventListener('input', this.debounce(() => {
            if (window.UoEForm.Utilities && window.UoEForm.Utilities.saveFormData) {
                window.UoEForm.Utilities.saveFormData();
            }
        }, 2000));
        
        // Prevent accidental page leave when form has data
        window.addEventListener('beforeunload', (e) => {
            const form = document.getElementById('studentForm');
            if (form) {
                const formData = new FormData(form);
                let hasData = false;
                for (let [key, value] of formData.entries()) {
                    if (value && value.toString().trim()) {
                        hasData = true;
                        break;
                    }
                }
                
                if (hasData && !window.UoEForm.config.isSubmitting) {
                    e.preventDefault();
                    e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                    return e.returnValue;
                }
            }
        });
    },
    
    // ========================================
    // SAVED DATA LOADING
    // ========================================
    
    loadSavedFormData() {
        try {
            const savedData = localStorage.getItem('uoe_student_form_data');
            if (savedData) {
                const data = JSON.parse(savedData);
                console.log('📄 Loading saved form data...');
                
                Object.entries(data).forEach(([fieldId, value]) => {
                    const field = document.getElementById(fieldId);
                    if (field) {
                        if (field.type === 'checkbox') {
                            field.checked = value;
                        } else {
                            field.value = value;
                        }
                    }
                });
                
                // Trigger location dropdowns if county is saved
                setTimeout(() => {
                    const countySelect = document.getElementById('county');
                    if (countySelect && countySelect.value && window.UoEForm.LocationManager) {
                        window.UoEForm.LocationManager.handleCountyChange();
                    }
                }, 1000);
                
                console.log('✅ Saved form data loaded');
            }
        } catch (error) {
            console.log('Unable to load saved data:', error);
        }
    },
    
    // ========================================
    // INITIALIZATION FEEDBACK
    // ========================================
    
    showInitializationProgress(message) {
        const progress = document.createElement('div');
        progress.id = 'initializationProgress';
        progress.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #2a5298 0%, #1e3c72 100%);
            color: white;
            padding: 15px 20px;
            text-align: center;
            z-index: 10002;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        progress.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                <div class="spinner" style="width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span id="progressText">${message}</span>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(progress);
    },
    
    updateInitializationProgress(message) {
        const progressText = document.getElementById('progressText');
        if (progressText) {
            progressText.textContent = message;
        }
    },
    
    hideInitializationProgress() {
        const progress = document.getElementById('initializationProgress');
        if (progress) {
            progress.style.opacity = '0';
            progress.style.transform = 'translateY(-100%)';
            progress.style.transition = 'all 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(progress)) {
                    document.body.removeChild(progress);
                }
            }, 300);
        }
    },
    
    showReadyNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10001;
            box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
            transition: all 0.3s ease;
        `;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">✅</span>
                <strong>System Ready</strong>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    },
    
    handleInitializationError(error) {
        this.hideInitializationProgress();
        
        const errorNotification = document.createElement('div');
        errorNotification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #dc3545;
            color: white;
            padding: 25px;
            border-radius: 12px;
            font-size: 16px;
            z-index: 10003;
            box-shadow: 0 8px 25px rgba(220, 53, 69, 0.4);
            max-width: 500px;
            text-align: center;
        `;
        errorNotification.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 15px;">❌</div>
            <strong>Initialization Error</strong><br>
            <div style="margin: 10px 0; font-size: 14px; opacity: 0.9;">${error.message}</div>
            <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
                <button onclick="window.location.reload()" style="
                    background: white; 
                    color: #dc3545; 
                    border: none; 
                    padding: 10px 20px; 
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                ">Reload Page</button>
                <button onclick="window.UoEForm.App.restart()" style="
                    background: rgba(255,255,255,0.2); 
                    color: white; 
                    border: 1px solid white; 
                    padding: 10px 20px; 
                    border-radius: 6px;
                    cursor: pointer;
                ">Retry</button>
            </div>
        `;
        
        document.body.appendChild(errorNotification);
    },
    
    // ========================================
    // UTILITY FUNCTIONS
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
    
    // ========================================
    // STATUS AND DEBUGGING
    // ========================================
    
    getStatus() {
        return {
            initialized: this.initialized,
            modules: this.modules,
            firebaseReady: window.UoEForm.checkFirebaseReady(),
            locationDataLoaded: window.UoEForm.LocationManager ? 
                window.UoEForm.LocationManager.isLoaded : false,
            globalFunctions: {
                submitForm: typeof window.submitForm,
                clearForm: typeof window.clearForm,
                printForm: typeof window.printForm,
                downloadPDF: typeof window.downloadPDF,
                validateForm: typeof window.validateForm,
                checkDataConsent: typeof window.checkDataConsent
            }
        };
    },
    
    diagnose() {
        const status = this.getStatus();
        console.log('🔍 University of Eldoret Form Diagnosis:', status);
        
        const problems = [];
        
        if (!status.initialized) problems.push('Application not initialized');
        if (!status.firebaseReady) problems.push('Firebase not ready');
        if (!status.locationDataLoaded) problems.push('Location data not loaded');
        
        Object.entries(status.globalFunctions).forEach(([func, type]) => {
            if (type !== 'function') {
                problems.push(`${func} not available`);
            }
        });
        
        if (problems.length === 0) {
            console.log('✅ No problems detected - system fully operational');
        } else {
            console.warn('⚠️ Problems detected:', problems);
        }
        
        return { status, problems };
    },
    
    // ========================================
    // PUBLIC INTERFACE
    // ========================================
    
    async restart() {
        console.log('🔄 Restarting application...');
        this.initialized = false;
        this.modules = {};
        
        // Remove any existing error messages
        const existingErrors = document.querySelectorAll('[id*="Error"], [id*="Progress"]');
        existingErrors.forEach(el => {
            if (document.body.contains(el)) {
                document.body.removeChild(el);
            }
        });
        
        await this.initialize();
    }
};

// ========================================
// MODULE STUBS (FOR MISSING MODULES)
// ========================================

// These provide basic fallbacks if the individual module files aren't loaded

window.UoEForm.Validator = window.UoEForm.Validator || {
    initialize() {
        console.log('📝 Form Validator (stub) initialized');
    },
    
    validateForm() {
        console.warn('⚠️ Using basic validation - load form-validator.js for full validation');
        const requiredFields = window.UoEForm.config.requiredFields;
        
        for (let fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            if (field && !field.value.trim()) {
                alert(`Please fill in the ${fieldId} field`);
                field.focus();
                return false;
            }
        }
        return true;
    },
    
    checkDataConsent() {
        const dataConsent = document.getElementById('dataConsent');
        const dataRights = document.getElementById('dataRights');
        
        if (!dataConsent?.checked || !dataRights?.checked) {
            alert('Please accept data processing consent and acknowledge your rights');
            return false;
        }
        return true;
    },
    
    calculateAge(dateString) {
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }
};

window.UoEForm.Utilities = window.UoEForm.Utilities || {
    initialize() {
        console.log('🛠️ Form Utilities (stub) initialized');
    },
    
    clearForm() {
        if (confirm('Are you sure you want to clear all form data?')) {
            document.getElementById('studentForm').reset();
            localStorage.removeItem('uoe_student_form_data');
            console.log('🗑️ Form cleared');
        }
    },
    
    saveFormData() {
        try {
            const form = document.getElementById('studentForm');
            const formData = new FormData(form);
            const data = {};
            
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }
            
            localStorage.setItem('uoe_student_form_data', JSON.stringify(data));
        } catch (error) {
            console.warn('Unable to save form data:', error);
        }
    }
};

window.UoEForm.PDFGenerator = window.UoEForm.PDFGenerator || {
    generatePDF() {
        console.warn('⚠️ PDF Generator (stub) - load pdf-generator.js for full functionality');
        alert('PDF generation requires the pdf-generator.js module');
    },
    
    printForm() {
        console.log('🖨️ Using browser print (fallback)');
        window.print();
    }
};

window.UoEForm.Firebase = window.UoEForm.Firebase || {
    submitToFirebase() {
        console.warn('⚠️ Firebase Integration (stub) - load firebase-integration.js for full functionality');
        alert('Form submission requires the firebase-integration.js module');
    }
};

// ========================================
// APPLICATION STARTUP
// ========================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('📋 DOM Content Loaded - Starting initialization...');
    await window.UoEForm.App.initialize();
});

// Fallback initialization if DOMContentLoaded already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(async () => {
        if (!window.UoEForm.App.initialized) {
            console.log('📋 Fallback initialization...');
            await window.UoEForm.App.initialize();
        }
    }, 500);
}

// ========================================
// GLOBAL DIAGNOSTIC FUNCTIONS
// ========================================

// Global diagnostic function for debugging
window.UoEFormDiagnose = function() {
    return window.UoEForm.App.diagnose();
};

// Global status function for monitoring
window.UoEFormStatus = function() {
    return window.UoEForm.App.getStatus();
};

// Development helper - list all available modules
window.UoEFormModules = function() {
    console.log('📦 Available UoEForm modules:', Object.keys(window.UoEForm));
    return Object.keys(window.UoEForm);
};

// ========================================
// LOADING COMPLETE
// ========================================

console.log('🎯 Main Application Controller loaded');
console.log('📞 Diagnostic functions available: UoEFormDiagnose(), UoEFormStatus(), UoEFormModules()');
console.log('🔧 To restart the application: window.UoEForm.App.restart()');

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.UoEForm;
}