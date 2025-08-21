// main.js - Simplified Main Application Controller
// University of Eldoret Student Form - Main Module

/**
 * Main application controller that coordinates all modules
 * - Provides global functions for HTML buttons  
 * - Manages initialization sequence
 * - Handles error reporting
 */

// ========================================
// GLOBAL FUNCTION DEFINITIONS (IMMEDIATE)
// ========================================

// Define these functions immediately so they're available for HTML onclick handlers
window.submitForm = function() {
    console.log('🚀 Submit form triggered');
    if (window.DualFormManager && window.DualFormManager.submitBothForms) {
        return window.DualFormManager.submitBothForms();
    } else if (typeof submitToFirebase === 'function') {
        return submitToFirebase();
    } else {
        console.error('❌ No submission function available');
        alert('System not ready. Please wait a moment and try again.');
    }
};

window.clearForm = function() {
    console.log('🗑️ Clear form triggered');
    if (window.DualFormManager && window.DualFormManager.clearAllForms) {
        return window.DualFormManager.clearAllForms();
    } else if (window.UoEForm && window.UoEForm.Utilities && window.UoEForm.Utilities.clearForm) {
        return window.UoEForm.Utilities.clearForm();
    } else {
        console.error('❌ No clear function available');
        alert('System not ready. Please wait a moment and try again.');
    }
};

window.printForm = function() {
    console.log('🖨️ Print form triggered');
    if (window.DualFormManager && window.DualFormManager.printBothForms) {
        return window.DualFormManager.printBothForms();
    } else if (typeof printSingleForm === 'function') {
        return printSingleForm();
    } else {
        console.error('❌ No print function available');
        alert('System not ready. Please wait a moment and try again.');
    }
};

window.downloadPDF = function() {
    console.log('📄 Download PDF triggered');
    if (window.DualFormManager && window.DualFormManager.downloadBothPDFs) {
        return window.DualFormManager.downloadBothPDFs();
    } else if (typeof downloadSinglePDF === 'function') {
        return downloadSinglePDF();
    } else {
        console.error('❌ No PDF function available');
        alert('System not ready. Please wait a moment and try again.');
    }
};

window.validateForm = function() {
    console.log('✅ Validate form triggered');
    if (typeof validateForm === 'function') {
        return validateForm();
    } else {
        console.error('❌ No validation function available');
        return false;
    }
};

// Form navigation functions
window.showForm = function(formId) {
    console.log(`📋 Show form: ${formId}`);
    if (window.DualFormManager && window.DualFormManager.showForm) {
        return window.DualFormManager.showForm(formId);
    } else {
        console.warn('⚠️ Dual form manager not available');
    }
};

window.validateAndSubmitBothForms = function() {
    console.log('🚀 Submit both forms triggered');
    if (window.DualFormManager && window.DualFormManager.submitBothForms) {
        return window.DualFormManager.submitBothForms();
    } else {
        console.error('❌ Dual form manager not available');
        alert('System not ready. Please wait a moment and try again.');
    }
};

window.printBothForms = function() {
    console.log('🖨️ Print both forms triggered');
    if (window.DualFormManager && window.DualFormManager.printBothForms) {
        return window.DualFormManager.printBothForms();
    } else {
        console.error('❌ Dual form manager not available');
        alert('System not ready. Please wait a moment and try again.');
    }
};

window.downloadBothPDFs = function() {
    console.log('📄 Download both PDFs triggered');
    if (window.DualFormManager && window.DualFormManager.downloadBothPDFs) {
        return window.DualFormManager.downloadBothPDFs();
    } else {
        console.error('❌ Dual form manager not available');
        alert('System not ready. Please wait a moment and try again.');
    }
};

window.clearAllForms = function() {
    console.log('🗑️ Clear all forms triggered');
    if (window.DualFormManager && window.DualFormManager.clearAllForms) {
        return window.DualFormManager.clearAllForms();
    } else {
        console.error('❌ Dual form manager not available');
        alert('System not ready. Please wait a moment and try again.');
    }
};

// ========================================
// MAIN APPLICATION CONTROLLER
// ========================================

