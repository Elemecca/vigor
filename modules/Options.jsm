/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Cu = Components.utils,
      Ci = Components.interfaces,
      Cc = Components.classes;

Cu.import( "resource://gre/modules/Services.jsm" );
Cu.import( "resource://gre/modules/FileUtils.jsm" );
Cu.import( "resource://flatascii/VimChecker.jsm" );

const Options = function (document) {
    Services.console.logStringMessage( "Options()" );
    this._vim_path   = document.getElementById( "flatascii-vim-path" );
    this._vim_button = document.getElementById( "flatascii-vim-choose" );
    this._vim_desc   = document.getElementById( "flatascii-vim-desc" );

    this._vim_button.addEventListener(
            "command", this.chooseVim.bind( this ), false );

    this._vim_desc.textContent = "";
    this._vim_desc.style.whiteSpace = "pre";
    this._vim_desc.style.fontFamily = "monospace";

    this.loadPrefs();
};
const P = Options.prototype = {};

P.loadPrefs = function() {
    // for now just be lazy
    this._vim_path.value = "";
    this._vim_button.disabled = false;
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
    }

    this._vim_picker.open( (function (result) {
        if (Ci.nsIFilePicker.returnOK != result) return;

        this.setVim( this._vim_picker.file.path );
    }).bind( this ) );
};

P.setVim = function (file) {
    if ('string' == typeof file)
        file = new FileUtils.File( file );

    this._vim_path.value = file.path;
    this._vim_desc.textContent = "Checking...";

    VimChecker.check( file, (function (result) {
        result.buildOutput( this._vim_desc );
        this._vim_button.disabled = false;
    }).bind( this ) );
}

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

Options.handler = function (subject, topic, data) {
    if ("flatascii@maltera.com" !== data) return;
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
