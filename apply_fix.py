import os

path = r'e:\anti\okinawa\src\App.tsx'
with open(path, 'rb') as f:
    data = f.read()

# Fix common corruption patterns
patterns = [
    (b'ocaleCompare', b'localeCompare'),
    (b'caleCompare', b'localeCompare'),
]

for p, r in patterns:
    if p in data:
        print(f"Replacing {p} with {r}")
        data = data.replace(p, r)

# Fix the specific corrupted line 2563
# based on our debug output, it had many spaces/nulls then sort...
import re
# Match any line that has a lot of nulls/spaces and ends with sort...
# But simpler: just find where uniqueKeys should be.
target_line = b'                                                const uniqueKeys = Array.from(new Set(groupKeys)).sort((a, b) => b.localeCompare(a));\r\n'

# Let's just fix the whole file's line 2563 and 4870 specifically by splitting and joining
lines = data.splitlines(keepends=True)
if len(lines) > 2562:
    lines[2562] = b'                                                const uniqueKeys = Array.from(new Set(groupKeys)).sort((a, b) => b.localeCompare(a));\r\n'
if len(lines) > 4869:
    lines[4869] = b'                                                            {[...plannerData.accommodations].sort((a, b) => a.startDate.localeCompare(b.startDate)).map((acc: any, idx: number) => (\r\n'

with open(path, 'wb') as f:
    f.writelines(lines)
print("Fix applied.")
