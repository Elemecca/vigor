/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Cu = Components.utils,
      Ci = Components.interfaces,
      Cc = Components.classes;

Cu.import( "resource://gre/modules/Services.jsm" );

let loaded_devtools = false;

const startup = function (data, reason) {
    // register our resource URI prefix
    Services.io.getProtocolHandler( "resource" )
            .QueryInterface( Ci.nsIResProtocolHandler )
            .setSubstitution( "vigor", Services.io.newURI(
                    "resource/", null, data.resourceURI ) );

    // set up our addon info module
    Cu.import( "resource://vigor/modules/VigorAddon.jsm" );
    for (let key of [ "id", "version", "installPath", "resourceURI" ])
        VigorAddon[ key ] = data[ key ];
    Object.freeze( VigorAddon );

    // register the options UI controller
    Cu.import( "resource://vigor/modules/Options.jsm" );
    Options.register();

    debugger;

    // monkey-patch the source editor
    try {
        const loader = Cu.import(
                "resource://gre/modules/devtools/Loader.jsm", {}
            ).devtools._provider.loader;
        loader.mapping.splice( 0, 0, [
                "devtools/sourceeditor/editor",
                "resource://vigor/impl/devtools-editor.js",
            ] );
        loaded_devtools = true;
    } catch (caught) {
        // the dev tools probably aren't included in this app
        Cu.reportError( caught );
    }
};

const shutdown = function (data, reason) {
    // don't bother cleaning a house that's about to explode
    if (APP_SHUTDOWN == reason) return;

    // unhook the source editor monkey-patch
    if (loaded_devtools) {
        const loader = Cu.import(
                "resource://gre/modules/devtools/Loader.jsm", {}
            ).devtools._provider.loader;
        loader.mapping.forEach( function (value, index, array) {
            if (value[ 1 ].startsWith( "resource://vigor/" ))
                array.splice( index, 1 );
        });
        loaded_devtools = false;
    }

    // unregister the options UI controller
    Cu.import( "resource://vigor/modules/Options.jsm" );
    Options.unregister();

    // unload JavaScript modules
    Cu.unload( "resource://vigor/modules/VigorAddon.jsm" );
    Cu.unload( "resource://vigor/modules/Options.jsm" );
    Cu.unload( "resource://vigor/modules/VimChecker.jsm" );
    Cu.unload( "resource://vigor/modules/WindowsPEHeader.jsm" );
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
