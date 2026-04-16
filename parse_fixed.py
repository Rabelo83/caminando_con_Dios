import json
import re
import os

with open("input.txt", "r", encoding="utf-8") as f:
    text = f.read()

# Sanitize input: Replace non-breaking spaces and fix carriage returns
text = text.replace('\xa0', ' ').replace('\u00a0', ' ')
text = text.replace('\r\n', '\n').replace('\r', '\n')

# Split by 3 or more newlines which separates the days
parts = re.split(r'\n(?:\s*\n){2,}', text)

parsed = []
for dev_str in parts:
    dev_str = dev_str.strip()
    if not dev_str: continue
    
    # Skip header
    if dev_str.upper().startswith("DEVOCIONAL: CAMINANDO DON DIOS.") or dev_str.upper().startswith("DEVOCIONAL: CAMINANDO CON DIOS."):
        if '\n' in dev_str:
            dev_str = dev_str.split('\n', 1)[1].strip()
        else:
            continue
        if not dev_str: continue

    lines = dev_str.split('\n')
    extracted_title = lines[0].strip()
    
    # Find the bible reference to use as title
    for line in lines[:5]:
        if re.search(r'\d{1,3}:\d+', line) or "NTV" in line.upper() or "NVI" in line.upper():
            extracted_title = line.strip()
            # Truncate correctly to extract only the reference
            ntv_idx = extracted_title.upper().find('NTV')
            if ntv_idx == -1:
                ntv_idx = extracted_title.upper().find('NVI')
                
            if ntv_idx != -1:
                match = re.search(r'NTV[).]?', extracted_title[ntv_idx:ntv_idx+5], re.IGNORECASE)
                if match:
                    extracted_title = extracted_title[:ntv_idx + len(match.group())].strip()
                else:
                    extracted_title = extracted_title[:ntv_idx+3].strip()
            elif len(extracted_title) > 80:
                period_idx = extracted_title.find('.')
                if period_idx != -1 and period_idx < 80:
                    extracted_title = extracted_title[:period_idx+1].strip()
                else:
                    extracted_title = extracted_title[:77].strip() + "..."
            break
            
    # Clean up the reference string specifically
    extracted_title = extracted_title.replace('**', '').replace('Versículo Principal:', '').strip()
    if extracted_title.startswith('- '):
        extracted_title = extracted_title[2:]
        
    # The content is the full devotional MINUS the extracted_title portion
    content = dev_str
    if extracted_title in content:
        content = content.replace(extracted_title, '', 1).strip()
    
    parsed.append({
        "id": len(parsed) + 1,
        "reference": extracted_title,
        "content": content
    })

print(f"Found {len(parsed)} devotionals.")

os.makedirs("data", exist_ok=True)
with open("data/devocionales.json", "w", encoding="utf-8") as f:
    json.dump(parsed, f, ensure_ascii=False, indent=2)

print("Saved clean data to data/devocionales.json")
