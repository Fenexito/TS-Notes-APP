/**
 * @file event-listeners.js
 * @summary Initializes all event listeners for the application.
 */

import { dom } from './dom-elements.js';
import { state, numericFields } from './config.js';
import { saveCurrentNote, loadNotes, exportNotes, importNotes, saveAgentName, editNote, handleResolutionCopy, handleCopilotCopy, filterNotes, addEventListenersToHistoryItems } from './history-manager.js';
import { clearAllFormFields, checkCurrentFormHasData, updateThirdRowLayout, populateIssueSelect, updateAffectedFieldVisibilityAndLabel, _populatePhysicalCheckListLabelsAndOptions, _updatePhysicalCheckListEnablement, updateOptikTvLegacySpecificFields, updateAwaStepsSelectState, updateTvsKeyFieldState, updateTransferFieldState, updateTechFieldsVisibilityAndState, handleSkillChange, setAgentNameEditable, cleanSection, updateStickyHeaderInfo, updateAwaAndSpeedFieldsVisibility, applyInitialRequiredHighlight, handleMultiSelectOptionClick, updateErrorFieldsVisibility, updateSecurityQuestionsVisibility } from './ui-manager.js';
import { showToast, customConfirm, copyToClipboard } from './ui-helpers.js';
import { generateFinalNote } from './note-builder.js';
import { viewNoteInModal, closeModal, closeSeparateModal, hideSidebar, handleSeparateNote } from './modal-manager.js';
import { closeChecklistSidebar, handleChecklistChange } from './checklist-manager.js';

function addMainHeaderListeners() {
    dom.btnSave.addEventListener('click', async () => {
        if (!state.checklistVerified) {
            dom.checklistSidebar.classList.add('open');
            dom.checklistSidebarOverlay.classList.add('is-visible');
            state.checklistOpened = true;
            showToast('Please verify the checklist before saving.', 'info');
            return;
        }

        if (!state.copilotUsed) {
            viewNoteInModal({ id: null, finalNoteText: state.currentFinalNoteContent, formData: null });
            if (dom.modalCopilotBtn) dom.modalCopilotBtn.classList.add('highlight-button');
            showToast('Please use Copilot before saving.', 'info');
            return;
        }

        await copyToClipboard(state.currentFinalNoteContent);
        const saved = await saveCurrentNote();
        if (saved) clearAllFormFields();
    });

    dom.btnReset.addEventListener('click', async () => {
        if (checkCurrentFormHasData()) {
            const confirmed = await customConfirm('Are you sure you want to clear all information? This action cannot be undone.');
            if (!confirmed) {
                showToast('Reset canceled.', 'info');
                return;
            }
        }
        state.currentViewedNoteId = null;
        state.currentlyViewedNoteData = null;
        clearAllFormFields();
        hideSidebar();
        showToast('Form reset.', 'info');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (dom.banInput) dom.banInput.focus();
    });

    dom.btnHistory.addEventListener('click', async () => {
        dom.historySearchInput.value = '';
        await loadNotes();
        dom.historySidebar.classList.add('open');
        dom.historySidebarOverlay.classList.add('is-visible');
    });

    dom.btnSee.addEventListener('click', () => {
        if (state.currentFinalNoteContent.trim() === '') {
            showToast('Current note is empty. Please fill the form.', 'warning');
        } else {
            viewNoteInModal({ id: null, finalNoteText: state.currentFinalNoteContent, formData: null });
        }
    });
}