window.UoEForm = window.UoEForm || {};
window.UoEForm.App = {
    
    initialized: false,
    
    async initialize() {
        if (this.initialized) {
            console.log('⚠️ Application already initialized');
            return;
        }
        
        console.log('🚀 Starting University of Eldoret Form Application...');
        
        try {
            // Check Firebase connection
            if (window.db) {
                console.log('✅ Firebase connected successfully');
            } else {
                console.warn('⚠️ Firebase not ready yet');
            }
            
            // Initialize location manager if available
            if (window.UoEForm.LocationManager) {
                await window.UoEForm.LocationManager.initialize();
            }
            
            // Initialize other modules if available
            if (window.UoEForm.Utilities) {
                window.UoEForm.Utilities.initialize();
            }
            
            // Initialize dual form manager (this handles the main functionality)
            if (window.DualFormManager) {
                // DualFormManager initializes itself
                console.log('✅ Dual Form Manager ready');
            }
            
            // Initialize legacy form functions
            if (typeof initializeForm === 'function') {
                initializeForm();
            }
            
            this.initialized = true;
            console.log('✅ Application initialization complete');
            
        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            this.showErrorMessage('Failed to initialize application. Please refresh the page and try again.');
        }
    },
    
    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #f8d7da;
            color: #721c24;
            padding: 15px 25px;
            border: 1px solid #f5c6cb;
            border-radius: 8px;
            z-index: 10000;
            font-weight: bold;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (document.body.contains(errorDiv)) {
                document.body.removeChild(errorDiv);
            }
        }, 10000);
    },
    
    restart() {
        console.log('🔄 Restarting application...');
        this.initialized = false;
        
        // Clear any existing data
        if (window.UoEForm.Utilities && window.UoEForm.Utilities.clearForm) {
            window.UoEForm.Utilities.clearForm();
        }
        
        // Reinitialize
        setTimeout(() => {
            this.initialize();
        }, 1000);
    }
};

// ========================================
// DIAGNOSTIC FUNCTIONS
// ========================================

window.UoEFormDiagnose = function() {
    console.log('🔍 === UoE FORM DIAGNOSTICS ===');
    console.log('Firebase ready:', !!window.db);
    console.log('Location Manager:', !!window.UoEForm.LocationManager);
    console.log('Dual Form Manager:', !!window.DualFormManager);
    console.log('Utilities:', !!window.UoEForm.Utilities);
    console.log('App initialized:', window.UoEForm.App.initialized);
    
    // Check forms
    console.log('Student form:', !!document.getElementById('studentForm'));
    console.log('Media form:', !!document.getElementById('mediaConsentForm'));
    
    // Check key functions
    console.log('Global functions:');
    console.log('- submitForm:', typeof window.submitForm);
    console.log('- printForm:', typeof window.printForm);
    console.log('- downloadPDF:', typeof window.downloadPDF);
    console.log('- clearForm:', typeof window.clearForm);
    console.log('- validateForm:', typeof window.validateForm);
    
    return 'Diagnostics complete - check console for details';
};

window.UoEFormStatus = function() {
    if (window.DualFormManager && window.DualFormManager.state) {
        console.log('📊 Form Status:', window.DualFormManager.state);
        return window.DualFormManager.state;
    } else {
        console.log('📊 Dual Form Manager not available');
        return null;
    }
};

window.UoEFormModules = function() {
    const modules = {};
    
    if (window.UoEForm) {
        Object.keys(window.UoEForm).forEach(key => {
            modules[key] = typeof window.UoEForm[key];
        });
    }
    
    modules.DualFormManager = typeof window.DualFormManager;
    modules.Firebase = !!window.db;
    
    console.log('📦 Available Modules:', modules);
    return modules;
};

// ========================================
// INITIALIZATION
// ========================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📋 DOM Content Loaded - Starting initialization...');
        window.UoEForm.App.initialize();
    });
} else {
    console.log('📋 DOM Already Ready - Starting initialization...');
    window.UoEForm.App.initialize();
}

console.log('🎯 Main Application Controller loaded');
console.log('📞 Diagnostic functions available: UoEFormDiagnose(), UoEFormStatus(), UoEFormModules()');
console.log('🔧 To restart the application: window.UoEForm.App.restart()');