import os

path = r'e:\anti\okinawa\src\App.tsx'
with open(path, 'rb') as f:
    data = f.read()

mess = b'ber) => (ocaleCompare'
if mess in data:
    print(f"Found mess: {mess}")
    # Replace the whole chunk around it if possible or just the mess
    # Based on findstr, it seems the line 2563 was partially overwritten by 4870
    # I'll just replace the whole mess line with the correct one.
else:
    print("Mess not found.")

# Let's try to find line 2563 and print it raw
lines = data.splitlines()
if len(lines) > 2562:
    print(f"Line 2563 (raw): {lines[2562]}")
