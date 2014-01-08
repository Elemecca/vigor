/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Cu = Components.utils,
      Ci = Components.interfaces;

Cu.import( "resource://flatascii/lib/subprocess.jsm" );

const VimCheckerResult = function (result) {
    this._result = result;
    this._summary = null;
    this._features = {};

    if (0 != result.exitCode) {
        this._error = "command returned " + result.exitCode;
    } else {
        this._parseOutput();
    }
};
const P = VimCheckerResult.prototype = {};

P.getFullOutput = function() {
    return this._result.stdout || "";
}

P._parseOutput = function() {
    const raw = this._result.stdout;
    if ("string" != typeof raw || "" === raw) {
        this._error = "command produced no output";
        return false;
    }

    if (!raw.startsWith( "VIM" )) {
        this._error = "output doesn't look like a 'vim --version' response";
        return false;
    }

    const lines = raw.split( /\r?\n/ );
   
    const re_feat_line = /^\s*[+-]/;
    const re_feat = /([+-]+)(\S+)/g;

    // save lines until the first feature line
    this._summary = lines[ 0 ] + "\n";
    for (var idx = 1; idx < lines.length; idx++) {
        var line = lines[ idx ];

        if (re_feat_line.test( line )) break;
        this._summary += line + "\n";
    }

    // extract each feature flag from the feature lines
    for (; idx < lines.length; idx++) {
        var line = lines[ idx ];
        if (!re_feat_line.test( line )) break;

        var match;
        while (null !== (match = re_feat.exec( line ))) {
            this._features[ match[ 2 ] ] = {
                name: match[ 2 ],
                flag: match[ 1 ],
                string: match[ 0 ],
                enabled: match[ 1 ].contains( "+" ),
            };
        }
    }

    return true;
}

P.buildOutput = function (parent) {
    const document = parent.ownerDocument;

    parent.textContent = this._summary;

    const feat_box = document.createElement( 'div' );
    feat_box.style.display = "block";
    feat_box.style.whiteSpace = "normal";
    feat_box.style.maxWidth = "80ex";
    
    for (var key in this._features) {
        if (!this._features.hasOwnProperty( key )) continue;
        var feature = this._features[ key ];

        var span = document.createElement( "span" );
        //span.style.minWidth = "20ex";
        span.style.display = "inline";
        span.style.color = (feature.enabled ? "green" : "red");
        span.textContent = feature.string;
        feat_box.appendChild( span );
        feat_box.appendChild( document.createTextNode( " " ) );
    }

    parent.appendChild( feat_box );
};

const VimChecker = {}

VimChecker.check = function (file, callback) {
    const process = subprocess.call({
        command: file,
        arguments: [ "--version" ],
        workdir: file.parent.path,
        mergeStderr: true,
        done: function (result) {
            callback.call( null, new VimCheckerResult( result ) );
        },
    });
}


const EXPORTED_SYMBOLS = [ "VimChecker" ];
