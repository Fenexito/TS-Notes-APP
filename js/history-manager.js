/**
 * @file history-manager.js
 * @summary Manages all functionality related to the note history sidebar,
 * including loading, displaying, filtering, editing, deleting, importing, and exporting notes.
 */

import { dom, get } from './dom-elements.js';
import { state, fieldConfig, AGENT_NAME_KEY, RESOLUTION_COPY_CHAR_LIMIT } from './config.js';
import { db, saveAgentNameToDB, loadAgentNameFromDB, saveNoteToDB, loadAllNotesFromDB, deleteNoteFromDB, importNotesToDB } from './database.js';
import { showToast, customConfirm, copyToClipboard, applyInitialRequiredHighlight } from './ui-helpers.js';
import { generateFinalNote, noteBuilder } from './note-builder.js';
// MODIFICADO: Se importan las funciones para controlar el overlay
import { viewNoteInModal, closeModal, unhighlightAllNotes, showSidebarAndHighlightNote, hideSidebar, updateLatestNoteOverlay, openInfoOverlay, closeInfoOverlay } from './modal-manager.js';
import { setAgentNameEditable, setAgentNameReadonly, clearAllFormFields, checkCurrentFormHasData, updateThirdRowLayout, populateIssueSelect, updateAffectedFieldVisibilityAndLabel, _populatePhysicalCheckListLabelsAndOptions, _updatePhysicalCheckListEnablement, updateOptikTvLegacySpecificFields, _populateAwaAlertsOptions, updateAwaAlerts2SelectState, updateAwaStepsSelectState, updateTvsKeyFieldState, updateTransferFieldState, updateTechFieldsVisibilityAndState } from './ui-manager.js';

// --- Funciones de Copiado Especializadas ---

export async function handleResolutionCopy(sourceData = null) {
    let data = sourceData;
    // Fallback si es llamado sin datos, mientras una nota del historial está siendo vista.
    if (!data && state.currentlyViewedNoteData) {
        data = state.currentlyViewedNoteData.formData;
    }

    const cxIssueVal = noteBuilder._getFieldValue('cxIssueText', data);
    const tsStepsVal = noteBuilder._getFieldValue('troubleshootingProcessText', data);
    if (!cxIssueVal && !tsStepsVal) {
         showToast('No resolution information to copy.', 'warning');
         return;
    }
    let combinedResolutionText = '';
    if (cxIssueVal) combinedResolutionText += `CX ISSUE: ${cxIssueVal}`;
    if (tsStepsVal) {
        if (combinedResolutionText) combinedResolutionText += '\n';
        combinedResolutionText += `TS STEPS: ${tsStepsVal}`;
    }
    let finalTextToCopy = combinedResolutionText;
    if (combinedResolutionText.length > RESOLUTION_COPY_CHAR_LIMIT) {
        finalTextToCopy = tsStepsVal ? `TS STEPS: ${tsStepsVal}` : '';
        if (!finalTextToCopy) {
            showToast('Resolution exceeds character limit and there are no troubleshooting steps to copy.', 'warning');
            return;
        }
    }
    if (finalTextToCopy) {
        await copyToClipboard(finalTextToCopy);
    } else {
        showToast('No resolution information to copy.', 'warning');
    }
};

export async function handleCopilotCopy(sourceNoteText) {
    if (!sourceNoteText) {
        showToast('No note to send to Copilot.', 'warning');
        return;
    }
    const noteLines = sourceNoteText.split('\n');
    const filteredNote = noteLines.filter(line => 
        !line.startsWith('PFTS |') && !line.startsWith('SKILL:') && !line.startsWith('BAN:') && 
        !line.startsWith('CID:') && !line.startsWith('NAME:') && !line.startsWith('CBR:') && 
        !line.startsWith('CALLER:') && !line.startsWith('VERIFIED BY:') && !line.startsWith('ADDRESS:') && 
        !line.startsWith('XID:')
    ).join('\n');
    await copyToClipboard(filteredNote);
};

/**
 * Retrieves the most recent note from the database.
 * @returns {Promise<object|null>} The latest note object, or null if none exist.
 */
export async function getLatestNote() {
    try {
        const allNotes = await loadAllNotesFromDB();
        // The notes are sorted by timestamp descending in the DB function
        return allNotes.length > 0 ? allNotes[0] : null;
    } catch (error) {
        console.error("Error fetching latest note:", error);
        return null;
    }
}

