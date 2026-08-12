#!/usr/bin/env bash
# Serves the site at http://localhost:8752 from the project root.
#
# This is now REQUIRED for local viewing: all assets and links use root-relative
# paths (/assets/..., /index.html), which only resolve when the site is served
# from a web root. Opening index.html directly from Explorer (file://) will load
# the page without CSS or JavaScript.
#
# Usage:  bash serve.sh      then open http://localhost:8752
set -euo pipefail
cd "$(dirname "$0")"

PORT="${1:-8752}"

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "
  \$listener = New-Object System.Net.HttpListener
  \$listener.Prefixes.Add('http://localhost:$PORT/')
  \$listener.Start()
  Write-Host 'Serving' (Get-Location) 'at http://localhost:$PORT/'
  Write-Host 'Press Ctrl+C to stop.'
  \$mime = @{ '.html'='text/html'; '.css'='text/css'; '.js'='application/javascript';
             '.json'='application/json'; '.png'='image/png'; '.jpg'='image/jpeg';
             '.svg'='image/svg+xml'; '.ico'='image/x-icon' }
  while (\$listener.IsListening) {
    \$ctx = \$listener.GetContext(); \$res = \$ctx.Response
    try {
      \$path = [System.Uri]::UnescapeDataString(\$ctx.Request.Url.AbsolutePath)
      if (\$path -eq '/') { \$path = '/index.html' }
      \$file = Join-Path (Get-Location) (\$path.TrimStart('/'))
      if (Test-Path \$file -PathType Leaf) {
        \$ext = [System.IO.Path]::GetExtension(\$file)
        \$ct = \$mime[\$ext]; if (-not \$ct) { \$ct = 'application/octet-stream' }
        \$bytes = [System.IO.File]::ReadAllBytes(\$file)
        \$res.ContentType = \$ct; \$res.ContentLength64 = \$bytes.Length
        \$res.OutputStream.Write(\$bytes, 0, \$bytes.Length)
      } else {
        \$res.StatusCode = 404
        \$msg = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found: ' + \$path)
        \$res.OutputStream.Write(\$msg, 0, \$msg.Length)
      }
    } catch { \$res.StatusCode = 500 } finally { \$res.OutputStream.Close() }
  }
"
