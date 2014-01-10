/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Cu = Components.utils,
      Ci = Components.interfaces;

Cu.import( "resource://gre/modules/Timer.jsm" );
Cu.import( "resource://gre/modules/Services.jsm" );
Cu.import( "resource://flatascii/lib/subprocess.jsm" );

const VimCheckerResult = function (result) {
    if ("string" == typeof result) {
        this._error = result;
        this._result = { stdout: "", exitCode: 255 };
    } else {
        this._result = result;

        if (0 != result.exitCode) {
            this._error = "command returned " + result.exitCode;
        } else {
            this._error = null;
        }
    }

    this._summary = null;
    this._features = {};
};
const P = VimCheckerResult.prototype = {};

Object.defineProperty( P, 'exitCode', {
    get: function() {
        return this._result.exitCode;
    },
});

Object.defineProperty( P, 'output', {
    get: function() {
        return this._result.stdout;
    },
});

Object.defineProperty( P, 'error', {
    get: function() {
        this._parseOutput();
        return this._error;
    },
});

Object.defineProperty( P, 'ok', {
    get: function() {
        return !this.error;
    },
});

Object.defineProperty( P, 'summary', {
    get: function() {
        this._parseOutput();
        return this._summary;
    },
});

Object.defineProperty( P, 'features', {
    get: function() {
        this._parseOutput();
        return this._features;
    },
});

P._parseOutput = function() {
    if (this._parsed || this._error) return;
    this._parsed = true;

    const raw = this._result.stdout;
    if ("string" != typeof raw || "" === raw) {
        this._error = "command produced no output";
        return;
    }

    if (!raw.startsWith( "VIM" )) {
        this._error = "output doesn't look like a 'vim --version' response";
        return;
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

    if (!(this._features[ "netbeans_intg" ] || {}).enabled) {
        this._error = "The NetBeans protocol is not supported.";

        if (/MS-Windows .* console version/i.test( this._summary )) {
            this._error += "\n\nUnfortunately the official Vim"
                + " binary for Windows doesn't support the control"
                + " protocol we use. We recommend using the version of"
                + " Vim distributed by the Cygwin project.";
        }
    }
}

const VimChecker = {}

function checkProcess (file, callback) {
    var timeout;
    var killed = false;

    const process = subprocess.call({
        command: file,
        arguments: [ "--version" ],
        workdir: file.parent.path,
        mergeStderr: true,
        done: function (result) {
            clearTimeout( timeout );
            callback.call( null, new VimCheckerResult( (killed 
                    ? "timed out waiting for 'vim --version' to run"
                    : result ) ) );
        },
    });

    timeout = setTimeout( function() {
        killed = true;
        process.kill( true );
    }, 2 * 1000 );
}

function checkHeader (file, callback) {
    Cu.import( "resource://flatascii/WindowsPEHeader.jsm" );
    const header = new WindowsPEHeader( file );
    header.read( function() {
        if (!header.error && header.nt.optional.subsystem
                == WindowsPEHeader.IMAGE_SUBSYSTEM_WINDOWS_GUI) {
            callback.call( null, new VimCheckerResult(
                "That file is a Windows GUI application.\n\n"
                + "Unfortunately we can't use gVim binaries on Windows"
                + " because they don't support console I/O, and the"
                + " official command-line binary doesn't support the"
                + " control protocol we use. We recommend using the"
                + " version of Vim distributed by the Cygwin project."
                ) );
        } else {
            checkProcess( file, callback );
        }
    });
}

VimChecker.check = function (file, callback) {
    // on Windows we don't want to call gVim because it'll open a
    // MessageBox, so we have to check the EXE file header first
    // to detect GUI applications
    if ("WINNT" == Services.appinfo.OS) {
        checkHeader( file, callback );
    } else {
        checkProcess( file, callback );
    }
}


const EXPORTED_SYMBOLS = [ "VimChecker" ];
