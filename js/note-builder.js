/**
 * @file note-builder.js
 * @summary Contains the logic for constructing the final note string from form data.
 */

import { dom } from './dom-elements.js';
import { fieldConfig, state } from './config.js';
import { updateCharCounter, updateTroubleshootingCharCounter } from './ui-helpers.js';
import { updateStickyHeaderInfo } from './ui-manager.js';
import { setChecklistValue } from './checklist-manager.js';

const _getFieldValue = (id, sourceData = null) => {
    if (sourceData) {
        if (id === 'skillToggle') {
            return sourceData.skill === 'SHS';
        }
        if (sourceData[id] !== undefined) {
            return sourceData[id];
        }
        const radioName = Object.keys(sourceData).find(key => key === id);
        return radioName ? sourceData[radioName] : '';
    }

    const element = dom[id] || document.getElementById(id);
    if (element) {
        if (element.tagName === 'SELECT' || element.tagName === 'TEXTAREA' || (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'date' || element.type === 'number'))) {
            return element.value.trim();
        } else if (element.type === 'radio') {
            const radioButtons = document.querySelectorAll(`input[name="${id}"]`);
            for (const radio of radioButtons) {
                if (radio.checked) return radio.value;
            }
            return '';
        } else if (element.type === 'checkbox') {
            return element.checked;
        }
    } else {
        const radioButtonsByName = document.querySelectorAll(`input[name="${id}"]`);
        if (radioButtonsByName.length > 0) {
            for (const radio of radioButtonsByName) {
                if (radio.checked) return radio.value;
            }
        }
    }
    return '';
};


const _buildSection1Content = (sourceData = null) => {
    const parts = [];
    const agentName = _getFieldValue('agentName', sourceData);
    parts.push(`PFTS | ${agentName || ''}`);
    // const skillValue = _getFieldValue('skillToggle', sourceData) ? 'SHS' : 'FFH';
    // if (skillValue) parts.push(`SKILL: ${skillValue}`);
    const section1FieldOrder = ['ban', 'cid', 'name', 'cbr', 'caller'];
    section1FieldOrder.forEach(fieldId => {
        const value = _getFieldValue(fieldId, sourceData);
        if (value) parts.push(`${fieldConfig[fieldId].label}: ${value}`);
    });
    if (_getFieldValue('caller', sourceData) === 'Consultation' && _getFieldValue('xid', sourceData)) {
        parts.push(`XID: ${_getFieldValue('xid', sourceData)}`);
    }
    ['verifiedBy', 'address', ].forEach(fieldId => {
        const value = _getFieldValue(fieldId, sourceData);
        if (value) parts.push(`${fieldConfig[fieldId].label}: ${value}`);
    });
    return parts;
};

