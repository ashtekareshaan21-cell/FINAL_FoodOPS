@echo off
REM ============================================================
REM  FoodOps Video Merger Script
REM  Place your screen recordings in the same folder as this file
REM  and rename them as shown below, then double-click to run.
REM ============================================================

echo.
echo  =============================================
echo   FoodOps Video Merger - Starting...
echo  =============================================
echo.

REM Output directory
set OUT=D:\FINAL_FOODOPS\demo_video
mkdir %OUT% 2>nul

REM ---- STEP 1: Convert .webp demo recording to mp4 ----
echo [1/4] Converting workflow recording to MP4...
ffmpeg -y -i "C:\Users\admin\.gemini\antigravity-ide\brain\650d2147-6cdf-4e7c-a674-2a7da12b718a\foodops_workflow_demo_1790097284988.webp" -c:v libx264 -pix_fmt yuv420p -r 30 "%OUT%\workflow_recording.mp4"

REM ---- STEP 2: List videos to merge ----
REM Add your screen recording files below. 
REM The script will merge them in order.

echo [2/4] Building file list...
(
  echo file '%OUT%\workflow_recording.mp4'
) > "%OUT%\filelist.txt"

REM If you have additional screen recordings, add them like this:
REM echo file 'D:\path\to\your\recording1.mp4' >> "%OUT%\filelist.txt"
REM echo file 'D:\path\to\your\recording2.mp4' >> "%OUT%\filelist.txt"

REM ---- STEP 3: Merge all videos ----
echo [3/4] Merging videos...
ffmpeg -y -f concat -safe 0 -i "%OUT%\filelist.txt" -c copy "%OUT%\foodops_demo_FINAL.mp4"

REM ---- STEP 4: Done ----
echo.
echo  =============================================
echo   DONE! Output saved to:
echo   %OUT%\foodops_demo_FINAL.mp4
echo  =============================================
echo.
echo  Opening output folder...
explorer "%OUT%"
pause
