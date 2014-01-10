/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Cu = Components.utils,
      Ci = Components.interfaces,
      Cc = Components.classes;

Cu.import( "resource://gre/modules/Services.jsm" );

const startup = function (data, reason) {
    // register our resource URI prefix
    Services.io.getProtocolHandler( "resource" )
            .QueryInterface( Ci.nsIResProtocolHandler )
            .setSubstitution( "vigor", Services.io.newURI(
                    "modules/", null, data.resourceURI ) );

    // register the options UI controller
    Cu.import( "resource://vigor/Options.jsm" );
    Options.register();
};

const shutdown = function (data, reason) {
    // don't bother cleaning a house that's about to explode
    if (APP_SHUTDOWN == reason) return;

    // unregister the options UI controller
    Cu.import( "resource://vigor/Options.jsm" );
    Options.unregister();

    // unload JavaScript modules
    Cu.unload( "resource://vigor/Options.jsm" );
    Cu.unload( "resource://vigor/VimChecker.jsm" );
    Cu.unload( "resource://vigor/WindowsPEHeader.jsm" );
    Cu.unload( "resource://vigor/lib/subprocess.jsm" );

    // unregister our resource URI prefix
    Services.io.getProtocolHandler( "resource" )
            .QueryInterface( Ci.nsIResProtocolHandler )
            .setSubstitution( "vigor", null );
};

const install = function (data, reason) {

};

const uninstall = function (data, reason) {

};
