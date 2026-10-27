#ifndef AppVersion
#define AppVersion "1.0.8"
#endif
#ifndef OutDir
#define OutDir SourcePath + "..\dist"
#endif
#ifndef AppSource
#define AppSource SourcePath + "..\build\runtime"
#endif
[Setup]
AppId={{92BB0514-477C-43F9-9CD2-592B1748940A}
AppName=ALCIDE
AppVersion={#AppVersion}
AppPublisher=Nicolas Scherer
DefaultDirName={localappdata}\Programs\DWG-Alcide
DefaultGroupName=ALCIDE
UsePreviousGroup=no
ChangesAssociations=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
DisableProgramGroupPage=yes
WizardStyle=modern
SetupIconFile={#AppSource}\resources\app\app-icon.ico
UninstallDisplayIcon={app}\ALCIDE.exe
OutputDir={#OutDir}
OutputBaseFilename=Installer-ALCIDE-{#AppVersion}
Compression=lzma2/fast
SolidCompression=yes
CloseApplications=yes
CloseApplicationsFilter=ALCIDE.exe,alcide-engine.exe
RestartApplications=no
LicenseFile={#AppSource}\resources\app\LICENSE-GPL-3.0.txt
DisableWelcomePage=no
WizardImageFile={#SourcePath}branding\wizard.bmp
WizardSmallImageFile={#SourcePath}branding\wizard-small.bmp
WizardImageStretch=yes
WizardImageBackColor=$002A2012
VersionInfoVersion={#AppVersion}.0
VersionInfoDescription=Installation ALCIDE
VersionInfoProductName=ALCIDE
[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"
[Messages]
french.WelcomeLabel1=Bienvenue dans ALCIDE {#AppVersion}
french.WelcomeLabel2=Du dessin au ferraillage, gardez la maîtrise de vos plans.%n%nDessinez avec précision, détaillez vos aciers et calepinez vos treillis soudés dans un même environnement de travail.%n%nSi ALCIDE vous accompagne au quotidien, un petit café est toujours apprécié : bouton « Café » dans le logiciel.
french.FinishedHeadingLabel=ALCIDE {#AppVersion} est prêt
french.FinishedLabel=Votre atelier est installé.%n%nOrientez la souris, tapez la distance, puis Entrée.%nTab donne accès à X, puis Y.

[Tasks]
Name: "desktopicon"; Description: "Créer un raccourci ALCIDE sur le Bureau"; GroupDescription: "Raccourcis :"
[Files]
Source: "{#AppSource}\*"; DestDir: "{app}"; Excludes: "debug.log,unins*.exe,unins*.dat,HISTORIQUE-technique-avant-0.8.txt,validation-*"; Flags: ignoreversion recursesubdirs createallsubdirs
[Registry]
Root: HKCU; Subkey: "Software\RegisteredApplications"; ValueType: string; ValueName: "ALCIDE"; ValueData: "Software\ALCIDE\Capabilities"; Flags: uninsdeletevalue
Root: HKCU; Subkey: "Software\ALCIDE\Capabilities"; ValueType: string; ValueName: "ApplicationName"; ValueData: "ALCIDE"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\ALCIDE\Capabilities"; ValueType: string; ValueName: "ApplicationDescription"; ValueData: "Logiciel de dessin — compatible avec les fichiers .dwg"
Root: HKCU; Subkey: "Software\Classes\Applications\ALCIDE.exe"; ValueType: string; ValueName: "FriendlyAppName"; ValueData: "ALCIDE"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Classes\Applications\ALCIDE.exe\shell\open\command"; ValueType: string; ValueData: """{app}\ALCIDE.exe"" ""%1"""
Root: HKCU; Subkey: "Software\ALCIDE\Capabilities\FileAssociations"; ValueType: string; ValueName: ".dwg"; ValueData: "ALCIDE.DWG"
Root: HKCU; Subkey: "Software\Classes\.dwg\OpenWithProgids"; ValueType: none; ValueName: "ALCIDE.DWG"; Flags: uninsdeletevalue
Root: HKCU; Subkey: "Software\Classes\Applications\ALCIDE.exe\SupportedTypes"; ValueType: string; ValueName: ".dwg"; ValueData: ""
Root: HKCU; Subkey: "Software\Classes\ALCIDE.DWG"; ValueType: string; ValueData: "Dessin DWG"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Classes\ALCIDE.DWG\DefaultIcon"; ValueType: string; ValueData: """{app}\ALCIDE.exe"",0"
Root: HKCU; Subkey: "Software\Classes\ALCIDE.DWG\shell\open\command"; ValueType: string; ValueData: """{app}\ALCIDE.exe"" ""%1"""
Root: HKCU; Subkey: "Software\ALCIDE\Capabilities\FileAssociations"; ValueType: string; ValueName: ".dxf"; ValueData: "ALCIDE.DXF"
Root: HKCU; Subkey: "Software\Classes\.dxf\OpenWithProgids"; ValueType: none; ValueName: "ALCIDE.DXF"; Flags: uninsdeletevalue
Root: HKCU; Subkey: "Software\Classes\Applications\ALCIDE.exe\SupportedTypes"; ValueType: string; ValueName: ".dxf"; ValueData: ""
Root: HKCU; Subkey: "Software\Classes\ALCIDE.DXF"; ValueType: string; ValueData: "Dessin DXF"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Classes\ALCIDE.DXF\DefaultIcon"; ValueType: string; ValueData: """{app}\ALCIDE.exe"",0"
Root: HKCU; Subkey: "Software\Classes\ALCIDE.DXF\shell\open\command"; ValueType: string; ValueData: """{app}\ALCIDE.exe"" ""%1"""
Root: HKCU; Subkey: "Software\ALCIDE\Capabilities\FileAssociations"; ValueType: string; ValueName: ".alcide"; ValueData: "ALCIDE.ALCIDE"
Root: HKCU; Subkey: "Software\Classes\.alcide\OpenWithProgids"; ValueType: none; ValueName: "ALCIDE.ALCIDE"; Flags: uninsdeletevalue
Root: HKCU; Subkey: "Software\Classes\Applications\ALCIDE.exe\SupportedTypes"; ValueType: string; ValueName: ".alcide"; ValueData: ""
Root: HKCU; Subkey: "Software\Classes\ALCIDE.ALCIDE"; ValueType: string; ValueData: "Projet ALCIDE"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Classes\ALCIDE.ALCIDE\DefaultIcon"; ValueType: string; ValueData: """{app}\ALCIDE.exe"",0"
Root: HKCU; Subkey: "Software\Classes\ALCIDE.ALCIDE\shell\open\command"; ValueType: string; ValueData: """{app}\ALCIDE.exe"" ""%1"""
[InstallDelete]
Type: files; Name: "{app}\DWG-Alcide.exe"
Type: files; Name: "{userdesktop}\DWG-Alcide\DWG-Alcide.lnk"
Type: files; Name: "{userprograms}\DWG-Alcide\DWG-Alcide.lnk"
Type: files; Name: "{userdesktop}\ALCIDE\ALCIDE.lnk"

[Icons]
Name: "{group}\ALCIDE"; Filename: "{app}\ALCIDE.exe"; WorkingDir: "{app}"; IconFilename: "{app}\resources\app\app-icon.ico"; AppUserModelID: "NicolasScherer.ALCIDE"
Name: "{userdesktop}\ALCIDE"; Filename: "{app}\ALCIDE.exe"; WorkingDir: "{app}"; IconFilename: "{app}\resources\app\app-icon.ico"; AppUserModelID: "NicolasScherer.ALCIDE"; Tasks: desktopicon
[Run]
Filename: "{app}\ALCIDE.exe"; Description: "Lancer ALCIDE"; Flags: nowait postinstall skipifsilent
[Code]
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  LegacyPath, BackupPath: String;
begin
  Result := '';
  LegacyPath := ExpandConstant('{app}\Sources');
  if FileExists(LegacyPath) and not DirExists(LegacyPath) then
  begin
    BackupPath := LegacyPath + '-ancien-' + GetDateTimeString('yyyymmddhhnnss', '-', ':') + '.txt';
    if not RenameFile(LegacyPath, BackupPath) then
      Result := 'Impossible de sauvegarder l’ancien fichier Sources. Fermez ALCIDE puis réessayez.';
  end;
end;

procedure InitializeWizard;
begin
  { Reserve enough inset for themed checkboxes at high DPI. }
  WizardForm.TasksList.Offset := ScaleX(12);
  WizardForm.TasksList.MinItemHeight := ScaleY(28);
  { The finish page uses a separate checklist for post-install actions. }
  WizardForm.RunList.Offset := ScaleX(12);
  WizardForm.RunList.MinItemHeight := ScaleY(28);
end;









