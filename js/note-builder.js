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

const _buildSection3Content 
