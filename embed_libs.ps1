
# Read the original file
$original = Get-Content "okinawa_trip_standalone.html"

# Define cut points (using 0-based indexing)
# Lines 1-32 (indices 0..31) are the header
# Lines 33-37 (indices 32..36) are the CDN links to be replaced
# Lines 38-end (indices 37..count-1) are the rest of the file

$header = $original[0..31]
$footer = $original[37..($original.Count - 1)]

# Prepare library contents
$scriptStart = "<script>"
$scriptEnd = "</script>"
$styleStart = "<style>"
$styleEnd = "</style>"

$reactContent = Get-Content "react.js" -Raw
$reactDomContent = Get-Content "react-dom.js" -Raw
$leafletCssContent = Get-Content "leaflet.css" -Raw
$leafletJsContent = Get-Content "leaflet.js" -Raw

# Assemble the new file content
$newContent = @()
$newContent += $header
$newContent += "<!-- Embedded Libraries -->"
$newContent += $scriptStart
$newContent += "console.log('Embedding React 17...');"
$newContent += $reactContent
$newContent += "console.log('React 17 Embedded.');"
$newContent += $scriptEnd
$newContent += $scriptStart
$newContent += "console.log('Embedding ReactDOM 17...');"
$newContent += $reactDomContent
$newContent += "console.log('ReactDOM 17 Embedded.');"
$newContent += $scriptEnd
$newContent += $styleStart
$newContent += "/* Leaflet CSS */"
$newContent += $leafletCssContent
$newContent += $styleEnd
$newContent += $scriptStart
$newContent += "console.log('Embedding Leaflet...');"
$newContent += $leafletJsContent
$newContent += "console.log('Leaflet Embedded.');"
$newContent += $scriptEnd
$newContent += $footer

# Write to new file
$newContent | Set-Content "okinawa_trip_embedded.html" -Encoding UTF8

Write-Host "File assembled: okinawa_trip_embedded.html"
