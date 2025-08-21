// pdf-generator.js - PDF Generation and Print Functionality
// University of Eldoret Student Form - PDF Module

/**
 * Handles PDF generation and print functionality including:
 * - Form validation before generation
 * - HTML to PDF conversion
 * - Print preparation and cleanup
 * - File naming and downloading
 */

window.UoEForm = window.UoEForm || {};
window.UoEForm.PDFGenerator = {
    
    // ========================================
    // PDF GENERATION
    // ========================================
    
    async generatePDF() {
        if (!window.UoEForm.Validator.validateForm()) {
            return;
        }
        
        if (!window.UoEForm.Validator.checkDataConsent()) {
            return;
        }

        try {
            this.showLoadingMessage('Generating PDF... Please wait');

            // Hide web-only elements
            const elementsToHide = document.querySelectorAll('.form-actions, .success-message, .pre-submission-section');
            elementsToHide.forEach(el => el.style.display = 'none');

            const container = document.querySelector('.container');
            
            // Store original styles
            const originalStyles = this.storeOriginalStyles(container);

            // Apply PDF-specific styling
            this.applyPDFStyling(container);

            // Wait for styling to apply
            await new Promise(resolve => setTimeout(resolve, 200));

            // Generate canvas using html2canvas
            const canvas = await this.createCanvas(container);

            // Create PDF document
            const doc = this.createPDFDocument(canvas);

            // Restore original styling
            this.restoreOriginalStyles(container, originalStyles);

            // Show hidden elements
            elementsToHide.forEach(el => {
                el.style.display = 'block';
                if (el.classList.contains('pre-submission-section')) {
                    el.style.visibility = 'visible';
                    el.style.opacity = '1';
                }
            });

            this.hideLoadingMessage();

            // Generate filename and save
            const fileName = this.generateFileName();
            doc.save(fileName);

            this.showSuccessMessage();

        } catch (error) {
            console.error('Error generating PDF:', error);
            this.handlePDFError();
        }
    },
    
    // ========================================
    // PDF STYLING AND PREPARATION
    // ========================================
    
    storeOriginalStyles(container) {
        return {
            width: container.style.width,
            maxWidth: container.style.maxWidth,
            margin: container.style.margin,
            boxShadow: container.style.boxShadow
        };
    },
    
    applyPDFStyling(container) {
        container.classList.add('pdf-generation');
        
        // Apply styles to all form inputs
        const inputs = document.querySelectorAll('.field-input, .location-dropdown');
        inputs.forEach(input => {
            this.cleanInputForPDF(input);
        });
    },
    
    cleanInputForPDF(input) {
        // Remove validation classes
        input.classList.remove('error', 'valid', 'location-error');
        
        // Force white background and black text
        const pdfStyles = {
            webkitBoxShadow: '0 0 0 30px white inset',
            boxShadow: '0 0 0 30px white inset',
            background: 'white',
            backgroundColor: 'white',
            webkitTextFillColor: 'black',
            color: 'black',
            borderBottom: '1px solid #000',
            borderColor: '#000'
        };
        
        Object.assign(input.style, pdfStyles);
        input.removeAttribute('data-validation-state');
    },
    
    restoreOriginalStyles(container, originalStyles) {
        container.classList.remove('pdf-generation');
        
        // Restore container styles
        Object.keys(originalStyles).forEach(key => {
            container.style[key] = originalStyles[key];
        });

        // Clear input styling
        const inputs = document.querySelectorAll('.field-input, .location-dropdown');
        inputs.forEach(input => {
            const stylesToClear = [
                'webkitBoxShadow', 'boxShadow', 'background', 'backgroundColor',
                'webkitTextFillColor', 'color', 'borderBottom', 'borderColor'
            ];
            
            stylesToClear.forEach(style => {
                input.style[style] = '';
            });
        });
    },
    
    // ========================================
    // CANVAS AND PDF CREATION
    // ========================================
    
    async createCanvas(container) {
        return await html2canvas(container, {
            scale: 1.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: 794,
            height: container.offsetHeight,
            scrollX: 0,
            scrollY: 0,
            onclone: this.onCanvasClone
        });
    },
    
    onCanvasClone(clonedDoc) {
        const clonedContainer = clonedDoc.querySelector('.container');
        
        // Apply consistent styling to cloned document
        Object.assign(clonedContainer.style, {
            width: '794px',
            maxWidth: '794px',
            margin: '0',
            boxShadow: 'none'
        });
        
        // Clean cloned inputs
        const clonedInputs = clonedDoc.querySelectorAll('.field-input, .location-dropdown');
        clonedInputs.forEach(input => {
            input.classList.remove('error', 'valid', 'location-error');
            Object.assign(input.style, {
                webkitBoxShadow: '0 0 0 30px white inset',
                boxShadow: '0 0 0 30px white inset',
                background: 'white',
                backgroundColor: 'white',
                webkitTextFillColor: 'black',
                color: 'black',
                borderBottom: '1px solid #000',
                borderColor: '#000'
            });
        });
    },
    
    createPDFDocument(canvas) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (imgHeight <= 297) { // Single page
            doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
        } else { // Multiple pages
            this.addMultiplePages(doc, canvas, imgWidth, imgHeight);
        }
        
        return doc;
    },
    
    addMultiplePages(doc, canvas, imgWidth, imgHeight) {
        const pageHeight = 297; // A4 height in mm
        const totalPages = Math.ceil(imgHeight / pageHeight);
        
        for (let i = 0; i < totalPages; i++) {
            if (i > 0) {
                doc.addPage();
            }
            
            const yOffset = -i * pageHeight;
            doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, yOffset, imgWidth, imgHeight);
        }
    },
    
    // ========================================
    // PRINT FUNCTIONALITY
    // ========================================
    
    printForm() {
        if (!window.UoEForm.Validator.validateForm()) {
            return;
        }
        
        if (!window.UoEForm.Validator.checkDataConsent()) {
            return;
        }
        
        const webElements = document.querySelectorAll('.form-actions, .success-message, .pre-submission-section');
        webElements.forEach(el => el.style.display = 'none');
        
        this.showPrintNotice();
        
        window.print();
        
        // Restore elements after print dialog closes
        setTimeout(() => {
            webElements.forEach(el => {
                el.style.display = 'block';
                if (el.classList.contains('pre-submission-section')) {
                    el.style.visibility = 'visible';
                    el.style.opacity = '1';
                }
            });
            this.hidePrintNotice();
        }, 1000);
    },
    
    showPrintNotice() {
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
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        printNotice.innerHTML = `
            <strong>📋 Remember:</strong><br>
            Print <strong>4 copies</strong> and attach passport photos on yellow background to each copy.
        `;
        document.body.appendChild(printNotice);
    },
    
    hidePrintNotice() {
        const printNotice = document.getElementById('printNotice');
        if (printNotice && document.body.contains(printNotice)) {
            document.body.removeChild(printNotice);
        }
    },
    
    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    
    generateFileName() {
        const fullNameField = document.getElementById('fullName');
        const name = fullNameField && fullNameField.value ? 
            fullNameField.value.replace(/\s+/g, '_') : 'Student';
        const date = new Date().toISOString().split('T')[0];
        
        return `UoE_Student_Form_${name}_${date}.pdf`;
    },
    
    showLoadingMessage(message) {
        const loadingMsg = document.createElement('div');
        loadingMsg.id = 'pdfLoadingMessage';
        loadingMsg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 25px;
            border-radius: 12px;
            z-index: 10000;
            font-size: 16px;
            text-align: center;
            box-shadow: 0 8px 20px rgba(0,0,0,0.4);
            min-width: 300px;
        `;
        loadingMsg.innerHTML = `
            <div style="margin-bottom: 15px; font-size: 32px;">📄</div>
            <div style="font-weight: bold; margin-bottom: 10px;">${message}</div>
            <div style="font-size: 14px; opacity: 0.8;">Converting form to PDF format...</div>
            <div style="margin-top: 15px;">
                <div style="width: 200px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; margin: 0 auto;">
                    <div style="width: 0%; height: 100%; background: #4CAF50; border-radius: 2px; animation: progress 3s ease-in-out infinite;"></div>
                </div>
            </div>
            <style>
                @keyframes progress {
                    0% { width: 0%; }
                    50% { width: 70%; }
                    100% { width: 100%; }
                }
            </style>
        `;
        document.body.appendChild(loadingMsg);
    },
    
    hideLoadingMessage() {
        const loadingMsg = document.getElementById('pdfLoadingMessage');
        if (loadingMsg && document.body.contains(loadingMsg)) {
            document.body.removeChild(loadingMsg);
        }
    },
    
    showSuccessMessage() {
        const successMessage = document.getElementById('successMessage');
        if (successMessage) {
            successMessage.innerHTML = `
                <strong>✅ PDF Generated Successfully!</strong><br>
                Your form has been converted to PDF and downloaded. You can now print the PDF or submit it electronically.
            `;
            successMessage.style.display = 'block';
            
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 10000);
        }
    },
    
    handlePDFError() {
        this.hideLoadingMessage();
        
        alert('❌ Error generating PDF. Please try again or use the Print option instead.');
        
        // Restore hidden elements
        const elementsToHide = document.querySelectorAll('.form-actions, .success-message, .pre-submission-section');
        elementsToHide.forEach(el => {
            el.style.display = 'block';
            if (el.classList.contains('pre-submission-section')) {
                el.style.visibility = 'visible';
                el.style.opacity = '1';
            }
        });
        
        // Remove PDF styling if it was applied
        const container = document.querySelector('.container');
        if (container) {
            container.classList.remove('pdf-generation');
        }
    },
    
    // ========================================
    // PUBLIC INTERFACE
    // ========================================
    
    async download() {
        console.log('📄 PDF download initiated');
        await this.generatePDF();
    },
    
    print() {
        console.log('🖨️ Print initiated');
        this.printForm();
    }
};

console.log('📄 PDF Generator module loaded');