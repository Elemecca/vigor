" Vim-side support functions for the Vigor addon to Mozilla apps.
" Maintainer:   Sam Hanes <sam@maltera.com>
" License:      MPL v2.0
"
" This Source Code Form is subject to the terms of the Mozilla Public
" License, v. 2.0. If a copy of the MPL was not distributed with this
" file, You can obtain one at http://mozilla.org/MPL/2.0/.

if exists( "g:loaded_Vigor" ) || &cp
    finish
endif
let g:loaded_Vigor = 1

function s:ReadCommand()
    let command = ""
    let escaped = 0
    while 1
        let char = nr2char( getchar() )
        if escaped
            if "\\" == char
                break
            else
                let command .= "\<Esc>" . char
                let escaped = 0
            endif
        elseif "\<Esc>" == char
            let escaped = 1
        else
            let command .= char
        endif
    endwhile

    silent! execute command

    " returns nothing so mappings will be nops.
endfunction

" <Esc>_ is the C1 control character Application Program Command
" it starts a command string which ends with String Terminator, <Esc>\
map     <expr>  <Esc>_  <SID>ReadCommand()
map!    <expr>  <Esc>_  <SID>ReadCommand()
