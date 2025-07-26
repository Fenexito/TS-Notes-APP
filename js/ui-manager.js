/**
 * @file ui-manager.js
 * @summary Manages dynamic UI updates, form state, and component interactions.
 */

import { dom, get } from './dom-elements.js';
import * as config from './config.js';
import { generateFinalNote, noteBuilder } from './note-builder.js';
import { applyInitialRequiredHighlight, populateTimeSlots, showToast } from './ui-helpers.js';
import { resetChecklist } from './checklist-manager.js';

export function updateStickyHeaderInfo() {
    if (!dom.headerDynamicInfo || !dom.agentInfoSection || !dom.stickyHeaderContainer) return;

    const isFixed = dom.stickyHeaderContainer.classList.contains('is-fixed');
    let shouldShowOnScroll = false;

    if (!isFixed) {
        const agentInfoRect = dom.agentInfoSection.getBoundingClientRect();
        shouldShowOnScroll = agentInfoRect.bottom <= 60;
    }
    
    dom.headerDynamicInfo.classList.toggle('show', isFixed || shouldShowOnScroll);

    // Actualizar los valores en el header.
    dom.headerBanValueSpan.innerText = noteBuilder._getFieldValue('ban') || '';
    dom.headerCidValueSpan.innerText = noteBuilder._getFieldValue('cid') || '';
    dom.headerNameValueSpan.innerText = noteBuilder._getFieldValue('name') || '';
    dom.headerCbrValueSpan.innerText = noteBuilder._getFieldValue('cbr') || '';
}


export function setAgentNameEditable(saveAgentNameOnBlur, saveAgentNameOnEnter) {
    if (!dom.agentNameInput) return;
    dom.agentNameInput.removeAttribute('readonly');
    dom.agentNameInput.title = 'Edit your name. It will be saved on blur or by pressing Enter.';
    dom.agentNameInput.focus();
    dom.agentNameInput.select();
    dom.agentNameInput.addEventListener('blur', saveAgentNameOnBlur);
    dom.agentNameInput.addEventListener('keydown', saveAgentNameOnEnter);
    config.state.isAgentNameEditable = true;
    if (!noteBuilder._getFieldValue('agentName')) {
        dom.agentNameInput.classList.add('required-initial-border');
    }
}

export function setAgentNameReadonly(saveAgentNameOnBlur, saveAgentNameOnEnter) {
    if (!dom.agentNameInput) return;
    dom.agentNameInput.setAttribute('readonly', 'readonly');
    dom.agentNameInput.title = 'This field can only be edited by pressing the edit button.';
    dom.agentNameInput.removeEventListener('blur', saveAgentNameOnBlur);
    dom.agentNameInput.removeEventListener('keydown', saveAgentNameOnEnter);
    config.state.isAgentNameEditable = false;
    dom.agentNameInput.classList.remove('required-initial-border');
}

export function updateThirdRowLayout(callerValue = null, xidValue = '') {
    if (!dom.callerSelect || !dom.xidFieldContainer || !dom.xidInput) return;
    const currentCallerValue = callerValue ?? noteBuilder._getFieldValue('caller');
    const showXid = currentCallerValue === 'Consultation';
    dom.xidFieldContainer.classList.toggle('hidden-field', !showXid);
    dom.xidInput.toggleAttribute('required', showXid);
    if (showXid && config.state.isEditingNoteFlag) {
        dom.xidInput.value = xidValue;
    } else if (!showXid && !config.state.isEditingNoteFlag) {
        dom.xidInput.value = '';
    }
    applyInitialRequiredHighlight();
    generateFinalNote();
}

export function populateIssueSelect(service, selectedIssue = '') {
    if (!dom.issueSelect) return;
    dom.issueSelect.innerHTML = '<option value="">Select an issue</option>';
    dom.issueSelect.toggleAttribute('required', !!service);
    const options = config.issueOptions[service] || [];
    options.forEach(issue => {
        const option = document.createElement('option');
        option.value = issue;
        option.textContent = issue;
        dom.issueSelect.appendChild(option);
    });
    dom.issueSelect.disabled = !service;
    if (selectedIssue && options.includes(selectedIssue)) {
        dom.issueSelect.value = selectedIssue;
    }
}

