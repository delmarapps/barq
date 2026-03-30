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
apiUrl: https://interest-witch-thesis-jvc.trycloudflare.com/api/v1
wsUrl:  https://interest-witch-thesis-jvc.trycloudflare.com

### Previous tunnels (for reference — these are temporary URLs that expire)
- https://internet-alpine-directive-administration.trycloudflare.com (expired)
- https://cooler-mining-walls-matters.trycloudflare.com (expired)

⚠️  Quick tunnel URLs change every restart. For a permanent URL, set up a named tunnel:
   1. Run: cloudflared tunnel login
   2. Run: cloudflared tunnel create barq
   Then update app.json and rebuild the APK with the fixed URL.

## To switch: update the "extra" block in mobile/app.json, then rebuild the APK