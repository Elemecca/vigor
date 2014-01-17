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

const VIGOR_IFRAME =
    'data:text/html;charset=utf8,<!DOCTYPE html>'
    + '<html dir="ltr">'
    + '  <head>'
    + [ '<script type="application/javascript" src="'
            + url + '"></script>' 
            for (url of VIGOR_SCRIPTS) ].join( "\n" )
    + [ '<link rel="stylesheet" type="text/css" href="' + url + '" />'
            for (url of VIGOR_STYLES) ].join( "\n" )
    + '  <body></body>'
    + '</html>';

const VIGOR_DEAD_VIM = "\x1Bc" // RIS - reset terminal
    + "                               /XXXXXXXXXXXXX\\\r\n            "
    + "                /XXXXXXXXXXXXXXXXXXX\\\r\n                     "
    + "     /XXX    XXX   XXX    XXX\\\r\n                         /XX"
    + "XX XX XXXX XXXX XX XXXX\\\r\n                        /XXXXX    "
    + "XXXX XXXX    XXXXX\\\r\n                        [XXXXX X XXXXX "
    + "XXXX XXXXXXXX]\r\n                        [XXXXX XX XXX   XXX X"
    + "XXXXXXX]\r\n                        [XXXXXXXXXXXXXXXXXXXXXXXXXX"
    + "X]\r\n                        [XXX                     XXX]\r\n"
    + "                        [XXX HERE LIES A PROCESS XXX]\r\n      "
    + "                  [XXX KILLED IN ITS PRIME XXX]\r\n            "
    + "            [XXX  BY A NEGLIGENT ^D  XXX]\r\n                  "
    + "      [XXX                     XXX]\r\n                        "
    + "[XXXXXXXXXXXXXXXXXXXXXXXXXXX]\r\n                        [XXXXX"
    + "XXXXXXXXXXXXXXXXXXXXXX]\r\n                        [ XXXXXXXXX "
    + "XXXXXXXX XXXXXX ]\r\n                        [X XXXXXXX XXXXXX "
    + "X XXXX XXX]\r\n   \\//  \\|/ \\/|/   \\/  [XX\\|//XXXXXXXXXX\\X"
    + "XXXXXXX\\/XX] \\|/  \\/|/ \\/ \\||/\\/\r\n#####################"
    + "##########################################################\r\n"
    + "\r\n                                Vim has died.\r\n          "
    + "                        Restart?\r\n";

const Vigor = function Vigor() {
    // start looking for the Vim executable now
    this._vim_exec = VimLocator.locate();

    this._running = true;
};

const P = Vigor.prototype = {};

P._launchVim = function() {
    return this._vim_exec.then( (result) => {
        const deferred = Promise.defer();
        this._process = subprocess.call({
            command: result.file.path,
            workdir: result.file.parent.path,
            stdin: (stdin) => {
                this._stdin = stdin;
                deferred.resolve( this );
            },
            stdout: (data) => {
                this._term.write( data );
            },
            done: (result) => {
                this._process = null;
                this._term.off( 'data', this._stdin.write );
                this._stdin = null;

                if (!this._destroyed)
                    this._vimDied();
            },
            bufferedOutput: false,
        });
        return deferred.promise;
    } );
};

P._vimDied = function() {
    const onData = (data) => {
        this._term.off( 'data', onData );
        this._term.write( "\x1Bc" ); // reset terminal
        this._launchVim().then( () => {
            this._term.on( 'data', this._stdin.write );
        });
    };
    
    this._term.on( 'data', onData );
    this._term.write( VIGOR_DEAD_VIM );
};

P.appendTo = function (parentElement) {
    const parentDoc = parentElement.ownerDocument;
    
    this._iframe = parentDoc.createElement( 'iframe' );
    this._iframe.setAttribute( 'flex', '1' );
    this._iframe.setAttribute( 'src', VIGOR_IFRAME );

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