export function updateAffectedFieldVisibilityAndLabel(service, affectedTextValue = '') {
    if (!dom.affectedLabel || !dom.affectedText || !dom.affectedTextGroup || !dom.serviceAffectedRow) return;

    const servicesToShowField = ['HomePhone / Fiber', 'HomePhone / Copper', 'Telus Email', 'MyTelus'];
    const isVisible = servicesToShowField.includes(service);
    let affectedLabelText = 'AFFECTED'; // Default label

    if (isVisible) {
        switch (service) {
            case 'HomePhone / Fiber':
            case 'HomePhone / Copper':
                affectedLabelText = 'AFFECTED PHONE NUMBER';
                break;
            case 'Telus Email':
                affectedLabelText = 'TELUS EMAIL';
                break;
            case 'MyTelus':
                affectedLabelText = 'MYTELUS EMAIL';
                break;
        }
    }

    dom.affectedLabel.textContent = affectedLabelText;

    // MODIFICADO: Lógica de visibilidad más robusta para evitar conflictos.
    if (isVisible) {
        dom.affectedTextGroup.style.display = 'flex'; // Forcing a display type
        dom.serviceAffectedRow.classList.add('has-affected');
        dom.affectedText.setAttribute('required', 'required');
    } else {
        dom.affectedTextGroup.style.display = 'none';
        dom.serviceAffectedRow.classList.remove('has-affected');
        dom.affectedText.removeAttribute('required');
    }

    if (isVisible && config.state.isEditingNoteFlag) {
        dom.affectedText.value = affectedTextValue;
    } else if (!isVisible && !config.state.isEditingNoteFlag) {
        dom.affectedText.value = '';
    }

    applyInitialRequiredHighlight();
    generateFinalNote();
}

export function _populatePhysicalCheckListLabelsAndOptions(service, phys1Value = '', phys2Value = '', phys3Value = '', phys4Value = '', selectedIssueFromForm = '') {
    const listsData = [
        { select: dom.physicalCheckList1Select, labelEl: dom.physicalCheckList1Label, key: 'list1', formDataValue: phys1Value },
        { select: dom.physicalCheckList2Select, labelEl: dom.physicalCheckList2Label, key: 'list2', formDataValue: phys2Value },
        { select: dom.physicalCheckList3Select, labelEl: dom.physicalCheckList3Label, key: 'list3', formDataValue: phys3Value },
        { select: dom.physicalCheckList4Select, labelEl: dom.physicalCheckList4Label, key: 'list4', formDataValue: phys4Value }
    ];
    const isSHS = dom.skillToggle.checked;
    const currentIssueValue = selectedIssueFromForm || noteBuilder._getFieldValue('issueSelect');

    listsData.forEach(item => {
        const { select, labelEl, key, formDataValue } = item;
        if (!select || !labelEl) return;

        labelEl.textContent = isSHS
            ? ({ list1: 'IQ PANEL', list2: 'DEVICE', list3: 'CONDITION', list4: 'XYZ' }[key] || config.fieldConfig[select.id].label)
            : (config.physicalCheckLabels[service]?.[key] || config.fieldConfig[select.id].label);

        select.innerHTML = '<option value="">Select an option</option>';
        let options = [];
        if (isSHS && key === 'list2') {
            select.disabled = true;
            if (!config.shsIssuesToDisableDevice.includes(currentIssueValue)) {
                if (config.shsDeviceOptionsMap[currentIssueValue]) {
                    options = config.shsDeviceOptionsMap[currentIssueValue];
                    select.disabled = false;
                } else if (config.directIssueToDeviceMap.includes(currentIssueValue)) {
                    options = [currentIssueValue];
                    select.disabled = false;
                }
            }
        } else if (isSHS && key === 'list3') {
            options = ['Device OK', 'Low Battery', 'Not Responding', 'Malfunction', 'IDLE', 'Tamper', 'Bypassed', 'Not Connected to Wi-Fi'];
            select.disabled = false;
        } else {
            options = config.equipmentOptions[service]?.[key] || [];
        }

        options.forEach(optionText => {
            const option = document.createElement('option');
            option.value = optionText;
            option.textContent = optionText;
            select.appendChild(option);
        });

        if (formDataValue && options.includes(formDataValue)) {
            select.value = formDataValue;
        }
    });
}

