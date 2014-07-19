/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { Cu, Cc, Ci, Components } = require( "chrome" );
const promise   = require( "sdk/core/promise" );
const events    = require( "devtools/shared/event-emitter" );
Cu.import( "resource://vigor/modules/Vigor.jsm" );

const Editor = function Editor (config) {
    this.config = {};
    this._vigor = new Vigor();

    events.decorate( this );
};

const P = Editor.prototype = {};

P.appendTo = function (targetElement) {
    return this._vigor.appendTo( targetElement );
};

/** Gets the current contents of the document.
 * @return {string} the entire contents of the editor buffer
 */
P.getText = function() {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Replaces the current contents of the document.
 * @param text {string} the new contents of the editor buffer
 */
P.setText = function (text) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Inserts the given text at the given position.
 * @param value {string} the text to be inserted
 * @param at {Point} the location at which it should be inserted
 */
P.insertText = function (value, at) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Replaces the contents of a region with the given text.
 * If {@code to} is omitted the region to be replaces starts at
 * {@code from} and contains the same number of characters as the
 * replacement string.
 *
 * @param value {string} the text to be inserted
 * @param from {Point} the start of the region to be replaced
 * @param [to] {Point} the end of the region to be replaced
 */
P.replaceText = function (value, from, to) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Checks whether the editor buffer contains unsaved changes.
 * @return {boolean} {@code true} if no changes have been made since
 *         the document was last saved
 */
P.isClean = function() {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Marks the editor buffer as having been saved.
 * @return {integer} the serial number of the new change generation
 */
P.setClean = function() {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Gets the syntax highlighting mode currently in effect.
 * @return {string} the name of the current mode
 */
P.getMode = function() {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Changes the syntax highlighting mode.
 * @param mode {string} the name of the new mode
 */
P.setMode = function (mode) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Checks whether the editor is focused.
 * @return {boolean} whether editor currently holds input focus
 */
P.hasFocus = function() {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Switches input focus to the editor. */
P.focus = function() {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Gets the current position of the cursor.
 * @param [start="head"] {string} which end of the selection to get:
 *        one of "start" (the end with the lower index), "end" (the
 *        end with the higher index), "head" (the end which moves when
 *        changing the selection), or "anchor" (the end which doesn't)
 * @return {Editor.Point} a character pointer
 */
P.getCursor = function (start) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Checks whether any text is currently selected.
 * @return {boolean} whether the endpoints of the selection differ
 */
P.somethingSelected = function() {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Gets the selected text.
 * @return {string} the content of the selected region
 */
P.getSelection = function() {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Sets the endpoints of the selected region.
 * @param anchor {Point} the static end of the region
 * @param [head] {Point} the movable end of the region,
 *        defaults to the same as {@code anchor}
 */
P.setSelection = function (anchor, head) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Deselects the currently selected region, if any. */
P.dropSelection = function() {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Replaces the content of the selected region with the given string.
 * By default the replacement text will remain selected. Passing the
 * {@code collapse} parameter will cause it to be collapsed to one end.
 *
 * @param replacement {string} the text to be inserted
 * @param [collapse] {string} collapse the selection the given end,
 *        one of "start" or "end"
 */
P.replaceSelection = function (replacement, collapse) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Moves one step back in the revision history.
 * Silently does nothing in the case that no older states exist.
 * TODO: check this wrt. error case
 */
P.undo = function() {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Checks whether it's possible to undo a change.
 * @return {boolean} whether a revision exists before the current one
 */
P.canUndo = function() {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Moves one step forward in the revision history.
 * Silently does nothing in the case that no newer states exist.
 * TODO: check this wrt. error case
 */
P.redo = function() {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Checks whether it's possible to redo a change.
 * @return {boolean} whether a revision exists after the current one
 */
P.canRedo = function() {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Resets the document's revision history.
 * The current state of the document will become the new base revision
 * and all other revisions will be permanently discarded.
 */
P.clearHistory = function() {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** TODO: CodeMirror method; not exactly sure how it works */
P.openDialog = function() {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** TODO: Mozilla method; not exactly sure how it works */
P.showContextMenu = function (container, x, y) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Returns the graphical coordinates of the cursor.
 * @param [where=false] {boolean|Point} which character should be
 *        measured: {@code true} for the start of the selection,
 *        {@code false} fot the end of the selection, or a
 *        {@code Point} for an absolute position within the document
 *        TODO: is a Point relative to the document or selection?
 * @param [mode="page"] {string} whether pixel coordinates should be
 *        calculated relative to the editor viewport ("local") or the
 *        browser window ("page")
 * @return {object} an object with properties {@code left},
 *         {@code top}, and {@code bottom} containing the pixel offsets
 *         of the requested character
 *         TODO: offsets between which edges of what?
 */
P.cursorCoords = function (where, mode) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Returns the number of lines in the current document.
 * @return {integer} the number of lines
 */
P.lineCount = function() {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Calculates (line, column) coordinates based on character offsets.
 * @param ...args {integer} one or more offsets for which the
 *        (line, column) coordinates are to be calculated
 * @return {array|Point} an array of {@code Point} objects or, if only
 *         one offset was given, a single {@code Point} object
 */
P.getPosition = function (...args) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Calculates character offsets based on (line, column) coordinates.
 * @param ...args {Point} one or more {@code Point} objects whose
 *        character offsets are to be calculated
 * @return {array|integer} an array of character offsets or, if only
 *         one coordinate pair was given, a single offset
 */
P.getOffset = function (...args) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

/** Redraws the editor contents. */
P.refresh = function() {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

P.jumpToLine = function() {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

P.getPositionFromCoords = function (left, top) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

P.extendSelection = function (pos) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

P.extend = function (funcs) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

P.getFirstVisibleLine = function() {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

P.setFirstVisibleLine = function (line) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

P.setCursor = function (point, align) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

P.alignLine = function (line, align) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

P.hasMarker = function (line, gutterName, markerClass) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

P.addMarker = function (line, gutterName, markerClass) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

P.removeMarker = function (line, gutterName, markerClass) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

P.removeAllMarkers = function (gutterName) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

P.setMarkerListeners = function (
        line, gutterName, markerClass, events, data) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

P.hasLineClass = function (line, className) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

P.addLineClass = function (line, className) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

P.removeLineClass = function (line, className) {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

P.destroy = function() {
    throw new Error( "not implemented in Vigor" ); //TODO:STUB
};

Editor.modes = {
    text: { name: "text" },
    html: { name: "htmlmixed" },
    css:  { name: "css" },
    js:   { name: "javascript" },
    vs:   { name: "x-shader/x-vertex" },
    fs:   { name: "x-shader/x-fragment" },
};

module.exports = Editor;
