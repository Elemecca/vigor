/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const EXPORTED_SYMBOLS = [ "VimLocator" ];

const Cu = Components.utils,
      Ci = Components.interfaces,
      Cc = Components.classes;

Cu.import( "resource://gre/modules/Services.jsm" );
Cu.import( "resource://gre/modules/FileUtils.jsm" );
Cu.import( "resource://vigor/VimChecker.jsm" );

const PREF_KEY = "extensions.vigor.vimExecutable";
const isWindows = ("WINNT" == Services.appinfo.OS);

const providers = [];

// search the platform executable search path
providers.push( function (item, done) {
    const entries = (function() {
        const env = Cc[ "@mozilla.org/process/environment;1" ]
                .getService( Ci.nsIEnvironment );
        for (let dirPath of 
                env.get( "PATH" ).split( isWindows ? ';' : ':' )) {
            let dir = null;
            try {
                dir = new FileUtils.File( dirPath );
            } catch (caught) { continue; }

            if (!dir.exists() || !dir.isDirectory()) continue;

            for (let candidate of [ "vim", "vim.exe" ]) {
                let file = dir.clone();
                file.append( candidate );
                if (file.exists())
                    yield file;
            }
        }
    })();

    (function checkNext() {
        try {
            item.call( null, entries.next(), checkNext );
        } catch (caught) {
            try {
                if (caught instanceof StopIteration) {
                    done.call( null );
                } else {
                    Cu.reportError( caught );
                    checkNext();
                }
            } catch (caught) {
                Cu.reportError( caught );
            }
        }
    })();
});

// look for Cygwin installations
if (isWindows) providers.push( function (item, done) {
    const entries = (function() {
        const key = Cc[ "@mozilla.org/windows-registry-key;1" ]
                .createInstance( Ci.nsIWindowsRegKey );

        try {
            key.open(
                    Ci.nsIWindowsRegKey.ROOT_KEY_LOCAL_MACHINE,
                    "SOFTWARE\\Cygwin\\Installations",
                    Ci.nsIWindowsRegKey.ACCESS_READ
                );
        } catch (caught) {
            // the key doesn't exist
            return;
        }

        for (let idx = 0; idx < key.valueCount; idx++) {
            let value = key.readStringValue( key.getValueName( idx ) );
            if (value.startsWith( "\\??\\" ))
                value = value.substring( 4 );

            try {
                let file = new FileUtils.File( value );
                if (!file.exists() || !file.isDirectory()) continue;

                file.append( "bin" );
                file.append( "vim.exe" );
                if (file.exists())
                    yield file;
            } catch (caught) {
                // the file path is invalid
            }
        }
    })();

    (function checkNext() {
        try {
            item.call( null, entries.next(), checkNext );
        } catch (caught) {
            try {
                if (caught instanceof StopIteration) {
                    done.call( null );
                } else {
                    Cu.reportError( caught );
                    checkNext();
                }
            } catch (caught) {
                Cu.reportError( caught );
            }
        }
    })();
});

const VimLocator = {
    search: function (callback) {
        let best = null;
        function check (file, nope) {
            VimChecker.check( file, function (result) {
                try {
                    if (result.ok) {
                        callback.call( null, result );
                    } else {
                        best = result;
                        nope.call( null );
                    }
                } catch (caught) {
                    Cu.reportError( caught );
                }
            });
        }

        const provIter = Iterator( providers );
        (function nextProvider() {
            try {
                const prov = provIter.next()[ 1 ];
                prov.call( null, check, nextProvider.bind( this ) );
            } catch (caught) {
                try {
                    if (caught instanceof StopIteration) {
                        callback.call( null, best );
                    } else {
                        Cu.reportError( caught );
                        nextProvider();
                    }
                } catch (caught) {
                    Cu.reportError( caught );
                }
            }
        })();
    },

    locate: function (callback) {
        var found = (function (result) {
            try {
                if (result) {
                    Services.prefs.getDefaultBranch( null )
                        .setComplexValue(
                                PREF_KEY, Ci.nsIFile, result.file );
                }

                callback.call( null, result );
            } catch (caught) {
                Cu.reportError( caught );
            }
        }).bind( this );

        if (this._cache)
            found( this._cache );

        try {
            const pref = Services.prefs.getComplexValue(
                                        PREF_KEY, Ci.nsIFile );
            VimChecker.check( pref, function (prefResult) {
                if (prefResult.ok) {
                    found( prefResult );
                } else {
                    this.search( function (searchResult) {
                        if (searchResult && searchResult.ok) {
                            found( searchResult );
                        } else {
                            found( prefResult );
                        }
                    });
                }
            });
        } catch (caught) {
            // the pref probably doesn't exist
        }

        this.search( found );
    },

    setLocation: function (result) {
        if (result === this._cache) return;
        if (!( result instanceof VimCheckerResult ))
            throw new TypeError(
                    "argument must be a VimCheckerResult" );

        this._cache = result;
        Services.prefs.setComplexValue(
                PREF_KEY, Ci.nsIFile, result.file );
    }
};
