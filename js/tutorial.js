/**
 * @file tutorial.js
 * @summary Manages the interactive tutorial for new users.
 * This file is now an ES module and exports the initialization function.
 */

// Importa los elementos del DOM y funciones necesarias de otros módulos.
import { dom } from './dom-elements.js';

// --- Estado y configuración del Tutorial ---
let currentStep = 0;
let highlightedElement = null;
let spotlightedElement = null;

// --- Datos de Ejemplo para el Tutorial (CORREGIDOS Y COMPLETOS) ---
const sampleNoteData = {
    skillToggle: false,
    agentName: 'Alexander',
    ban: '9999999', cid: '8888888', name: 'Alexander', cbr: '77777777',
    caller: 'Owner', xid: '', verifiedBy: 'Security Questions', address: '1234 Maple RD, BC V1B0X9',
    serviceOnCsr: 'Active',
    outage: 'no',
    errorsInNC: 'no',
    accountSuspended: 'no',
    serviceSelect: 'Optik TV (Legacy)',
    issueSelect: 'Video Quality Issues',
    physicalCheckList1Select: 'VIP5602w',        
    affectedText: '',
    cxIssueText: 'This is the place were you are gonna save the information from the cx issue. You can add as much info as you need to fill all the information that your cx is sharing with you about the problem',
    enablePhysicalCheck2: true,
    enablePhysicalCheck3: true,
    enablePhysicalCheck4: true,
    physicalCheckList2Select: 'Power connected properly / Powered ON',
    physicalCheckList3Select: 'Connected WIRELES',
    physicalCheckList4Select: 'HDMI connected / Input selected properly',
    xVuStatusSelect: 'Critical Errors Found',
    packetLossSelect: 'Some Packet Loss',
    additionalinfoText: 'This is an aditional Text to add info that is relevant to the issue or the solution',
    troubleshootingProcessText: 'This is the place were you are gonna put ALL YOUR TROUBLESHOOT PROCESS. Including all the relevant information you need to follow to solve the problem, including Reboot, FR, CORE consultation, ETC. The word reboot is here to pass validation.',
    enableAwaAlerts2: true,
    awaAlertsSelect: 'Broadband DOWNSTREAM congestion (cx using more than 80% of the speed plan)',
    awaAlerts2Select: 'Occasional Slowspeed in ONE device',
    awaStepsSelect: "Advice cx about issues but cx dont want to troubheshoot this now",
    activeDevicesInput: '10', totalDevicesInput: '20',
    downloadBeforeInput: '110', uploadBeforeInput: '90',
    downloadAfterInput: '580', uploadAfterInput: '490',
    tvsSelect: 'YES', tvsKeyInput: 'JSH182HF',
    extraStepsSelect: 'Use go/send to share PIN reset instructions',
    resolvedSelect: 'Yes | EOC',
    transferCheckbox: true,
    transferSelect: 'FFH CARE',
    cbr2Input: '', aocInput: 'AOC', dispatchDateInput: '', dispatchTimeSlotSelect: '',
    csrOrderInput: '99999999', ticketInput: '000000001111111',
    
    // Checklist data to pass validation during save
    checklistCallbackNumber: 'yes',
    checklistProbingQuestions: 'yes',
    checklistCorrectWorkflow: 'yes',
    checklistAdvancedWifi: 'yes',
    checklistTvs: 'yes',
    checklistReboot: 'yes',
    checklistSwap: 'yes',
    checklistCallback: 'na',
    checklistAllServices: 'yes',
    checklistGoSend: 'yes',
    checklistCheckPhysical: 'no',
    checklistTsCopilot: 'no'
};


