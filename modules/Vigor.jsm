/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Cu = Components.utils,
      Ci = Components.interfaces,
      Cc = Components.classes;

Cu.import( "resource://gre/modules/Services.jsm" );
Cu.import( "resource://gre/modules/Promise.jsm" );

const EXPORTED_SYMBOLS = [ "Vigor" ];

const VIGOR_SCRIPTS = [
    "resource://vigor/lib/term.js",
];

const Vigor = function Vigor() {

};

const P = Vigor.prototype = {};

P.appendTo = function (parentElement) {
    const parentDoc = parentElement.ownerDocument;
    
    this._iframe = parentDoc.createElement( 'iframe' );
    this._iframe.setAttribute( 'flex', '1' );
    this._iframe.setAttribute( 'src',
            'data:text/html;charset=utf8,<!DOCTYPE html>'
            + '<html dir="ltr">'
            + '  <body></body>'
            + '</html>'
        );

    const defer = Promise.defer();
    this._iframe.addEventListener( 'load', (function onLoad() {
        this._iframe.removeEventListener( 'load', onLoad, true );
        const window   = this._iframe.contentWindow.wrappedJSObject;
        const document = window.document;

        for (let url of VIGOR_SCRIPTS)
            Services.scriptloader.loadSubScript( url, window, "utf8" );
        
        this._term = new window.Terminal();
        this._term.on( 'data', (function onData (data) {
            this._term.write( data );
        }).bind( this ) );

        this._term.open( document.body );
        this._term.write( "Hi there!\n" );
        
        defer.resolve( this );
    }).bind( this ), true );

    parentElement.appendChild( this._iframe );

    return defer.promise;
};

P.destroy = function() {
    if (this._term) {
        this._term.destroy();
        this._term = null;
    }

    if (this._iframe) {
        this._iframe.parentNode.removeChild( this._iframe );
        this._iframe = null;
    }
};
