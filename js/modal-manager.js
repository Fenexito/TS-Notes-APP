/**
 * @file modal-manager.js
 * @summary Manages the logic for all modals and sidebars (opening, closing, populating content).
 */

import { dom, get } from './dom-elements.js';
import { state } from './config.js';
import { updateCharCounter, updateSeparatePartCharCounter, showToast } from './ui-helpers.js';
import { noteBuilder } from './note-builder.js';
// MODIFICADO: Se importan las funciones para controlar el overlay
import { loadNotes, editNote, handleResolutionCopy, handleCopilotCopy, saveCurrentNote, getLatestNote } from './history-manager.js';
import { clearAllFormFields } from './ui-manager.js';
import { copyToClipboard } from './ui-helpers.js';


export function viewNoteInModal(noteObject) {
    if (!noteObject) return;

    // Set the current note data in the global state for other functions to access
    state.currentlyViewedNoteData = noteObject;
    state.currentViewedNoteId = noteObject.id;

    const noteText = noteObject.finalNoteText || '';
    const noteLength = noteText.length;

    // Populate modal content
    if (dom.modalNoteTextarea) dom.modalNoteTextarea.value = noteText;
    updateCharCounter(noteLength, dom.modalNoteCharCount, true);
    
    const isSavedNote = !!noteObject.id;

    // Forcefully control visibility by directly manipulating the style property.
    // This method overrides conflicting CSS rules.
    if (isSavedNote) {
        if (dom.modalEditFromHistoryBtn) dom.modalEditFromHistoryBtn.style.display = 'inline-block';
        if (dom.modalCopySaveBtn) dom.modalCopySaveBtn.style.display = 'none';
    } else {
        if (dom.modalEditFromHistoryBtn) dom.modalEditFromHistoryBtn.style.display = 'none';
        if (dom.modalCopySaveBtn) dom.modalCopySaveBtn.style.display = 'inline-block';
    }

    // Control visibility of the SPLIT button based on character count
    if (dom.modalSeparateBtn) {
        dom.modalSeparateBtn.style.display = noteLength > 1000 ? 'inline-block' : 'none';
    }

    // Show the modal
    if (dom.noteModalOverlay) {
        dom.noteModalOverlay.classList.add('is-visible');
    }
}

export function closeModal(keepSidebarClosed = false) {
    if (dom.noteModalOverlay) dom.noteModalOverlay.classList.remove('is-visible');
    
    if (state.currentViewedNoteId && !keepSidebarClosed) {
        showSidebarAndHighlightNote(state.currentViewedNoteId);
    }
    
    state.currentViewedNoteId = null;
    
    if (dom.modalNoteTextarea) dom.modalNoteTextarea.value = '';
    
    updateCharCounter(0, dom.modalNoteCharCount, true);
    if (state.currentFinalNoteContent) {
         updateCharCounter(state.currentFinalNoteContent.length, dom.mainNoteCharCountHeader, true);
    }
}

export function closeSeparateModal() {
    if (dom.separateNoteModalOverlay) dom.separateNoteModalOverlay.classList.remove('is-visible');
    const dynamicPartsContainer = dom.separateNoteModalOverlay.querySelector('.modal-body.separate-notes-container');
    if (dynamicPartsContainer) {
        dynamicPartsContainer.innerHTML = '';
    }

    if (state.currentlyViewedNoteData) {
        viewNoteInModal(state.currentlyViewedNoteData);
    } else if (state.currentFinalNoteContent.trim() !== '') {
        viewNoteInModal({
            id: null,
            finalNoteText: state.currentFinalNoteContent,
            formData: null
        });
    }
}

export function hideSidebar() {
    if (dom.historySidebar) dom.historySidebar.classList.remove('open');
    if (dom.historySidebarOverlay) dom.historySidebarOverlay.classList.remove('is-visible');
    unhighlightAllNotes();
}

