// smooth-flow.js - Smooth Form Flow Management
// University of Eldoret Student Form - Dual Form Flow Controller

// ========================================
// FORM FLOW STATE
// ========================================

const FormFlow = {
    currentStep: 1,
    studentFormCompleted: false,
    mediaFormCompleted: false,
    bothFormsSubmitted: false,
    
    // Form validation status
    studentFormValid: false,
    mediaFormValid: false,
    consentValid: false
};

// ========================================
// FORM NAVIGATION FUNCTIONS
// ========================================

function proceedToMediaForm() {
    // Validate student form first
    if (!validateStudentForm()) {
        alert('❌ Please complete all required fields in the Student Personal Details form before proceeding.');
        return;
    }
    
    // Auto-fill media form with student data
    syncDataToMediaForm();
    
    // Show media form with smooth transition
    showFormSection('mediaFormSection');
    updateProgressStep(2);
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    FormFlow.currentStep = 2;
    FormFlow.studentFormCompleted = true;
    
    console.log('✅ Proceeded to Media Consent form');
}

function goBackToStudentForm() {
    // Show student form with smooth transition
    showFormSection('studentFormSection');
    updateProgressStep(1);
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    FormFlow.currentStep = 1;
    
    console.log('↩️ Returned to Student Personal Details form');
}

function showFormSection(sectionId) {
    // Hide all form sections
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section with animation
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        setTimeout(() => {
            targetSection.classList.add('active');
        }, 300);
    }
}

function updateProgressStep(step) {
    // Update progress indicators
    document.querySelectorAll('.progress-step').forEach((stepEl, index) => {
        if (index + 1 <= step) {
            stepEl.classList.add('active');
        } else {
            stepEl.classList.remove('active');
        }
    });
    
    // Update progress line
    const progressLine = document.getElementById('progressLine');
    if (progressLine) {
        if (step === 2) {
            progressLine.classList.add('completed');
        } else {
            progressLine.classList.remove('completed');
        }
    }
}

// ========================================
// DATA SYNCHRONIZATION
// ========================================

function syncDataToMediaForm() {
    // Get data from student form
    const fullName = document.getElementById('fullName').value;
    const nationalId = document.getElementById('nationalId').value;
    
    // Auto-fill media form
    const mediaFullName = document.getElementById('mediaFullName');
    const mediaIdNumber = document.getElementById('mediaIdNumber');
    const mediaDate = document.getElementById('mediaDate');
    const mediaSignatureName = document.getElementById('mediaSignatureName');
    
    if (mediaFullName) mediaFullName.value = fullName;
    if (mediaIdNumber) mediaIdNumber.value = nationalId;
    if (mediaSignatureName) mediaSignatureName.value = fullName;
    
    // Set today's date
    if (mediaDate) {
        const today = new Date().toISOString().split('T')[0];
        mediaDate.value = today;
    }
    
    console.log('🔄 Data synced to Media form');
}

// ========================================
// FORM VALIDATION
// ========================================

function validateStudentForm() {
    const requiredFields = [
        'fullName', 'admissionNumber', 'phoneNumber', 'nationalId', 
        'nationality', 'gender', 'dateOfBirth', 'placeOfBirth', 'permanentResidence', 
        'location', 'county', 'emergency1Name', 'emergency1Relationship', 'emergency1Phone'
    ];
    
    let isValid = true;
    let missingFields = [];
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && !field.value.trim()) {
            field.classList.add('error');
            isValid = false;
            missingFields.push(getFieldLabel(fieldId));
        } else if (field) {
            field.classList.remove('error');
            field.classList.add('valid');
        }
    });
    
    // Check county selection
    const countySelect = document.getElementById('county');
    if (!countySelect || !countySelect.value) {
        if (countySelect) {
            countySelect.classList.add('location-error');
        }
        isValid = false;
        if (!missingFields.includes('County')) {
            missingFields.push('County');
        }
    }
    
    if (!isValid && missingFields.length > 0) {
        // Show which fields are missing
        const firstError = document.querySelector('.field-input.error, .location-dropdown.location-error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstError.focus();
        }
    }
    
    FormFlow.studentFormValid = isValid;
    return isValid;
}

function validateMediaForm() {
    const requiredFields = ['mediaFullName', 'mediaIdNumber', 'mediaDate', 'mediaSignatureName'];
    let isValid = true;
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && !field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        } else if (field) {
            field.classList.remove('error');
            field.classList.add('valid');
        }
    });
    
    FormFlow.mediaFormValid = isValid;
    return isValid;
}

function validateConsent() {
    const dataConsent = document.getElementById('dataConsent');
    const dataRights = document.getElementById('dataRights');
    
    const isValid = dataConsent && dataConsent.checked && dataRights && dataRights.checked;
    FormFlow.consentValid = isValid;
    return isValid;
}

