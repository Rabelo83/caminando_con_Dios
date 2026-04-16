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
    extracted_title = ""
    
    # Strict regex for pulling Bible references like "Hechos 5:3-4 NTV" or "(Gn 32:22-32 NTV)."
    pattern = r'([1-3]?\s?[A-Za-zñáéíóú]+\s+\d{1,3}[:.]\d+(?:[\-–]\d+)?(?:[a-z])?\s*(?:\([A-Za-z]+\)|NTV|NVI|RVR(?:1960)?)?\w*)'
    
    for line in lines[:15]:
        m = re.search(pattern, line, re.IGNORECASE)
        if m:
            extracted_title = m.group(1).strip()
            # If the literal word "NTV" or "NVI" is directly in the original line, try to grab its closing dot/parenthesis too
            extra_idx = line.find(extracted_title) + len(extracted_title)
            if extra_idx < len(line) and line[extra_idx] in [')', '.']:
                extracted_title = line[line.find(extracted_title) : extra_idx + 1]
            break

    # If no match found, fallback to the first line (capped)
    if not extracted_title:
        extracted_title = lines[0].strip()
        if len(extracted_title) > 80:
            extracted_title = extracted_title[:77] + "..."
            
    # Clean up markdown formatting if any
    clean_title = extracted_title.replace('**', '').replace('Versículo Principal:', '').strip()
    if clean_title.startswith('- '):
        clean_title = clean_title[2:]
    clean_title = clean_title.strip(" )")
        
    # The content is the full devotional MINUS the extracted_title portion
    content = dev_str
    if extracted_title in content:
        content = content.replace(extracted_title, '', 1).strip()
        
    # Final pass to remove hanging punctuation and Markdown artifacts
    content = content.replace('**', '').replace('Versículo Principal:', '').strip()
    content = content.lstrip(' .)-').strip()
    
    parsed.append({
        "id": len(parsed) + 1,
        "reference": clean_title,
        "content": content
    })

print(f"Found {len(parsed)} devotionals.")

os.makedirs("data", exist_ok=True)
with open("data/devocionales.json", "w", encoding="utf-8") as f:
    json.dump(parsed, f, ensure_ascii=False, indent=2)

print("Saved clean data to data/devocionales.json")
