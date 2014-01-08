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
        return;
    }

    if (!this._parseOutput()) return;

    if (!(this._features[ "netbeans_intg" ] || {}).enabled) {
        this._error = "NetBeans integration protocol is not supported";
        return;
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

Object.defineProperty( P, 'ok', {
    get: function() {
        return ('undefined' == typeof this._error);
    },
});

P.buildOutput = function (parent) {
    const document = parent.ownerDocument;
    const fragment = document.createDocumentFragment();

    if (!this.ok) {
        const error_box = document.createElement( 'div' );
        error_box.style.display = "block";
        error_box.style.border = "2px solid rgba( 255, 0, 0, 0.8 )";
        error_box.style.background = "rgba( 255, 0, 0, 0.25 )";
        error_box.style.padding = "0.5ex";
        error_box.style.marginBottom = "0.5em";
        error_box.textContent = this._error;
        fragment.appendChild( error_box );
    }

    const output_box = document.createElement( 'div' );
    output_box.style.display = "block";
    output_box.style.border = "1px solid rgba( 0, 0, 0, 0.2 )";
    output_box.style.background = "rgba( 0, 0, 0, 0.1 )";
    output_box.style.padding = "0.5ex";
    output_box.style.fontSize = "80%";
    fragment.appendChild( output_box );
    
    const summary_box = document.createElement( 'div' );
    summary_box.style.display = "block";
    summary_box.style.whiteSpace = "pre";
    summary_box.textContent = this._summary;
    output_box.appendChild( summary_box );

    const feat_box = document.createElement( 'div' );
    feat_box.style.display = "block";
    feat_box.style.whiteSpace = "normal";
    feat_box.style.maxWidth = "80ex";
    output_box.appendChild( feat_box );
    
    const keys = Object.keys( this._features ).sort( function (a, b) {
        return a.localeCompare( b )
    } );
    for (var idx = 0; idx < keys.length; idx++) {
        var feature = this._features[ keys[ idx ] ];

        var span = document.createElement( "span" );
        span.style.display = "inline";
        span.style.color = (feature.enabled ? "green" : "red");
        span.textContent = feature.string;
        feat_box.appendChild( span );
        feat_box.appendChild( document.createTextNode( " " ) );
    }

    parent.textContent = "";
    parent.appendChild( fragment );
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
