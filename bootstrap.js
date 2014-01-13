/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Cu = Components.utils,
      Ci = Components.interfaces,
      Cc = Components.classes;

Cu.import( "resource://gre/modules/Services.jsm" );

const SOURCE_EDITOR = "resource:///modules/devtools/sourceeditor/source-editor.jsm";
const SOURCE_EDITOR_IMPL = "resource:///modules/devtools/sourceeditor/source-editor-orion.jsm";
const SOURCE_EDITOR_OURS = "resource://vigor/source-editor-vigor.jsm";

const startup = function (data, reason) {
    // register our resource URI prefix
    Services.io.getProtocolHandler( "resource" )
            .QueryInterface( Ci.nsIResProtocolHandler )
            .setSubstitution( "vigor", Services.io.newURI(
                    "modules/", null, data.resourceURI ) );

    // register the options UI controller
    Cu.import( "resource://vigor/Options.jsm" );
    Options.register();

    debugger;

    // monkey-patch the source editor
    try {
        Cu.unload( SOURCE_EDITOR );
        Cu.unload( SOURCE_EDITOR_IMPL );

        let editor_impl = Cu.import( SOURCE_EDITOR_IMPL, null );
        let editor_ours = Cu.import( SOURCE_EDITOR_OURS, null );

        // remove the original exports
        for (let key of editor_impl.EXPORTED_SYMBOLS)
            delete editor_impl[ key ];
        
        // copy over ours
        editor_impl.EXPORTED_SYMBOLS = editor_ours.EXPORTED_SYMBOLS
        for (let key of editor_ours.EXPORTED_SYMBOLS)
            editor_impl[ key ] = editor_ours[ key ];
    } catch (caught) {
        // the dev tools probably aren't included in this app
        // our patch might have failed, though, so try to clean up
        Cu.unload( SOURCE_EDITOR );
        Cu.unload( SOURCE_EDITOR_IMPL );
        Cu.unload( SOURCE_EDITOR_OURS );
    }
};

const shutdown = function (data, reason) {
    // don't bother cleaning a house that's about to explode
    if (APP_SHUTDOWN == reason) return;

    // unhook the source editor monkey-patch
    Cu.unload( SOURCE_EDITOR );
    Cu.unload( SOURCE_EDITOR_IMPL );
    Cu.unload( SOURCE_EDITOR_OURS );

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
