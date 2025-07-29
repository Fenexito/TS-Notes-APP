/**
 * @file ui-manager.js
 * @summary Manages dynamic UI updates, form state, and component interactions.
 */

import { dom, get } from './dom-elements.js';
import * as config from './config.js';
import { generateFinalNote, noteBuilder } from './note-builder.js';
import { populateTimeSlots, showToast } from './ui-helpers.js';
import { resetChecklist } from './checklist-manager.js';

// --- Layout Adjustment ---
function adjustLayouts() {
    const gridContainer = document.getElementById('section2-grid-container');
    const { errorInfoGroup, affectedTextGroup } = dom;

    if (!gridContainer || !errorInfoGroup || !affectedTextGroup) return;

    const isErrorInfoVisible = !errorInfoGroup.classList.contains('hidden-field');
    const isAffectedVisible = !affectedTextGroup.classList.contains('hidden-field');
    const isSideColumnVisible = isErrorInfoVisible || isAffectedVisible;

    // This class will be used by the external CSS to change the grid layout
    gridContainer.classList.toggle('side-info-visible', isSideColumnVisible);
}


// --- Multi-Select Component Helper ---
function _populateMultiSelect(options, listElement, selectedSet, savedValues = []) {
    if (!listElement) return;
    listElement.innerHTML = '';
    selectedSet.clear();

    const valuesToSelect = new Set(savedValues);

    options.forEach(optionText => {
        const optionElement = document.createElement('div');
        optionElement.dataset.value = optionText;
        optionElement.className = 'custom-select-option';

        const iconSpan = document.createElement('span');
        iconSpan.className = 'option-icon';
        iconSpan.innerHTML = `<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>`;
        
        const textSpan = document.createElement('span');
        textSpan.textContent = optionText;

        optionElement.appendChild(iconSpan);
        optionElement.appendChild(textSpan);
        listElement.appendChild(optionElement);

        if (valuesToSelect.has(optionText)) {
            optionElement.classList.add('selected');
            selectedSet.add(optionText);
        }
    });
}

function _updateMultiSelectButtonLabel(buttonLabel, selectedSet, defaultText) {
    if (!buttonLabel) return;
    if (selectedSet.size === 0) {
        buttonLabel.textContent = defaultText;
        buttonLabel.classList.remove('font-semibold');
    } else if (selectedSet.size === 1) {
        buttonLabel.textContent = [...selectedSet][0];
        buttonLabel.classList.add('font-semibold');
    } else {
        buttonLabel.textContent = `${selectedSet.size} items selected`;
        buttonLabel.classList.add('font-semibold');
    }
}

export function handleMultiSelectOptionClick(optionElement, selectedSet, buttonLabel, defaultText) {
    const value = optionElement.dataset.value;
    if (selectedSet.has(value)) {
        selectedSet.delete(value);
        optionElement.classList.remove('selected');
    } else {
        selectedSet.add(value);
        optionElement.classList.add('selected');
    }
    _updateMultiSelectButtonLabel(buttonLabel, selectedSet, defaultText);
    generateFinalNote();
}
// --- End Multi-Select ---


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
    if (!dom.affectedLabel || !dom.affectedText || !dom.affectedTextGroup) return;

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
    dom.affectedTextGroup.classList.toggle('hidden-field', !isVisible);
    dom.affectedText.toggleAttribute('required', isVisible);

    if (isVisible && config.state.isEditingNoteFlag) {
        dom.affectedText.value = affectedTextValue;
    } else if (!isVisible && !config.state.isEditingNoteFlag) {
        dom.affectedText.value = '';
    }

    adjustLayouts();
    applyInitialRequiredHighlight();
    generateFinalNote();
}

export function updateErrorFieldsVisibility(errorValue = null, errorInfoValue = '') {
    const { errorInfoGroup, errorInfoText, errorInfoLabel } = dom;
    if (!errorInfoGroup || !errorInfoText || !errorInfoLabel) return;

    const currentErrorValue = errorValue ?? noteBuilder._getFieldValue('errorSelect');
    const showInfo = currentErrorValue === 'Active Outage affecting services' || currentErrorValue === 'Error Found in NetCracker';

    errorInfoGroup.classList.toggle('hidden-field', !showInfo);
    errorInfoText.toggleAttribute('required', showInfo);

    if (showInfo) {
        errorInfoLabel.textContent = currentErrorValue === 'Active Outage affecting services' ? 'OUTAGE INFO' : 'NC INFO';
        if (config.state.isEditingNoteFlag) {
            errorInfoText.value = errorInfoValue;
        }
    } else {
        errorInfoText.value = '';
    }
    
    adjustLayouts();
    applyInitialRequiredHighlight();
    generateFinalNote();
}