function addFormAndFieldListeners() {
    dom.callNoteForm.addEventListener('input', (event) => {
        const target = event.target;
        if (numericFields.includes(target.id)) {
            target.value = target.value.replace(/[^0-9.]/g, '');
        }
        applyInitialRequiredHighlight();
        generateFinalNote();
    });

    const saveAgentNameOnBlur = async () => { if (state.isAgentNameEditable) await saveAgentName(); };
    const saveAgentNameOnEnter = async (e) => { if (e.key === 'Enter' && state.isAgentNameEditable) { e.preventDefault(); await saveAgentName(); dom.agentNameInput.blur(); }};
    dom.editAgentNameBtn.addEventListener('click', () => setAgentNameEditable(saveAgentNameOnBlur, saveAgentNameOnEnter));

    dom.callerSelect.addEventListener('change', () => updateThirdRowLayout());
    dom.verifiedBySelect.addEventListener('change', () => updateSecurityQuestionsVisibility());
    dom.errorSelect.addEventListener('change', () => updateErrorFieldsVisibility());
    
    dom.serviceSelect.addEventListener('change', () => {
        const service = dom.serviceSelect.value;
        populateIssueSelect(service);
        updateAffectedFieldVisibilityAndLabel(service);
        _populatePhysicalCheckListLabelsAndOptions(service);
        _updatePhysicalCheckListEnablement(service);
        updateOptikTvLegacySpecificFields(service);
        updateAwaAndSpeedFieldsVisibility(service);
    });

    dom.issueSelect.addEventListener('change', () => {
        if(dom.skillToggle.checked) {
            _populatePhysicalCheckListLabelsAndOptions(dom.serviceSelect.value);
            if (!state.isEditingNoteFlag) {
                dom.enablePhysicalCheck2, dom.enablePhysicalCheck3, dom.enablePhysicalCheck4.forEach(cb => cb.checked = false);
            }
            _updatePhysicalCheckListEnablement(dom.serviceSelect.value);
        }
    });

    dom.skillToggle.addEventListener('change', handleSkillChange);
    
    dom.resolvedSelect.addEventListener('change', () => {
        const resolvedValue = dom.resolvedSelect.value;
        updateTechFieldsVisibilityAndState(resolvedValue);
        dom.transferCheckbox.checked = (resolvedValue === 'Cx needs to be transferred');
        updateTransferFieldState(dom.transferCheckbox.checked);
    });

    [dom.physicalCheckList1Select, dom.physicalCheckList2Select, dom.physicalCheckList3Select].forEach((select, index) => {
        select.addEventListener('change', () => {
            const nextCheckbox = dom[`enablePhysicalCheck${index + 2}`];
            if (select.value !== '' && nextCheckbox && !nextCheckbox.checked) {
                nextCheckbox.checked = true;
                _updatePhysicalCheckListEnablement(dom.serviceSelect.value);
            }
        });
    });

    [dom.enablePhysicalCheck2, dom.enablePhysicalCheck3, dom.enablePhysicalCheck4].forEach(cb => {
        cb.addEventListener('change', () => _updatePhysicalCheckListEnablement(dom.serviceSelect.value));
    });

    dom.tvsSelect.addEventListener('change', () => updateTvsKeyFieldState());
    dom.transferCheckbox.addEventListener('change', () => updateTransferFieldState());
}

