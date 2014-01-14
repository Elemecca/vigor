/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const EXPORTED_SYMBOLS = [ "VimLocator" ];

const Cu = Components.utils,
      Ci = Components.interfaces,
      Cc = Components.classes;

Cu.import( "resource://gre/modules/FileUtils.jsm" );
Cu.import( "resource://vigor/VimChecker.jsm" );

const providers = [];

// search the platform executable search path
providers.push( function (item, done) {
    const entries = (function() {
        const env = Cc[ "@mozilla.org/process/environment;1" ]
                .getService( Ci.nsIEnvironment );
        for (let dirPath of env.get( "PATH" ).split( /[:;]/ )) {
            let dir = new FileUtils.File( dirPath );
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

const VimLocator = {
    locate: function (callback) {
        function check (file, nope) {
            VimChecker.check( file, function (result) {
                try {
                    if (result.ok) {
                        callback.call( null, result );
                    } else {
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
                prov.call( null, check, nextProvider );
            } catch (caught) {
                try {
                    if (caught instanceof StopIteration) {
                        callback.call( null, null );
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
};