export function _updatePhysicalCheckListEnablement(service, isPhys2Checked = null, isPhys3Checked = null, isPhys4Checked = null) {
    if (!dom.physicalCheckListsContainer) return;
    const isSHS = dom.skillToggle.checked;
    const hideAll = !service || (!isSHS && config.SERVICES_TO_HIDE_PHYSICAL_CHECK.includes(service));
    dom.physicalCheckListsContainer.classList.toggle('hidden-field', hideAll);

    const listsData = [
        { select: dom.physicalCheckList1Select, checkbox: null },
        { select: dom.physicalCheckList2Select, checkbox: dom.enablePhysicalCheck2, formDataChecked: isPhys2Checked },
        { select: dom.physicalCheckList3Select, checkbox: dom.enablePhysicalCheck3, formDataChecked: isPhys3Checked },
        { select: dom.physicalCheckList4Select, checkbox: dom.enablePhysicalCheck4, formDataChecked: isPhys4Checked }
    ];

    listsData.forEach(({ select, checkbox, formDataChecked }) => {
        if (!select) return;
        if (hideAll) {
            select.disabled = true;
            select.removeAttribute('required');
            if (checkbox) checkbox.disabled = true;
            return;
        }

        if (checkbox) {
            checkbox.disabled = false;
            const isChecked = config.state.isEditingNoteFlag ? formDataChecked : checkbox.checked;
            checkbox.checked = !!isChecked; // Ensure boolean conversion
            select.disabled = !checkbox.checked;
            select.toggleAttribute('required', checkbox.checked);
            if (!checkbox.checked && !config.state.isEditingNoteFlag) select.value = '';
        } else {
            select.disabled = false;
            select.setAttribute('required', 'required');
        }
    });

    applyInitialRequiredHighlight();
    generateFinalNote();
}

export function updateOptikTvLegacySpecificFields(service, xVuValue = '', packetLossValue = '') {
    const { optikTvLegacySpecificFieldsContainer, xVuStatusSelect, packetLossSelect } = dom;
    if (!optikTvLegacySpecificFieldsContainer || !xVuStatusSelect || !packetLossSelect) return;

    const showFields = service === 'Optik TV (Legacy)';
    optikTvLegacySpecificFieldsContainer.classList.toggle('hidden-field', !showFields);
    [xVuStatusSelect, packetLossSelect].forEach(el => {
        el.disabled = !showFields;
        el.toggleAttribute('required', showFields);
        if (!showFields) el.value = '';
    });

    if (showFields) {
        const populateSelect = (select, listKey, selectedValue) => {
            select.innerHTML = '<option value="">Select an option</option>';
            const options = config.equipmentOptions[service]?.[listKey] || [];
            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = option.textContent = opt;
                select.appendChild(option);
            });
            if (selectedValue && options.includes(selectedValue)) {
                select.value = selectedValue;
            }
        };
        populateSelect(xVuStatusSelect, 'list5', xVuValue);
        populateSelect(packetLossSelect, 'list6', packetLossValue);
    }
    applyInitialRequiredHighlight();
    generateFinalNote();
}

