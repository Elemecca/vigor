/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Cu = Components.utils,
      Ci = Components.interfaces,
      Cc = Components.classes;

Cu.import( "resource://gre/modules/Services.jsm" );
Cu.import( "resource://gre/modules/Promise.jsm" );
Cu.import( "resource://vigor/VigorAddon.jsm" );
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

    // bind event handler methods
    this._handleResize  = this._handleResize.bind( this );
    this._checkResize   = this._checkResize.bind( this );

    this._running = true;
};

const P = Vigor.prototype = {};

P._launchVim = function() {
    return this._vim_exec.then( (result) => {
        const deferred = Promise.defer();

        const plugin_path = 
            VigorAddon.getResourceFile( "modules/impl/vigor.vim" );
        
        this._process = subprocess.call({
            command: result.file.path,
            arguments: [ "-S", plugin_path ],
            environment: [
                "LINES="    + this._term.rows,
                "COLUMNS="  + this._term.cols,
            ],
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
        this._window   = window;
        this._document = document;
        this._body     = document.body;

        // figure out the size of a character in the current font
        {   let guide = document.createElement( 'span' );
            guide.style.visibility = 'hidden';
            guide.textContent = 'x';
            document.body.appendChild( guide );

            Object.defineProperties( this, {
                _charWidth:  { value: guide.scrollWidth  },
                _charHeight: { value: guide.scrollHeight },
            });
            document.body.removeChild( guide );
        }

        const winSize = this._measureWindow();

        this._term = new window.Terminal({
                geometry: [ winSize.x, winSize.y ],
            });
        this._term.open( document.body );

        window.addEventListener(
                "resize", this._handleResize, false );

        defer.resolve( this._launchVim().then( (function() {
            this._term.on( 'data', this._stdin.write );
            return this;
        }).bind( this ) ));
    }).bind( this ), true );

    parentElement.appendChild( this._iframe );

    return defer.promise;
};

P._measureWindow = function() {
    return {
        x: Math.floor( this._body.clientWidth  / this._charWidth  ),
        y: Math.floor( this._body.clientHeight / this._charHeight ),
    };
};

P._handleResize = function() {
    if (this._resizing)
        this._window.clearTimeout( this._resizing );
    
    this._resizing = 
        this._window.setTimeout( this._checkResize, 66 );
};

P._checkResize = function() {
    if (this._resizing) {
        this._window.clearTimeout( this._resizing );
        this._resizing = null;
    }

    const win = this._measureWindow();
    if (win.x != this._term.cols
            || win.y != this._term.rows) {
        this._term.resize( win.x, win.y );

        // post resize control code to Vim
        this.sendCommand( "set"
                + " lines=" + this._term.rows
                + " columns=" + this._term.cols
            );

        return true;
    } else {
        return false;
    }
};

P.sendCommand = function (command) {
    if (!this._stdin)
        throw new Error( "vim process not attached" );

    this._stdin.write( "\x1B_" + command + "\x1B\\" );
};

P.destroy = function() {
    if (this._term) {
        this._term.destroy();
        this._term = null;
    }

    if (this._iframe) {
        this._window.removeEventListener(
                'resize', this._handleResize, false );
        if (this._resizing)
            this._window.cancelTimeout( this._resizing );

        this._iframe.parentNode.removeChild( this._iframe );

        this._window    = null;
        this._document  = null;
        this._body      = null;
        this._iframe    = null;
    }
};