const _buildSection2InitialContent = (sourceData = null) => {
    const parts = [];
    if (_getFieldValue('serviceOnCsr', sourceData)) parts.push(`SERVICE ON CSR: ${_getFieldValue('serviceOnCsr', sourceData)}`);
    const outageValue = _getFieldValue('outage', sourceData);
    if (outageValue === 'yes') parts.push('OUTAGE: Active Outage affecting services');
    else if (outageValue === 'no') parts.push('OUTAGE: No Active Outage');
    const errorsInNCValue = _getFieldValue('errorsInNC', sourceData);
    if (errorsInNCValue === 'yes') parts.push('NC: ERROR FOUND in NetCracker');
    else if (errorsInNCValue === 'no') parts.push('NC: No Errors in NetCracker');
    const accountSuspendedValue = _getFieldValue('accountSuspended', sourceData);
    if (accountSuspendedValue === 'yes') parts.push('SUSPENDED: Yes');
    else if (accountSuspendedValue === 'no') parts.push('SUSPENDED: No');
    if (_getFieldValue('serviceSelect', sourceData)) parts.push(`SERVICE: ${_getFieldValue('serviceSelect', sourceData)}`);
    if (_getFieldValue('issueSelect', sourceData)) parts.push(`WORKFLOW: ${_getFieldValue('issueSelect', sourceData)}`);
    
    const affectedTextValue = _getFieldValue('affectedText', sourceData);
    if (affectedTextValue) {
        const service = _getFieldValue('serviceSelect', sourceData);
        let label = 'AFFECTED'; // Default
        switch (service) {
            case 'HomePhone / Fiber':
            case 'HomePhone / Copper':
                label = 'AFFECTED PHONE NUMBER';
                break;
            case 'Telus Email':
                label = 'TELUS EMAIL';
                break;
            case 'MyTelus':
                label = 'MYTELUS EMAIL';
                break;
        }
        parts.push(`${label}: ${affectedTextValue}`);
    }

    if (_getFieldValue('cxIssueText', sourceData)) parts.push(`CX ISSUE: ${_getFieldValue('cxIssueText', sourceData)}`);

    const physicalCheckValues = [];
    ['physicalCheckList1Select', 'physicalCheckList2Select', 'physicalCheckList3Select', 'physicalCheckList4Select']
    .forEach(fieldId => {
        if (_getFieldValue(fieldId, sourceData)) {
            physicalCheckValues.push(_getFieldValue(fieldId, sourceData));
        }
    });
    if (physicalCheckValues.length > 0) parts.push(`CHECK PHYSICAL: ${physicalCheckValues.join(', ')}`);

    const xVuValue = _getFieldValue('xVuStatusSelect', sourceData);
    const packetLossValue = _getFieldValue('packetLossSelect', sourceData);
    if (xVuValue || packetLossValue) {
        parts.push(`XVU STATUS: ${xVuValue}${xVuValue && packetLossValue ? ', ' : ''}${packetLossValue}`);
    }
    if (_getFieldValue('additionalinfoText', sourceData)) parts.push(`ADDITIONAL INFO: ${_getFieldValue('additionalinfoText', sourceData)}`);
    return parts;
};

const _buildTroubleshootingProcessContent = (sourceData = null) => {
    const parts = [];
    if (_getFieldValue('troubleshootingProcessText', sourceData)) parts.push(`TS STEPS: ${_getFieldValue('troubleshootingProcessText', sourceData)}`);
    return parts;
};

const _buildSection3Content = (sourceData = null) => {
    const parts = [];
    const currentSkill = _getFieldValue('skillToggle', sourceData) ? 'SHS' : 'FFH';
    const currentAwaAlertsLabel = currentSkill === 'SHS' ? 'ADC TROUBLE CONDITIONS' : 'AWA ALERTS';

    if (_getFieldValue('awaAlertsSelect', sourceData)) {
        let awaNoteLine = `${currentAwaAlertsLabel}: ${_getFieldValue('awaAlertsSelect', sourceData)}`;
        if (_getFieldValue('enableAwaAlerts2', sourceData) && _getFieldValue('awaAlerts2Select', sourceData)) {
            awaNoteLine += `, ${_getFieldValue('awaAlerts2Select', sourceData)}`;
        }
        if (_getFieldValue('awaStepsSelect', sourceData)) {
            awaNoteLine += `, ${_getFieldValue('awaStepsSelect', sourceData)}`;
        }
        parts.push(awaNoteLine);
    }

    if (currentSkill !== 'SHS') {
        const activeDevices = _getFieldValue('activeDevicesInput', sourceData);
        const totalDevices = _getFieldValue('totalDevicesInput', sourceData);
        if (activeDevices || totalDevices) parts.push(`ACTIVE/TOTAL DEVICES: ${activeDevices || ''} / ${totalDevices || ''}`);
        const downloadBefore = _getFieldValue('downloadBeforeInput', sourceData);
        const uploadBefore = _getFieldValue('uploadBeforeInput', sourceData);
        const downloadAfter = _getFieldValue('downloadAfterInput', sourceData);
        const uploadAfter = _getFieldValue('uploadAfterInput', sourceData);
        if (downloadBefore || uploadBefore || downloadAfter || uploadAfter) {
            let speedNote = '';
            if (downloadBefore || uploadBefore) speedNote += `DOWN/UP MBPS BEFORE: ${downloadBefore || 'N/A'}Mbps | ${uploadBefore || 'N/A'}Mbps`;
            if (downloadAfter || uploadAfter) {
                if (speedNote) speedNote += ', ';
                speedNote += `AFTER: ${downloadAfter || 'N/A'}Mbps | ${uploadAfter || 'N/A'}Mbps`;
            }
            if (speedNote) parts.push(speedNote);
        }
    }
    if (_getFieldValue('tvsSelect', sourceData)) {
        let tvsNote = `TVS : ${_getFieldValue('tvsSelect', sourceData)}`;
        if (_getFieldValue('tvsSelect', sourceData) === 'YES' && _getFieldValue('tvsKeyInput', sourceData)) {
            tvsNote += `, ${_getFieldValue('tvsKeyInput', sourceData)}`;
        }
        parts.push(tvsNote);
    }
    if (_getFieldValue('extraStepsSelect', sourceData)) parts.push(`EXTRA STEPS: ${_getFieldValue('extraStepsSelect', sourceData)}`);
    if (_getFieldValue('extraStepsSelect2', sourceData)) parts.push(`EXTRA STEPS 2: ${_getFieldValue('extraStepsSelect2', sourceData)}`);
    return parts;
};