function validateAllForms() {
    return validateStudentForm() && validateMediaForm() && validateConsent();
}

// ========================================
// FORM SUBMISSION
// ========================================

async function submitBothForms() {
    console.log('🚀 Submitting both forms...');
    
    // Validate everything
    if (!validateAllForms()) {
        if (!FormFlow.studentFormValid) {
            alert('❌ Please complete all required fields in the Student Personal Details form.');
            goBackToStudentForm();
            return;
        }
        
        if (!FormFlow.mediaFormValid) {
            alert('❌ Please complete all required fields in the Media Release form.');
            return;
        }
        
        if (!FormFlow.consentValid) {
            alert('❌ Please accept both data protection consent terms.');
            const consentSection = document.querySelector('.data-protection-section');
            if (consentSection) {
                consentSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                highlightConsentSection();
            }
            return;
        }
    }
    
    if (!window.db) {
        alert('❌ Database connection error. Please check your internet connection and try again.');
        return;
    }
    
    try {
        showLoadingMessage('Submitting both forms to University database...');
        
        // Submit student form
        const studentData = getFormDataForFirebase();
        await submitToCollection(studentData, 'student_submissions');
        console.log('✅ Student form submitted');
        
        // Submit media form  
        const mediaData = getMediaFormData();
        await submitToCollection(mediaData, 'media_submissions');
        console.log('✅ Media form submitted');
        
        // Update statistics
        await updateSubmissionStats();
        
        hideLoadingMessage();
        showCompletionSuccess();
        
        FormFlow.bothFormsSubmitted = true;
        
        // Clear saved data
        localStorage.removeItem('uoe_student_form');
        localStorage.removeItem('uoe_media_form');
        
    } catch (error) {
        console.error('❌ Error submitting forms:', error);
        hideLoadingMessage();
        
        let errorMessage = 'Submission failed. Please try again.';
        
        if (error.code === 'permission-denied') {
            errorMessage = 'Permission denied. Please check your connection and try again.';
        } else if (error.code === 'unavailable') {
            errorMessage = 'Service temporarily unavailable. Please try again in a few minutes.';
        }
        
        alert('❌ ' + errorMessage);
    }
}

async function submitToCollection(data, collection) {
    const { collection: firestoreCollection, addDoc, serverTimestamp } = 
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    
    data.submissionDate = serverTimestamp();
    
    const docRef = await addDoc(firestoreCollection(window.db, collection), data);
    console.log(`✅ Document written to ${collection} with ID:`, docRef.id);
    
    return docRef;
}

function getMediaFormData() {
    const now = new Date();
    
    return {
        formType: 'media_release',
        submissionDate: now.toISOString(),
        submissionYear: now.getFullYear(),
        submissionMonth: now.getMonth() + 1,
        submissionDay: now.getDate(),
        formVersion: "2.5",
        
        personalInfo: {
            fullName: document.getElementById('mediaFullName').value.toUpperCase(),
            idNumber: document.getElementById('mediaIdNumber').value,
            signatureName: document.getElementById('mediaSignatureName').value.toUpperCase(),
            date: document.getElementById('mediaDate').value
        },
        
        consent: {
            mediaRelease: true,
            dataProcessing: document.getElementById('dataConsent').checked,
            rightsAcknowledgment: document.getElementById('dataRights').checked,
            consentDate: now.toISOString()
        },
        
        metadata: {
            userAgent: navigator.userAgent,
            processingStatus: "completed"
        }
    };
}

// ========================================
// SUCCESS AND COMPLETION
// ========================================

function showCompletionSuccess() {
    // Hide form sections
    document.querySelectorAll('.form-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Hide consent section
    const consentSection = document.querySelector('.data-protection-section');
    if (consentSection) {
        consentSection.style.display = 'none';
    }
    
    // Show final actions
    const finalActions = document.getElementById('finalActions');
    if (finalActions) {
        finalActions.style.display = 'block';
        finalActions.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Update progress to show completion
    document.querySelectorAll('.progress-step').forEach(step => {
        step.classList.add('active', 'completed');
    });
    
    const progressLine = document.getElementById('progressLine');
    if (progressLine) {
        progressLine.classList.add('completed');
    }
    
    // Show success message
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.innerHTML = `
            <h3>🎉 Registration Submitted Successfully!</h3>
            <p>Both your Student Personal Details and Media Release forms have been submitted to the University of Eldoret system.</p>
            <p><strong>Submission ID:</strong> ${new Date().getTime()}</p>
        `;
        successMessage.style.display = 'block';
        
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 8000);
    }
    
    console.log('🎉 Both forms completed and submitted successfully');
}