// --- Definición de los Pasos del Tutorial (TEXTOS EN INGLÉS Y CON PALABRA CLAVE EN NEGRITAS) ---
const steps = [
    {
        element: '.sticky-header-container',
        title: 'Main Header',
        text: 'This is the main action bar. Here you will find the buttons to **view**, save, and reset your note.'
    },
    {
        element: '#callNoteForm',
        title: 'Your Workspace',
        text: 'This is the main form, which we have pre-filled with **sample** data. When you press "Next", the first section will expand.',
        action: () => expandSection('#seccion1')
    },
    {
        element: '#seccion1-wrapper',
        title: 'Account Information',
        text: 'As you can see, the fields already contain **information**. Pressing "Next" will collapse this section and we will continue with the next one.',
        action: () => switchSection('#seccion1', '#seccion2')
    },
    {
        element: '#seccion2-wrapper',
        title: 'Issue Details',
        text: 'The "Issue Details" section has now been **expanded**.',
        action: () => switchSection('#seccion2', '#seccion3')
    },
    {
        element: '#seccion3-wrapper',
        title: 'WiFi Analysis & TVS',
        text: 'This is the "**WiFi** Analysis & TVS" section.',
        action: () => switchSection('#seccion3', '#seccion4')
    },
    {
        element: '#seccion4-wrapper',
        title: 'Call Resolution',
        text: 'Finally, document the outcome of the **call** here. When you press "Next", all sections will expand.',
        action: () => expandAllSections()
    },
    {
        element: '#callNoteForm',
        title: 'Expanded View',
        text: 'All sections are now **visible**. Press "Next" to continue and generate the final note.',
        position: 'left-center'
    },
    {
        element: '.sticky-header-container',
        title: 'App Buttons',
        text: 'These buttons allow you to save, reset, or view the **final** note. Press "Next" to continue.',
        spotlightElement: '#topactions'
    },
    {
        element: '.sticky-header-container',
        title: 'View Final Note',
        text: 'Pressing "Next" will **generate** the complete note based on the sample data.',
        action: () => dom.btnSee.click(),
        spotlightElement: '#btnSee'
    },
    {
        element: '#noteModalOverlay .modal-content',
        title: 'Generated Final Note',
        text: 'This is the complete **note**. We will explore its options. Press "Next".',
        spotlightElement: '#modalNoteTextarea'
    },
    {
        element: '#noteModalOverlay .modal-content',
        title: 'Final Note Buttons',
        text: 'These buttons allow you to perform **actions** with the generated note.',
        spotlightElement: '.modal-actions'
    },
    {
        element: '#noteModalOverlay .modal-content',
        title: 'Split Note',
        text: 'Pressing "Next" will **split** the note and display it in a new modal.',
        action: () => dom.modalSeparateBtn.click(),
        spotlightElement: '#modalSeparateBtn'
    },
    {
        element: '#separateNoteModalOverlay .modal-content',
        title: 'Split Notes',
        text: 'Here you can see the note split into two **parts**, each with its own copy button.',
        spotlightElement: '.separate-notes-container'
    },
    {
        element: '#separateNoteModalOverlay .modal-content',
        title: 'Save Note',
        text: 'Pressing "Next" will simulate **saving** the note and will close the modals.',
        action: async () => {
             // We manually find the button in the DOM and click it
             const saveBtn = document.querySelector('#separateModalCopySaveBtn');
             if(saveBtn) saveBtn.click();
        },
        spotlightElement: '#separateModalCopySaveBtn'
    },
    {
        element: '.sticky-header-container',
        title: 'Note Saved',
        text: 'Great! The note has been "saved". Now, press "Next" to open the **history** panel.',
        action: async () => {
            if (dom.btnHistory) {
                dom.btnHistory.click();
                await waitForTransition(dom.historySidebar);
            }
        },
        spotlightElement: '#btnHistory'
    },
    {
        element: '#historySidebar',
        title: 'History Panel',
        text: 'This is the **history** panel. Press "Next" to continue.',
        position: 'left'
    },
    {
        element: '#historySidebar',
        title: 'Search Bar',
        text: 'You can use this bar to quickly **search** through your saved notes.',
        position: 'left',
        spotlightElement: '#historySearchInput'
    },
    {
        element: '#historySidebar',
        title: 'Import & Export',
        text: 'From here you can **export** all your notes to a file or import notes from another device.',
        position: 'left',
        spotlightElement: '#historyactionsfooter',
        action: async () => {
            if (dom.closeHistoryBtn) {
                dom.closeHistoryBtn.click();
                await waitForTransition(dom.historySidebar);
            }
        }
    },
    {
        element: '.sticky-header-container',
        title: 'Left Menu',
        text: 'The history has been closed. Now, press "Next" to open the **checklist** menu.',
        action: async () => {
            if (dom.btnChecklistMenu) {
                dom.btnChecklistMenu.click();
                await waitForTransition(dom.checklistSidebar);
            }
        },
        spotlightElement: '#btnChecklistMenu'
    },
    {
        element: '#checklistSidebar',
        title: 'Checklist Menu',
        text: 'This is the checklist and options menu. It helps you ensure you meet all **excellence** mandates on every call.',
        position: 'right',
        noHighlight: true,
        action: async () => {
            if (dom.closeChecklistBtn) {
                dom.closeChecklistBtn.click();
                await waitForTransition(dom.checklistSidebar);
            }
        }
    },
    {
        element: '#feedback-widget',
        title: 'Send us your ideas',
        text: 'If you have any **suggestions** to improve the app, we would love to hear them! Use this button to send your feedback.',
        position: 'manual-feedback',
        spotlightElement: '#feedback-btn',
    },
    {
        element: 'body',
        title: 'You have completed the tutorial!',
        text: 'You are now ready to use APad. Press "**Finish**" to clear the form and start taking your own notes.',
        position: 'center',
        noHighlight: true,
        forceOverlay: true,
    },
];

