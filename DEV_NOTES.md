# API URL Configs

⚠️  IMPORTANT: The apiUrl/wsUrl in mobile/app.json are BAKED INTO THE APK at build time.
   You must update mobile/app.json AND rebuild the APK every time your server IP changes.
   Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) to find your current LAN IP.

## Local (same WiFi)
⚠️  usesCleartextTraffic MUST remain true in app.json — all local API/WS URLs use HTTP.
   Setting it to false will silently block every network request on Android.

### Current IP (active)
apiUrl: http://192.168.1.34:3000/api/v1
wsUrl:  http://192.168.1.34:3000

### Previous IPs (for reference)
apiUrl: http://192.168.33.68:3000/api/v1
wsUrl:  http://192.168.33.68:3000

## Tunnel (Cloudflare) — CURRENTLY ACTIVE
apiUrl: https://cooler-mining-walls-matters.trycloudflare.com/api/v1
wsUrl:  https://cooler-mining-walls-matters.trycloudflare.com

## To switch: update the "extra" block in mobile/app.json, then rebuild the APK