$filePath = "AddAssetModal.jsx"
$content = Get-Content $filePath -Raw -Encoding UTF8

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
        $afterSelectIdx = $match.Index + $match.Length
        $nextFewChars = ""
        if ($afterSelectIdx + 200 -lt $content.Length) {
            $nextFewChars = $content.Substring($afterSelectIdx, 200)
        } else {
            $nextFewChars = $content.Substring($afterSelectIdx)
        }
        
        $customInputPattern = "\{formData\." + $selectName + "\s*===\s*['""]Others['""]\s*&&"
        if (-not ($nextFewChars -match $customInputPattern)) {
            $insertString = "`r`n                                                {formData." + $selectName + " === 'Others' && (`r`n                                                    <input name=""" + $selectName + "Custom"" value={formData." + $selectName + "Custom || ''} onChange={handleInputChange} className=""input-field mt-2 animate-in slide-in-from-top-1 duration-200"" placeholder=""Please specify..."" />`r`n                                                )}"
            
            $obj = New-Object PSObject
            $obj | Add-Member -MemberType NoteProperty -Name Index -Value $afterSelectIdx
            $obj | Add-Member -MemberType NoteProperty -Name InsertString -Value $insertString
            $replacements += $obj
        }
    }
}

$replacements = $replacements | Sort-Object -Property Index -Descending

foreach ($r in $replacements) {
    $content = $content.Substring(0, $r.Index) + $r.InsertString + $content.Substring($r.Index)
}

Set-Content $filePath -Value $content -Encoding UTF8
Write-Output ("Added " + $replacements.Length + " custom inputs for 'Others'.")
