net start postgresql-x64-17
$proc = (netstat -ano | findstr ":3000.*LISTENING").Trim().Split()[-1]
if ($proc) { taskkill /PID $proc /F }
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd D:\barq\backend; npm run dev'
Write-Host "BARQ Backend started!" -ForegroundColor Green