function addModalAndSidebarListeners() {
    dom.modalCopyBtn.addEventListener('click', () => copyToClipboard(dom.modalNoteTextarea.value));
    dom.modalCloseBtn.addEventListener('click', () => closeModal());
    dom.modalCloseBtnBottom.addEventListener('click', () => closeModal());
    
    dom.modalSeparateBtn.addEventListener('click', handleSeparateNote);

    dom.modalResolutionBtn.addEventListener('click', () => {
        if (state.currentlyViewedNoteData) {
            handleResolutionCopy(state.currentlyViewedNoteData.formData);
        }
    });

    dom.modalCopilotBtn.addEventListener('click', () => {
        if (state.currentlyViewedNoteData) {
            handleCopilotCopy(state.currentlyViewedNoteData.finalNoteText);
            state.copilotUsed = true;
            dom.modalCopilotBtn.classList.remove('highlight-button');
        }
    });
    
    dom.modalCopySaveBtn.addEventListener('click', async () => {
        if (!state.checklistVerified) {
            state.awaitingChecklistCompletionForCopySave = true;
            dom.checklistSidebar.classList.add('open');
            dom.checklistSidebarOverlay.classList.add('is-visible');
            state.checklistOpened = true;
            showToast('Please verify the checklist before saving.', 'info');
            return;
        }

        if (!state.copilotUsed) {
            dom.modalCopilotBtn.classList.add('highlight-button');
            showToast('Please use Copilot before saving.', 'info');
            return;
        }

        state.awaitingChecklistCompletionForCopySave = true;
        const copied = await copyToClipboard(dom.modalNoteTextarea.value);
        const savedNote = await saveCurrentNote();
        if (savedNote && copied) {
            clearAllFormFields();
            closeModal(true);
        }
        state.awaitingChecklistCompletionForCopySave = false;
    });

    dom.modalEditFromHistoryBtn.addEventListener('click', async () => {
        if (state.currentViewedNoteId) {
            const noteToLoad = state.historyNotesCache.find(n => n.id === state.currentViewedNoteId);
            if (noteToLoad) {
                closeModal(true);
                await editNote(noteToLoad.formData, noteToLoad.id);
            }
        }
    });

    dom.separateModalCloseBtn.addEventListener('click', closeSeparateModal);
    dom.separateModalCloseBtnBottom.addEventListener('click', closeSeparateModal);

    dom.separateModalCopySaveBtn.addEventListener('click', async () => {
        if (!state.checklistVerified) {
            state.awaitingChecklistCompletionForCopySave = true;
            dom.checklistSidebar.classList.add('open');
            dom.checklistSidebarOverlay.classList.add('is-visible');
            state.checklistOpened = true;
            showToast('Please verify the checklist before saving.', 'info');
            return;
        }

        if (!state.copilotUsed) {
            closeSeparateModal();
            dom.modalCopilotBtn.classList.add('highlight-button');
            showToast('Please use Copilot before saving.', 'info');
            return;
        }

        const noteToCopy = state.currentlyViewedNoteData
            ? state.currentlyViewedNoteData.finalNoteText
            : state.currentFinalNoteContent;

        const copied = await copyToClipboard(noteToCopy);
        const saved = await saveCurrentNote();
        if (saved && copied) {
            clearAllFormFields();
            closeSeparateModal();
            closeModal(true);
        }
    });

    dom.separateNoteModalOverlay.addEventListener('click', (e) => {
        if (e.target === dom.separateNoteModalOverlay) {
            closeSeparateModal();
            return;
        }

        const button = e.target.closest('button');
        if (!button) return;

        if (button.classList.contains('copy-separated-btn')) {
            const targetId = button.dataset.target;
            const textarea = document.getElementById(targetId);
            if (textarea) copyToClipboard(textarea.value);
            return;
        }

        const sourceData = state.currentlyViewedNoteData ? state.currentlyViewedNoteData.formData : null;
        const finalNote = state.currentlyViewedNoteData ? state.currentlyViewedNoteData.finalNoteText : state.currentFinalNoteContent;

        if (button.id === 'separateModalResolutionBtn') {
            handleResolutionCopy(sourceData);
            return;
        }
        if (button.id === 'separateModalCopilotBtn') {
            handleCopilotCopy(finalNote);
            state.copilotUsed = true;
            if (dom.modalCopilotBtn) dom.modalCopilotBtn.classList.remove('highlight-button');
            return;
        }
    });

    dom.closeHistoryBtn.addEventListener('click', hideSidebar);
    dom.historySidebarOverlay.addEventListener('click', hideSidebar);
    addEventListenersToHistoryItems();
    dom.historySearchInput.addEventListener('input', (e) => filterNotes(e.target.value));
    dom.exportBtn.addEventListener('click', exportNotes);
    dom.importBtn.addEventListener('click', () => dom.importFile.click());
    dom.importFile.addEventListener('change', importNotes);

    dom.btnChecklistMenu.addEventListener('click', () => {
        dom.checklistSidebar.classList.add('open');
        dom.checklistSidebarOverlay.classList.add('is-visible');
        state.checklistOpened = true;
    });
    dom.closeChecklistBtn.addEventListener('click', closeChecklistSidebar);
    dom.checklistSidebarOverlay.addEventListener('click', closeChecklistSidebar);
    dom.checklistSidebar.addEventListener('change', handleChecklistChange);
}