function validateRequiredFields() {
    for (const fieldId in fieldConfig) {
        const config = fieldConfig[fieldId];
        const element = dom[fieldId] || document.getElementById(fieldId);
        
        if (config.required && element) {
            const container = element.closest('.input-group, .radio-group');
            const isHidden = (container && (container.classList.contains('hidden-field'))) || element.disabled;
            
            if (!isHidden) {
                const value = noteBuilder._getFieldValue(fieldId);
                if (value === '' || (element.tagName === 'SELECT' && value === '')) {
                    return false;
                }
            }
        }
    }
    return true;
}

export async function saveCurrentNote() {
    if (!validateRequiredFields()) {
        showToast('Please fill all required fields.', 'error');
        applyInitialRequiredHighlight();
        return null;
    }

    const requiredChecklistItems = dom.checklistSidebar.querySelectorAll('.checklist-item[data-required="true"]');
    let allChecklistFilled = true;
    requiredChecklistItems.forEach(item => {
        const radioName = item.querySelector('input[type="radio"]').name;
        const isChecked = document.querySelector(`input[name="${radioName}"]:checked`);
        item.classList.toggle('checklist-item-required', !isChecked);
        if (!isChecked) allChecklistFilled = false;
    });

    if (!allChecklistFilled) {
        showToast('Please complete the required Checklist items.', 'warning');
        dom.checklistSidebar.classList.add('open');
        dom.checklistSidebarOverlay.classList.add('is-visible');
        if (state.awaitingChecklistCompletionForCopySave) closeModal(true);
        return null;
    }

    if (state.isAgentNameEditable) {
        if (!noteBuilder._getFieldValue('agentName')) {
            showToast('Please enter your agent name (PFTS).', 'error');
            if (dom.agentNameInput) {
                dom.agentNameInput.classList.add('required-initial-border');
                dom.agentNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                dom.agentNameInput.focus();
            }
            return null;
        }
        await saveAgentName();
    }
    
    const noteToSave = state.currentFinalNoteContent;
    
    const formData = {};
    const formElements = dom.callNoteForm.elements;

    // --- REVISED FORM DATA GATHERING LOGIC ---
    for (const element of Array.from(formElements)) {
        const id = element.id;
        const name = element.name;
        const type = element.type;
        const value = element.value;

        if (!id && !name) continue; // Skip elements without identifiers

        switch (type) {
            case 'radio':
                if (element.checked) {
                    formData[name] = value;
                }
                break;
            case 'checkbox':
                // Ensure we use the ID for checkboxes as they are unique identifiers
                if (id) {
                    formData[id] = element.checked;
                }
                break;
            case 'select-multiple':
                // Handle multi-select if any
                formData[id || name] = Array.from(element.selectedOptions).map(opt => opt.value);
                break;
            default:
                // For text, select-one, textarea, date, etc.
                if (id) { // Prefer ID for uniqueness
                    formData[id] = value;
                } else if (name) {
                    formData[name] = value;
                }
                break;
        }
    }
    
    // Explicitly set skill, as it's a checkbox that drives logic
    formData.skill = dom.skillToggle.checked ? 'SHS' : 'FFH';
    
    // Also gather checklist data
    dom.checklistSidebar.querySelectorAll('.checklist-item input[type="radio"]:checked').forEach(radio => {
        formData[radio.name] = radio.value;
    });

    try {
        const noteData = {
            finalNoteText: noteToSave,
            formData: formData,
            timestamp: new Date().toISOString()
        };
        const savedId = await saveNoteToDB(noteData, state.currentEditingNoteId);
        const savedNote = { id: savedId, ...noteData };

        showToast(state.currentEditingNoteId ? 'History note updated.' : 'Note saved to history.', 'success');
        
        // --- NUEVA LÓGICA PARA EL OVERLAY ---
        updateLatestNoteOverlay(savedNote);
        openInfoOverlay(); 
        setTimeout(closeInfoOverlay, 25000);
        // --- FIN DE LA NUEVA LÓGICA ---

        state.currentEditingNoteId = null;
        state.isEditingNoteFlag = false;
        await loadNotes();
        state.lastNoteIdBeforeModalTransition = null;
        state.currentlyViewedNoteData = null;
        
        clearAllFormFields();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (dom.banInput) dom.banInput.focus();
        
        return savedNote;

    } catch (e) {
        console.error("Error saving note to IndexedDB:", e);
        showToast('Error saving note to history. Please try again.', 'error');
        return null;
    }
}

