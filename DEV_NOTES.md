# API URL Configs

⚠️  IMPORTANT: The apiUrl/wsUrl in mobile/app.json are BAKED INTO THE APK at build time.
   You must update mobile/app.json AND rebuild the APK every time your server IP changes.
   Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) to find your current LAN IP.

## Local (same WiFi)
apiUrl: http://192.168.33.68:3000/api/v1
wsUrl:  http://192.168.33.68:3000
NOTE: Requires usesCleartextTraffic: true in app.json + AndroidManifest.xml

## Tunnel (Cloudflare) — CURRENTLY ACTIVE
apiUrl: https://cooler-mining-walls-matters.trycloudflare.com/api/v1
wsUrl:  https://cooler-mining-walls-matters.trycloudflare.com

## To switch: update the "extra" block in mobile/app.json, then rebuild the APK