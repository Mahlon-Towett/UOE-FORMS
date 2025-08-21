// config.js - Firebase Configuration and Initialization
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
    localStorageKey: 'uoe_student_form'
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

console.log('📋 Configuration module loaded');