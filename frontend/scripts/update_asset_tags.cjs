const fs = require('fs');
const file = 'C:/xampp/htdocs/gha-asset-manager/frontend/src/components/AddAssetModal.jsx';
let content = fs.readFileSync(file, 'utf8');

// Update initial formData state
content = content.replace(/(assetTag:\s*'')/g, '$1,\n        hasAssetTag: \'No\'');
content = content.replace(/(assetTag:\s*assetToEdit\.asset_tag\s*\|\|\s*'')/g, '$1,\n                hasAssetTag: assetToEdit.asset_tag ? \'Yes\' : \'No\'');

// Define regex for the Asset Tag label + input block
const regex = /<label className="label">Asset Tag(.*?)<\/label>\s*<input name="assetTag" value=\{formData\.assetTag\} onChange=\{handleInputChange\} className="input-field" placeholder="(.*?)" \/>/g;

content = content.replace(regex, (match, suffix, placeholder) => {
    return `<label className="label">Does the asset have an Asset Tag${suffix}?</label>
    <select name="hasAssetTag" value={formData.hasAssetTag} onChange={handleInputChange} className="input-field mb-4">
        <option value="No">No</option>
        <option value="Yes">Yes</option>
    </select>
    {formData.hasAssetTag === 'Yes' && (
        <div className="animate-in slide-in-from-top-2 duration-200">
            <input name="assetTag" value={formData.assetTag} onChange={handleInputChange} className="input-field" placeholder="Enter Asset Tag... (e.g. GHA-XYZ)" />
        </div>
    )}`;
});

const regex2 = /<label className="label">Tag Number(.*?)<\/label>\s*<input name="assetTag" value=\{formData\.assetTag\} onChange=\{handleInputChange\} className="input-field" placeholder="(.*?)" \/>/g;
content = content.replace(regex2, (match, p1) => {
    return `<label className="label">Does the asset have a Tag Number${p1}?</label>
    <select name="hasAssetTag" value={formData.hasAssetTag} onChange={handleInputChange} className="input-field mb-4">
        <option value="No">No</option>
        <option value="Yes">Yes</option>
    </select>
    {formData.hasAssetTag === 'Yes' && (
        <div className="animate-in slide-in-from-top-2 duration-200">
            <input name="assetTag" value={formData.assetTag} onChange={handleInputChange} className="input-field" placeholder="Enter Tag Number..." />
        </div>
    )}`;
});

fs.writeFileSync(file, content);
console.log('Replacement successful!');
