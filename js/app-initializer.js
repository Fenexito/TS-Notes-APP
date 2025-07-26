/**
 * @file app-initializer.js
 * @summary Centraliza la inicialización de la aplicación.
 * Llama a todas las funciones necesarias para configurar el estado inicial
 * de la aplicación después de que el DOM se haya cargado.
 */

import { dom, get, queryAll } from './dom-elements.js';
import { initializeEventListeners } from './event-listeners.js';
import { loadNotes, handleWelcomeModal } from './history-manager.js';
import { populateTimeSlots, updateTroubleshootingCharCounter } from './ui-helpers.js';
import { populateExtraStepsSelect, updateThirdRowLayout, initialResizeTextareas, updateStickyHeaderInfo, handleSkillChange, applyInitialRequiredHighlight } from './ui-manager.js';
import { resetChecklist } from './checklist-manager.js';
import { generateFinalNote } from './note-builder.js';
import { initializeTutorial, startTour } from './tutorial.js';

/**
 * Orquesta la secuencia de inicialización de la aplicación.
 */
export async function initializeApp() {
    console.log('initializeApp: Starting initialization...');

    // Popula los selects que tienen opciones estáticas.
    const transferOptions = [
        'FFH CARE', 'FFH LOYALTY', 'FFH CAM - COLLECTIONS', 'C2F', 'SHS', 'MOB TS', 
        'MOB CARE', 'MOB LOYALTY', 'MOB CAM', 'wHSIA TS', 'SATELLITE TS', 'SMARTHOME CARE', 
        'SMARTHOME LOYALTY', 'SMARTHOME PLUS', 'ACQUISITIONS CARE', 'ACQUISITIONS TS', 
        'CUSTOM HOME CARE & MOVES', 'CUSTOM HOME LOYALTY', 'CUSTOM HOME TS'
    ];
    transferOptions.forEach(optionText => {
        const option = document.createElement('option');
        option.value = optionText;
        option.textContent = optionText;
        if (dom.transferSelect) dom.transferSelect.appendChild(option);
    });
    
    // Configura los dropdowns y campos iniciales.
    populateExtraStepsSelect();
    updateThirdRowLayout();
    
    console.log('initializeApp: Calling initializeEventListeners...');
    initializeEventListeners();

    // Maneja la lógica del modal de bienvenida y determina si el usuario es nuevo.
    const isNewUser = await handleWelcomeModal();
    initialResizeTextareas();

    // Asegura que los campos dinámicos empiecen ocultos.
    if (dom.affectedTextGroup) dom.affectedTextGroup.style.display = 'none';
    if (dom.serviceAffectedRow) dom.serviceAffectedRow.classList.remove('has-affected');

    // Inicializa los selects de "physical check".
    const initialPhysicalCheckListIds = ['physicalCheckList1Select', 'physicalCheckList2Select', 'physicalCheckList3Select', 'physicalCheckList4Select'];
    initialPhysicalCheckListIds.forEach(id => {
        const selectElement = get(id);
        if (selectElement) {
            selectElement.innerHTML = '<option value="">Select an option</option>';
            selectElement.disabled = true;
            selectElement.removeAttribute('required');
        }
    });

    // Inicializa los checkboxes y contenedores relacionados.
    if (dom.enablePhysicalCheck2) { dom.enablePhysicalCheck2.checked = false; dom.enablePhysicalCheck2.disabled = true; }
    if (dom.enablePhysicalCheck3) { dom.enablePhysicalCheck3.checked = false; dom.enablePhysicalCheck3.disabled = true; }
    if (dom.enablePhysicalCheck4) { dom.enablePhysicalCheck4.checked = false; dom.enablePhysicalCheck4.disabled = true; }
    if (dom.physicalCheckListsContainer) dom.physicalCheckListsContainer.classList.add('hidden-field');
    if (dom.enableAwaAlerts2) dom.enableAwaAlerts2.checked = false;
    if (dom.awaAlerts2Select) dom.awaAlerts2Select.value = '';
    if (dom.awaStepsSelect) { dom.awaStepsSelect.disabled = true; dom.awaStepsSelect.removeAttribute('required'); }
    if (dom.transferCheckbox) dom.transferCheckbox.checked = false;

    // Popula los slots de tiempo para dispatch.
    populateTimeSlots("dispatch");
    
    // Resetea el checklist y genera la nota inicial vacía.
    resetChecklist();
    generateFinalNote();

    // Actualiza contadores y carga el historial de notas.
    if (dom.troubleshootingProcessText) updateTroubleshootingCharCounter(dom.troubleshootingProcessText.value.length);
    await loadNotes();
    
    // Aplica el resaltado inicial a los campos requeridos y configura el sticky header.
    applyInitialRequiredHighlight();
    window.addEventListener('scroll', updateStickyHeaderInfo);
    updateStickyHeaderInfo();

    // Configura el estado inicial del toggle de "skill".
    handleSkillChange();

    // Inicializa el tutorial (solo listeners) y lo inicia si es un usuario nuevo.
    initializeTutorial();
    if (isNewUser) {
        setTimeout(() => {
            startTour();
        }, 250);
    }
    
    console.log('initializeApp: Initialization complete.');
}