function addGlobalListeners() {
    document.body.addEventListener('click', (event) => {
        const multiSelectButton = event.target.closest('.custom-select-button');

        const clearAllDropdownsAndOverflows = () => {
            document.querySelectorAll('.custom-select-options-container').forEach(c => {
                c.style.display = 'none';
                c.classList.remove('opens-up');
            });
            document.querySelectorAll('.section-content.overflow-visible').forEach(sec => {
                sec.classList.remove('overflow-visible');
            });
        };

        if (multiSelectButton) {
            const container = multiSelectButton.closest('.custom-select-container');
            const optionsContainer = container.querySelector('.custom-select-options-container');
            if (optionsContainer) {
                const isVisible = optionsContainer.style.display === 'block';
                
                clearAllDropdownsAndOverflows();

                if (!isVisible) {
                    optionsContainer.style.visibility = 'hidden';
                    optionsContainer.style.display = 'block';
                    const optionsHeight = optionsContainer.offsetHeight;
                    optionsContainer.style.display = 'none';
                    optionsContainer.style.visibility = 'visible';

                    const buttonRect = multiSelectButton.getBoundingClientRect();
                    const spaceBelow = window.innerHeight - buttonRect.bottom;

                    if (spaceBelow < optionsHeight && buttonRect.top > optionsHeight) {
                        optionsContainer.classList.add('opens-up');
                    } else {
                        optionsContainer.classList.remove('opens-up');
                    }
                    
                    optionsContainer.style.display = 'block';
                    const parentSectionContent = optionsContainer.closest('.section-content');
                    if (parentSectionContent) {
                        parentSectionContent.classList.add('overflow-visible');
                    }
                }
            }
            return;
        }

        const optionElement = event.target.closest('.custom-select-option');
        if (optionElement) {
            const container = optionElement.closest('.custom-select-container');
            if (container.id === 'awaAlertsContainer') {
                handleMultiSelectOptionClick(optionElement, state.awaAlertsSelected, dom.awaAlertsLabel, 'Select AWA alerts...');
            } else if (container.id === 'extraStepsContainer') {
                handleMultiSelectOptionClick(optionElement, state.extraStepsSelected, dom.extraStepsLabel, 'Select extra steps...');
            } else if (container.id === 'securityQuestionsContainer') {
                handleMultiSelectOptionClick(optionElement, state.securityQuestionsSelected, dom.securityQuestionsLabel, 'Select questions...');
            }
            return;
        }

        if (!event.target.closest('.custom-select-container')) {
            clearAllDropdownsAndOverflows();
        }

        const copyButton = event.target.closest('.copy-button, .copy-button-sticky');
        if (copyButton) {
            const targetInputId = copyButton.dataset.targetId || copyButton.dataset.target;
            const targetInput = document.getElementById(targetInputId);
            if (targetInput) copyToClipboard(targetInput.value);
            return;
        }

        const sectionTitle = event.target.closest('.section-title');
        if (sectionTitle && !event.target.closest('.clean-section-btn')) {
            const section = sectionTitle.closest('.form-section');
            if (section) {
                section.classList.toggle('collapsed');
                if (section.id === 'seccion1') {
                    dom.stickyHeaderContainer.classList.toggle('is-fixed', section.classList.contains('collapsed'));
                    updateStickyHeaderInfo();
                }
            }
            return;
        }

        const cleanButton = event.target.closest('.clean-section-btn');
        if (cleanButton) {
            cleanSection(cleanButton.dataset.sectionId);
            return;
        }

        const checklistTitle = event.target.closest('.checklist-section-title');
        if (checklistTitle && !event.target.closest('.clean-checklist-section-btn')) {
            const section = checklistTitle.closest('.checklist-section');
            const content = section.querySelector('.checklist-items-container');
            section.classList.toggle('collapsed');
            content.classList.toggle('collapsed');
        }
    });
    
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (dom.noteModalOverlay.classList.contains('is-visible')) closeModal();
            if (dom.separateNoteModalOverlay.classList.contains('is-visible')) closeSeparateModal();
            if (dom.historySidebar.classList.contains('open')) hideSidebar();
            if (dom.checklistSidebar.classList.contains('open')) closeChecklistSidebar();
            if (dom.customConfirmModal.classList.contains('is-visible')) {
                dom.customConfirmModal.classList.remove('is-visible');
                if (state.resolveConfirmPromise) state.resolveConfirmPromise(false);
            }
            if (dom.feedbackModalOverlay.classList.contains('is-visible')) dom.feedbackModalOverlay.classList.remove('is-visible');
            if (dom.welcomeModalOverlay.classList.contains('is-visible')) dom.welcomeModalOverlay.classList.remove('is-visible');
        }
    });

    dom.noteModalOverlay.addEventListener('click', (e) => { if (e.target === dom.noteModalOverlay) closeModal(); });
    dom.customConfirmModal.addEventListener('click', (e) => {
        if (e.target === dom.customConfirmModal) {
            dom.customConfirmModal.classList.remove('is-visible');
            if (state.resolveConfirmPromise) state.resolveConfirmPromise(false);
        }
    });
    dom.feedbackModalOverlay.addEventListener('click', (e) => { if (e.target === dom.feedbackModalOverlay) dom.feedbackModalOverlay.classList.remove('is-visible'); });
    dom.welcomeModalOverlay.addEventListener('click', (e) => {
        if (e.target === dom.welcomeModalOverlay) {
            dom.welcomeModalOverlay.classList.remove('is-visible');
        }
    });

    dom.feedbackBtn.addEventListener('click', () => dom.feedbackModalOverlay.classList.add('is-visible'));
    dom.closeFeedbackModalBtn.addEventListener('click', () => dom.feedbackModalOverlay.classList.remove('is-visible'));
    
    dom.confirmYesBtn.addEventListener('click', () => {
        if (dom.customConfirmModal) dom.customConfirmModal.classList.remove('is-visible');
        if (state.resolveConfirmPromise) state.resolveConfirmPromise(true);
    });
    dom.confirmNoBtn.addEventListener('click', () => {
        if (dom.customConfirmModal) dom.customConfirmModal.classList.remove('is-visible');
        if (state.resolveConfirmPromise) state.resolveConfirmPromise(false);
    });
}

export function initializeEventListeners() {
    addMainHeaderListeners();
    addFormAndFieldListeners();
    addModalAndSidebarListeners();
    addGlobalListeners();
}
