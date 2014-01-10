/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Cu = Components.utils,
      Ci = Components.interfaces,
      Cc = Components.classes;

Cu.import( "resource://gre/modules/XPCOMUtils.jsm" );

const Log = Cc[ "@mozilla.org/consoleservice;1" ]
        .getService( Ci.nsIConsoleService );
Log.logStringMessage( "ProxyMsgComposeService loaded" );


const OUR_NEW_CHROME = "chrome://vigor/content/compose.xul";
const DEFAULT_CHROME = "chrome://messenger/content/messengercompose/messengercompose.xul";

function ProxyMsgComposeService() {
    Log.logStringMessage( "ProxyMsgComposeService constructed" );
}

const P = ProxyMsgComposeService.prototype = {
    classID:    Components.ID( "{c5b7a892-4ba1-4a20-85c6-c21ae56e492e}" ),

    QueryInterface: XPCOMUtils.generateQI([
            Ci.nsIMsgComposeService
        ])
};

XPCOMUtils.defineLazyGetter( P, '_super', function() {
    return Components.classesByID[
            // nsMsgComposeService
            "{588595fe-1ada-11d3-a715-0060b0eb39b5}"
        ].getService( Ci.nsIMsgComposeService );
});

function fixChromeURL (chromeURL) {
    if ('string' != typeof chromeURL
            || DEFAULT_CHROME == chromeURL)
        return OUR_NEW_CHROME;

    return chromeURL;
}

P.OpenComposeWindow = function (chromeURL,
        header, uri, type, format, identity, sourceWindow) {
    Log.logStringMessage( "OpenComposeWindow called" );
    this._super.OpenComposeWindow( fixChromeURL( chromeURL ),
            header, uri, type, format, identity, sourceWindow );
};

P.OpenComposeWindowWithURI = function (chromeURL, uri, identity) {
    this._super.OpenComposeWindowWithURI(
            fixChromeURL( chromeURL ), uri, identity );
};

P.OpenComposeWindowWithParams = function (chromeURL, params) {
    this._super.OpenComposeWindowWithParams(
            fixChromeURL( chromeURL ), params );
};

// autogenerate simple facade methods
for (var name in [
            'initCompose',
            'TimeStamp',
            'isCachedWindow',
            'getParamsForMailto',
            'forwaredMessage',
            'replyWithTemplate',
            'registerComposeDocShell',
            'unregisterComposeDocShell',
            'getMsgComposeForDocShell',
        ]) {
    P[ name ] = function() {
        return this._super[ name ].apply( this._super, arguments );
    };
}

const NSGetFactory = XPCOMUtils.generateNSGetFactory([
        ProxyMsgComposeService
    ]);
