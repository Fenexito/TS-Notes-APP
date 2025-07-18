/**
 * @file database.js
 * @summary Manages all interactions with the IndexedDB database using Dexie.js.
 * This includes database setup, and all CRUD (Create, Read, Update, Delete) operations for notes and settings.
 */

import { AGENT_NAME_KEY } from './config.js';

// Initialize the Dexie database instance.
// This object is exported and used by other modules to interact with the database.
export const db = new Dexie('tsNotesAppDB');

// Define the database schema.
// Version 1 of the database contains two tables (object stores):
// - 'notes': Stores the note objects. 'id' is the primary key, and 'timestamp' is an indexed field for sorting.
// - 'settings': A key-value store for application settings, like the agent's name. 'key' is the primary key.
db.version(1).stores({
    notes: 'id, timestamp',
    settings: 'key'
});

/**
 * Saves or updates the agent's name in the database.
 * @param {string} name - The agent's name to save.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
export async function saveAgentNameToDB(name) {
    await db.settings.put({ key: AGENT_NAME_KEY, value: name });
}

/**
 * Retrieves the agent's name from the database.
 * @returns {Promise<object|undefined>} A promise that resolves with the setting object or undefined if not found.
 */
export async function loadAgentNameFromDB() {
    return await db.settings.get(AGENT_NAME_KEY);
}

/**
 * Saves a new note or updates an existing one in the database.
 * @param {object} noteData - The complete note object to save.
 * @param {string|null} editingId - The ID of the note to update. If null, a new note is created.
 * @returns {Promise<string>} A promise that resolves with the ID of the saved/updated note.
 */
export async function saveNoteToDB(noteData, editingId) {
    if (editingId) {
        // If we are editing, we update the existing note.
        const originalNote = await db.notes.get(editingId);
        if (originalNote && originalNote.timestamp) {
            noteData.timestamp = originalNote.timestamp; // Preserve original timestamp
        }
        noteData.id = editingId;
        noteData.isModified = true; // Mark as modified
        await db.notes.put(noteData);
        return editingId;
    } else {
        // If it's a new note, we add it.
        const newId = Date.now().toString();
        noteData.id = newId;
        noteData.isModified = false;
        await db.notes.add(noteData);
        return newId;
    }
}

/**
 * Loads all notes from the database, sorted by timestamp in descending order.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of all note objects.
 */
export async function loadAllNotesFromDB() {
    return await db.notes.orderBy('timestamp').reverse().toArray();
}

/**
 * Deletes a note from the database by its ID.
 * @param {string} noteId - The ID of the note to delete.
 * @returns {Promise<void>} A promise that resolves when the note is deleted.
 */
export async function deleteNoteFromDB(noteId) {
    await db.notes.delete(noteId);
}

/**
 * Imports an array of notes into the database.
 * This will add new notes and overwrite existing notes with the same ID.
 * @param {Array<object>} data - An array of note objects to import.
 * @returns {Promise<void>} A promise that resolves when the bulk operation is complete.
 */
export async function importNotesToDB(data) {
    await db.notes.bulkPut(data);
}
