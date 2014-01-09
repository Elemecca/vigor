/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Cu = Components.utils,
      Ci = Components.interfaces,
      Cc = Components.classes;

Cu.import( "resource://gre/modules/NetUtil.jsm" );

const NS_SEEK_SET = Ci.nsISeekableStream.NS_SEEK_SET,
      NS_SEEK_CUR = Ci.nsISeekableStream.NS_SEEK_CUR,
      NS_SEEK_END = Ci.nsISeekableStream.NS_SEEK_END;

const WindowsPEHeader = function (file) {
    this._file = file;
}
const P = WindowsPEHeader.prototype = {};

Object.defineProperty( P, "error", {
    get: function() {
        return this._error_message;
    },
});

Object.defineProperty( P, "isGUI", {
    get: function() {
        return (2 == this._subsystem);
    },
});

P.read = function (callback) {
    this._callback = callback;

    const channel = NetUtil.newChannel( this._file );
    channel.contentType = "application/octet-stream";
    NetUtil.asyncFetch( channel, (function (stream, result) {
        if (!Components.isSuccessCode( result ))
            return this._error( "unable to open file" );

        // get an interface we can seek with
        const seek = stream.QueryInterface( Ci.nsISeekableStream );
        if (!seek) return this._error( "unable to seek file" );
        
        // get an interface to read binary data
        const binary = Cc[ "@mozilla.org/binaryinputstream;1" ]
                .createInstance( Ci.nsIBinaryInputStream );
        if (!binary) return this._error(
                "error creating binary stream" );
        binary.setInputStream( stream );

        function read16() {
            return binary.read8() | (binary.read8() >> 8);
        }

        function read32() {
            return read16() | (read16() >> 16);
        }

        // check the DOS signature
        const dos_sig = read16();
        if (0x5A4D != dos_sig)
            return this._error( "DOS signature invalid" );

        // read the 32-bit LE offset to the NT header and seek to it
        seek.seek( NS_SEEK_CUR, 29 * 2 );
        const offset = read32();
        seek.seek( NS_SEEK_SET, offset + 2 );

        // check the NT signature
        const nt_sig = read32();
        if (0x00004550 != nt_sig)
            return this._error( "NT signature invalid" );

        // skip over the file header
        seek.seek( NS_SEEK_CUR, 20 );

        // check the EXE signature
        const exe_sig = read16();
        if (0x010B != exe_sig && 0x020B != exe_sig)
            return this._error( "EXE signature invalid" );

        // skip directly to the Subsystem field
        seek.seek( NS_SEEK_CUR, 66 );
        this._subsystem = read16();

        this._fireCallback();
    }).bind( this ) );
};

P._error = function (message) {
    this._error_message = message;
};

P._fireCallback = function() {
    this._callback.call( null, this );
};

const EXPORTED_SYMBOLS = [ "WindowsPEHeader" ];