export async function loadNotes() {
    if (!dom.noteHistoryList) return;
    dom.noteHistoryList.innerHTML = '';
    
    try {
        state.historyNotesCache = await loadAllNotesFromDB();
    } catch (e) {
        console.error("Error loading notes from IndexedDB:", e);
        showToast("Error loading note history.", "error");
        state.historyNotesCache = [];
    }

    const notes = state.historyNotesCache;
    dom.noNotesMessage.classList.toggle('hidden-field', notes.length > 0);
    if (notes.length === 0) return;

    const notesByDate = notes.reduce((acc, note) => {
        const utcDate = new Date(note.timestamp);
        utcDate.setHours(utcDate.getHours() - 6);
        const dateKey = utcDate.toISOString().slice(0, 10);

        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(note);
        return acc;
    }, {});

    Object.keys(notesByDate).sort((a, b) => new Date(b) - new Date(a)).forEach(dateKey => {
        const notesForDay = notesByDate[dateKey];
        const groupEl = createDateGroupElement(dateKey, notesForDay);
        dom.noteHistoryList.appendChild(groupEl);
    });

    filterNotes(dom.historySearchInput.value);
}

function createDateGroupElement(dateKey, notes) {
    const group = document.createElement('div');
    group.className = 'date-group';
    
    const todayDate = new Date();
    todayDate.setHours(todayDate.getHours() - 6);
    const todayKey = todayDate.toISOString().slice(0, 10);
    
    const isToday = dateKey === todayKey;
    const dateForFormatting = new Date(dateKey + 'T06:00:00Z');
    const displayDate = isToday ? 'Today' : dateForFormatting.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

    group.innerHTML = `
        <div class="date-group-header">
            <h3>${displayDate}</h3>
            <span class="note-count">${notes.length}</span>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="icon-chevron-down ${isToday ? '' : 'hidden-field'}"><polyline points="6 9 12 15 18 9"></polyline></svg>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="icon-chevron-up ${isToday ? 'hidden-field' : ''}"><polyline points="18 15 12 9 6 15"></polyline></svg>
        </div>
        <ul class="date-group-content ${isToday ? '' : 'collapsed'}">
            ${notes.map(createNoteItemHTML).join('')}
        </ul>
    `;
    return group;
}

