$content = Get-Content 'e:\anti\okinawa\okinawa_trip_standalone.html' -Raw
if ($content -match 'var travelFiles = \[(.*?)\];') {
    $arrayContent = $matches[0]
    $arrayContent = $arrayContent -replace 'var travelFiles = ', 'export const travelFiles = '
    $arrayContent | Out-File 'e:\anti\okinawa\src\assets.ts' -Encoding utf8
} else {
    Write-Host "No match found"
}
