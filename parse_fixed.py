import json
import re
import os

with open("input.txt", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace('\r\n', '\n').replace('\r', '\n')

# Split by 3 or more newlines which separates the days
parts = re.split(r'\n(?:\s*\n){2,}', text)

parsed = []
for dev_str in parts:
    dev_str = dev_str.strip()
    if not dev_str: continue
    
    # Skip header
    if dev_str.upper().startswith("DEVOCIONAL: CAMINANDO DON DIOS."):
        dev_str = dev_str.split('\n', 1)[1].strip()
        if not dev_str: continue

    lines = dev_str.split('\n')
    title = lines[0]
    
    # Find the bible reference to use as title
    for line in lines[:5]:
        if re.search(r'\d{1,3}:\d+', line) or "NTV" in line.upper():
            title = line.strip()
            break
            
    # Remove the title from the body
    content = dev_str.replace(title, '', 1).strip()
    
    parsed.append({
        "id": len(parsed) + 1,
        "reference": title,
        "content": content
    })

print(f"Found {len(parsed)} devotionals.")

os.makedirs("data", exist_ok=True)
with open("data/devocionales.json", "w", encoding="utf-8") as f:
    json.dump(parsed, f, ensure_ascii=False, indent=2)

print("Saved to data/devocionales.json")
