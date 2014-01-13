/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

const EXPORTED_SYMBOLS = [ "SourceEditor" ];

const SourceEditor = function SourceEditor() {
    
};

const P = SourceEditor.prototype = {};

P.init = function (element, config, callback) {
    if (this._iframe)
        throw new Error( "SourceEditor is already initialized" );

    let doc = element.ownerDocument;

    this._iframe = doc.createElementNS( XUL_NS, "iframe" );
    this._iframe.flex = 1;

    let onIframeLoad = (function() {
        this._iframe.removeEventListener( "load", onIframeLoad, true );
        this._onIframeLoad();
    }).bind(this);

    this._iframe.addEventListener( "load", onIframeLoad, true );

    this._iframe.setAttribute( "src",
            "data:text/html;charset=utf8,<!DOCTYPE html>"
            + "<html style='height:100%' dir='ltr'>"
            + "<body style='height:100%;margin:0;overflow:hidden'>"
            + "<div id='editor' style='height:100%'></div>"
            + "</body></html>"
        );

    element.appendChild( this._iframe );
    this.parentElement = element;

    this._onReadyCallback = callback;
    this.ui.init();
};

P._onIframeLoad = function() {
    let window = this._iframe.contentWindow.wrappedJSObject;
    let document = window.contentDocument;
    
    document.getElementById( 'editor' ).textContent = this.getText();

    if (this._onReadyCallback) {
        this._onReadyCallback( this );
        this._onReadyCallback = null;
    }
};

Object.defineProperty( P, "editorElement", {
    get: function() {
        return this._iframe;
    }
});

P.addEventListener = function (type, callback){}; //TODO:STUB
P.removeEventListener = function (type, callback){}; //TODO:STUB
P.undo = function(){}; //TODO:STUB
P.redo = function(){}; //TODO:STUB

P.canUndo = function() {
    //TODO:STUB
    return false;
};

P.canRedo = function() {
    //TODO:STUB
    return false;
};

P.resetUndo = function(){}; //TODO:STUB
P.dirty = true; //TODO:STUB
P.startCompoundChange = function(){}; //TODO:STUB
P.endCompoundChange = function(){}; //TODO:STUB
P.focus = function(){}; //TODO:STUB

P.getTopIndex = function() {
    //TODO:STUB
    return 0;
};

P.setTopIndex = function (index){}; //TODO:STUB

P.hasFocus = function() {
    //TODO:STUB
    return false;
};

P.getText = function (start, end) {
    //TODO:STUB
    return "Hello, Vigor.";
};

P.getLineStart = function (line) {
    //TODO:STUB
    return 0;
};

P.getLineEnd = function (line, includeDelimiter) {
    //TODO:STUB
    return this.getCharCount();
};

P.getCharCount = function() {
    //TODO:STUB
    return this.getText().length;
};

P.getSelectedText = function() {
    //TODO:STUB
    return "";
};

P.setText = function (text, start, end) {
    //TODO:STUB
};

P.dropSelection = function(){}; //TODO:STUB
P.setSelection = function (start, end){}; //TODO:STUB

P.getSelection = function(){
    //TODO:STUB
    return { start: 0, end: 0 };
};

P.getCaretOffset = function() {
    //TODO:STUB
    return 0;
};

P.setCaretOffset = function (offset) {}; //TODO:STUB

P.getCaretPosition = function() {
    //TODO:STUB
    return { line: 0, col: 0 };
};

P.setCaretPosition = function (line, col, align) {}; //TODO:STUB

P.getLineCount = function() {
    //TODO:STUB
    return 1;
};

P.getLineDelimiter = function() {
    //TODO:STUB
    return "\n";
};

P.getIndentationString = function() {
    //TODO:STUB
    return "    ";
};

P.setMode = function (mode) {}; //TODO:STUB

P.getMode = function() {
    //TODO:STUB
    return SourceEditor.MODES.TEXT;
};

P.readOnly = false; //TODO:STUB
P.setDebugLocation = function (line) {}; //TODO:STUB

P.getDebugLocation = function() {
    //TODO:STUB
    return -1;
};

P.addBreakpoint = function (line, condition) {}; //TODO:STUB
P.removeBreakpoint = function (line) {}; //TODO:STUB

P.getBreakpoints = function() {
    //TODO:STUB
    return [];
};

P.convertCoordinates = function (rect, from, to) {
    //TODO:STUB
    return rect;
};

P.getOffsetAtLocation = function (x, y) {
    //TODO:STUB
    return 0;
};

P.getLocationAtOffset = function (offset) {
    //TODO:STUB
    return { x: 10, y: 10 };
};

P.getLineAtOffset = function (offset) {
    // TODO:STUB
    return 0;
};

P.destroy = function() {
    this.ui.destroy();
    this.ui = null;

    this.parentElement.removeChild( this._iframe );
    this.parentElement = null;
    this._iframe = null;
};