export function updateSecurityQuestionsVisibility(verifiedByValue = null, securityQuestions = []) {
    const { securityQuestionsContainer } = dom;
    if (!securityQuestionsContainer) return;

    const currentVerifiedBy = verifiedByValue ?? noteBuilder._getFieldValue('verifiedBy');
    const showQuestions = currentVerifiedBy === 'Security Questions' || currentVerifiedBy === 'Manual Auth';

    securityQuestionsContainer.classList.toggle('hidden-field', !showQuestions);
    
    if (showQuestions) {
        populateSecurityQuestionsComponent(securityQuestions);
    } else {
        config.state.securityQuestionsSelected.clear();
        _updateMultiSelectButtonLabel(dom.securityQuestionsLabel, config.state.securityQuestionsSelected, 'Select questions...');
    }

    applyInitialRequiredHighlight();
    generateFinalNote();
}

export function populateSecurityQuestionsComponent(savedValues = []) {
    const { securityQuestionsOptionsList, securityQuestionsLabel } = dom;
    if (!securityQuestionsOptionsList || !securityQuestionsLabel) return;

    _populateMultiSelect(config.securityQuestionsOptions, securityQuestionsOptionsList, config.state.securityQuestionsSelected, savedValues);
    _updateMultiSelectButtonLabel(securityQuestionsLabel, config.state.securityQuestionsSelected, 'Select questions...');
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

export function populateAwaAlertsComponent(skill, savedValues = []) {
    const { awaAlertsOptionsList, awaAlertsLabel, awaAlertsButton } = dom;
    if (!awaAlertsOptionsList || !awaAlertsLabel || !awaAlertsButton) return;

    const options = skill === 'SHS' ? config.allAwaAlertsOptionsSHS : config.allAwaAlertsOptionsFFH;
    const labelText = skill === 'SHS' ? 'ADC TROUBLE CONDITIONS' : 'AWA ALERTS';
    
    const labelElement = awaAlertsButton.parentElement.querySelector('label');
    if(labelElement) labelElement.textContent = labelText;

    _populateMultiSelect(options, awaAlertsOptionsList, config.state.awaAlertsSelected, savedValues);
    _updateMultiSelectButtonLabel(awaAlertsLabel, config.state.awaAlertsSelected, 'Select AWA alerts...');
    
    awaAlertsButton.disabled = false;
    applyInitialRequiredHighlight();
}

export function updateAwaStepsSelectState(awaStepsValue = '') {
    const { awaStepsSelect, awaStepsSelectLabel, skillToggle } = dom;
    if (!awaStepsSelect || !awaStepsSelectLabel) return;
    
    const isSHS = skillToggle.checked;
    const options = isSHS ? config.awaStepsOptionsSHS : config.awaStepsOptionsFFH;
    awaStepsSelectLabel.textContent = isSHS ? 'ADC TROUBLE CONDITIONS 3' : 'AWA STEPS';
    awaStepsSelect.innerHTML = '<option value="">Select an option</option>';
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = option.textContent = opt;
        awaStepsSelect.appendChild(option);
    });

    awaStepsSelect.disabled = false;
    awaStepsSelect.setAttribute('required', 'required');

    if (awaStepsValue && options.includes(awaStepsValue)) {
        awaStepsSelect.value = awaStepsValue;
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

    if (cbr2FieldContainer) cbr2FieldContainer.classList.toggle('hidden-field', !(showTech || showBosr || showNc || showEmt));
    if (aocFieldContainer) aocFieldContainer.classList.toggle('hidden-field', !showTech);
    if (dispatchDateInputContainer) dispatchDateInputContainer.classList.toggle('hidden-field', !(showTech || showFollowUp));
    if (dispatchTimeSlotSelectContainer) dispatchTimeSlotSelectContainer.classList.toggle('hidden-field', !(showTech || showFollowUp));

    [cbr2Input, aocInput, dispatchDateInput, dispatchTimeSlotSelect].forEach(el => {
        if (el) {
            el.removeAttribute('required');
            if (!config.state.isEditingNoteFlag) el.value = '';
        }
    });

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

export function populateExtraStepsComponent(savedValues = []) {
    const { extraStepsOptionsList, extraStepsLabel } = dom;
    if (!extraStepsOptionsList || !extraStepsLabel) return;

    _populateMultiSelect(config.extraStepsOptions, extraStepsOptionsList, config.state.extraStepsSelected, savedValues);
    _updateMultiSelectButtonLabel(extraStepsLabel, config.state.extraStepsSelected, 'Select extra steps...');
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
    
    populateAwaAlertsComponent(isSHS ? 'SHS' : 'FFH');
    updateAwaStepsSelectState();

    applyInitialRequiredHighlight();
    generateFinalNote();
}

export function updateAwaAndSpeedFieldsVisibility(service) {
    const isSHS = dom.skillToggle.checked;
    
    // Logic for AWA fields
    const shouldHideAwaForService = config.SERVICES_TO_HIDE_AWA_SPEED.includes(service);
    const hideAwa = isSHS || shouldHideAwaForService;
    const awaGroups = [dom.awaAlertsContainer, dom.awaStepsSelect?.closest('.input-group')];

    awaGroups.forEach(group => {
        if (group) {
            group.classList.toggle('hidden-field', hideAwa);
            if (hideAwa) {
                // Clear and reset AWA fields
                if (group.id === 'awaAlertsContainer') {
                    config.state.awaAlertsSelected.clear();
                    _updateMultiSelectButtonLabel(dom.awaAlertsLabel, config.state.awaAlertsSelected, 'Select AWA alerts...');
                    if(dom.awaAlertsOptionsList) Array.from(dom.awaAlertsOptionsList.children).forEach(opt => opt.classList.remove('selected'));
                } else {
                    const input = group.querySelector('select');
                    if (input) {
                        input.value = '';
                        input.removeAttribute('required');
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            }
        }
    });

    // Logic for Speed fields
    const showSpeedFields = ['HighSpeed / Fiber', 'HighSpeed / Copper'].includes(service) && !isSHS;
    const speedGroups = [
        dom.activeDevicesGroup,
        dom.totalDevicesGroup,
        dom.downloadBeforeGroup,
        dom.uploadBeforeGroup,
        dom.downloadAfterGroup,
        dom.uploadAfterGroup
    ];

    speedGroups.forEach(group => {
        if (group) {
            group.classList.toggle('hidden-field', !showSpeedFields);
            if (!showSpeedFields) {
                 group.querySelectorAll('input').forEach(input => input.value = '');
            }
        }
    });

    updateAwaStepsSelectState();
    applyInitialRequiredHighlight();
    generateFinalNote();
}


export function clearAllFormFields(isForEdit = false) {
    const form = dom.callNoteForm;
    if (!form) return;

    // Clear multi-selects
    config.state.awaAlertsSelected.clear();
    if(dom.awaAlertsOptionsList) Array.from(dom.awaAlertsOptionsList.children).forEach(opt => opt.classList.remove('selected'));
    _updateMultiSelectButtonLabel(dom.awaAlertsLabel, config.state.awaAlertsSelected, 'Select AWA alerts...');
    
    config.state.extraStepsSelected.clear();
    if(dom.extraStepsOptionsList) Array.from(dom.extraStepsOptionsList.children).forEach(opt => opt.classList.remove('selected'));
    _updateMultiSelectButtonLabel(dom.extraStepsLabel, config.state.extraStepsSelected, 'Select extra steps...');

    config.state.securityQuestionsSelected.clear();
    if(dom.securityQuestionsOptionsList) Array.from(dom.securityQuestionsOptionsList.children).forEach(opt => opt.classList.remove('selected'));
    _updateMultiSelectButtonLabel(dom.securityQuestionsLabel, config.state.securityQuestionsSelected, 'Select questions...');


    Array.from(form.elements).forEach(element => {
        if (element.tagName === 'BUTTON' || element.tagName === 'FIELDSET' || (!element.id && !element.name)) return;
        if (element.id === 'agentName' && dom.agentNameInput?.readOnly) return;

        if (element.closest('.custom-select-container')) return;

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
        updateErrorFieldsVisibility();
        updateSecurityQuestionsVisibility();
    }
    
    generateFinalNote();
    applyInitialRequiredHighlight();
}

export function cleanSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    // Clear multi-selects within the section
    section.querySelectorAll('.custom-select-container').forEach(container => {
        if (container.id === 'awaAlertsContainer') {
            config.state.awaAlertsSelected.clear();
            _updateMultiSelectButtonLabel(dom.awaAlertsLabel, config.state.awaAlertsSelected, 'Select AWA alerts...');
            if(dom.awaAlertsOptionsList) Array.from(dom.awaAlertsOptionsList.children).forEach(opt => opt.classList.remove('selected'));
        }
        if (container.id === 'extraStepsContainer') {
            config.state.extraStepsSelected.clear();
            _updateMultiSelectButtonLabel(dom.extraStepsLabel, config.state.extraStepsSelected, 'Select extra steps...');
            if(dom.extraStepsOptionsList) Array.from(dom.extraStepsOptionsList.children).forEach(opt => opt.classList.remove('selected'));
        }
        if (container.id === 'securityQuestionsContainer') {
            config.state.securityQuestionsSelected.clear();
            _updateMultiSelectButtonLabel(dom.securityQuestionsLabel, config.state.securityQuestionsSelected, 'Select questions...');
            if(dom.securityQuestionsOptionsList) Array.from(dom.securityQuestionsOptionsList.children).forEach(opt => opt.classList.remove('selected'));
        }
    });

    section.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]), select, textarea').forEach(input => {
        if (!input.readOnly) input.value = '';
    });
    section.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
        if (!input.disabled) input.checked = false;
    });

    section.querySelectorAll('select, input[type="checkbox"], input[type="radio"]').forEach(el => {
        el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    generateFinalNote();
    applyInitialRequiredHighlight();
    const sectionTitle = section.querySelector('.section-title span').textContent;
    showToast(`Section "${sectionTitle}" cleared.`, 'info');
}

export function checkCurrentFormHasData() {
    if (config.state.awaAlertsSelected.size > 0 || config.state.extraStepsSelected.size > 0 || config.state.securityQuestionsSelected.size > 0) {
        return true;
    }

    const form = dom.callNoteForm;
    if (!form) return false;

    return Array.from(form.elements).some(element => {
        if (!element.id && !element.name) return false;
        if (element.id === 'agentName' && dom.agentNameInput?.readOnly) return false;
        if (element.closest('.custom-select-container')) return false;

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
    // This function is now empty as the layout is controlled by CSS grid.
}

export function applyInitialRequiredHighlight() {
    if (!dom.callNoteForm) return;

    for (const fieldId in config.fieldConfig) {
        const fieldConf = config.fieldConfig[fieldId];
        const element = dom[fieldId] || document.getElementById(fieldId);
        if (!element) continue;

        const isHidden = element.classList.contains('hidden-field') || element.closest('.hidden-field') || element.style.display === 'none' || element.disabled;

        if (fieldConf.required && !isHidden) {
            let isMissing = false;
            if (fieldConf.type === 'multiselect') {
                let selectedSet;
                if (fieldId === 'awaAlertsContainer') selectedSet = config.state.awaAlertsSelected;
                else if (fieldId === 'extraStepsContainer') selectedSet = config.state.extraStepsSelected;
                else if (fieldId === 'securityQuestionsContainer') selectedSet = config.state.securityQuestionsSelected;
                
                isMissing = selectedSet ? selectedSet.size === 0 : true;
                const button = element.querySelector('button');
                if (button) button.classList.toggle('required-initial-border', isMissing);

            } else if (element.type === 'radio') {
                const groupContainer = element.closest('.radio-group');
                const isChecked = Array.from(document.querySelectorAll(`input[name="${element.name}"]`)).some(r => r.checked);
                isMissing = !isChecked;
                groupContainer?.classList.toggle('required-initial-border', isMissing);
            } else {
                isMissing = (noteBuilder._getFieldValue(fieldId) === '');
                element.classList.toggle('required-initial-border', isMissing);
            }
        } else {
            if (fieldConf.type === 'multiselect') {
                const button = element.querySelector('button');
                if (button) button.classList.remove('required-initial-border');
            } else {
                 element.classList.remove('required-initial-border');
                 const container = element.closest('.radio-group');
                 if (container) container.classList.remove('required-initial-border');
            }
        }
    }
}
