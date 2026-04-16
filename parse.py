import json
import re
import os

with open("input.txt", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace('\r\n', '\n').replace('\r', '\n')
lines = text.split('\n')

devotionals = []
current_lines = []

for line in lines:
    line = line.strip()
    if not line:
        continue
    
    current_lines.append(line)
    
    if re.search(r"Tenga[sn].*día", line, re.IGNORECASE):
        if len(current_lines) > 0:
            devotionals.append("\n\n".join(current_lines))
        current_lines = []

if current_lines:
    devotionals.append("\n\n".join(current_lines))

print(f"Found {len(devotionals)} devotionals based on closing text.")

parsed = []
for idx, dev_str in enumerate(devotionals):
    dev_str = dev_str.strip()
    if not dev_str: continue
    
    parts = dev_str.split('\n\n', 1)
    if len(parts) == 1:
        title = f"Día {idx + 1}"
        content = parts[0]
    else:
        # First paragraph is usually the verse (e.g. "Éxodo 3...")
        title = parts[0]
        content = parts[1]
    
    parsed.append({
        "id": idx + 1,
        "reference": title,
        "content": content
    })

with open("devocionales.json", "w", encoding="utf-8") as f:
    json.dump(parsed, f, ensure_ascii=False, indent=2)

print("Saved to devocionales.json")
