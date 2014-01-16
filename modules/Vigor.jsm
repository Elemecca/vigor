/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Cu = Components.utils,
      Ci = Components.interfaces,
      Cc = Components.classes;

Cu.import( "resource://gre/modules/Promise.jsm" );

const EXPORTED_SYMBOLS = [ "Vigor" ];

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

        document.body.appendChild(
            document.createTextNode( "Hi there!" ) );
        
        defer.resolve();
    }).bind( this ), true );

    parentElement.appendChild( this._iframe );

    return defer.promise;
};