const _buildSection4Content = (sourceData = null) => {
    const parts = [];
    const resolutionDetails = [];
    const resolvedValue = _getFieldValue('resolvedSelect', sourceData);
    
    if (resolvedValue) {
        resolutionDetails.push(`RESOLVED: ${resolvedValue}`);
        if (resolvedValue === 'No | Tech Booked') {
            if (_getFieldValue('cbr2Input', sourceData)) resolutionDetails.push(`CBR2: ${_getFieldValue('cbr2Input', sourceData)}`);
            if (_getFieldValue('aocInput', sourceData)) resolutionDetails.push(`AOC: ${_getFieldValue('aocInput', sourceData)}`);
            const dispatchDate = _getFieldValue('dispatchDateInput', sourceData);
            const dispatchTime = _getFieldValue('dispatchTimeSlotSelect', sourceData);
            if (dispatchDate && dispatchTime) {
                const [year, month, day] = dispatchDate.split('-');
                const dateObj = new Date(year, month - 1, day);
                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const dayAbbreviations = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                const formattedDate = `${dayAbbreviations[dateObj.getDay()]} ${monthNames[dateObj.getMonth()]} ${dateObj.getDate()}`;
                resolutionDetails.push(`DISPATCH: ${formattedDate}, ${dispatchTime}`);
            }
        } else if (resolvedValue === 'No | Follow Up Required' || resolvedValue === 'Cx Need a Follow Up. Set SCB on FVA') {
            const followUpDate = _getFieldValue('dispatchDateInput', sourceData);
            const followUpTime = _getFieldValue('dispatchTimeSlotSelect', sourceData);
            if (followUpDate && followUpTime) {
                const [year, month, day] = followUpDate.split('-');
                const dateObj = new Date(year, month - 1, day);
                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const dayAbbreviations = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                const formattedDate = `${dayAbbreviations[dateObj.getDay()]} ${monthNames[dateObj.getMonth()]} ${dateObj.getDate()}`;
                resolutionDetails.push(`FOLLOW UP: ${formattedDate}, ${followUpTime}`);
            }
        } else if (resolvedValue === 'No | BOSR Created') {
            if (_getFieldValue('cbr2Input', sourceData)) resolutionDetails.push(`BOSR TICKET #: ${_getFieldValue('cbr2Input', sourceData)}`);
        } else if (resolvedValue === 'No | NC Ticket Created') {
            if (_getFieldValue('cbr2Input', sourceData)) resolutionDetails.push(`NC TICKET #: ${_getFieldValue('cbr2Input', sourceData)}`);
        } else if (resolvedValue === 'Cx ask for a Manager | Unable to de escalate. Manager still needed | Escalate to EMT') {
            if (_getFieldValue('cbr2Input', sourceData)) resolutionDetails.push(`EMT TICKET #: ${_getFieldValue('cbr2Input', sourceData)}`);
        }
    }
    
    parts.push(...resolutionDetails);

    if (_getFieldValue('transferCheckbox', sourceData) && _getFieldValue('transferSelect', sourceData)) {
        parts.push(`TRANSFER TO ${_getFieldValue('transferSelect', sourceData)}`);
    }
    if (_getFieldValue('csrOrderInput', sourceData)) parts.push(`CSR ORDER: ${_getFieldValue('csrOrderInput', sourceData)}`);
    if (_getFieldValue('ticketInput', sourceData)) parts.push(`TICKET: ${_getFieldValue('ticketInput', sourceData)}`);
    return parts;
};

