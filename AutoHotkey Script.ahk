#Requires AutoHotkey v2.0
#SingleInstance Force

; ==================================================================
; INPUT NAMA AGENT (Selalu muncul saat skrip dijalankan)
; ==================================================================
ib := InputBox("Masukkan nama agent:", "Nama Agent")
if (ib.Result = "Cancel")
    ExitApp

AgentName := ib.Value

; ==================================================================
; HOTKEY UTAMA: Win + W (!w)
; ==================================================================
!w:: {
    Sleep(20) ; Jeda awal singkat

    if (A_Clipboard == "") {
        MsgBox("Clipboard kosong!")
        return
    }

    text := A_Clipboard

    ; 1. JIKA MODE WD (Mengandung kata "AGENT")
    if InStr(text, "AGENT") {
        ; Ganti kata AGENT dengan nama agen dari InputBox
        text := StrReplace(text, "AGENT", AgentName)

        ; Mencari nominal di akhir teks untuk dibungkus kurung ( )
        if RegExMatch(text, "(\d{1,3}(,\d{3})*)$", &m) {
            newText := "(" m[1] ")"
            text := StrReplace(text, m[1], newText)
        }

        ; Pecah teks berdasarkan karakter TAB (`t) ke dalam Array
        kolomArray := StrSplit(text, "`t")

        ; Bersihkan kolom tertentu (agar di-skip saat ketik)
        if (kolomArray.Length >= 2)
            kolomArray[2] := ""
        if (kolomArray.Length >= 4)
            kolomArray[4] := ""
        if (kolomArray.Length >= 5)
            kolomArray[5] := ""
        if (kolomArray.Length >= 6)
            kolomArray[6] := ""

        ; PROSES KETIK (Ngebut tapi halus)
        SendMode "Event"
        SetKeyDelay 1, 1 

        for index, isiKolom in kolomArray {
            ; Ketik data kolom
            if (isiKolom != "") {
                SendText(isiKolom)
            }
            
            ; Pindah ke kanan dengan TAB
            if (index < kolomArray.Length) {
                Send "{Tab}"
                Sleep(2)
            }
        }
        
        ; Selesai, tekan Enter
        Send "{Enter}"
        SendMode "Input"
    } 
    ; 2. JIKA MODE LAIN (BN / PS / DP / DLL) -> Langsung paste
    else {
        SendInput("^v")
        Sleep(50)
        SendInput("{Enter}")
    }

    return
}