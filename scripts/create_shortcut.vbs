Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDesktop = WshShell.SpecialFolders("Desktop")
strProjectDir = fso.GetAbsolutePathName(".")

strTargetLaunch = strProjectDir & "\Iniciar Ficha.bat"
strTargetStop = strProjectDir & "\Detener Ficha.bat"
strIcon = strProjectDir & "\public\favicon.ico"

' 1. Acceso directo principal
Set oLink = WshShell.CreateShortcut(strDesktop & "\Where's my Ficha.lnk")
oLink.TargetPath = strTargetLaunch
oLink.WorkingDirectory = strProjectDir
If fso.FileExists(strIcon) Then
    oLink.IconLocation = strIcon & ", 0"
End If
oLink.Description = "Iniciar Where's my Ficha"
oLink.Save

' 2. Acceso directo para detener
Set oLinkStop = WshShell.CreateShortcut(strDesktop & "\Detener Ficha.lnk")
oLinkStop.TargetPath = strTargetStop
oLinkStop.WorkingDirectory = strProjectDir
oLinkStop.Description = "Detener servidor de Where's my Ficha"
oLinkStop.Save

WScript.Echo "Accesos directos creados correctamente en: " & strDesktop
