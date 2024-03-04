@echo off

mkdir temp
@REM copy css, js, res, fonts folder into temp
xcopy /s /e /y /q css temp\css\
xcopy /s /e /y /q js temp\js\
xcopy /s /e /y /q res temp\res\
xcopy /s /e /y /q fonts temp\fonts\
@REM copy index.html into temp
xcopy /q index.html temp
@REM copy publish
call PseudoFTP.Client transfer -s temp -i Metronome --overwrite
rmdir /s /q temp
