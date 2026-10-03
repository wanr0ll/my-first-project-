$filePath = "AddAssetModal.jsx"
$content = Get-Content $filePath -Raw -Encoding UTF8

# Regex to match the exact wrapper we added:
# <>
# <select ...>...</select>
# {formData.X === 'Others' && (
#     <input name="XCustom" value={formData.XCustom || ''} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Please specify..." />
# )}
# </>
# We will capture the original <select> and replace the whole thing with just the <select>

$regex = "(?s)<>`r`n(<select\s+name=""([^""]+)""[^>]*>[\s\S]*?</select>)`r`n\s*\{formData\.\2 === 'Others' && \(`r`n\s*<input name=""\2Custom"" value=\{formData\.\2Custom \|\| ''\} onChange=\{handleInputChange\} className=""input-field mt-2 animate-in slide-in-from-top-1 duration-200"" placeholder=""Please specify\.\.\."" />`r`n\s*\)\}`r`n</>"

$newContent = [regex]::Replace($content, $regex, '$1')

$matches = [regex]::Matches($content, $regex)
Set-Content $filePath -Value $newContent -Encoding UTF8
Write-Output ("Undid " + $matches.Count + " fragment wrappers.")
