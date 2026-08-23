@echo off
cd /d "C:\Users\user\Projects\uni-path-journey"
echo ========================================
echo  GitHub Qulaylik Paneli
echo ========================================
echo.
echo [1] Holatni ko'rish (status)
echo [2] Barcha o'zgarishlarni saqlash (commit)
echo [3] GitHub'ga yuklash (push)
echo [4] GitHub'dan yangilash (pull)
echo [5] Loyihani VS Code'da ochish
echo [6] Chiqish
echo.
set /p choice="Tanlang (1-6): "

if "%choice%"=="1" git status
if "%choice%"=="2" (
    set /p msg="Commit xabari: "
    git add -A
    git commit -m "%msg%"
    echo Saqlandi!
)
if "%choice%"=="3" git push && echo GitHub'ga yuklandi!
if "%choice%"=="4" git pull && echo Yangilandi!
if "%choice%"=="5" code .
if "%choice%"=="6" exit

pause