export function _populateAwaAlertsOptions(skill, selectedValue = '') {
    const { awaAlertsSelect, awaAlertsSelectLabel } = dom;
    if (!awaAlertsSelect || !awaAlertsSelectLabel) return;

    const options = skill === 'SHS' ? config.awaAlertsOptionsSHS : config.awaAlertsOptionsFFH;
    awaAlertsSelectLabel.textContent = skill === 'SHS' ? 'ADC TROUBLE CONDITIONS' : 'AWA ALERTS';
    awaAlertsSelect.innerHTML = '<option value="">Select an option</option>';
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = option.textContent = opt;
        awaAlertsSelect.appendChild(option);
    });
    if (selectedValue && options.includes(selectedValue)) {
        awaAlertsSelect.value = selectedValue;
    }
    awaAlertsSelect.disabled = false;
    awaAlertsSelect.setAttribute('required', 'required');
}

export function updateAwaAlerts2SelectState(isChecked = null, awa2Value = '') {
    const { enableAwaAlerts2, awaAlerts2Select, awaAlerts2SelectLabel, skillToggle } = dom;
    if (!enableAwaAlerts2 || !awaAlerts2Select || !awaAlerts2SelectLabel) return;
    
    const isSHS = skillToggle.checked;
    const options = isSHS ? config.awaAlerts2OptionsSHS : config.awaAlerts2OptionsFFH;
    awaAlerts2SelectLabel.textContent = isSHS ? 'ADC TROUBLE CONDITIONS 2' : 'AWA ALERTS 2';
    awaAlerts2Select.innerHTML = '<option value="">Select an option</option>';
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = option.textContent = opt;
        awaAlerts2Select.appendChild(option);
    });

    const effectiveChecked = config.state.isEditingNoteFlag ? isChecked : enableAwaAlerts2.checked;
    enableAwaAlerts2.checked = !!effectiveChecked; // Ensure boolean conversion
    awaAlerts2Select.disabled = !enableAwaAlerts2.checked;
    if (enableAwaAlerts2.checked && awa2Value && options.includes(awa2Value)) {
        awaAlerts2Select.value = awa2Value;
    } else if (!enableAwaAlerts2.checked) {
        awaAlerts2Select.value = '';
    }
    applyInitialRequiredHighlight();
    generateFinalNote();
}

export function updateAwaStepsSelectState(awaStepsValue = '') {
    const { awaAlertsSelect, awaStepsSelect, awaStepsSelectLabel, skillToggle } = dom;
    if (!awaAlertsSelect || !awaStepsSelect || !awaStepsSelectLabel) return;
    
    const isSHS = skillToggle.checked;
    const options = isSHS ? config.awaStepsOptionsSHS : config.awaStepsOptionsFFH;
    awaStepsSelectLabel.textContent = isSHS ? 'ADC TROUBLE CONDITIONS 3' : 'AWA STEPS';
    awaStepsSelect.innerHTML = '<option value="">Select an option</option>';
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = option.textContent = opt;
        awaStepsSelect.appendChild(option);
    });

    const isAwaMainSelected = noteBuilder._getFieldValue('awaAlertsSelect') !== '';
    awaStepsSelect.disabled = !isAwaMainSelected;
    awaStepsSelect.toggleAttribute('required', isAwaMainSelected);
    if (isAwaMainSelected && awaStepsValue && options.includes(awaStepsValue)) {
        awaStepsSelect.value = awaStepsValue;
    } else if (!isAwaMainSelected) {
        awaStepsSelect.value = '';
    }
    applyInitialRequiredHighlight();
    generateFinalNote();
}

