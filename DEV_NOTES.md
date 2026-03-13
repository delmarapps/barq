# API URL Configs

⚠️  IMPORTANT: The apiUrl/wsUrl in mobile/app.json are BAKED INTO THE APK at build time.
   You must update mobile/app.json AND rebuild the APK every time your server IP changes.
   Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) to find your current LAN IP.

## Local (same WiFi) — CURRENTLY ACTIVE
apiUrl: http://192.168.33.68:3000/api/v1
wsUrl:  http://192.168.33.68:3000

## Tunnel (localtunnel - changes every restart)
apiUrl: https://wicked-aliens-write.loca.lt/api/v1
wsUrl:  https://wicked-aliens-write.loca.lt

## To switch: update the "extra" block in mobile/app.json, then rebuild the APK