function updateChecklistState() {
    setChecklistValue('checklistCallbackNumber', _getFieldValue('cbr') ? 'yes' : 'no');
    const issueSelected = _getFieldValue('issueSelect') !== '';
    setChecklistValue('checklistProbingQuestions', issueSelected ? 'yes' : 'no');
    setChecklistValue('checklistCorrectWorkflow', issueSelected ? 'yes' : 'no');
    const isFFH = !dom.skillToggle.checked;
    const awaSelected = _getFieldValue('awaAlertsSelect') !== '';
    setChecklistValue('checklistAdvancedWifi', isFFH && awaSelected ? 'yes' : 'no');
    const tvsYes = _getFieldValue('tvsSelect') === 'YES';
    const tvsKeyFilled = _getFieldValue('tvsKeyInput') !== '';
    setChecklistValue('checklistTvs', tvsYes && tvsKeyFilled ? 'yes' : 'no');
    const tsText = _getFieldValue('troubleshootingProcessText').toLowerCase();
    const rebootKeywords = ['fr', 'hr', 'factory reset', 'hard reset', 'reboot'];
    setChecklistValue('checklistReboot', rebootKeywords.some(keyword => tsText.includes(keyword)) ? 'yes' : 'na');
    setChecklistValue('checklistSwap', _getFieldValue('csrOrderInput') ? 'yes' : 'na');
    const resolvedValueForCallback = _getFieldValue('resolvedSelect');
    setChecklistValue('checklistCallback', resolvedValueForCallback === 'Cx Need a Follow Up. Set SCB on FVA' ? 'yes' : 'na');
    setChecklistValue('checklistAllServices', _getFieldValue('serviceOnCsr') === 'Active' ? 'yes' : 'no');
    setChecklistValue('checklistGoSend', _getFieldValue('extraStepsSelect') !== '' ? 'yes' : 'no');
}

export const generateFinalNote = () => {
    let noteContent = [
        ..._buildSection1Content(),
        ..._buildSection2InitialContent(),
        ..._buildTroubleshootingProcessContent(),
        ..._buildSection3Content(),
        ..._buildSection4Content()
    ];
    let rawNote = noteContent.filter(line => line.trim() !== '').join('\n').replace(/\n\s*\n/g, '\n\n').trim();
    state.currentFinalNoteContent = rawNote;
    const charCount = rawNote.length;

    updateCharCounter(charCount, dom.modalNoteCharCount, true);
    updateCharCounter(charCount, dom.mainNoteCharCountHeader, true);
    if (dom.headerCharCountValue) {
        updateCharCounter(charCount, dom.headerCharCountValue, true);
    }
    if (dom.troubleshootingProcessText) {
        updateTroubleshootingCharCounter(dom.troubleshootingProcessText.value.length);
    }
    
    updateStickyHeaderInfo();
    updateChecklistState();
};

export const noteBuilder = {
    _buildSection1Content,
    _buildSection2InitialContent,
    _buildTroubleshootingProcessContent,
    _buildSection3Content,
    _buildSection4Content,
    _getFieldValue
};