export function updateTvsKeyFieldState(tvsValue = '', tvsKeyValue = '') {
    const { tvsSelect, tvsKeyFieldContainer, tvsKeyInput } = dom;
    if (!tvsSelect || !tvsKeyFieldContainer || !tvsKeyInput) return;
    
    const currentTvsValue = config.state.isEditingNoteFlag ? tvsValue : noteBuilder._getFieldValue('tvsSelect');
    const showKey = currentTvsValue === 'YES';
    
    tvsKeyFieldContainer.classList.toggle('hidden-field', !showKey);
    tvsKeyInput.toggleAttribute('required', showKey);
    if (showKey && config.state.isEditingNoteFlag) {
        tvsKeyInput.value = tvsKeyValue;
    } else if (!showKey && !config.state.isEditingNoteFlag) {
        tvsKeyInput.value = '';
    }
    applyInitialRequiredHighlight();
    generateFinalNote();
}

export function updateTransferFieldState(isChecked = null, transferValue = '') {
    const { transferCheckbox, transferSelect } = dom;
    if (!transferCheckbox || !transferSelect) return;
    
    const effectiveChecked = config.state.isEditingNoteFlag ? isChecked : transferCheckbox.checked;
    transferCheckbox.checked = !!effectiveChecked;
    transferSelect.disabled = !effectiveChecked;
    transferSelect.toggleAttribute('required', effectiveChecked);
    
    if (effectiveChecked) {
        if (transferValue && Array.from(transferSelect.options).some(o => o.value === transferValue)) {
            transferSelect.value = transferValue;
        }
    } else {
        transferSelect.value = '';
    }
    applyInitialRequiredHighlight();
    generateFinalNote();
}

export function updateTechFieldsVisibilityAndState(resolvedValue, cbr2Value = '', aocValue = '', dispatchDateValue = '', dispatchTimeValue = '') {
    const { cbr2FieldContainer, aocFieldContainer, dispatchDateInputContainer, dispatchTimeSlotSelectContainer } = dom;
    const { cbr2Input, aocInput, dispatchDateInput, dispatchTimeSlotSelect, cbr2Label, dispatchDateLabel, dispatchTimeLabel } = dom;

    const showTech = resolvedValue === 'No | Tech Booked';
    const showFollowUp = resolvedValue === 'No | Follow Up Required' || resolvedValue === 'No | Follow Up Required | Set SCB with FVA';
    const showBosr = resolvedValue === 'No | BOSR Created';
    const showNc = resolvedValue === 'No | NC Ticket Created';
    const showEmt = resolvedValue === 'Cx ask for a Manager | Unable to de escalate. Manager still needed | Escalate to EMT';

    // Toggle visibility based on conditions
    if (cbr2FieldContainer) cbr2FieldContainer.classList.toggle('hidden-field', !(showTech || showBosr || showNc || showEmt));
    if (aocFieldContainer) aocFieldContainer.classList.toggle('hidden-field', !showTech);
    if (dispatchDateInputContainer) dispatchDateInputContainer.classList.toggle('hidden-field', !(showTech || showFollowUp));
    if (dispatchTimeSlotSelectContainer) dispatchTimeSlotSelectContainer.classList.toggle('hidden-field', !(showTech || showFollowUp));

    // Reset all fields first
    [cbr2Input, aocInput, dispatchDateInput, dispatchTimeSlotSelect].forEach(el => {
        if (el) {
            el.removeAttribute('required');
            if (!config.state.isEditingNoteFlag) el.value = '';
        }
    });

    // Apply specific logic based on selection
    if (showTech) {
        if (cbr2Input) cbr2Input.setAttribute('required', 'required');
        if (cbr2Label) cbr2Label.textContent = 'CBR2';
        if (aocInput) {
            aocInput.value = config.state.isEditingNoteFlag ? aocValue : config.fieldConfig.aocInput.defaultValue;
            aocInput.setAttribute('readonly', 'readonly');
        }
        if (dispatchDateInput) dispatchDateInput.setAttribute('required', 'required');
        if (dispatchDateLabel) dispatchDateLabel.textContent = 'DISPATCH DATE';
        if (dispatchTimeSlotSelect) {
            dispatchTimeSlotSelect.setAttribute('required', 'required');
            dispatchTimeSlotSelect.disabled = false;
            populateTimeSlots("dispatch", config.state.isEditingNoteFlag ? dispatchTimeValue : '');
        }
    } else if (showFollowUp) {
        if (dispatchDateInput) dispatchDateInput.setAttribute('required', 'required');
        if (dispatchDateLabel) dispatchDateLabel.textContent = 'FOLLOW UP DATE';
        if (dispatchTimeSlotSelect) {
            dispatchTimeSlotSelect.setAttribute('required', 'required');
            dispatchTimeSlotSelect.disabled = false;
            populateTimeSlots("followup", config.state.isEditingNoteFlag ? dispatchTimeValue : '');
        }
        if (dispatchTimeLabel) dispatchTimeLabel.textContent = 'FOLLOW UP TIME';
    } else if (showBosr) {
        if (cbr2Input) cbr2Input.setAttribute('required', 'required');
        if (cbr2Label) cbr2Label.textContent = 'BOSR TICKET #';
    } else if (showNc) {
        if (cbr2Input) cbr2Input.setAttribute('required', 'required');
        if (cbr2Label) cbr2Label.textContent = 'NC TICKET #';
    } else if (showEmt) {
        if (cbr2Input) cbr2Input.setAttribute('required', 'required');
        if (cbr2Label) cbr2Label.textContent = 'EMT TICKET #';
    }
    
    if (config.state.isEditingNoteFlag) {
        if (cbr2Input) cbr2Input.value = cbr2Value;
        if (dispatchDateInput) dispatchDateInput.value = dispatchDateValue;
    }

    applyInitialRequiredHighlight();
    generateFinalNote();
}

