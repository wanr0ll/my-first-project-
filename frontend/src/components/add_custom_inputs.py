import re
import os

file_path = "AddAssetModal.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

select_pattern = re.compile(r'(<select\s+name="([^"]+)"[^>]*>[\s\S]*?</select>)')

replacements = []
for match in select_pattern.finditer(content):
    full_select = match.group(1)
    select_name = match.group(2)
    
    # Check if this dropdown contains "Others" option directly or via constants mapping
    has_others_option = any(k in full_select for k in [
        "Others", "GENERAL_COLORS", "GENERAL_SIZES", "PORT_COUNTS", 
        "NETWORK_FORM_FACTORS", "ENGINE_SIZES", "MILEAGE_RANGES", 
        "FLOOR_COUNTS", "LANE_COUNTS", "LAYER_THICKNESSES", 
        "INTERCHANGE_AREAS", "BRANDS", "MODELS", "CAPACITIES", "TYPES"
    ])
    
    if has_others_option:
        # Check if a custom input block immediately follows the select tag
        after_select_idx = match.end()
        next_few_chars = content[after_select_idx:after_select_idx + 200]
        
        custom_input_pattern = re.compile(r'{formData\.' + select_name + r'\s*===\s*[\'"]Others[\'"]\s*&&', re.IGNORECASE)
        
        if not custom_input_pattern.search(next_few_chars):
            # Need to insert the custom input block
            insert_string = f'\n                                                {{formData.{select_name} === \'Others\' && (\n                                                    <input name="{select_name}Custom" value={{formData.{select_name}Custom || \'\'}} onChange={{handleInputChange}} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Please specify..." />\n                                                )}}'
            
            replacements.append({
                "index": after_select_idx,
                "text": insert_string
            })

# Apply replacements in reverse order
replacements.sort(key=lambda x: x["index"], reverse=True)
for r in replacements:
    content = content[:r["index"]] + r["text"] + content[r["index"]:]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Added {len(replacements)} custom inputs for 'Others'.")