function createNoteItemHTML(note) {
    const { 
        ban, cid, name, cbr, ticketInput: ticket, skill, 
        serviceSelect, issueSelect, resolvedSelect, 
        dispatchDateInput, dispatchTimeSlotSelect, cbr2Input 
    } = note.formData;

    const noteLength = note.finalNoteText?.length || 0;
    let charCountClasses = 'note-history-char-count';
    if (noteLength > 995) charCountClasses += ' red-text bold-text';
    else if (noteLength > 850) charCountClasses += ' orange-text';
    
    let highlightClass = '';
    switch(resolvedSelect) {
        case 'No | Tech Booked':
            highlightClass = 'highlight-purple';
            break;
        case 'No | Follow Up Required':
        case 'No | Follow Up Required | Set SCB with FVA':
            highlightClass = 'highlight-red';
            break;
        case 'No | BOSR Created':
        case 'No | NC Ticket Created':
            highlightClass = 'highlight-blue';
            break;
    }

    let resolutionDetailsHTML = '';
    if (resolvedSelect === 'No | Tech Booked' && dispatchDateInput && dispatchTimeSlotSelect) {
        resolutionDetailsHTML += `<div class="detail-row"><span>DISPATCH:</span><strong>${dispatchDateInput}, ${dispatchTimeSlotSelect}</strong></div>`;
    } else if ((resolvedSelect === 'No | Follow Up Required' || resolvedSelect === 'Cx Need a Follow Up. Set SCB on FVA') && dispatchDateInput && dispatchTimeSlotSelect) {
        resolutionDetailsHTML += `<div class="detail-row"><span>FOLLOW UP:</span><strong>${dispatchDateInput}, ${dispatchTimeSlotSelect}</strong></div>`;
    } else if (resolvedSelect === 'No | BOSR Created' && cbr2Input) {
        resolutionDetailsHTML += `<div class="detail-row"><span>BOSR TICKET:</span><strong>${cbr2Input}</strong></div>`;
    } else if (resolvedSelect === 'No | NC Ticket Created' && cbr2Input) {
        resolutionDetailsHTML += `<div class="detail-row"><span>NC TICKET:</span><strong>${cbr2Input}</strong></div>`;
    } else if (resolvedSelect === 'Cx ask for a Manager | Unable to de escalate. Manager still needed | Escalate to EMT' && cbr2Input) {
        resolutionDetailsHTML += `<div class="detail-row"><span>EMT TICKET:</span><strong>${cbr2Input}</strong></div>`;
    }

    return `
        <li class="note-item ${highlightClass}" data-note-id="${note.id}" data-search-terms="${[ban, cid, name, cbr, ticket, serviceSelect, issueSelect, resolvedSelect, note.finalNoteText].join(' ').toLowerCase()}">
            <div class="note-item-header">
                <span class="${charCountClasses}">${noteLength}</span>
                ${skill ? `<span class="note-skill-label">(${skill})</span>` : ''}
                <span class="note-modified-indicator ${note.isModified ? '' : 'hidden-field'}" title="Modified note">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </span>
            </div>
            <div class="note-main-details">
                <div class="detail-row"><span>BAN:</span><strong>${ban || ''}</strong></div>
                <div class="detail-row"><span>CID:</span><strong>${cid || ''}</strong></div>
                <div class="detail-row"><span>NAME:</span><strong>${name || ''}</strong></div>
                <div class="detail-row"><span>CBR:</span><strong>${cbr || ''}</strong></div>
                ${ticket ? `<div class="detail-row"><span>TICKET:</span><strong>${ticket}</strong></div>` : ''}
                <div class="detail-separator"></div>
                ${serviceSelect ? `<div class="detail-row"><span>SERVICE:</span><strong>${serviceSelect}</strong></div>` : ''}
                ${issueSelect ? `<div class="detail-row"><span>WORKFLOW:</span><strong>${issueSelect}</strong></div>` : ''}
                ${resolvedSelect ? `<div class="detail-row"><span>RESOLVED:</span><strong>${resolvedSelect}</strong></div>` : ''}
                ${resolutionDetailsHTML}
            </div>
            <div class="note-actions">
                <button type="button" class="history-action-btn view-btn" data-note-id="${note.id}"><svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>VIEW</button>
                <button type="button" class="history-action-btn edit-btn" data-note-id="${note.id}"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>EDIT</button>
                <button type="button" class="history-action-btn delete-btn" data-note-id="${note.id}"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>DELETE</button>
            </div>
        </li>
    `;
}

export function addEventListenersToHistoryItems() {
    dom.noteHistoryList.addEventListener('click', async (event) => {
        const target = event.target;
        const noteItem = target.closest('.note-item');
        
        const dateGroupHeader = target.closest('.date-group-header');
        if (dateGroupHeader) {
            const content = dateGroupHeader.nextElementSibling;
            const iconDown = dateGroupHeader.querySelector('.icon-chevron-down');
            const iconUp = dateGroupHeader.querySelector('.icon-chevron-up');
            
            content.classList.toggle('collapsed');
            iconDown.classList.toggle('hidden-field');
            iconUp.classList.toggle('hidden-field');
            return;
        }

        if (!noteItem) return;
        
        const noteId = noteItem.dataset.noteId;
        const selectedNote = state.historyNotesCache.find(n => n.id === noteId);
        if (!selectedNote) return;

        if (target.closest('.view-btn')) {
            hideSidebar();
            viewNoteInModal(selectedNote);
        } else if (target.closest('.edit-btn')) {
            state.lastNoteIdBeforeModalTransition = noteId;
            closeModal(true);
            await editNote(selectedNote.formData, selectedNote.id);
        } else if (target.closest('.delete-btn')) {
            unhighlightAllNotes();
            hideSidebar();
            const confirmed = await customConfirm('Are you sure you want to delete this note from history? This action cannot be undone.');
            if (confirmed) {
                await deleteNoteFromDB(noteId);
                await loadNotes();
            } else {
                showToast('Deletion canceled.', 'info');
                showSidebarAndHighlightNote(noteId);
            }
        }
    });
}

