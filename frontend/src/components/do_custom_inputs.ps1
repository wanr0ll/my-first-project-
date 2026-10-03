$filePath = "AddAssetModal.jsx"
$content = Get-Content $filePath -Raw -Encoding UTF8

# Match any select block
$regex = "(?i)(<select\s+name=""([^""]+)""[^>]*>[\s\S]*?</select>)"
$matches = [regex]::Matches($content, $regex)

$replacements = @()

foreach ($match in $matches) {
    $fullSelect = $match.Groups[1].Value
    $selectName = $match.Groups[2].Value
    
    $keywords = @("Others", "GENERAL_COLORS", "GENERAL_SIZES", "PORT_COUNTS", "NETWORK_FORM_FACTORS", "ENGINE_SIZES", "MILEAGE_RANGES", "FLOOR_COUNTS", "LANE_COUNTS", "LAYER_THICKNESSES", "INTERCHANGE_AREAS", "BRANDS", "MODELS", "CAPACITIES", "TYPES")
    
    $hasOthers = $false
    foreach ($k in $keywords) {
        if ($fullSelect.Contains($k)) {
            $hasOthers = $true
            break
        }
    }
    
    if ($hasOthers) {
        # Check if it is already handled externally. Sometimes brandName has its own logic manually written in the component.
        # So we check if brandNameCustom is already manually in the file somewhere near.
        $afterSelectIdx = $match.Index + $match.Length
        $nextFewChars = ""
        if ($afterSelectIdx + 200 -lt $content.Length) {
            $nextFewChars = $content.Substring($afterSelectIdx, 200)
        } else {
            $nextFewChars = $content.Substring($afterSelectIdx)
        }
        
        $customInputPattern = "\{formData\." + $selectName + "\s*===\s*['""]Others['""]"
        
        if (-not ($nextFewChars -match $customInputPattern)) {
            # Let's replace the whole match with <>{fullSelect}{customInput}</>
            $insertString = "`r`n                                                {formData." + $selectName + " === 'Others' && (`r`n                                                    <input name=""" + $selectName + "Custom"" value={formData." + $selectName + "Custom || ''} onChange={handleInputChange} className=""input-field mt-2 animate-in slide-in-from-top-1 duration-200"" placeholder=""Please specify..."" />`r`n                                                )}"
            
            $replacementText = "<>`r`n" + $fullSelect + $insertString + "`r`n</>"
            
            $obj = New-Object PSObject
            $obj | Add-Member -MemberType NoteProperty -Name Index -Value $match.Index
            $obj | Add-Member -MemberType NoteProperty -Name Length -Value $match.Length
            $obj | Add-Member -MemberType NoteProperty -Name ReplacementText -Value $replacementText
            $replacements += $obj
        }
    }
}

$replacements = $replacements | Sort-Object -Property Index -Descending

foreach ($r in $replacements) {
    $content = $content.Substring(0, $r.Index) + $r.ReplacementText + $content.Substring($r.Index + $r.Length)
}

Set-Content $filePath -Value $content -Encoding UTF8
Write-Output ("Replaced " + $replacements.Length + " selects with custom input wrappers.")
