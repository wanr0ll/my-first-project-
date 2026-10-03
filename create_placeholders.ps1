Add-Type -AssemblyName System.Drawing

function Create-Placeholder {
    param([string]$filePath, [string]$label)
    $width = 400
    $height = 400
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Background
    $bg = [System.Drawing.Color]::FromArgb(235, 240, 255)
    $g.Clear($bg)

    # Outer border
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(160, 180, 230), 3)
    $g.DrawRectangle($pen, 10, 10, $width - 21, $height - 21)

    # Dashed inner border
    $dashes = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(140, 160, 220), 2)
    $dashes.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
    $g.DrawRectangle($dashes, 22, 22, $width - 45, $height - 45)

    # Icon area background circle
    $circleColor = [System.Drawing.Color]::FromArgb(210, 220, 250)
    $circleBrush = New-Object System.Drawing.SolidBrush($circleColor)
    $g.FillEllipse($circleBrush, 120, 70, 160, 160)

    # Simple icon: draw camera icon shape
    $iconPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(80, 100, 180), 4)
    $g.DrawEllipse($iconPen, 155, 105, 90, 90)
    $g.DrawRectangle($iconPen, 130, 95, 140, 110)
    $iconBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(80, 100, 180))
    $g.FillEllipse($iconBrush, 170, 120, 60, 60)

    # Label
    $labelFont = New-Object System.Drawing.Font("Segoe UI", 15, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(50, 70, 150))
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Near
    $labelRect = New-Object System.Drawing.RectangleF(20, 258, 360, 70)
    $g.DrawString($label, $labelFont, $textBrush, $labelRect, $sf)

    # Hint text
    $hintFont = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Italic)
    $hintBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(120, 140, 190))
    $hintRect = New-Object System.Drawing.RectangleF(20, 330, 360, 40)
    $g.DrawString("[ Replace with actual image ]", $hintFont, $hintBrush, $hintRect, $sf)

    $bmp.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created: $filePath"
}

$dir = "c:\xampp\htdocs\gha-asset-manager\frontend\public\defaults\it_consumables"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

Create-Placeholder "$dir\usb_drive.png"           "USB / Flash Drives"
Create-Placeholder "$dir\external_hdd.png"        "External Hard Drives"
Create-Placeholder "$dir\network_cables.png"      "Network Cables"
Create-Placeholder "$dir\power_cables.png"        "Power Cables / Adapters"
Create-Placeholder "$dir\ups_batteries.png"       "UPS Batteries"
Create-Placeholder "$dir\wireless_peripherals.png" "Wireless Peripherals"
Create-Placeholder "$dir\ram_modules.png"         "RAM / Memory Modules"
Create-Placeholder "$dir\it_consumables.png"      "IT Consumables (Others)"

Write-Host "All 8 placeholder images created!"
