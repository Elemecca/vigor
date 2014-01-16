/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Cu = Components.utils,
      Ci = Components.interfaces,
      Cc = Components.classes;

Cu.import( "resource://gre/modules/Services.jsm" );
Cu.import( "resource://gre/modules/Promise.jsm" );
Cu.import( "resource://vigor/VimLocator.jsm" );
Cu.import( "resource://vigor/lib/subprocess.jsm" );

const EXPORTED_SYMBOLS = [ "Vigor" ];

const VIGOR_SCRIPTS = [
    "resource://vigor/lib/term.js",
];

const VIGOR_STYLES = [
    "resource://vigor/impl/terminal.css",
];

const Vigor = function Vigor() {

};

const P = Vigor.prototype = {};

P._launchVim = function() {
    const deferred = Promise.defer();

    VimLocator.locate( (function (result) {
        if (!result || !result.ok) {
            deferred.reject( new Error(
                    "vim executable not found" ) );
            return;
        }

        this._process = subprocess.call({
            command: result.file.path,
            workdir: result.file.parent.path,
            stdin: (function (stdin) {
                this._stdin = stdin;
                deferred.resolve( this );
            }).bind( this ),
            stdout: (function (data) {
                this._term.write( data );
            }).bind( this ),
            bufferedOutput: false,
        });
    }).bind( this ) );

    return deferred.promise;
};

P.appendTo = function (parentElement) {
    const parentDoc = parentElement.ownerDocument;
    
    this._iframe = parentDoc.createElement( 'iframe' );
    this._iframe.setAttribute( 'flex', '1' );
    this._iframe.setAttribute( 'src',
            'data:text/html;charset=utf8,<!DOCTYPE html>'
            + '<html dir="ltr">'
            + '  <head>'
            + [ '<script type="application/javascript" src="'
                    + url + '"></script>' 
                    for (url of VIGOR_SCRIPTS) ].join( "\n" )
            + [ '<link rel="stylesheet" type="text/css" href="'
                    + url + '" />'
                    for (url of VIGOR_STYLES) ].join( "\n" )
            + '  <body></body>'
            + '</html>'
        );

    const defer = Promise.defer();
    this._iframe.addEventListener( 'load', (function onLoad() {
        this._iframe.removeEventListener( 'load', onLoad, true );
        const window   = this._iframe.contentWindow.wrappedJSObject;
        const document = window.document;

        this._term = new window.Terminal({
            });
        this._term.open( document.body );

        defer.resolve( this._launchVim().then( (function() {
            this._term.on( 'data', this._stdin.write );
            return this;
        }).bind( this ) ));
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