export async function editNote(formData, originalNoteId) {
    hideSidebar();
    if (checkCurrentFormHasData()) {
        const confirmed = await customConfirm('There is data in the current editor. Do you want to overwrite it?');
        if (!confirmed) {
            showToast('Edit canceled.', 'info');
            showSidebarAndHighlightNote(originalNoteId);
            return;
        }
    }
    state.currentEditingNoteId = originalNoteId;
    state.isEditingNoteFlag = true;
    state.currentlyViewedNoteData = null;
    clearAllFormFields(true); 

    // STEP 1: Set master skill toggle and populate dropdowns with the correct OPTIONS first.
    if (dom.skillToggle) {
        dom.skillToggle.checked = (formData.skill === 'SHS');
    }
    if (dom.serviceSelect) {
        dom.serviceSelect.value = formData.serviceSelect || '';
    }
    populateIssueSelect(formData.serviceSelect, formData.issueSelect);
    _populateAwaAlertsOptions(formData.skill === 'SHS' ? 'SHS' : 'FFH', formData.awaAlertsSelect);
    _populatePhysicalCheckListLabelsAndOptions(formData.serviceSelect, '', '', '', '', formData.issueSelect);

    // STEP 2: Populate the entire form with all saved data (values, checked states).
    Object.keys(formData).forEach(key => {
        const value = formData[key];
        const element = get(key) || dom[key];

        if (element) {
            // Defer setting state for these specific checkboxes to their dedicated UI functions
            if (key === 'enablePhysicalCheck2' || key === 'enablePhysicalCheck3' || key === 'enablePhysicalCheck4' || key === 'enableAwaAlerts2' || key === 'transferCheckbox') {
                return;
            }

            if (element.type === 'checkbox') {
                element.checked = !!value;
            } else if (element.type !== 'radio') {
                if (value !== undefined) {
                    element.value = value;
                }
            }
        } else {
            const radioToSelect = document.querySelector(`input[name="${key}"][value="${value}"]`);
            if (radioToSelect) {
                radioToSelect.checked = true;
            }
        }
    });

    // STEP 3: With the form fully populated, now run all UI synchronization functions.
    const skillString = dom.skillToggle.checked ? 'SHS' : 'FFH';
    if (dom.skillTextIndicator) dom.skillTextIndicator.textContent = skillString;
    if (dom.serviceSelect) dom.serviceSelect.disabled = dom.skillToggle.checked;
    const speedDeviceFields = [dom.activeDevicesGroup, dom.totalDevicesGroup, dom.downloadBeforeGroup, dom.uploadBeforeGroup, dom.downloadAfterGroup, dom.uploadAfterGroup];
    speedDeviceFields.forEach(group => {
        if (group) group.classList.toggle('hidden-field', dom.skillToggle.checked);
    });

    updateThirdRowLayout(formData.caller, formData.xid);
    updateAffectedFieldVisibilityAndLabel(formData.serviceSelect, formData.affectedText);
    updateOptikTvLegacySpecificFields(formData.serviceSelect, formData.xVuStatusSelect, formData.packetLossSelect);
    updateTvsKeyFieldState(formData.tvsSelect, formData.tvsKeyInput);
    updateTechFieldsVisibilityAndState(formData.resolvedSelect, formData.cbr2Input, formData.aocInput, formData.dispatchDateInput, formData.dispatchTimeSlotSelect);
    
    // Sync special checkbox-dependent UI, passing the saved state to them
    _updatePhysicalCheckListEnablement(formData.serviceSelect, formData.enablePhysicalCheck2, formData.enablePhysicalCheck3, formData.enablePhysicalCheck4);
    updateAwaAlerts2SelectState(formData.enableAwaAlerts2, formData.awaAlerts2Select);
    updateAwaStepsSelectState(formData.awaStepsSelect);
    updateTransferFieldState(formData.transferCheckbox, formData.transferSelect);

    generateFinalNote();
    showToast('Note loaded into the editor.', 'success');
    state.lastNoteIdBeforeModalTransition = null;
}

export function filterNotes(searchText) {
    const lowerCaseSearchText = searchText.toLowerCase().trim();
    let anyNoteVisible = false;

    dom.noteHistoryList.querySelectorAll('.note-item').forEach(item => {
        const searchTerms = item.dataset.searchTerms || '';
        const isVisible = lowerCaseSearchText === '' || searchTerms.includes(lowerCaseSearchText);
        item.classList.toggle('hidden-field', !isVisible);
        if (isVisible) {
            anyNoteVisible = true;
            if (lowerCaseSearchText !== '') {
                const group = item.closest('.date-group');
                if (group) {
                    const content = group.querySelector('.date-group-content');
                    const iconDown = group.querySelector('.icon-chevron-down');
                    const iconUp = group.querySelector('.icon-chevron-up');
                    if (content.classList.contains('collapsed')) {
                        content.classList.remove('collapsed');
                        iconDown.classList.add('hidden-field');
                        iconUp.classList.remove('hidden-field');
                    }
                }
            }
        }
    });

    dom.noteHistoryList.querySelectorAll('.date-group').forEach(group => {
        const hasVisibleNotes = !!group.querySelector('.note-item:not(.hidden-field)');
        group.classList.toggle('hidden-field', !hasVisibleNotes);
        const countSpan = group.querySelector('.note-count');
        if(countSpan) {
            const visibleCount = group.querySelectorAll('.note-item:not(.hidden-field)').length;
            countSpan.textContent = visibleCount;
        }
    });
    
    const noNotesMessage = dom.noNotesMessage;
    if (noNotesMessage) {
        if (state.historyNotesCache.length === 0) {
            noNotesMessage.textContent = 'No saved notes yet.';
            noNotesMessage.classList.remove('hidden-field');
        } else {
            noNotesMessage.textContent = 'No notes found matching the search.';
            noNotesMessage.classList.toggle('hidden-field', anyNoteVisible || lowerCaseSearchText === '');
        }
    }
}

