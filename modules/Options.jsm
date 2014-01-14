/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Cu = Components.utils,
      Ci = Components.interfaces,
      Cc = Components.classes;

Cu.import( "resource://gre/modules/Services.jsm" );
Cu.import( "resource://gre/modules/FileUtils.jsm" );
Cu.import( "resource://vigor/VimChecker.jsm" );
Cu.import( "resource://vigor/VimLocator.jsm" );

const Options = function (document) {
    this._vim_path   = document.getElementById( "vigor-vim-path" );
    this._vim_button = document.getElementById( "vigor-vim-choose" );
    this._vim_desc   = document.getElementById( "vigor-vim-desc" );

    this._vim_path.style.fontFamily = "monospace";
    this._vim_path.style.whiteSpace = "pre";

    this._vim_button.addEventListener(
            "command", this.chooseVim.bind( this ), false );

    this.loadPrefs();
};
const P = Options.prototype = {};

P.loadPrefs = function() {
    VimLocator.locate( this._setVim.bind( this ) );
};

P.chooseVim = function() {
    this._vim_button.disabled = true;

    if (null == this._vim_picker) {
        this._vim_picker = Cc[ "@mozilla.org/filepicker;1" ]
                .createInstance( Ci.nsIFilePicker );
        this._vim_picker.init(
                this._vim_button.ownerDocument.defaultView,
                "Choose Vim Executable",
                Ci.nsIFilePicker.modeOpen );
        this._vim_picker.appendFilters( Ci.nsIFilePicker.filterApps );
        this._vim_picker.appendFilters( Ci.nsIFilePicker.filterAll );
    }

    this._vim_picker.open( (function (result) {
        if (Ci.nsIFilePicker.returnOK == result) { 
            this.setVim( this._vim_picker.file.path );
        } else {
            this._vim_button.disabled = false;
        }
    }).bind( this ) );
};

P.setVim = function (file) {
    if ('string' == typeof file)
        file = new FileUtils.File( file );

    this._vim_path.value = file.path;
    this._vim_desc.textContent = "Checking...";

    VimChecker.check( file, (function (result) {
        VimLocator.setLocation( result );
        this._showVimCheck( result );
        this._vim_button.disabled = false;
    }).bind( this ) );
};

P._setVim = function (result) {
    if (result) {
        this._vim_path.value = result.file.path;
        this._showVimCheck( result );
    } else {
        this._vim_path.value = "";
    }
    this._vim_button.disabled = false;
};

P._showVimCheck = function (result) {
    const element  = this._vim_desc.cloneNode( false );
    const document = element.ownerDocument;

    if (result.error) {
        const error_box = document.createElement( 'div' );
        error_box.style.display = "block";
        error_box.style.maxWidth = "80ex";
        error_box.style.whiteSpace = "pre-line";
        error_box.style.border = "2px solid rgba( 255, 0, 0, 0.8 )";
        error_box.style.background = "rgba( 255, 0, 0, 0.25 )";
        error_box.style.padding = "0.5ex";
        error_box.style.marginTop = "0.25em";
        error_box.textContent = result.error;
        element.appendChild( error_box );
    }

    if (result.output) {
        const output_box = document.createElement( 'div' );
        output_box.style.display = "block";
        output_box.style.maxWidth = "90ex";
        output_box.style.whiteSpace = "pre-wrap";
        output_box.style.fontFamily = "monospace";
        output_box.style.fontSize = "80%";
        output_box.style.border = "1px solid rgba( 0, 0, 0, 0.2 )";
        output_box.style.background = "rgba( 0, 0, 0, 0.1 )";
        output_box.style.padding = "0.5ex";
        output_box.style.marginTop = "0.25em";
        element.appendChild( output_box );

        if (result.summary) {
            output_box.appendChild(
                    document.createTextNode( result.summary ) );
            
            const keys = Object.keys( result.features ).sort(
                    function (a, b) { return a.localeCompare( b ) } );
            for (var idx = 0; idx < keys.length; idx++) {
                var feature = result.features[ keys[ idx ] ];

                var span = document.createElement( "span" );
                span.style.display = "inline";
                span.style.color = (feature.enabled ? "green" : "red");
                span.textContent = feature.string;
                output_box.appendChild( span );
                output_box.appendChild(
                        document.createTextNode( " " ) );
            }
        } else {
            // append at most five lines of the output
            output_box.appendChild( document.createTextNode(
                    result.output.substring( 0, 5 * 80 )
                        .split( /\r?\n/ ).slice( 0, 5 ).join( "\n" )
                ) );
        }
    }

    this._vim_desc.parentNode.replaceChild( element, this._vim_desc );
    this._vim_desc = element;
};


P.destroy = function() {
    // make sure we forget all DOM nodes to prevent leaks
    for (var key in this) {
        if (this.hasOwnProperty( key ))
            delete this[ key ];
    }
};

Options.register = function() {
    Services.obs.addObserver( Options.handler, "addon-options-displayed", false );
    Services.obs.addObserver( Options.handler, "addon-options-hidden", false );
};

Options.unregister = function() {
    Services.obs.removeObserver( Options.handler, "addon-options-displayed" );
    Services.obs.removeObserver( Options.handler, "addon-options-hidden" );
};

Options.handler = function (subject, topic, data) {
    if ("vigor@maltera.com" !== data) return;
    if ("addon-options-displayed" === topic) {
        Options.instance = new Options( subject );
    } else if ("addon-options-hidden" === topic) {
        if (Options.instance) {
            Options.instance.destroy();
            Options.instance = null;
        }
    }
};

const EXPORTED_SYMBOLS = [ "Options" ];