export function populateExtraStepsSelect() {
    const selects = [dom.extraStepsSelect, dom.extraStepsSelect2];
    selects.forEach(select => {
        if (!select) return;
        select.innerHTML = '<option value="">Select an option</option>';
        config.extraStepsOptions.forEach(optionText => {
            const option = document.createElement('option');
            option.value = optionText;
            option.textContent = optionText;
            select.appendChild(option);
        });
    });
}

export function handleSkillChange() {
    const isSHS = dom.skillToggle.checked;
    if (dom.skillTextIndicator) {
        dom.skillTextIndicator.textContent = isSHS ? 'SHS' : 'FFH';
    }

    const currentService = noteBuilder._getFieldValue('serviceSelect');
    dom.serviceSelect.disabled = isSHS;

    if (isSHS) {
        dom.serviceSelect.value = 'SHS Legacy';
    } else if (currentService === 'SHS Legacy') {
        dom.serviceSelect.value = '';
    }
    
    if (!config.state.isEditingNoteFlag) {
        [dom.enablePhysicalCheck2, dom.enablePhysicalCheck3, dom.enablePhysicalCheck4].forEach(cb => cb.checked = false);
    }
    
    dom.serviceSelect.dispatchEvent(new Event('change'));
    
    _populateAwaAlertsOptions(isSHS ? 'SHS' : 'FFH', dom.awaAlertsSelect.value);
    updateAwaAlerts2SelectState(dom.enableAwaAlerts2.checked, dom.awaAlerts2Select.value);
    updateAwaStepsSelectState(dom.awaStepsSelect.value);

    applyInitialRequiredHighlight();
    generateFinalNote();
}

export function updateAwaAndSpeedFieldsVisibility(service) {
    const isSHS = dom.skillToggle.checked;
    const shouldHideForService = config.SERVICES_TO_HIDE_AWA_SPEED.includes(service);
    const shouldHide = isSHS || shouldHideForService;

    const controlledGroups = [
        dom.awaAlertsSelect?.closest('.input-group'),
        dom.awaAlerts2Select?.closest('.input-group'),
        dom.awaStepsSelect?.closest('.input-group'),
        dom.activeDevicesGroup,
        dom.totalDevicesGroup,
        dom.downloadBeforeGroup,
        dom.uploadBeforeGroup,
        dom.downloadAfterGroup,
        dom.uploadAfterGroup
    ];

    controlledGroups.forEach(group => {
        if (!group) return;

        const wasHidden = group.classList.contains('hidden-field');
        group.classList.toggle('hidden-field', shouldHide);
        
        if (shouldHide && !wasHidden) {
            group.querySelectorAll('input, select').forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
                input.removeAttribute('required');
                input.dispatchEvent(new Event('change', { bubbles: true }));
            });
        }
    });

    updateAwaAlerts2SelectState(dom.enableAwaAlerts2.checked);
    updateAwaStepsSelectState();

    applyInitialRequiredHighlight();
    generateFinalNote();
}

