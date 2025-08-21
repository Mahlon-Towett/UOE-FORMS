// config.js - Firebase Configuration and Global Settings
// University of Eldoret Student Form - Configuration Module

/**
 * Firebase Configuration and Global Settings
 * This module initializes Firebase and provides global configuration
 */

// Global state variables
window.UoEForm = window.UoEForm || {};
window.UoEForm.isSubmitting = false;
window.UoEForm.isFirebaseReady = false;

// Firebase configuration (already set in HTML, but keeping reference)
window.UoEForm.firebaseConfig = {
    apiKey: "AIzaSyCQ4B3CdAJ4WoFu-bPlZQtLgdpHvkXTK0w",
    authDomain: "uoe-student-form.firebaseapp.com",
    projectId: "uoe-student-form",
    storageBucket: "uoe-student-form.firebasestorage.app",
    messagingSenderId: "1023597600972",
    appId: "1:1023597600972:web:4a79cca07365059d392269",
    measurementId: "G-HS1FV2ZS80"
};

// Form configuration
window.UoEForm.config = {
    formVersion: "2.5",
    locationDataUrl: "./kenyan_locations.json",
    requiredFields: [
        'fullName', 'admissionNumber', 'phoneNumber', 'nationalId', 
        'nationality', 'gender', 'dateOfBirth', 'placeOfBirth', 
        'permanentResidence', 'location', 'county', 'emergency1Name', 
        'emergency1Relationship', 'emergency1Phone'
    ],
    checkboxGroups: ['maritalStatus', 'fatherStatus', 'motherStatus'],
    siblingFields: ['sibling1', 'sibling2', 'sibling3', 'sibling4', 'sibling5', 'sibling6'],
    localStorageKey: 'uoe_dual_form_data'
};

// Wait for Firebase to be ready (initialized in HTML)
function waitForFirebase() {
    return new Promise((resolve) => {
        const checkFirebase = setInterval(() => {
            if (window.db && window.analytics) {
                clearInterval(checkFirebase);
                window.UoEForm.isFirebaseReady = true;
                console.log('✅ Firebase services ready');
                resolve(true);
            }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            clearInterval(checkFirebase);
            console.error('❌ Firebase initialization timeout');
            resolve(false);
        }, 10000);
    });
}

// Initialize Firebase connection check
window.UoEForm.initializeFirebase = async function() {
    try {
        const isReady = await waitForFirebase();
        if (isReady) {
            console.log('✅ Firebase Firestore connected successfully!');
            return true;
        } else {
            console.error('❌ Firebase connection failed!');
            return false;
        }
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        return false;
    }
};

// Utility function to check if Firebase is ready
window.UoEForm.checkFirebaseReady = function() {
    return window.UoEForm.isFirebaseReady && window.db;
};

// Global error handler for Firebase operations
window.UoEForm.handleFirebaseError = function(error) {
    console.error('❌ Firebase operation error:', error);
    
    let userMessage = 'An error occurred. Please try again.';
    
    switch (error.code) {
        case 'permission-denied':
            userMessage = 'Permission denied. Please check your connection and try again.';
            break;
        case 'unavailable':
            userMessage = 'Service temporarily unavailable. Please try again in a few minutes.';
            break;
        case 'unauthenticated':
            userMessage = 'Authentication error. Please refresh the page and try again.';
            break;
        case 'resource-exhausted':
            userMessage = 'Server is busy. Please try again in a few minutes.';
            break;
        case 'deadline-exceeded':
            userMessage = 'Request timed out. Please check your connection and try again.';
            break;
        default:
            if (error.message) {
                userMessage = `Error: ${error.message}`;
            }
    }
    
    return userMessage;
};

// Application constants
window.UoEForm.constants = {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png'],
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
    VALIDATION_DEBOUNCE: 500, // 500ms
    MIN_AGE: 16,
    MAX_AGE: 70,
    PHONE_REGEX: /^(\+254|0)[17]\d{8}$/,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    NATIONAL_ID_REGEX: /^\d{7,8}$/
};

// Environment detection
window.UoEForm.environment = {
    isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    isProduction: window.location.hostname.includes('uoeld.ac.ke') || window.location.hostname.includes('southrifteye.co.ke'),
    userAgent: navigator.userAgent,
    isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isAndroid: /Android/.test(navigator.userAgent),
    browserName: getBrowserName()
};

function getBrowserName() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown';
}

// Performance monitoring
window.UoEForm.performance = {
    startTime: Date.now(),
    loadTime: null,
    submissionTimes: [],
    
    markLoadComplete() {
        this.loadTime = Date.now() - this.startTime;
        console.log(`📊 Application loaded in ${this.loadTime}ms`);
    },
    
    trackSubmission(startTime, endTime) {
        const duration = endTime - startTime;
        this.submissionTimes.push(duration);
        console.log(`📊 Submission completed in ${duration}ms`);
    },
    
    getAverageSubmissionTime() {
        if (this.submissionTimes.length === 0) return 0;
        const sum = this.submissionTimes.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.submissionTimes.length);
    }
};

// Feature flags
window.UoEForm.features = {
    enableLocationValidation: true,
    enableAutoSave: true,
    enableOfflineMode: false,
    enableAnalytics: true,
    enableAdvancedValidation: true,
    enablePrintOptimization: true,
    enableFormProgress: true,
    maxRetryAttempts: 3,
    enableDebugMode: window.UoEForm.environment.isDevelopment
};

// Debug utilities (only in development)
if (window.UoEForm.features.enableDebugMode) {
    window.UoEForm.debug = {
        logFormData() {
            if (typeof getFormDataForFirebase === 'function') {
                console.log('📋 Current form data:', getFormDataForFirebase());
            }
        },
        
        logLocationData() {
            if (typeof getSelectedLocationHierarchy === 'function') {
                console.log('📍 Location hierarchy:', getSelectedLocationHierarchy());
            }
        },
        
        validateAllFields() {
            const requiredFields = window.UoEForm.config.requiredFields;
            const missing = [];
            
            requiredFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (!field || !field.value.trim()) {
                    missing.push(fieldId);
                }
            });
            
            console.log('🔍 Validation check:', {
                total: requiredFields.length,
                filled: requiredFields.length - missing.length,
                missing: missing,
                complete: missing.length === 0
            });
        },
        
        clearAllData() {
            localStorage.clear();
            sessionStorage.clear();
            console.log('🗑️ All local data cleared');
        }
    };
    
    // Add debug commands to global scope
    window.debugForm = window.UoEForm.debug.logFormData;
    window.debugLocation = window.UoEForm.debug.logLocationData;
    window.debugValidation = window.UoEForm.debug.validateAllFields;
    window.debugClear = window.UoEForm.debug.clearAllData;
    
    console.log('🛠️ Debug mode enabled. Available commands: debugForm(), debugLocation(), debugValidation(), debugClear()');
}

console.log('📋 Configuration module loaded');
console.log('🌍 Environment:', window.UoEForm.environment.isDevelopment ? 'Development' : 'Production');
console.log('📱 Device:', window.UoEForm.environment.isMobile ? 'Mobile' : 'Desktop');
console.log('🌐 Browser:', window.UoEForm.environment.browserName);