// --- Funciones del Tour ---

export function startTour() {
    loadSampleDataIntoForm(sampleNoteData);
    document.querySelectorAll('.form-section').forEach(sec => sec.classList.add('collapsed'));
    currentStep = 0;
    showStep(currentStep);
}

function showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= steps.length) {
        return endTour();
    }
    
    const step = steps[stepIndex];
    const { overlay, popover, popoverTitle, popoverText, prevBtn, nextBtn, doneBtn } = dom.tutorial;

    if (step.forceOverlay) {
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    } else {
        overlay.style.backgroundColor = '';
    }

    if (highlightedElement) highlightedElement.classList.remove('tutorial-highlight');
    if (spotlightedElement) spotlightedElement.classList.remove('tutorial-spotlight');

    const targetElement = document.querySelector(step.element);

    if (!targetElement) {
        setTimeout(() => {
            const elementAfterWait = document.querySelector(step.element);
            if (elementAfterWait) showStep(stepIndex);
            else { console.error(`Element not found: ${step.element}`); endTour(); }
        }, 300);
        return;
    }
    
    overlay.classList.remove('hidden');
    popover.classList.remove('hidden');
    popoverTitle.textContent = step.title;
    // Use innerHTML to render the bold tag
    popoverText.innerHTML = step.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    if (!step.noHighlight) {
        targetElement.classList.add('tutorial-highlight');
        highlightedElement = targetElement;
    } else {
        highlightedElement = null;
    }

    if (step.spotlightElement) {
        const spotElement = document.querySelector(step.spotlightElement);
        if (spotElement) {
            spotElement.classList.add('tutorial-spotlight');
            spotlightedElement = spotElement;
        }
    }
    
    requestAnimationFrame(() => positionPopover(targetElement, step.position));

    const isLastStep = stepIndex === steps.length - 1;
    prevBtn.classList.toggle('hidden', stepIndex === 0);
    nextBtn.classList.toggle('hidden', isLastStep);
    doneBtn.classList.toggle('hidden', !isLastStep);
}

function endTour() {
    const { overlay, popover } = dom.tutorial;
    overlay.classList.add('hidden');
    popover.classList.add('hidden');
    if (highlightedElement) highlightedElement.classList.remove('tutorial-highlight');
    if (spotlightedElement) spotlightedElement.classList.remove('tutorial-spotlight');
    localStorage.setItem('tutorialCompleted', 'true');
    // Click the main reset button to clear the form
    if(dom.btnReset) dom.btnReset.click();
}

function positionPopover(targetElement, position = 'bottom-center') {
    const { popover } = dom.tutorial;
    if (!popover || popover.classList.contains('hidden')) return;

    const targetRect = targetElement.getBoundingClientRect();
    
    popover.style.visibility = 'hidden';
    popover.classList.add('active');
    const popoverRect = popover.getBoundingClientRect();
    popover.style.visibility = '';
    popover.classList.remove('active');

    let top, left;

    switch (position) {
        case 'manual-feedback':
            const feedbackBtnRect = dom.feedbackBtn.getBoundingClientRect();
            top = feedbackBtnRect.top - popoverRect.height - 15;
            left = feedbackBtnRect.right - popoverRect.width;
            break;
        case 'left-center':
            top = targetRect.top + (targetRect.height / 2) - (popoverRect.height / 2);
            left = targetRect.left - popoverRect.width - 15;
            break;
        case 'left':
            top = targetRect.top + 20;
            left = targetRect.left - popover.offsetWidth - 20;
            break;
        case 'right':
            top = targetRect.top + 20;
            left = targetRect.right + 20;
            break;
        case 'center':
            top = window.innerHeight / 2 - popoverRect.height / 2;
            left = window.innerWidth / 2 - popoverRect.width / 2;
            break;
        default: // bottom-center
            top = targetRect.bottom + 15;
            left = targetRect.left + (targetRect.width / 2) - (popoverRect.width / 2);
            break;
    }

    // Boundary checks
    if (left < 10) left = 10;
    if ((left + popoverRect.width) > window.innerWidth) left = window.innerWidth - popoverRect.width - 10;
    if (top < 10) top = 10;
    if ((top + popoverRect.height) > window.innerHeight) top = window.innerHeight - popoverRect.height - 10;
    
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
    popover.classList.add('active');
}

