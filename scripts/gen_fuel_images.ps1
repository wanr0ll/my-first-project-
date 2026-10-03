Add-Type -AssemblyName System.Drawing

$outputDir = "C:\xampp\htdocs\gha-asset-manager\frontend\public\defaults\fuel_energy"

function New-FuelImage {
    param(
        [string]$FileName,
        [string]$Label,
        [System.Drawing.Color]$TopColor,
        [System.Drawing.Color]$BottomColor,
        [string]$IconType
    )
    $w = 400; $h = 400
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

    # Background gradient
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        [System.Drawing.Rectangle]::new(0, 0, $w, $h),
        $TopColor, $BottomColor,
        [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
    )
    $g.FillRectangle($bgBrush, 0, 0, $w, $h)
    $bgBrush.Dispose()

    # Glow circles
    $gp1 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(40,255,255,255), 2)
    $gp2 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(20,255,255,255), 1)
    $g.DrawEllipse($gp1, 60, 60, 280, 280)
    $g.DrawEllipse($gp2, 30, 30, 340, 340)
    $g.DrawEllipse($gp2, 100, 100, 200, 200)
    $gp1.Dispose(); $gp2.Dispose()

    $ib  = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(240,255,255,255))
    $ab  = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200,255,220,100))
    $db  = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100,0,0,0))

    switch ($IconType) {
        'pump' {
            $g.FillRectangle($ib, 155, 140, 90, 150)
            $g.FillRectangle($ib, 148, 128, 104, 18)
            $g.FillRectangle($ab, 245, 160, 40, 14)
            $g.FillRectangle($ab, 280, 158, 14, 30)
            $g.FillRectangle($db, 170, 165, 60, 35)
            $g.FillRectangle($ib, 145, 288, 110, 12)
        }
        'barrel' {
            $g.FillRectangle($ib, 145, 148, 110, 140)
            $g.FillEllipse($ab, 145, 136, 110, 24)
            $g.FillEllipse($ib, 145, 274, 110, 24)
            $bb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(55,0,0,0))
            $g.FillRectangle($bb, 145, 188, 110, 10)
            $g.FillRectangle($bb, 145, 228, 110, 10)
            $g.FillRectangle($ab, 193, 118, 14, 24)
            $bb.Dispose()
        }
        'cylinder' {
            $g.FillEllipse($ib,  160, 132, 80, 28)
            $g.FillRectangle($ib, 160, 144, 80, 145)
            $g.FillEllipse($ib,  160, 275, 80, 28)
            $g.FillRectangle($ab, 188, 108, 24, 28)
            $g.FillEllipse($ab,  183, 102, 34, 14)
            $bb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(50,0,0,0))
            $g.FillRectangle($bb, 160, 195, 80, 38)
            $sf2 = New-Object System.Drawing.StringFormat
            $sf2.Alignment = [System.Drawing.StringAlignment]::Center
            $sf2.LineAlignment = [System.Drawing.StringAlignment]::Center
            $sf = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
            $wb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
            $g.DrawString("LPG", $sf, $wb, [System.Drawing.RectangleF]::new(160, 196, 80, 36), $sf2)
            $bb.Dispose(); $sf.Dispose(); $wb.Dispose()
        }
        'grease' {
            $g.FillRectangle($ib, 115, 183, 160, 40)
            $pts = @([System.Drawing.Point]::new(145,223),[System.Drawing.Point]::new(175,223),[System.Drawing.Point]::new(170,268),[System.Drawing.Point]::new(150,268))
            $g.FillPolygon($ib, $pts)
            $np  = @([System.Drawing.Point]::new(275,191),[System.Drawing.Point]::new(308,196),[System.Drawing.Point]::new(308,210),[System.Drawing.Point]::new(275,215))
            $g.FillPolygon($ab, $np)
            $g.FillEllipse($ab, 108, 178, 20, 50)
            $g.FillRectangle($db, 148, 216, 26, 8)
        }
        'oil' {
            $g.FillRectangle($ib, 163, 175, 74, 120)
            $sh = @([System.Drawing.Point]::new(155,175),[System.Drawing.Point]::new(245,175),[System.Drawing.Point]::new(237,145),[System.Drawing.Point]::new(163,145))
            $g.FillPolygon($ib, $sh)
            $g.FillRectangle($ab, 181, 118, 38, 30)
            $g.FillEllipse($ab, 176, 110, 48, 16)
            $bb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(55,0,0,0))
            $g.FillRectangle($bb, 163, 210, 74, 40)
            $g.FillRectangle($ib, 237, 180, 14, 50)
            $bb.Dispose()
        }
    }
    $ib.Dispose(); $ab.Dispose(); $db.Dispose()

    $wb  = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $shb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(80,0,0,0))
    $fs  = if ($Label.Length -gt 14) { 16 } else { 20 }
    $fnt = New-Object System.Drawing.Font("Segoe UI", $fs, [System.Drawing.FontStyle]::Bold)
    $sf  = New-Object System.Drawing.StringFormat
    $sf.Alignment     = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString($Label, $fnt, $shb, [System.Drawing.RectangleF]::new(2, 317, 400, 58), $sf)
    $g.DrawString($Label, $fnt, $wb,  [System.Drawing.RectangleF]::new(0, 315, 400, 58), $sf)
    $wb.Dispose(); $shb.Dispose(); $fnt.Dispose()
    $g.Dispose()

    $path = Join-Path $outputDir $FileName
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Saved: $FileName"
}

New-FuelImage -FileName "petrol.png"            -Label "Petrol"               -TopColor ([System.Drawing.Color]::FromArgb(255,10,25,70))   -BottomColor ([System.Drawing.Color]::FromArgb(255,210,80,10))  -IconType 'pump'
New-FuelImage -FileName "diesel.png"            -Label "Diesel"               -TopColor ([System.Drawing.Color]::FromArgb(255,20,30,50))   -BottomColor ([System.Drawing.Color]::FromArgb(255,40,80,130)) -IconType 'barrel'
New-FuelImage -FileName "lpg.png"               -Label "Liquefied Gas (LPG)"  -TopColor ([System.Drawing.Color]::FromArgb(255,5,60,70))    -BottomColor ([System.Drawing.Color]::FromArgb(255,10,120,80)) -IconType 'cylinder'
New-FuelImage -FileName "lubricating_grease.png"-Label "Lubricating Grease"   -TopColor ([System.Drawing.Color]::FromArgb(255,30,45,15))   -BottomColor ([System.Drawing.Color]::FromArgb(255,100,70,20)) -IconType 'grease'
New-FuelImage -FileName "engine_oil.png"        -Label "Engine Oil"           -TopColor ([System.Drawing.Color]::FromArgb(255,50,20,5))    -BottomColor ([System.Drawing.Color]::FromArgb(255,180,90,10)) -IconType 'oil'

Write-Host "All 5 images generated."
