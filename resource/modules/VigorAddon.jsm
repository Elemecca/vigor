/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Cu = Components.utils,
      Ci = Components.interfaces,
      Cc = Components.classes;

Cu.import( "resource://gre/modules/Services.jsm" );

const EXPORTED_SYMBOLS = [ "VigorAddon" ];

const VigorAddon = {};
const C = VigorAddon;

// properties added in bootstrap.js
//   id
//   version
//   installPath
//   resourceURI

/**
 * @param path {string}
 * @return {nsIFile}
 */
C.getResourceFile = function (path) {
    return Services.io.getProtocolHandler( "file" )
            .QueryInterface( Ci.nsIFileProtocolHandler )
            .getFileFromURLSpec(
                    this.resourceURI.resolve( path )
                ).path.replace( "\\", "\\\\", "g" );
};