function waitForTransition(element, timeout = 500) {
    return new Promise(resolve => {
        const onEnd = () => {
            element.removeEventListener('transitionend', onEnd);
            clearTimeout(timer);
            resolve();
        };
        const timer = setTimeout(onEnd, timeout);
        element.addEventListener('transitionend', onEnd, { once: true });
    });
}

async function expandSection(sectionSelector) {
    const section = document.querySelector(sectionSelector);
    if (section && section.classList.contains('collapsed')) {
        section.querySelector('.section-title')?.click();
        await waitForTransition(section);
    }
}

async function switchSection(collapseSelector, expandSelector) {
    const collapseSection = document.querySelector(collapseSelector);
    if (collapseSection && !collapseSection.classList.contains('collapsed')) {
        collapseSection.querySelector('.section-title')?.click();
        await waitForTransition(collapseSection);
    }
    await expandSection(expandSelector);
}

async function expandAllSections() {
    const sections = document.querySelectorAll('.form-section.collapsed');
    for (const section of sections) {
        section.querySelector('.section-title')?.click();
    }
    if (sections.length > 0) await waitForTransition(sections[sections.length - 1]);
}

async function loadSampleDataIntoForm(data) {
    const dispatchEvents = (element) => {
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('input', { bubbles: true }));
    };

    for (const key in data) {
        const element = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = data[key];
            } else if (element.type === 'radio') {
                const radio = document.querySelector(`input[name="${key}"][value="${data[key]}"]`);
                if (radio) radio.checked = true;
            } else {
                element.value = data[key];
            }
            dispatchEvents(element);
            if (element.tagName === 'SELECT') {
                await new Promise(res => setTimeout(res, 50)); // Small delay for dependent UI to update
            }
        } else {
             // Handle radio groups where only name is available
            const radio = document.querySelector(`input[name="${key}"][value="${data[key]}"]`);
            if (radio) {
                radio.checked = true;
                dispatchEvents(radio);
            }
        }
    }
}

function setupTutorialListeners() {
    const { nextBtn, prevBtn, doneBtn } = dom.tutorial;
    nextBtn.addEventListener('click', async () => {
        const step = steps[currentStep];
        if (step.action) {
            nextBtn.disabled = true;
            await step.action();
            nextBtn.disabled = false;
        }
        currentStep++;
        showStep(currentStep);
    });
    prevBtn.addEventListener('click', () => {
        currentStep--;
        showStep(currentStep);
    });
    doneBtn.addEventListener('click', endTour);
}

/**
 * Main function to initialize the tutorial logic.
 * This is exported and called from app-initializer.js.
 */
export function initializeTutorial() {
    // Attach DOM elements for the tutorial to the main dom object
    dom.tutorial = {
        overlay: document.getElementById('custom-tutorial-overlay'),
        popover: document.getElementById('custom-tutorial-popover'),
        popoverTitle: document.getElementById('tutorial-popover-title'),
        popoverText: document.getElementById('tutorial-popover-text'),
        prevBtn: document.getElementById('tutorial-prev-btn'),
        nextBtn: document.getElementById('tutorial-next-btn'),
        doneBtn: document.getElementById('tutorial-done-btn'),
    };
    setupTutorialListeners();

    // Add resize listener to reposition the popover
    window.addEventListener('resize', () => {
        if (currentStep < steps.length && dom.tutorial.overlay && !dom.tutorial.overlay.classList.contains('hidden')) {
            const step = steps[currentStep];
            const targetElement = document.querySelector(step.element);
            if (targetElement) {
                positionPopover(targetElement, step.position);
            }
        }
    });
}