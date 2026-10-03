
$filePath = "AddAssetModal.jsx"
$content = Get-Content $filePath -Raw -Encoding UTF8

# The pattern my script inserted exactly matches:
# \s*\{formData\.([a-zA-Z0-9_]+)\s*===\s*'Others'\s*&&\s*\(\s*<input\s+name=""\1Custom""\s+value=\{formData\.\1Custom\s*\|\|\s*''\}\s+onChange=\{handleInputChange\}\s+className=""input-field\s+mt-2\s+animate-in\s+slide-in-from-top-1\s+duration-200""\s+placeholder=""Please\s+specify\.\.\.""\s*/>\s*\)\}
$regex = "(?s)\r\n\s*\{formData\.([a-zA-Z0-9_]+) === 'Others' && \(\r\n\s*<input name=""\1Custom"" value=\{formData\.\1Custom \|\| ''\} onChange=\{handleInputChange\} className=""input-field mt-2 animate-in slide-in-from-top-1 duration-200"" placeholder=""Please specify\.\.\."" />\r\n\s*\)\}"

$newContent = [regex]::Replace($content, $regex, "")

Set-Content $filePath -Value $newContent -Encoding UTF8
$matches = [regex]::Matches($content, $regex)
Write-Output ("Removed " + $matches.Count + " custom inputs.")

