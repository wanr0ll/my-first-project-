const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "AddAssetModal.jsx");
let content = fs.readFileSync(filePath, "utf-8");

// Regex to find select blocks
// We want to capture the select block, extract its name, check if it contains "Others" option, and see if it already has a Custom input.
const selectRegex = /(<select\s+name="([^"]+)"[^>]*>[\s\S]*?<\/select>)/g;

let match;
const replacements = [];

while ((match = selectRegex.exec(content)) !== null) {
    const fullSelect = match[1];
    const selectName = match[2];
    
    // Check if the select block itself contains "Others" (explicitly or via array map like GENERAL_COLORS)
    const hasOthersOption = fullSelect.includes("Others") || 
                            fullSelect.includes("GENERAL_COLORS") || 
                            fullSelect.includes("GENERAL_SIZES") || 
                            fullSelect.includes("PORT_COUNTS") || 
                            fullSelect.includes("NETWORK_FORM_FACTORS") || 
                            fullSelect.includes("ENGINE_SIZES") || 
                            fullSelect.includes("MILEAGE_RANGES") || 
                            fullSelect.includes("FLOOR_COUNTS") || 
                            fullSelect.includes("LANE_COUNTS") || 
                            fullSelect.includes("LAYER_THICKNESSES") || 
                            fullSelect.includes("INTERCHANGE_AREAS") || 
                            fullSelect.includes("BRANDS") || 
                            fullSelect.includes("MODELS") || 
                            fullSelect.includes("CAPACITIES");
    
    if (hasOthersOption) {
        // Check if there is already a custom input block immediately following it
        // We look ahead up to 200 characters to see if we render a Custom field.
        const customInputPattern = new RegExp(`{formData\\.${selectName} === ['"]Others['"] &&`, "i");
        const afterSelectIdx = match.index + fullSelect.length;
        const nextFewChars = content.substring(afterSelectIdx, afterSelectIdx + 200);
        
        if (!customInputPattern.test(nextFewChars)) {
            // Need to insert
            const insertString = `\n{formData.${selectName} === 'Others' && (\n    <input name="${selectName}Custom" value={formData.${selectName}Custom || ''} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Please specify..." />\n)}`;
            
            replacements.push({
                index: afterSelectIdx,
                insertString: insertString
            });
        }
    }
}

// Apply replacements from back to front to avoid messing up indices
replacements.sort((a, b) => b.index - a.index);
for (const r of replacements) {
    content = content.substring(0, r.index) + r.insertString + content.substring(r.index);
}

fs.writeFileSync(filePath, content, "utf-8");
console.log(`Added ${replacements.length} custom inputs for "Others".`);
