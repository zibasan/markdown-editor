!macro customInstall
  ; .md file association
  WriteRegStr HKCR ".md" "" "MarkdownEditor.md"
  WriteRegStr HKCR "MarkdownEditor.md" "" "Markdown File"
  WriteRegStr HKCR "MarkdownEditor.md\\DefaultIcon" "" "$INSTDIR\\resources\\icon.ico"
  WriteRegStr HKCR "MarkdownEditor.md\\shell\\open\\command" "" '"$INSTDIR\\Markdown Editor.exe" "%1"'

  ; Explorer context menu (removed)
!macroend

!macro customUninstall
  ; Explorer context menu (removed)
  DeleteRegKey HKCR "MarkdownEditor.md"
  DeleteRegValue HKCR ".md" ""
!macroend