// ========================================
// PRINT AND PDF FUNCTIONS
// ========================================

function printBothForms() {
    if (!FormFlow.bothFormsSubmitted) {
        alert('❌ Please submit both forms before printing.');
        return;
    }
    
    // Show both forms for printing
    showFormsForPrint();
    
    const printNotice = document.createElement('div');
    printNotice.id = 'printNotice';
    printNotice.style.cssText = `
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
    printNotice.innerHTML = `
        <strong>📋 Printing Instructions:</strong><br>
        • Print <strong>4 copies</strong> of each form<br>
        • Attach passport photos to Student form copies<br>
        • Sign each Media Release form copy<br>
        • Submit all 8 copies to Registrar Academic office
    `;
    document.body.appendChild(printNotice);
    
    window.print();
    
    setTimeout(() => {
        restoreAfterPrint();
        const notice = document.getElementById('printNotice');
        if (notice && document.body.contains(notice)) {
            document.body.removeChild(notice);
        }
    }, 1000);
}

async function downloadBothPDFs() {
    if (!FormFlow.bothFormsSubmitted) {
        alert('❌ Please submit both forms before downloading.');
        return;
    }
    
    try {
        showLoadingMessage('Generating PDFs...');
        
        // Generate Student form PDF
        await generateFormPDF('studentFormSection', 'Student_Personal_Details');
        
        // Small delay between PDFs
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate Media form PDF
        await generateFormPDF('mediaFormSection', 'Media_Release_Form');
        
        hideLoadingMessage();
        showPDFSuccessMessage();
        
    } catch (error) {
        console.error('❌ Error generating PDFs:', error);
        hideLoadingMessage();
        alert('❌ Error generating PDFs. Please try again or use the Print option.');
    }
}

async function generateFormPDF(sectionId, baseFileName) {
    // Show the specific form section
    document.querySelectorAll('.form-section').forEach(section => {
        section.style.display = 'none';
    });
    
    const formSection = document.getElementById(sectionId);
    const container = formSection.querySelector('.container');
    
    formSection.style.display = 'block';
    container.classList.add('pdf-generation');
    
    // Clean up input styling
    const inputs = container.querySelectorAll('.field-input, .location-dropdown, .inline-input, .signature-date-input, .signature-name-input');
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
    
    const fileName = generateFileName(baseFileName);
    pdf.save(fileName);
    
    container.classList.remove('pdf-generation');
    formSection.style.display = 'none';
}

function generateFileName(baseFileName) {
    const fullNameField = document.getElementById('fullName');
    const admissionField = document.getElementById('admissionNumber');
    
    const name = fullNameField && fullNameField.value ? 
        fullNameField.value.replace(/[^a-zA-Z0-9]/g, '_') : 'Student';
    const admission = admissionField && admissionField.value ? 
        admissionField.value.replace(/[^a-zA-Z0-9]/g, '_') : '';
    
    const timestamp = new Date().toISOString().split('T')[0];
    
    return `UoE_${baseFileName}_${name}_${admission}_${timestamp}.pdf`;
}

function showPDFSuccessMessage() {
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.innerHTML = `
            <h3>📄 PDFs Generated Successfully!</h3>
            <p>Both forms have been downloaded as separate PDF files.</p>
            <p><strong>Remember:</strong> Print 4 copies of each PDF before submitting to the Registrar Academic office.</p>
        `;
        successMessage.style.display = 'block';
        
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 10000);
    }
}

function showFormsForPrint() {
    // Hide web elements
    const elementsToHide = document.querySelectorAll(`
        .progress-container,
        .form-navigation,
        .final-actions,
        .data-protection-section,
        .success-message
    `);
    
    elementsToHide.forEach(el => {
        if (el) {
            el.style.display = 'none';
        }
    });
    
    // Show both form sections
    document.querySelectorAll('.form-section').forEach(section => {
        section.style.display = 'block';
        section.style.pageBreakAfter = 'always';
    });
}

function restoreAfterPrint() {
    // Hide form sections
    document.querySelectorAll('.form-section').forEach(section => {
        section.style.display = 'none';
        section.style.pageBreakAfter = '';
    });
    
    // Restore web elements
    const elementsToRestore = document.querySelectorAll(`
        .progress-container,
        .final-actions
    `);
    
    elementsToRestore.forEach(el => {
        if (el) {
            el.style.display = '';
        }
    });
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function highlightConsentSection() {
    const consentSection = document.querySelector('.data-protection-section');
    if (consentSection) {
        consentSection.style.border = '3px solid #dc3545';
        consentSection.style.borderRadius = '10px';
        consentSection.style.padding = '25px';
        
        setTimeout(() => {
            consentSection.style.border = '';
            consentSection.style.borderRadius = '';
            consentSection.style.padding = '';
        }, 5000);
    }
}

function clearAllForms() {
    if (confirm('Are you sure you want to clear all form data? This action cannot be undone.')) {
        // Clear both forms
        const studentForm = document.getElementById('studentForm');
        const mediaForm = document.getElementById('mediaConsentForm');
        
        if (studentForm) studentForm.reset();
        if (mediaForm) mediaForm.reset();
        
        // Clear validation styling
        document.querySelectorAll('.field-input, .location-dropdown, .inline-input, .signature-date-input, .signature-name-input').forEach(field => {
            field.classList.remove('error', 'valid', 'location-error');
        });
        
        // Clear consent checkboxes
        const dataConsent = document.getElementById('dataConsent');
        const dataRights = document.getElementById('dataRights');
        if (dataConsent) dataConsent.checked = false;
        if (dataRights) dataRights.checked = false;
        
        // Reset location dropdowns
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
        
        // Reset form flow state
        FormFlow.currentStep = 1;
        FormFlow.studentFormCompleted = false;
        FormFlow.mediaFormCompleted = false;
        FormFlow.bothFormsSubmitted = false;
        FormFlow.studentFormValid = false;
        FormFlow.mediaFormValid = false;
        FormFlow.consentValid = false;
        
        // Show student form
        goBackToStudentForm();
        
        // Hide success messages and final actions
        const successMessage = document.getElementById('successMessage');
        const finalActions = document.getElementById('finalActions');
        
        if (successMessage) successMessage.style.display = 'none';
        if (finalActions) finalActions.style.display = 'none';
        
        // Show form sections and other elements
        document.querySelectorAll('.form-section').forEach(section => {
            section.style.display = '';
        });
        
        const consentSection = document.querySelector('.data-protection-section');
        if (consentSection) {
            consentSection.style.display = '';
        }
        
        // Clear saved data
        localStorage.removeItem('uoe_student_form');
        localStorage.removeItem('uoe_media_form');
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log('✅ All forms cleared and reset');
    }
}

function showLoadingMessage(message) {
    const overlay = document.getElementById('loadingOverlay');
    const text = document.getElementById('loadingText');
    
    if (overlay) {
        overlay.style.display = 'flex';
    }
    
    if (text) {
        text.textContent = message;
    }
}

function hideLoadingMessage() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// ========================================
// REAL-TIME VALIDATION
// ========================================

function setupRealTimeValidation() {
    // Student form validation
    const studentForm = document.getElementById('studentForm');
    if (studentForm) {
        studentForm.addEventListener('input', () => {
            FormFlow.studentFormValid = validateStudentForm();
            updateNextButton();
        });
        
        studentForm.addEventListener('change', () => {
            FormFlow.studentFormValid = validateStudentForm();
            updateNextButton();
        });
    }
    
    // Media form validation
    const mediaForm = document.getElementById('mediaConsentForm');
    if (mediaForm) {
        mediaForm.addEventListener('input', () => {
            FormFlow.mediaFormValid = validateMediaForm();
            updateSubmitButton();
        });
    }
    
    // Consent validation
    const dataConsent = document.getElementById('dataConsent');
    const dataRights = document.getElementById('dataRights');
    
    [dataConsent, dataRights].forEach(checkbox => {
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                FormFlow.consentValid = validateConsent();
                updateSubmitButton();
            });
        }
    });
}

function updateNextButton() {
    const nextBtn = document.getElementById('nextFormBtn');
    if (nextBtn) {
        if (FormFlow.studentFormValid) {
            nextBtn.disabled = false;
            nextBtn.textContent = 'Next: Media Consent Form →';
            nextBtn.classList.remove('btn-disabled');
        } else {
            nextBtn.disabled = true;
            nextBtn.textContent = 'Complete required fields first';
            nextBtn.classList.add('btn-disabled');
        }
    }
}

function updateSubmitButton() {
    const submitBtn = document.getElementById('submitBothBtn');
    if (submitBtn) {
        const allValid = FormFlow.studentFormValid && FormFlow.mediaFormValid && FormFlow.consentValid;
        
        if (allValid) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Both Forms';
            submitBtn.classList.remove('btn-disabled');
        } else {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Complete all requirements first';
            submitBtn.classList.add('btn-disabled');
        }
    }
}

// ========================================
// INITIALIZATION
// ========================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupRealTimeValidation();
        updateNextButton();
        updateSubmitButton();
        console.log('✅ Smooth flow initialized');
    });
} else {
    setupRealTimeValidation();
    updateNextButton();
    updateSubmitButton();
    console.log('✅ Smooth flow initialized');
}

console.log('🌊 Smooth Flow Management loaded');