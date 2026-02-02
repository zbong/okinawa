import re
import os

path = r'e:\anti\okinawa\src\App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Improve the AI generation prompt to be more hotel-centric and route-optimized
improvement = """
               - Preferred Accommodations (Already Booked): ${plannerData.accommodations.length > 0 ? plannerData.accommodations.map((a: any) => `${a.name} (From ${a.startDate} To ${a.endDate})`).join(', ') : 'Not specified'}
               
               [LAYOUT RULES]:
               1. Geographic Optimization: Group attractions by proximity. Minimize zig-zagging.
               2. Accommodation Alignment: Start and end each day near the relevant hotel for that night.
               3. Travel Pace: ${plannerData.pace === 'relaxed' ? '3-4 items/day' : plannerData.pace === 'tight' ? '6-7 items/day' : '4-5 items/day'}.
"""

# Replace the previous block
content = re.sub(r'- Preferred Accommodations \(Already Booked\):.*?- Travel Pace: \$\{plannerData\.pace\}.*?\)', improvement, content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully improved AI generation prompt.")
