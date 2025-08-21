// dual-form-manager.js - Dual Form Management System
// University of Eldoret Student Form - Dual Form Controller

/**
 * Manages both Student Personal Details and Media Release forms
 * - Ensures both forms are completed before submission
 * - Synchronizes data between forms
 * - Handles combined validation and submission
 */

window.DualFormManager = {
    
    // ========================================
    // STATE MANAGEMENT
    // ========================================
    
    state: {
        studentFormComplete: false,
        mediaFormComplete: false,
        studentFormSubmitted: false,
        mediaFormSubmitted: false,
        currentForm: 'student-form',
        dataConsent: false,
        dataRights: false
    },
    
    // ========================================
    // INITIALIZATION
    // ========================================
    
    initialize() {
        console.log('🔄 Initializing Dual Form Manager...');
        
        this.setupFormSynchronization();
        this.setupValidationListeners();
        this.setupAutoSave();
        this.loadSavedData();
        this.updateUI();
        
        console.log('✅ Dual Form Manager initialized');
    },
    
    // ========================================
    // FORM NAVIGATION
    // ========================================
    
    showForm(formId) {
        // Hide all form containers
        document.querySelectorAll('.form-container').forEach(container => {
            container.classList.remove('active');
        });
        
        // Show selected form
        const selectedForm = document.getElementById(formId);
        if (selectedForm) {
            selectedForm.classList.add('active');
        }
        
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        
        const activeTab = formId === 'student-form' ? 'student-tab' : 'media-tab';
        document.getElementById(activeTab).classList.add('active');
        
        this.state.currentForm = formId;
        this.updateUI();
    },
    
    // ========================================
    // DATA SYNCHRONIZATION
    // ========================================
    
    setupFormSynchronization() {
        // Sync basic data from student form to media form
        const syncFields = [
            { student: 'fullName', media: 'mediaFullName' },
            { student: 'nationalId', media: 'mediaIdNumber' }
        ];
        
        syncFields.forEach(field => {
            const studentField = document.getElementById(field.student);
            const mediaField = document.getElementById(field.media);
            
            if (studentField && mediaField) {
                studentField.addEventListener('input', () => {
                    mediaField.value = studentField.value;
                    this.updateFormStatus();
                });
            }
        });
        
        // Auto-sync date for media form
        const today = new Date().toISOString().split('T')[0];
        const mediaDateField = document.getElementById('mediaDate');
        const mediaSignatureNameField = document.getElementById('mediaSignatureName');
        
        if (mediaDateField) {
            mediaDateField.value = today;
        }
        
        // Sync signature name with full name
        const studentNameField = document.getElementById('fullName');
        if (studentNameField && mediaSignatureNameField) {
            studentNameField.addEventListener('input', () => {
                mediaSignatureNameField.value = studentNameField.value;
            });
        }
    },
    
    // ========================================
    // VALIDATION MANAGEMENT
    // ========================================
    
    setupValidationListeners() {
        // Monitor student form completion
        const studentForm = document.getElementById('studentForm');
        if (studentForm) {
            studentForm.addEventListener('input', () => {
                this.validateStudentForm();
                this.updateFormStatus();
            });
            
            studentForm.addEventListener('change', () => {
                this.validateStudentForm();
                this.updateFormStatus();
            });
        }
        
        // Monitor media form completion
        const mediaForm = document.getElementById('mediaConsentForm');
        if (mediaForm) {
            mediaForm.addEventListener('input', () => {
                this.validateMediaForm();
                this.updateFormStatus();
            });
        }
        
        // Monitor consent checkboxes
        const dataConsent = document.getElementById('dataConsent');
        const dataRights = document.getElementById('dataRights');
        
        if (dataConsent) {
            dataConsent.addEventListener('change', () => {
                this.state.dataConsent = dataConsent.checked;
                this.updateFormStatus();
            });
        }
        
        if (dataRights) {
            dataRights.addEventListener('change', () => {
                this.state.dataRights = dataRights.checked;
                this.updateFormStatus();
            });
        }
    },
    
    validateStudentForm() {
        const requiredFields = [
            'fullName', 'admissionNumber', 'phoneNumber', 'nationalId', 
            'nationality', 'gender', 'dateOfBirth', 'placeOfBirth', 
            'permanentResidence', 'location', 'county', 'emergency1Name', 
            'emergency1Relationship', 'emergency1Phone'
        ];
        
        let isValid = true;
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !field.value.trim()) {
                isValid = false;
            }
        });
        
        // Check county selection
        const countySelect = document.getElementById('county');
        if (!countySelect || !countySelect.value) {
            isValid = false;
        }
        
        this.state.studentFormComplete = isValid;
        return isValid;
    },
    
    validateMediaForm() {
        const mediaName = document.getElementById('mediaFullName');
        const mediaId = document.getElementById('mediaIdNumber');
        const mediaDate = document.getElementById('mediaDate');
        const mediaSignatureName = document.getElementById('mediaSignatureName');
        
        const isValid = mediaName && mediaName.value.trim() &&
                       mediaId && mediaId.value.trim() &&
                       mediaDate && mediaDate.value &&
                       mediaSignatureName && mediaSignatureName.value.trim();
        
        this.state.mediaFormComplete = isValid;
        return isValid;
    },
    
    validateConsent() {
        return this.state.dataConsent && this.state.dataRights;
    },
    
    validateBothForms() {
        this.validateStudentForm();
        this.validateMediaForm();
        
        return this.state.studentFormComplete && 
               this.state.mediaFormComplete && 
               this.validateConsent();
    },
    
    // ========================================
    // UI STATUS UPDATES
    // ========================================
    
    updateFormStatus() {
        this.validateStudentForm();
        this.validateMediaForm();
        
        // Update student form status
        const studentStatus = document.getElementById('student-status');
        if (studentStatus) {
            studentStatus.textContent = this.state.studentFormComplete ? '✅ Complete' : '❌ Incomplete';
            studentStatus.style.color = this.state.studentFormComplete ? '#28a745' : '#dc3545';
        }
        
        // Update media form status
        const mediaStatus = document.getElementById('media-status');
        if (mediaStatus) {
            mediaStatus.textContent = this.state.mediaFormComplete ? '✅ Complete' : '❌ Incomplete';
            mediaStatus.style.color = this.state.mediaFormComplete ? '#28a745' : '#dc3545';
        }
        
        this.updateUI();
    },
    
    updateUI() {
        const allFormsComplete = this.validateBothForms();
        
        // Update overall status
        const overallStatus = document.getElementById('overall-status');
        if (overallStatus) {
            const statusIcon = overallStatus.querySelector('.status-icon');
            const statusText = overallStatus.querySelector('.status-text');
            
            if (allFormsComplete) {
                statusIcon.textContent = '✅';
                statusText.textContent = 'Ready to submit and print!';
                overallStatus.classList.add('complete');
            } else {
                statusIcon.textContent = '❌';
                statusText.textContent = 'Complete both forms to proceed';
                overallStatus.classList.remove('complete');
            }
        }
        
        // Update action buttons
        const submitBtn = document.getElementById('submitBtn');
        const printBtn = document.getElementById('printBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        
        if (submitBtn) submitBtn.disabled = !allFormsComplete;
        if (printBtn) printBtn.disabled = !allFormsComplete;
        if (downloadBtn) downloadBtn.disabled = !allFormsComplete;
    },
    
    // ========================================
    // AUTO SAVE FUNCTIONALITY
    // ========================================
    
    setupAutoSave() {
        setInterval(() => {
            this.saveAllData();
        }, 30000); // Save every 30 seconds
        
        // Save on page unload
        window.addEventListener('beforeunload', () => {
            this.saveAllData();
        });
    },
    
    saveAllData() {
        const studentData = this.getStudentFormData();
        const mediaData = this.getMediaFormData();
        const consentData = {
            dataConsent: this.state.dataConsent,
            dataRights: this.state.dataRights
        };
        
        const allData = {
            student: studentData,
            media: mediaData,
            consent: consentData,
            timestamp: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('uoe_dual_form_data', JSON.stringify(allData));
        } catch (error) {
            console.warn('Could not save form data to localStorage:', error);
        }
    },
    
    loadSavedData() {
        try {
            const savedData = localStorage.getItem('uoe_dual_form_data');
            if (savedData) {
                const data = JSON.parse(savedData);
                
                // Restore student form data
                if (data.student) {
                    this.populateStudentForm(data.student);
                }
                
                // Restore media form data
                if (data.media) {
                    this.populateMediaForm(data.media);
                }
                
                // Restore consent data
                if (data.consent) {
                    const dataConsent = document.getElementById('dataConsent');
                    const dataRights = document.getElementById('dataRights');
                    
                    if (dataConsent) {
                        dataConsent.checked = data.consent.dataConsent;
                        this.state.dataConsent = data.consent.dataConsent;
                    }
                    
                    if (dataRights) {
                        dataRights.checked = data.consent.dataRights;
                        this.state.dataRights = data.consent.dataRights;
                    }
                }
                
                this.updateFormStatus();
                console.log('✅ Saved form data restored');
            }
        } catch (error) {
            console.warn('Could not load saved form data:', error);
        }
    },
    
    // ========================================
    // DATA EXTRACTION
    // ========================================
    
    getStudentFormData() {
        // Use the existing getFormDataForFirebase function
        if (typeof getFormDataForFirebase === 'function') {
            return getFormDataForFirebase();
        }
        
        // Fallback: basic data extraction
        const formData = {};
        const studentForm = document.getElementById('studentForm');
        if (studentForm) {
            const inputs = studentForm.querySelectorAll('input, select');
            inputs.forEach(input => {
                if (input.id) {
                    if (input.type === 'checkbox') {
                        formData[input.id] = input.checked;
                    } else {
                        formData[input.id] = input.value;
                    }
                }
            });
        }
        return formData;
    },
    
    getMediaFormData() {
        return {
            fullName: document.getElementById('mediaFullName')?.value || '',
            idNumber: document.getElementById('mediaIdNumber')?.value || '',
            date: document.getElementById('mediaDate')?.value || '',
            signatureName: document.getElementById('mediaSignatureName')?.value || '',
            formType: 'media_release',
            submissionDate: new Date().toISOString()
        };
    },
    
    // ========================================
    // FORM POPULATION
    // ========================================
    
    populateStudentForm(data) {
        Object.keys(data).forEach(key => {
            const field = document.getElementById(key);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = data[key];
                } else {
                    field.value = data[key];
                }
            }
        });
    },
    
    populateMediaForm(data) {
        Object.keys(data).forEach(key => {
            const field = document.getElementById(key);
            if (field) {
                field.value = data[key];
            }
        });
    },
    
    // ========================================
    // SUBMISSION MANAGEMENT
    // ========================================
    
    async submitBothForms() {
        if (!this.validateBothForms()) {
            alert('❌ Please complete both forms and accept the data protection terms before submitting.');
            return false;
        }
        
        try {
            this.showLoading('Submitting both forms...');
            
            // Submit student form
            const studentData = this.getStudentFormData();
            await this.submitToFirebase(studentData, 'student_submissions');
            this.state.studentFormSubmitted = true;
            
            // Submit media form
            const mediaData = this.getMediaFormData();
            await this.submitToFirebase(mediaData, 'media_submissions');
            this.state.mediaFormSubmitted = true;
            
            this.hideLoading();
            this.showSuccessMessage();
            
            // Clear saved data after successful submission
            localStorage.removeItem('uoe_dual_form_data');
            
            console.log('✅ Both forms submitted successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error submitting forms:', error);
            this.hideLoading();
            alert('❌ Error submitting forms. Please try again.');
            return false;
        }
    },
    
    async submitToFirebase(data, collection) {
        const { collection: firestoreCollection, addDoc, serverTimestamp } = 
            await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        
        data.submissionDate = serverTimestamp();
        
        const docRef = await addDoc(firestoreCollection(window.db, collection), data);
        console.log(`✅ Document written to ${collection} with ID:`, docRef.id);
        
        return docRef;
    },
    
    // ========================================
    // PRINT AND PDF MANAGEMENT
    // ========================================
    
    printBothForms() {
        if (!this.validateBothForms()) {
            alert('❌ Please complete both forms before printing.');
            return;
        }
        
        this.hideWebElements();
        this.showPrintNotice();
        
        window.print();
        
        setTimeout(() => {
            this.restoreWebElements();
            this.hidePrintNotice();
        }, 1000);
    },
    
    async downloadBothPDFs() {
        if (!this.validateBothForms()) {
            alert('❌ Please complete both forms before downloading.');
            return;
        }
        
        try {
            this.showLoading('Generating PDFs...');
            
            // Generate student form PDF
            await this.generatePDF('student-form', 'Student_Personal_Details');
            
            // Small delay between PDFs
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Generate media form PDF
            await this.generatePDF('media-consent', 'Media_Release_Form');
            
            this.hideLoading();
            this.showPDFSuccessMessage();
            
        } catch (error) {
            console.error('❌ Error generating PDFs:', error);
            this.hideLoading();
            alert('❌ Error generating PDFs. Please try again or use the Print option.');
        }
    },
    
    async generatePDF(formId, baseFileName) {
        this.hideWebElements();
        
        const container = document.querySelector(`#${formId} .container`);
        container.classList.add('pdf-generation');
        
        // Clean up input styling
        const inputs = container.querySelectorAll('.field-input, .location-dropdown, .inline-input');
        inputs.forEach(input => {
            input.style.webkitBoxShadow = '0 0 0 30px white inset';
            input.style.boxShadow = '0 0 0 30px white inset';
            input.style.background = 'white';
            input.style.color = 'black';
            input.style.borderBottom = '1px solid #000';
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
        
        const fileName = this.generateFileName(baseFileName);
        pdf.save(fileName);
        
        container.classList.remove('pdf-generation');
        this.restoreWebElements();
    },
    
    generateFileName(baseFileName) {
        const fullNameField = document.getElementById('fullName');
        const admissionField = document.getElementById('admissionNumber');
        
        const name = fullNameField && fullNameField.value ? 
            fullNameField.value.replace(/[^a-zA-Z0-9]/g, '_') : 'Student';
        const admission = admissionField && admissionField.value ? 
            admissionField.value.replace(/[^a-zA-Z0-9]/g, '_') : '';
        
        const timestamp = new Date().toISOString().split('T')[0];
        
        return `UoE_${baseFileName}_${name}_${admission}_${timestamp}.pdf`;
    },
    
    // ========================================
    // UI HELPER METHODS
    // ========================================
    
    hideWebElements() {
        const elementsToHide = document.querySelectorAll(`
            .form-navigation,
            .form-actions, 
            .success-message,
            .important-instructions,
            .data-protection-section
        `);
        
        elementsToHide.forEach(el => {
            if (el) {
                el.style.display = 'none';
            }
        });
    },
    
    restoreWebElements() {
        const elementsToRestore = document.querySelectorAll(`
            .form-navigation,
            .form-actions, 
            .success-message,
            .important-instructions,
            .data-protection-section
        `);
        
        elementsToRestore.forEach(el => {
            if (el) {
                el.style.display = '';
            }
        });
    },
    
    showPrintNotice() {
        const notice = document.createElement('div');
        notice.id = 'printNotice';
        notice.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2a5298;
            color: white;
            padding: 15px;
            border-radius: 10px;
            z-index: 9999;
            font-size: 14px;
            max-width: 350px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        notice.innerHTML = `
            <strong>📋 Remember:</strong><br>
            Print <strong>4 copies of EACH form</strong> and attach passport photos on yellow background to each copy of the Student Personal Details form.
        `;
        document.body.appendChild(notice);
    },
    
    hidePrintNotice() {
        const notice = document.getElementById('printNotice');
        if (notice && document.body.contains(notice)) {
            document.body.removeChild(notice);
        }
    },
    
    showLoading(message) {
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
    
    showSuccessMessage() {
        const successMessage = document.getElementById('successMessage');
        if (successMessage) {
            successMessage.innerHTML = `
                <h3>✅ Submission Successful!</h3>
                <p>Both forms have been submitted successfully to the University of Eldoret system.</p>
                <p><strong>Next Steps:</strong></p>
                <ul style="text-align: left; max-width: 500px; margin: 10px auto;">
                    <li>Print 4 copies of both forms using the Print button</li>
                    <li>Attach passport photos (yellow background) to each copy of the Student Personal Details form</li>
                    <li>Submit all physical copies to the Registrar Academic office</li>
                </ul>
                <p>Thank you for choosing University of Eldoret!</p>
            `;
            successMessage.style.display = 'block';
            
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 15000);
        }
    },
    
    showPDFSuccessMessage() {
        const successMessage = document.getElementById('successMessage');
        if (successMessage) {
            successMessage.innerHTML = `
                <h3>📄 PDFs Generated Successfully!</h3>
                <p>Both forms have been downloaded as separate PDF files.</p>
                <p><strong>Remember:</strong> Print 4 copies of each PDF and attach passport photos to the Student Personal Details forms before submitting to the Registrar Academic office.</p>
            `;
            successMessage.style.display = 'block';
            
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 10000);
        }
    },
    
    // ========================================
    // FORM CLEARING
    // ========================================
    
    clearAllForms() {
        if (confirm('Are you sure you want to clear ALL form data? This action cannot be undone and will clear both the Student Personal Details and Media Release forms.')) {
            // Clear student form
            const studentForm = document.getElementById('studentForm');
            if (studentForm) {
                studentForm.reset();
            }
            
            // Clear media form
            const mediaForm = document.getElementById('mediaConsentForm');
            if (mediaForm) {
                mediaForm.reset();
            }
            
            // Clear consent checkboxes
            const dataConsent = document.getElementById('dataConsent');
            const dataRights = document.getElementById('dataRights');
            
            if (dataConsent) dataConsent.checked = false;
            if (dataRights) dataRights.checked = false;
            
            // Reset location dropdowns
            this.resetLocationDropdowns();
            
            // Clear all validation styling
            document.querySelectorAll('.field-input, .location-dropdown, .inline-input').forEach(field => {
                field.classList.remove('error', 'valid', 'location-error');
            });
            
            // Reset state
            this.state = {
                studentFormComplete: false,
                mediaFormComplete: false,
                studentFormSubmitted: false,
                mediaFormSubmitted: false,
                currentForm: 'student-form',
                dataConsent: false,
                dataRights: false
            };
            
            // Clear saved data
            localStorage.removeItem('uoe_dual_form_data');
            
            // Hide success message
            const successMessage = document.getElementById('successMessage');
            if (successMessage) {
                successMessage.style.display = 'none';
            }
            
            // Update UI
            this.updateFormStatus();
            
            // Scroll to top and show first form
            window.scrollTo({ top: 0, behavior: 'smooth' });
            this.showForm('student-form');
            
            console.log('✅ All forms cleared');
        }
    },
    
    resetLocationDropdowns() {
        const subCountySelect = document.getElementById('subCounty');
        const constituencySelect = document.getElementById('constituency');
        const wardSelect = document.getElementById('ward');
        
        if (subCountySelect) {
            subCountySelect.disabled = true;
            subCountySelect.innerHTML = '<option value="">Select county first</option>';
        }
        
        if (constituencySelect) {
            constituencySelect.disabled = true;
            constituencySelect.innerHTML = '<option value="">Select sub-county first</option>';
        }
        
        if (wardSelect) {
            wardSelect.disabled = true;
            wardSelect.innerHTML = '<option value="">Select constituency first</option>';
        }
    }
};

// ========================================
// GLOBAL FUNCTIONS FOR HTML ONCLICK HANDLERS
// ========================================

window.showForm = function(formId) {
    window.DualFormManager.showForm(formId);
};

window.validateAndSubmitBothForms = async function() {
    return await window.DualFormManager.submitBothForms();
};

window.printBothForms = function() {
    window.DualFormManager.printBothForms();
};

window.downloadBothPDFs = async function() {
    return await window.DualFormManager.downloadBothPDFs();
};

window.clearAllForms = function() {
    window.DualFormManager.clearAllForms();
};

// ========================================
// INITIALIZATION
// ========================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.DualFormManager.initialize();
    });
} else {
    window.DualFormManager.initialize();
}

console.log('✅ Dual Form Manager module loaded');