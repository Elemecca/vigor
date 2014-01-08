/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Cu = Components.utils,
      Ci = Components.interfaces;

Cu.import( "resource://flatascii/lib/subprocess.jsm" );

const VimCheckerResult = function (result) {
    this._result = result;
};
const P = VimCheckerResult.prototype = {};

P.getFullOutput = function() {
    return this._result.stdout || "";
}


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
