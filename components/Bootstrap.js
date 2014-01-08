/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Cu = Components.utils,
      Ci = Components.interfaces;

Cu.import( "resource://gre/modules/XPCOMUtils.jsm" );

const Bootstrap = function() {};
Bootstrap.prototype = {
    classID: Components.ID( "{9d4377b9-5710-4b43-8d24-74e87f5140bb}" ),
    QueryInterface: XPCOMUtils.generateQI([
            Ci.nsIObserver,
        ]),

    observe: function (subject, topic, data) {
        Cu.import( "resource://flatascii/Options.jsm" );
        Options.register();
    },
};

const NSGetFactory = XPCOMUtils.generateNSGetFactory([ Bootstrap ]);
