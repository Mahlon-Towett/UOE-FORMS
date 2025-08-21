// main.js - Main Application Controller
// University of Eldoret Student Form - Main Module

/**
 * Main application controller that:
 * - Coordinates all modules
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
    if (window.UoEForm && window.UoEForm.Firebase) {
        window.UoEForm.Firebase.submit();
    } else {
        console.error('❌ Firebase module not ready');
        alert('System not ready. Please wait a moment and try again.');
    }
};

window.clearForm = function() {
    console.log('🗑️ Clear form triggered');
    if (window.UoEForm && window.UoEForm.Utilities) {
        window.UoEForm.Utilities.clear();
    } else {
        console.error('❌ Utilities module not ready');
        alert('System not ready. Please wait a moment and try again.');
    }
};

window.printForm = function() {
    console.log('🖨️ Print form triggered');
    if (window.UoEForm && window.UoEForm.PDFGenerator) {
        window.UoEForm.PDFGenerator.print();
    } else {
        console.error('❌ PDF Generator module not ready');
        alert('System not ready. Please wait a moment and try again.');
    }
};

window.downloadPDF = function() {
    console.log('📄 Download PDF triggered');
    if (window.UoEForm && window.UoEForm.PDFGenerator) {
        window.UoEForm.PDFGenerator.download();
    } else {
        console.error('❌ PDF Generator module not ready');
        alert('System not ready. Please wait a moment and try again.');
    }
};

console.log('✅ Global functions defined immediately:', {
    submitForm: typeof window.submitForm,
    clearForm: typeof window.clearForm,
    printForm: typeof window.printForm,
    downloadPDF: typeof window.downloadPDF
});

// ========================================
// MAIN APPLICATION CONTROLLER
// ========================================

window.UoEForm = window.UoEForm || {};
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
        if (progress && document.body.contains(progress)) {
            progress.style.opacity = '0';
            progress.style.transform = 'translateY(-100%)';
            progress.style.transition = 'all 0.5s ease';
            
            setTimeout(() => {
                if (document.body.contains(progress)) {
                    document.body.removeChild(progress);
                }
            }, 500);
        }
    },
    
    showReadyNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            font-size: 14px;
            z-index: 10001;
            box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
            animation: slideInRight 0.5s ease;
        `;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">✅</span>
                <div>
                    <strong>System Ready</strong><br>
                    <small>All modules initialized successfully</small>
                </div>
            </div>
            <style>
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                notification.style.transition = 'all 0.5s ease';
                
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 500);
            }
        }, 4000);
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
            max-width: 400px;
            text-align: center;
        `;
        errorNotification.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 15px;">❌</div>
            <strong>Initialization Error</strong><br>
            <small style="margin-top: 10px; display: block;">${error.message}</small>
            <button onclick="window.location.reload()" style="
                background: white; 
                color: #dc3545; 
                border: none; 
                padding: 10px 20px; 
                border-radius: 6px; 
                margin-top: 15px;
                cursor: pointer;
                font-weight: bold;
            ">Reload Page</button>
        `;
        
        document.body.appendChild(errorNotification);
    },
    
    // ========================================
    // STATUS AND DEBUGGING
    // ========================================
    
    getStatus() {
        return {
            initialized: this.initialized,
            modules: this.modules,
            firebaseReady: window.UoEForm.checkFirebaseReady(),
            locationDataLoaded: window.UoEForm.LocationManager ? window.UoEForm.LocationManager.isLoaded : false,
            globalFunctions: {
                submitForm: typeof window.submitForm,
                clearForm: typeof window.clearForm,
                printForm: typeof window.printForm,
                downloadPDF: typeof window.downloadPDF
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
        await this.initialize();
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

// Global diagnostic function for debugging
window.UoEFormDiagnose = function() {
    return window.UoEForm.App.diagnose();
};

// Global status function for monitoring
window.UoEFormStatus = function() {
    return window.UoEForm.App.getStatus();
};

console.log('🎯 Main Application Controller loaded');
console.log('📞 Diagnostic functions available: UoEFormDiagnose(), UoEFormStatus()');