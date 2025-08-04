/**
 * @file checklist-manager.js
 * @summary Manages all logic related to the checklist sidebar.
 */

import { dom } from './dom-elements.js';
import { state } from './config.js';

export function closeChecklistSidebar() {
    if (dom.checklistSidebar) dom.checklistSidebar.classList.remove('open');
    if (dom.checklistSidebarOverlay) dom.checklistSidebarOverlay.classList.remove('is-visible');

    state.checklistVerified = true;

    if (state.awaitingChecklistCompletionForCopySave) {
        state.awaitingChecklistCompletionForCopySave = false;
        viewNoteInModal(state.currentlyViewedNoteData || { id: null, finalNoteText: state.currentFinalNoteContent, formData: null });
        showToast('Please press "Copy & Save" again.', 'info');
    }
}

export function handleChecklistChange(event) {
    const radio = event.target;
    if (radio.type !== 'radio') return;

    const parentItem = radio.closest('.checklist-item');
    if (!parentItem) return;

    parentItem.classList.remove('status-pending', 'status-yes', 'status-no', 'status-na', 'checklist-item-required');
    
    switch (radio.value) {
        case 'yes': parentItem.classList.add('status-yes'); break;
        case 'no': parentItem.classList.add('status-no'); break;
        case 'na': parentItem.classList.add('status-na'); break;
    }
}

export function setChecklistValue(radioName, value) {
    const radioToSelect = document.querySelector(`input[name="${radioName}"][value="${value}"]`);
    if (radioToSelect && !radioToSelect.checked) {
        radioToSelect.checked = true;
        radioToSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

export function resetChecklist() {
    dom.checklistSidebar.querySelectorAll('.checklist-item input[type="radio"]').forEach(radio => {
        radio.checked = false;
        const parentItem = radio.closest('.checklist-item');
        parentItem?.classList.remove('status-yes', 'status-no', 'status-na', 'checklist-item-required');
        parentItem?.classList.add('status-pending');
    });
    setChecklistValue('checklistCheckPhysical', 'no');
    setChecklistValue('checklistTsCopilot', 'no');
}