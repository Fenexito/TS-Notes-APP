/**
 * @file ui-helpers.js
 * @summary Contains generic, reusable helper functions for UI tasks like toasts, clipboard, modals, etc.
 */

import { dom } from './dom-elements.js';
import { state, fieldConfig, CHARACTER_LIMIT, TS_CHAR_RED_THRESHOLD, TS_CHAR_ORANGE_THRESHOLD } from './config.js';
import { noteBuilder } from './note-builder.js';

export function showToast(message, type = 'info', duration = 3000) {
    if (!dom.toastContainer) {
        console.error('Toast container not found!');
        return;
    }
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.textContent = message;
    dom.toastContainer.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, duration);
}

export async function copyToClipboard(textToCopy) {
    if (typeof textToCopy !== 'string' || textToCopy.trim() === '') {
        showToast('Empty field. Nothing to copy.', 'error');
        return false;
    }
    try {
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = textToCopy;
        tempTextArea.style.position = 'absolute';
        tempTextArea.style.left = '-9999px';
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextArea);
        showToast('Text copied to clipboard.', 'success');
        return true;
    } catch (err) {
        console.error('Error copying to clipboard:', err);
        showToast('Could not copy text.', 'error');
        return false;
    }
}

export function customConfirm(message) {
    if (!dom.confirmMessage || !dom.customConfirmModal) return Promise.resolve(false);
    dom.confirmMessage.textContent = message;
    dom.customConfirmModal.classList.add('is-visible');
    return new Promise((resolve) => {
        state.resolveConfirmPromise = resolve;
    });
}

export function updateCharCounter(currentCount, counterElement, applyColors = false) {
    if (!counterElement) return;
    counterElement.textContent = currentCount;
    if (applyColors) {
        counterElement.classList.remove('red-text', 'orange-text', 'bold-text');
        if (currentCount > CHARACTER_LIMIT) {
            counterElement.classList.add('red-text', 'bold-text');
        } else if (currentCount > 850) {
            counterElement.classList.add('orange-text');
        }
    }
}

export function updateTroubleshootingCharCounter(currentCount) {
    if (!dom.troubleshootingCharCountSpan) return;
    dom.troubleshootingCharCountSpan.textContent = currentCount;
    dom.troubleshootingCharCountSpan.classList.remove('orange-text', 'red-text', 'bold-text');
    if (currentCount > TS_CHAR_RED_THRESHOLD) {
        dom.troubleshootingCharCountSpan.classList.add('red-text', 'bold-text');
    } else if (currentCount > TS_CHAR_ORANGE_THRESHOLD) {
        dom.troubleshootingCharCountSpan.classList.add('orange-text', 'bold-text');
    }
}

export function updateSeparatePartCharCounter(textareaElement, counterElement) {
    if (!textareaElement || !counterElement) return;
    const currentCount = textareaElement.value.length;
    counterElement.textContent = currentCount;
    counterElement.classList.remove('red-text', 'orange-text', 'bold-text');
    if (currentCount > CHARACTER_LIMIT) {
        counterElement.classList.add('red-text', 'bold-text');
    } else if (currentCount > 850) {
        counterElement.classList.add('orange-text');
    }
}

export function populateTimeSlots(type, selectedTime = '') {
    if (!dom.dispatchTimeSlotSelect) return;
    dom.dispatchTimeSlotSelect.innerHTML = '<option value="">Select Time Range</option>';
    let timeRanges = [];
    if (type === "dispatch") {
        timeRanges = ["8am - 9am", "9am - 11am", "11am - 1pm", "1pm - 3pm", "3pm - 5pm", "5pm - 7pm", "8am - 5pm"];
    } else if (type === "followup") {
        timeRanges = [
            "8am - 9am", "9am - 10am", "10am - 11am", "11am - 12pm",
            "12pm - 1pm", "1pm - 2pm", "2pm - 3pm", "3pm - 4pm",
            "4pm - 5pm", "5pm - 6pm", "6pm - 7pm", "7pm - 8pm",
            "8pm - 9pm", "9pm - 10pm"
        ];
    }
    timeRanges.forEach(range => {
        const option = document.createElement('option');
        option.value = range;
        option.textContent = range;
        dom.dispatchTimeSlotSelect.appendChild(option);
    });
    if (selectedTime && Array.from(dom.dispatchTimeSlotSelect.options).some(option => option.value === selectedTime)) {
        dom.dispatchTimeSlotSelect.value = selectedTime;
    }
}

export function applyInitialRequiredHighlight() {
    if (!dom.callNoteForm) return;

    for (const fieldId in fieldConfig) {
        const config = fieldConfig[fieldId];
        const element = dom[fieldId] || document.getElementById(fieldId);
        if (!element) continue;

        const container = element.closest('.input-group, .radio-group');
        const isHidden = (container && (container.classList.contains('hidden-field'))) || element.disabled;

        if (config.required && !isHidden) {
            let isMissing = false;
            if (element.type === 'radio') {
                const groupContainer = element.closest('.radio-group');
                const isChecked = Array.from(document.querySelectorAll(`input[name="${element.name}"]`)).some(r => r.checked);
                isMissing = !isChecked;
                groupContainer?.classList.toggle('required-initial-border', isMissing);
            } else {
                isMissing = (noteBuilder._getFieldValue(fieldId) === '');
                element.classList.toggle('required-initial-border', isMissing);
            }
        } else {
            element.classList.remove('required-initial-border');
            if (container) container.classList.remove('required-initial-border');
        }
    }
}