export function clearAllFormFields(isForEdit = false) {
    const form = dom.callNoteForm;
    if (!form) return;

    Array.from(form.elements).forEach(element => {
        if (element.tagName === 'BUTTON' || element.tagName === 'FIELDSET' || (!element.id && !element.name)) return;
        if (element.id === 'agentName' && dom.agentNameInput?.readOnly) return;

        element.classList.remove('required-initial-border');
        element.style.border = '';

        if (element.type === 'checkbox' || element.type === 'radio') {
            element.checked = false;
        } else {
            element.value = '';
        }

        element.removeAttribute('required');
        element.removeAttribute('readonly');
        if (element.tagName === 'SELECT') element.disabled = false;
    });

    resetChecklist();
    dom.sections.forEach(section => section.classList.remove('collapsed'));

    if (!isForEdit) {
        if (dom.skillToggle) dom.skillToggle.checked = false;
        config.state.currentEditingNoteId = null;
        config.state.isEditingNoteFlag = false;
        config.state.currentlyViewedNoteData = null;
        
        handleSkillChange();
        updateThirdRowLayout();
        updateTvsKeyFieldState();
        updateTransferFieldState(false);
        updateTechFieldsVisibilityAndState('');
    }
    
    generateFinalNote();
    applyInitialRequiredHighlight();
}

export function cleanSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    section.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]), select, textarea').forEach(input => {
        if (!input.readOnly) input.value = '';
    });
    section.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
        if (!input.disabled) input.checked = false;
    });

    section.querySelectorAll('select, input[type="checkbox"]').forEach(el => {
        el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    generateFinalNote();
    applyInitialRequiredHighlight();
    const sectionTitle = section.querySelector('.section-title span').textContent;
    showToast(`Section "${sectionTitle}" cleared.`, 'info');
}

export function checkCurrentFormHasData() {
    const form = dom.callNoteForm;
    if (!form) return false;

    return Array.from(form.elements).some(element => {
        if (!element.id && !element.name) return false;
        if (element.id === 'agentName' && dom.agentNameInput?.readOnly) return false;

        const container = element.closest('.input-group, .radio-group');
        const isHidden = (container && (container.classList.contains('hidden-field'))) || element.disabled;
        if (isHidden) return false;

        if (element.type === 'checkbox') {
            return element.id !== 'skillToggle' && element.checked;
        }
        if (element.type === 'radio') {
            return element.checked;
        }
        return element.value?.trim() !== '';
    });
}

export function initialResizeTextareas() {
    document.querySelectorAll('#cxIssueText, #troubleshootingProcessText, #additionalinfoText').forEach(el => {
        if (!el || el.id === 'modalNoteTextarea') return;
        el.style.height = 'auto';
        const computedStyle = window.getComputedStyle(el);
        const minHeightPx = parseFloat(computedStyle.minHeight);
        const maxHeightPx = parseFloat(computedStyle.maxHeight);
        let targetHeight = el.scrollHeight;
        if (targetHeight < minHeightPx) {
            targetHeight = minHeightPx;
        } else if (targetHeight > maxHeightPx) {
            targetHeight = maxHeightPx;
            el.style.overflowY = 'auto';
        } else {
            el.style.overflowY = 'hidden';
        }
        el.style.height = targetHeight + 'px';
    });
}