export async function exportNotes() {
    hideSidebar();
    try {
        const allNotes = await loadAllNotesFromDB();
        if (allNotes.length === 0) {
            showToast('There are no notes to export.', 'warning');
            return;
        }
        const jsonString = JSON.stringify(allNotes, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `apad_notes_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
        showToast('Notes successfully exported!', 'success');
    } catch (error) {
        console.error('Error exporting notes:', error);
        showToast('An error occurred while exporting notes.', 'error');
    }
}

export function importNotes(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data) || data.some(item => !item.id || !item.formData)) {
                throw new Error('Invalid file format.');
            }
            const confirmed = await customConfirm(`You are about to import ${data.length} notes. This will add/overwrite notes. Continue?`);
            if (!confirmed) {
                showToast('Import canceled.', 'info');
                return;
            }
            await importNotesToDB(data);
            showToast(`${data.length} notes imported.`, 'success');
            await loadNotes();
            hideSidebar();
        } catch (error) {
            showToast(error.message || 'Error importing notes.', 'error');
        } finally {
            if (dom.importFile) dom.importFile.value = '';
        }
    };
    reader.readAsText(file);
}

export async function loadAgentName() {
    try {
        const agentNameSetting = await loadAgentNameFromDB();
        if (agentNameSetting?.value) {
            dom.agentNameInput.value = agentNameSetting.value;
            setAgentNameReadonly();
        } else {
            setAgentNameEditable();
        }
    } catch (e) {
        console.error("Error loading agent name:", e);
        showToast('Could not load agent name.', 'error');
        setAgentNameEditable();
    }
    generateFinalNote();
}

export async function saveAgentName() {
    const name = noteBuilder._getFieldValue('agentName');
    if (name) {
        try {
            await saveAgentNameToDB(name);
            setAgentNameReadonly();
            showToast('Agent name saved.', 'success');
        } catch (e) {
            console.error("Error saving agent name:", e);
            showToast('Error saving agent name.', 'error');
        }
    } else {
        showToast('Agent name cannot be empty.', 'error');
    }
    generateFinalNote();
}

export async function handleWelcomeModal() {
    const agentNameSetting = await loadAgentNameFromDB();
    const { welcomeModalOverlay, welcomeAgentNameInput, startTakingNotesBtn, agentNameInput } = dom;

    // If name exists, we're done. No modal needed.
    if (agentNameSetting?.value) {
        agentNameInput.value = agentNameSetting.value;
        setAgentNameReadonly();
        welcomeModalOverlay.classList.remove('is-visible');
        return; 
    }

    // If no name, show the modal and set it up.
    welcomeModalOverlay.querySelector('h3').textContent = 'Welcome to APad';
    welcomeModalOverlay.querySelector('.input-group').classList.remove('hidden-field');
    welcomeModalOverlay.classList.add('is-visible');

    // To prevent multiple listeners on hot reloads/re-calls, clone the button.
    const newStartBtn = startTakingNotesBtn.cloneNode(true);
    startTakingNotesBtn.parentNode.replaceChild(newStartBtn, startTakingNotesBtn);
    
    newStartBtn.addEventListener('click', async () => {
        const newAgentName = welcomeAgentNameInput.value.trim();
        if (!newAgentName) {
            showToast('Please enter your name to continue.', 'warning');
            return; // Exit if name is empty, leaving the modal open for another try.
        }
        
        // On success, save the name and close the modal.
        agentNameInput.value = newAgentName;
        await saveAgentName();
        welcomeModalOverlay.classList.remove('is-visible');
    });
}
