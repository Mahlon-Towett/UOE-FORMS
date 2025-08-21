// firebase-integration.js - Firebase Data Submission
// University of Eldoret Student Form - Firebase Module

/**
 * Handles all Firebase-related operations including:
 * - Form data collection and structuring
 * - Firestore document submission
 * - Statistics tracking
 * - Error handling
 */

window.UoEForm = window.UoEForm || {};
window.UoEForm.Firebase = {
    
    // ========================================
    // FORM DATA COLLECTION
    // ========================================
    
    getFormDataForFirebase() {
        const now = new Date();
        const dobString = document.getElementById('dateOfBirth').value;
        const age = dobString ? window.UoEForm.Validator.calculateAge(dobString) : null;
        
        // Get detailed location information
        const locationHierarchy = window.UoEForm.LocationManager.getSelectedLocationHierarchy();
        
        return {
            // Metadata for analytics and tracking
            metadata: {
                submissionDate: now.toISOString(),
                submissionYear: now.getFullYear(),
                submissionMonth: now.getMonth() + 1,
                submissionDay: now.getDate(),
                formVersion: window.UoEForm.config.formVersion,
                processingStatus: "completed",
                ipAddress: null,
                userAgent: navigator.userAgent,
                dataIntegrity: true,
                locationDataSource: window.UoEForm.LocationManager.isLoaded ? "complete" : "fallback"
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
                status: this.getCheckedValue('maritalStatus') || null,
                spouseDetails: document.getElementById('spouseDetails').value || null,
                spouseOccupation: document.getElementById('spouseOccupation').value || null,
                numberOfChildren: parseInt(document.getElementById('numberOfChildren').value) || 0
            },

            // Family Information
            familyInfo: {
                father: {
                    fullName: document.getElementById('fatherName').value || null,
                    status: this.getCheckedValue('fatherStatus') || null,
                    phoneNumber: document.getElementById('fatherPhone').value || null,
                    nationalId: document.getElementById('fatherIdNo').value || null,
                    occupation: document.getElementById('fatherOccupation').value || null,
                    dateOfBirth: document.getElementById('fatherDob').value || null
                },
                mother: {
                    fullName: document.getElementById('motherName').value || null,
                    status: this.getCheckedValue('motherStatus') || null,
                    phoneNumber: document.getElementById('motherPhone').value || null,
                    nationalId: document.getElementById('motherIdNo').value || null,
                    occupation: document.getElementById('motherOccupation').value || null,
                    dateOfBirth: document.getElementById('motherDob').value || null
                },
                siblings: this.getSiblingsArray(),
                siblingCount: this.getSiblingsArray().filter(s => s.trim()).length
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
                ageGroup: this.getAgeGroup(age),
                academicYear: "2024/2025",
                semester: "1",
                locationCompleteness: window.UoEForm.LocationManager.calculateLocationCompleteness(locationHierarchy),
                genderCode: document.getElementById('gender').value ? 
                    document.getElementById('gender').value.charAt(0).toUpperCase() : null,
                formCompleteness: this.calculateFormCompleteness(),
                dataQuality: window.UoEForm.LocationManager.isLoaded ? "complete" : "basic"
            }
        };
    },
    
    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    
    getCheckedValue(name) {
        const checked = document.querySelector(`input[name="${name}"]:checked`);
        return checked ? checked.value : '';
    },
    
    getSiblingsArray() {
        const siblings = [];
        const config = window.UoEForm.config;
        
        config.siblingFields.forEach(fieldId => {
            const siblingName = document.getElementById(fieldId).value;
            if (siblingName.trim()) {
                siblings.push(siblingName.trim());
            }
        });
        
        return siblings;
    },
    
    getAgeGroup(age) {
        if (!age) return null;
        if (age <= 19) return "17-19";
        if (age <= 22) return "20-22";
        if (age <= 25) return "23-25";
        return "26+";
    },
    
    calculateFormCompleteness() {
        const allFields = document.querySelectorAll('#studentForm input, #studentForm select');
        const filledFields = Array.from(allFields).filter(field => {
            if (field.type === 'checkbox') {
                return field.checked;
            }
            return field.value && field.value.trim() !== '';
        });
        
        return Math.round((filledFields.length / allFields.length) * 100);
    },
    
    // ========================================
    // FIREBASE SUBMISSION
    // ========================================
    
    async submitToFirebase() {
        if (window.UoEForm.isSubmitting) {
            console.log('Submission already in progress...');
            return;
        }
        
        if (!window.UoEForm.Validator.validateForm()) {
            return;
        }
        
        if (!window.UoEForm.Validator.checkDataConsent()) {
            return;
        }
        
        if (!window.UoEForm.checkFirebaseReady()) {
            alert('❌ Database connection error. Please check your internet connection and try again.');
            return;
        }
        
        window.UoEForm.isSubmitting = true;
        
        try {
            this.showLoadingMessage('Submitting your form...');
            
            const formData = this.getFormDataForFirebase();
            
            const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            
            formData.metadata.submissionDate = serverTimestamp();
            
            const docRef = await addDoc(collection(window.db, 'student_submissions'), formData);
            
            console.log('✅ Document written with ID: ', docRef.id);
            
            await this.updateSubmissionStats();
            
            this.hideLoadingMessage();
            this.showSuccessMessage();
            
            // Clear saved form data
            localStorage.removeItem(window.UoEForm.config.localStorageKey);
            
            // Scroll to success message
            const successMessage = document.getElementById('successMessage');
            if (successMessage) {
                successMessage.scrollIntoView({ behavior: 'smooth' });
            }
            
        } catch (error) {
            console.error('❌ Error adding document: ', error);
            this.hideLoadingMessage();
            
            let errorMessage = 'Submission failed. Please try again.';
            
            if (error.code === 'permission-denied') {
                errorMessage = 'Permission denied. Please check your connection and try again.';
            } else if (error.code === 'unavailable') {
                errorMessage = 'Service temporarily unavailable. Please try again in a few minutes.';
            }
            
            alert('❌ ' + errorMessage);
        } finally {
            window.UoEForm.isSubmitting = false;
        }
    },
    
    // ========================================
    // STATISTICS TRACKING
    // ========================================
    
    async updateSubmissionStats() {
        try {
            const { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } = 
                await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            
            const today = new Date();
            const dateKey = today.toISOString().split('T')[0];
            
            const statsDocRef = doc(window.db, 'submission_stats', dateKey);
            const statsDoc = await getDoc(statsDocRef);
            
            const locationData = window.UoEForm.LocationManager.getSelectedLocationHierarchy();
            const county = locationData.county ? locationData.county.displayName : 'Unknown';
            const gender = document.getElementById('gender').value;
            const age = window.UoEForm.Validator.calculateAge(document.getElementById('dateOfBirth').value);
            const ageGroup = this.getAgeGroup(age);
            
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
            // Don't fail the main submission if stats update fails
        }
    },
    
    // ========================================
    // USER FEEDBACK
    // ========================================
    
    showLoadingMessage(message) {
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
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        loadingMsg.innerHTML = `
            <div style="margin-bottom: 10px; font-size: 24px;">📄</div>
            <div>${message}</div>
            <div style="margin-top: 10px; font-size: 12px; opacity: 0.8;">Please wait...</div>
        `;
        document.body.appendChild(loadingMsg);
    },
    
    hideLoadingMessage() {
        const loadingMsg = document.getElementById('loadingMessage');
        if (loadingMsg && document.body.contains(loadingMsg)) {
            document.body.removeChild(loadingMsg);
        }
    },
    
    showSuccessMessage() {
        const successMessage = document.getElementById('successMessage');
        if (successMessage) {
            successMessage.innerHTML = `
                <strong>✅ Form Submitted Successfully!</strong><br>
                Your personal details have been recorded with detailed location information. You can now print or download a copy for your records.
            `;
            successMessage.style.display = 'block';
            
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 15000);
        }
    },
    
    // ========================================
    // PUBLIC INTERFACE
    // ========================================
    
    async submit() {
        console.log('🚀 Firebase submission initiated');
        await this.submitToFirebase();
    }
};

console.log('🔥 Firebase Integration module loaded');