import os

path = r'e:\anti\okinawa\src\App.tsx'
with open(path, 'rb') as f:
    lines = f.readlines()

# Index 2562 is line 2563
lines[2562] = b'                                                const uniqueKeys = Array.from(new Set(groupKeys)).sort((a, b) => b.localeCompare(a));\r\n'
# Index 4869 is line 4870
lines[4869] = b'                                                            {[...plannerData.accommodations].sort((a, b) => a.startDate.localeCompare(b.startDate)).map((acc: any, idx: number) => (\r\n'

with open(path, 'wb') as f:
    f.writelines(lines)
print("File fixed.")
