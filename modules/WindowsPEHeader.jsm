/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// based on documentation at
// http://support.microsoft.com/kb/90493/en-us
// http://msdn.microsoft.com/en-us/library/windows/desktop/ms680336%28v=vs.85%29.aspx
// http://msdn.microsoft.com/en-us/library/windows/desktop/ms680313%28v=vs.85%29.aspx
// http://msdn.microsoft.com/en-us/library/windows/desktop/ms680339%28v=vs.85%29.aspx

"use strict";

const Cu = Components.utils,
      Ci = Components.interfaces,
      Cc = Components.classes;

const SIZEOF_DOS_HEADER       =  64;
const SIZEOF_FILE_HEADER      =  20;
const SIZEOF_OPTIONAL_HEADER  = 136;
const SIZEOF_NT_HEADER =
        4 + SIZEOF_FILE_HEADER + SIZEOF_OPTIONAL_HEADER;

const WindowsPEHeader = function (file) {
    this._file = file;
}
const C = WindowsPEHeader;
const P = WindowsPEHeader.prototype = {};

(function(){
    const props = {
        IMAGE_DOS_SIGNATURE:                            0x5A4D,
        IMAGE_NT_SIGNATURE:                             0x00004550,

        IMAGE_FILE_MACHINE_UNKNOWN:                     0x0000,
        IMAGE_FILE_MACHINE_I386:                        0x014c,
        IMAGE_FILE_MACHINE_R3000:                       0x0162,
        IMAGE_FILE_MACHINE_R4000:                       0x0166,
        IMAGE_FILE_MACHINE_R10000:                      0x0168,
        IMAGE_FILE_MACHINE_WCEMIPSV2:                   0x0169,
        IMAGE_FILE_MACHINE_ALPHA:                       0x0184,
        IMAGE_FILE_MACHINE_SH3:                         0x01a2,
        IMAGE_FILE_MACHINE_SH3DSP:                      0x01a3,
        IMAGE_FILE_MACHINE_SH3E:                        0x01a4,
        IMAGE_FILE_MACHINE_SH4:                         0x01a6,
        IMAGE_FILE_MACHINE_SH5:                         0x01a8,
        IMAGE_FILE_MACHINE_ARM:                         0x01c0,
        IMAGE_FILE_MACHINE_THUMB:                       0x01c2,
        IMAGE_FILE_MACHINE_AM33:                        0x01d3,
        IMAGE_FILE_MACHINE_POWERPC:                     0x01F0,
        IMAGE_FILE_MACHINE_POWERPCFP:                   0x01f1,
        IMAGE_FILE_MACHINE_IA64:                        0x0200,
        IMAGE_FILE_MACHINE_MIPS16:                      0x0266,
        IMAGE_FILE_MACHINE_ALPHA64:                     0x0284,
        IMAGE_FILE_MACHINE_MIPSFPU:                     0x0366,
        IMAGE_FILE_MACHINE_MIPSFPU16:                   0x0466,
        IMAGE_FILE_MACHINE_AXP64:                       0x0284,
        IMAGE_FILE_MACHINE_TRICORE:                     0x0520,
        IMAGE_FILE_MACHINE_CEF:                         0x0CEF,
        IMAGE_FILE_MACHINE_EBC:                         0x0EBC,
        IMAGE_FILE_MACHINE_AMD64:                       0x8664,
        IMAGE_FILE_MACHINE_M32R:                        0x9041,
        IMAGE_FILE_MACHINE_CEE:                         0xC0EE,

        IMAGE_FILE_RELOCS_STRIPPED:                     0x0001,
        IMAGE_FILE_EXECUTABLE_IMAGE:                    0x0002,
        IMAGE_FILE_LINE_NUMS_STRIPPED:                  0x0004,
        IMAGE_FILE_LOCAL_SYMS_STRIPPED:                 0x0008,
        IMAGE_FILE_AGGRESIVE_WS_TRIM:                   0x0010,
        IMAGE_FILE_LARGE_ADDRESS_AWARE:                 0x0020,
        IMAGE_FILE_BYTES_REVERSED_LO:                   0x0080,
        IMAGE_FILE_32BIT_MACHINE:                       0x0100,
        IMAGE_FILE_DEBUG_STRIPPED:                      0x0200,
        IMAGE_FILE_REMOVABLE_RUN_FROM_SWAP:             0x0400,
        IMAGE_FILE_NET_RUN_FROM_SWAP:                   0x0800,
        IMAGE_FILE_SYSTEM:                              0x1000,
        IMAGE_FILE_DLL:                                 0x2000,
        IMAGE_FILE_UP_SYSTEM_ONLY:                      0x4000,
        IMAGE_FILE_BYTES_REVERSED_HI:                   0x8000,

        IMAGE_NT_OPTIONAL_HDR32_MAGIC:                  0x010b,
        IMAGE_NT_OPTIONAL_HDR64_MAGIC:                  0x020b,
        IMAGE_ROM_OPTIONAL_HDR_MAGIC:                   0x0107,

        IMAGE_SUBSYSTEM_UNKNOWN:                         0,
        IMAGE_SUBSYSTEM_NATIVE:                          1,
        IMAGE_SUBSYSTEM_WINDOWS_GUI:                     2,
        IMAGE_SUBSYSTEM_WINDOWS_CUI:                     3,
        IMAGE_SUBSYSTEM_OS2_CUI:                         5,
        IMAGE_SUBSYSTEM_POSIX_CUI:                       7,
        IMAGE_SUBSYSTEM_NATIVE_WINDOWS:                  8,
        IMAGE_SUBSYSTEM_WINDOWS_CE_GUI:                  9,
        IMAGE_SUBSYSTEM_EFI_APPLICATION:                10,
        IMAGE_SUBSYSTEM_EFI_BOOT_SERVICE_DRIVER:        11,
        IMAGE_SUBSYSTEM_EFI_RUNTIME_DRIVER:             12,
        IMAGE_SUBSYSTEM_EFI_ROM:                        13,
        IMAGE_SUBSYSTEM_XBOX:                           14,
        IMAGE_SUBSYSTEM_WINDOWS_BOOT_APPLICATION:       16,

        IMAGE_DLLCHARACTERISTICS_DYNAMIC_BASE:          0x0040,
        IMAGE_DLLCHARACTERISTICS_FORCE_INTEGRITY:       0x0080,
        IMAGE_DLLCHARACTERISTICS_NX_COMPAT:             0x0100,
        IMAGE_DLLCHARACTERISTICS_NO_ISOLATION:          0x0200,
        IMAGE_DLLCHARACTERISTICS_NO_SEH:                0x0400,
        IMAGE_DLLCHARACTERISTICS_NO_BIND:               0x0800,
        IMAGE_DLLCHARACTERISTICS_WDM_DRIVER:            0x2000,
        IMAGE_DLLCHARACTERISTICS_TERMINAL_SERVER_AWARE: 0x8000,
    };

    for (let key of Object.keys( props )) {
        Object.defineProperty( C, key, {
            enumerable: true,
            value: props[ key ],
        });
    }
})();

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
    const file = File( this._file );

    // why isn't the FileReader constructor exposed in chrome code?
    const reader = Cc[ "@mozilla.org/files/filereader;1" ]
            .createInstance( Ci.nsIDOMFileReader );

    const handleDOSread = (function() {
        if (reader.error) return this._error(
                "error reading DOS header: " + reader.error );

        const recs = Array.apply( [],
                new Uint16Array( reader.result ) );
        const lfanew = new Int32Array( reader.result );
        Object.defineProperty( this, "dos", {
            enumerable: true,
            value: Object.freeze({
                magic:      recs[  0 ],
                cblp:       recs[  1 ],
                cp:         recs[  2 ],
                crlc:       recs[  3 ],
                cparhdr:    recs[  4 ],
                minalloc:   recs[  5 ],
                maxalloc:   recs[  6 ],
                ss:         recs[  7 ],
                sp:         recs[  8 ],
                csum:       recs[  9 ],
                ip:         recs[ 10 ],
                cs:         recs[ 11 ],
                lfarlc:     recs[ 12 ],
                ovno:       recs[ 13 ],
                res:        recs.slice( 14, 17 ),
                oemid:      recs[ 18 ],
                oeminfo:    recs[ 19 ],
                res2:       recs.slice( 20, 29 ),
                lfanew:     lfanew[ 15 ],
            }),
        });
        
        if (C.IMAGE_DOS_SIGNATURE != this.dos.magic)
            return this._error( "DOS header magic number is wrong" );

        // read the FILE and OPTIONAL headers
        reader.onloadend = handleFileRead;
        reader.readAsArrayBuffer( file.slice(
                this.dos.lfanew,
                this.dos.lfanew + SIZEOF_NT_HEADER ) );
    }).bind( this );

    const handleFileRead = (function() {
        if (reader.error) return this._error(
                "error reading file header: " + reader.error );

        const uchar  = new Uint8Array(  reader.result );
        const ushort = new Uint16Array( reader.result );
        const ulong  = new Uint32Array( reader.result );

        Object.defineProperty( this, "nt", {
            enumerable: true,
            value: {
                signature: ulong[ 0 ],
                file: Object.freeze({
                    machine:                ushort[ 2 ],
                    numberOfSections:       ushort[ 3 ],
                    timeDateStamp:          ulong[ 2 ],
                    pointerToSymbolTable:   ulong[ 3 ],
                    numberOfSymbols:        ulong[ 4 ],
                    sizeOfOptionalHeader:   ushort[ 10 ],
                    characteristics:        ushort[ 11 ],
                }),
            },
        });

        if (C.IMAGE_NT_SIGNATURE != this.nt.signature)
            return this._error( "NT signature is wrong" );

        if (C.IMAGE_NT_OPTIONAL_HDR32_MAGIC == ushort[ 12 ]) {
            this.nt.optional = Object.freeze({
                magic:                          ushort[ 12 ],
                majorLinkerVersion:             uchar[ 26 ],
                minorLinkerVersion:             uchar[ 27 ],
                sizeOfCode:                     ulong[  7 ],
                sizeOfInitializedData:          ulong[  8 ],
                sizeOfUninitializedData:        ulong[  9 ],
                addressOfEntryPoint:            ulong[ 10 ],
                baseOfCode:                     ulong[ 11 ],
                baseOfData:                     ulong[ 12 ],
                imageBase:                      ulong[ 13 ],
                sectionAlignment:               ulong[ 14 ],
                fileAlignment:                  ulong[ 15 ],
                majorOperatingSystemVersion:    ushort[ 32 ],
                minorOperatingSystemVersion:    ushort[ 33 ],
                majorImageVersion:              ushort[ 34 ],
                minorImageVersion:              ushort[ 35 ],
                majorSubsystemVersion:          ushort[ 36 ],
                minorSubsystemVersion:          ushort[ 37 ],
                win32VersionValue:              ulong[ 19 ],
                sizeOfImage:                    ulong[ 20 ],
                sizeOfHeaders:                  ulong[ 21 ],
                checkSum:                       ulong[ 22 ],
                subsystem:                      ushort[ 46 ],
                dllCharacteristics:             ushort[ 47 ],
                sizeOfStackReserve:             ulong[ 24 ],
                sizeOfStackCommit:              ulong[ 25 ],
                sizeOfHeapReserve:              ulong[ 26 ],
                sizeOfHeapCommit:               ulong[ 27 ],
                loaderFlags:                    ulong[ 28 ],
                numberOfRvaAndSizes:            ulong[ 29 ],
            });
        } else if (C.IMAGE_NT_OPTIONAL_HDR64_MAGIC == ushort[ 12 ]) {
            function udlong (base) {
                return Object.freeze({
                    low:    ulong[ base++ ],
                    high:   ulong[ base++ ],
                });
            }

            this.nt.optional = Object.freeze({
                magic:                          ushort[ 12 ],
                majorLinkerVersion:             uchar[ 26 ],
                minorLinkerVersion:             uchar[ 27 ],
                sizeOfCode:                     ulong[  7 ],
                sizeOfInitializedData:          ulong[  8 ],
                sizeOfUninitializedData:        ulong[  9 ],
                addressOfEntryPoint:            ulong[ 10 ],
                baseOfCode:                     ulong[ 11 ],
                // baseOfData                   not present
                imageBase:                      udlong( 12 ),
                sectionAlignment:               ulong[ 14 ],
                fileAlignment:                  ulong[ 15 ],
                majorOperatingSystemVersion:    ushort[ 32 ],
                minorOperatingSystemVersion:    ushort[ 33 ],
                majorImageVersion:              ushort[ 34 ],
                minorImageVersion:              ushort[ 35 ],
                majorSubsystemVersion:          ushort[ 36 ],
                minorSubsystemVersion:          ushort[ 37 ],
                win32VersionValue:              ulong[ 19 ],
                sizeOfImage:                    ulong[ 20 ],
                sizeOfHeaders:                  ulong[ 21 ],
                checkSum:                       ulong[ 22 ],
                subsystem:                      ushort[ 46 ],
                dllCharacteristics:             ushort[ 47 ],
                sizeOfStackReserve:             udlong( 24 ),
                sizeOfStackCommit:              udlong( 26 ),
                sizeOfHeapReserve:              udlong( 28 ),
                sizeOfHeapCommit:               udlong( 30 ),
                loaderFlags:                    ulong[ 32 ],
                numberOfRvaAndSizes:            ulong[ 33 ],
            });
        } else {
            return this._error( "OPTIONAL magic number is wrong" );
        }

        Object.freeze( this.nt );
        this._fireCallback();
    }).bind( this );

    // load the DOS header
    reader.onloadend = handleDOSread;
    reader.readAsArrayBuffer( file.slice( 0, SIZEOF_DOS_HEADER ) );
};

P._error = function (message) {
    this._error_message = message;
    this._fireCallback;
};

P._fireCallback = function() {
    this._callback.call( null, this );
};

const EXPORTED_SYMBOLS = [ "WindowsPEHeader" ];