export async function showSidebarAndHighlightNote(noteId) {
    if (dom.historySidebar) dom.historySidebar.classList.add('open');
    if (dom.historySidebarOverlay) dom.historySidebarOverlay.classList.add('is-visible');
    await loadNotes();
    setTimeout(() => {
        const noteElement = dom.noteHistoryList.querySelector(`[data-note-id="${noteId}"]`);
        if (noteElement) {
            unhighlightAllNotes();
            noteElement.classList.add('selected');
            if (state.highlightTimeout) clearTimeout(state.highlightTimeout);
            state.highlightTimeout = setTimeout(() => {
                noteElement.classList.remove('selected');
                state.highlightTimeout = null;
            }, 1000);

            const parentGroupContent = noteElement.closest('.date-group-content');
            if (parentGroupContent && parentGroupContent.classList.contains('collapsed')) {
                parentGroupContent.classList.remove('collapsed');
                const parentGroupHeader = parentGroupContent.closest('.date-group').querySelector('.date-group-header');
                if (parentGroupHeader) {
                    parentGroupHeader.querySelector('.icon-chevron-down').classList.add('hidden-field');
                    parentGroupHeader.querySelector('.icon-chevron-up').classList.remove('hidden-field');
                }
            }
            noteElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
}

export function unhighlightAllNotes() {
    document.querySelectorAll('.note-item.selected').forEach(item => {
        item.classList.remove('selected');
    });
    if (state.highlightTimeout) {
        clearTimeout(state.highlightTimeout);
        state.highlightTimeout = null;
    }
}

export function handleSeparateNote() {
    const sourceData = state.currentlyViewedNoteData ? state.currentlyViewedNoteData.formData : null;
    const finalNote = state.currentlyViewedNoteData ? state.currentlyViewedNoteData.finalNoteText : state.currentFinalNoteContent;
    const isSavedNote = !!state.currentlyViewedNoteData?.id;

    const { _buildSection1Content, _buildSection2InitialContent, _buildTroubleshootingProcessContent, _buildSection3Content, _buildSection4Content } = noteBuilder;

    // Define the fundamental note sections
    const part1String = [..._buildSection1Content(sourceData), ..._buildSection2InitialContent(sourceData)].join('\n').trim();
    const tsString = _buildTroubleshootingProcessContent(sourceData).join('\n').trim();
    const resolutionString = [..._buildSection3Content(sourceData), ..._buildSection4Content(sourceData)].join('\n').trim();
    
    const container = dom.separateNoteModalOverlay.querySelector('.modal-body.separate-notes-container');
    if (!container) return;
    container.innerHTML = '';

    let parts = [];

    if (finalNote.length <= 995) {
        // Condition 1: Note is short enough, no split needed.
        parts.push({ label: 'Full Note', content: finalNote });
    } else {
        // Note is long, a split is necessary.

        // Standard Two-Part Split content
        const twoPart_p1 = part1String;
        const twoPart_p2 = `${tsString}\n${resolutionString}`.trim();

        if (twoPart_p1.length <= 995 && twoPart_p2.length <= 995) {
            // Condition 2: A standard two-part split works perfectly.
            parts.push({ label: 'Part 1', content: `1/2\n${twoPart_p1}` });
            parts.push({ label: 'Part 2', content: `2/2\n${twoPart_p2}` });
        } else {
            // A standard two-part split fails. Let's try the strategic split.
            const strategic_p1 = `${part1String}\n${resolutionString}`.trim();
            const strategic_p2 = tsString;

            if (strategic_p1.length <= 995 && strategic_p2.length <= 995) {
                // Condition 3: The strategic two-part split works.
                parts.push({ label: 'Part 1', content: `1/2\n${strategic_p1}` });
                if (strategic_p2.trim()) { // Only add if TS part has content
                   parts.push({ label: 'Part 2', content: `2/2\n${strategic_p2}` });
                }
            } else {
                // Condition 4: Both two-part strategies failed. Fallback to a three-part split.
                parts.push({ label: 'Part 1', content: `1/3\n${part1String}` });
                if (tsString.trim()) {
                    parts.push({ label: 'Part 2', content: `2/3\n${tsString}` });
                }
                parts.push({ label: 'Part 3', content: `3/3\n${resolutionString}` });
            }
        }
    }

    parts.forEach((part, index) => {
        if (!part.content.trim()) return;
        const partDiv = document.createElement('div');
        partDiv.className = 'separated-note-part';
        const textareaId = `separatedPart${index}`;
        partDiv.innerHTML = `
            <div class="separated-label-and-counter">
                <label for="${textareaId}">${part.label}</label>
                <span class="char-counter" id="${textareaId}CharCount">0</span>
            </div>
            <textarea id="${textareaId}" rows="auto" readonly>${part.content}</textarea>
            <button type="button" class="modal-action-btn copy-btn-style copy-separated-btn" data-target="${textareaId}">COPY</button>
        `;
        container.appendChild(partDiv);
        const textarea = get(textareaId);
        const charCount = get(`${textareaId}CharCount`);
        if (textarea && charCount) {
            textarea.style.height = textarea.scrollHeight + 'px';
            updateSeparatePartCharCounter(textarea, charCount);
        }
    });

    dom.separateModalCopySaveBtn.classList.toggle('hidden-field', isSavedNote);
    
    closeModal(true);
    dom.separateNoteModalOverlay.classList.add('is-visible');
}


// ==========================================================================
// LÓGICA DEL OVERLAY FLOTANTE
// ==========================================================================

export function openInfoOverlay() {
    const container = get('info-overlay-container');
    if (container) {
        container.classList.add('is-open');
    }
}

export function closeInfoOverlay() {
    const container = get('info-overlay-container');
    if (container) {
        container.classList.remove('is-open');
    }
}

function updateInfoOverlay(title, htmlContent) {
    const panel = get('info-overlay-panel');
    if (!panel) return;

    const headerTitle = panel.querySelector('.info-overlay-header h3');
    const contentDiv = panel.querySelector('.info-overlay-content');

    if (headerTitle) {
        headerTitle.textContent = title;
    }
    if (contentDiv) {
        contentDiv.innerHTML = htmlContent;
    }
}

export function updateLatestNoteOverlay(noteObject) {
    if (!noteObject || !noteObject.formData) {
        updateInfoOverlay('Última Nota', '<p>Aún no hay notas guardadas.</p>');
        return;
    }

    const data = noteObject.formData;
    const getVal = (key) => data[key] || 'N/A';

    // MODIFICADO: Se quita el margen y la línea <hr>
    const content = `
        <div style="font-size: 0.85em; line-height: 1.5;">
            <p style="margin: 0 0 2px 0;">BAN: <strong>${getVal('ban')}</strong></p>
            <p style="margin: 0 0 2px 0;">CID: <strong>${getVal('cid')}</strong></p>
            <p style="margin: 0 0 2px 0;">NAME: <strong>${getVal('name')}</strong></p>
            <p style="margin: 0 0 2px 0;">CBR: <strong>${getVal('cbr')}</strong></p>
            <p style="margin: 0 0 2px 0;">TICKET: <strong>${getVal('ticketInput')}</strong></p>
        </div>
    `;

    updateInfoOverlay('Last Note Saved', content);
}

async function loadLastNoteForOverlay() {
    const lastNote = await getLatestNote();
    if (lastNote) {
        updateLatestNoteOverlay(lastNote);
    } else {
        updateInfoOverlay('Last Note', '<p>Same some notes first</p>');
    }
}

export function initInfoOverlay() {
    const trigger = get('info-overlay-trigger');
    const closeBtn = get('info-overlay-close');
    const backdrop = get('info-overlay-backdrop');
    const container = get('info-overlay-container');

    if (trigger) {
        trigger.addEventListener('click', () => {
            if (container && container.classList.contains('is-open')) {
                closeInfoOverlay();
            } else {
                openInfoOverlay();
            }
        });
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', closeInfoOverlay);
    }
    if (backdrop) {
        backdrop.addEventListener('click', closeInfoOverlay);
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (container && container.classList.contains('is-open')) {
                closeInfoOverlay();
            }
        }
    });

    loadLastNoteForOverlay();
}