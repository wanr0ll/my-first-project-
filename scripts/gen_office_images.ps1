Add-Type -AssemblyName System.Drawing

$outputDir = "C:\xampp\htdocs\gha-asset-manager\frontend\public\defaults\office_consumables"

function New-OfficeImage {
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
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
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
    $gp1 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(35,255,255,255), 2)
    $gp2 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(18,255,255,255), 1)
    $g.DrawEllipse($gp1,  60,  60, 280, 280)
    $g.DrawEllipse($gp2,  30,  30, 340, 340)
    $g.DrawEllipse($gp2, 105, 105, 190, 190)
    $gp1.Dispose(); $gp2.Dispose()

    $ib = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235,255,255,255))
    $ab = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210,255,220,100))
    $db = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(90, 0,  0,  0))

    switch ($IconType) {

        'paper' {
            # Stack of paper sheets — 3 layers offset for depth effect
            # Bottom layer (shadow)
            $g.FillRectangle($db, 128, 168, 150, 130)
            # Third sheet
            $sh3 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180,220,230,240))
            $g.FillRectangle($sh3, 120, 158, 148, 128)
            $sh3.Dispose()
            # Second sheet
            $sh2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210,235,240,250))
            $g.FillRectangle($sh2, 128, 148, 148, 128)
            $sh2.Dispose()
            # Top sheet (white)
            $g.FillRectangle($ib, 136, 138, 148, 128)
            # Lines on top sheet (simulating text)
            $linePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(80,100,120,160), 2)
            for ($y = 165; $y -le 245; $y += 16) {
                $lineW = if ($y % 32 -eq 5) { 90 } else { 120 }
                $g.DrawLine($linePen, 152, $y, (152 + $lineW), $y)
            }
            $linePen.Dispose()
            # Corner fold on top sheet
            $foldPts = @(
                [System.Drawing.Point]::new(264, 138),
                [System.Drawing.Point]::new(284, 158),
                [System.Drawing.Point]::new(264, 158)
            )
            $g.FillPolygon($ab, $foldPts)
        }

        'toner' {
            # Toner cartridge body (long rectangular)
            $g.FillRectangle($ib, 105, 165, 190, 75)
            # Rounded end caps
            $g.FillEllipse($ib,  97, 160, 25, 85)
            $g.FillEllipse($ib, 278, 160, 25, 85)
            # Chip/label strip on top
            $g.FillRectangle($ab, 118, 162, 164, 18)
            # Handle grip on top
            $g.FillRectangle($ab, 160, 140, 80, 28)
            # Toner drum outlet (bottom strip)
            $g.FillRectangle($db, 118, 222, 164, 15)
            # Small vent slots on body
            $ventBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(60,0,0,0))
            for ($x = 125; $x -le 270; $x += 28) {
                $g.FillRectangle($ventBrush, $x, 180, 10, 30)
            }
            $ventBrush.Dispose()
        }

        'stationery' {
            # Pencil (angled)
            $pencilPts = @(
                [System.Drawing.Point]::new(130, 145),
                [System.Drawing.Point]::new(148, 145),
                [System.Drawing.Point]::new(250, 248),
                [System.Drawing.Point]::new(232, 248)
            )
            $g.FillPolygon($ib, $pencilPts)
            # Pencil tip triangle
            $tipPts = @(
                [System.Drawing.Point]::new(232, 248),
                [System.Drawing.Point]::new(250, 248),
                [System.Drawing.Point]::new(240, 272)
            )
            $tipBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220,210,170,100))
            $g.FillPolygon($tipBrush, $tipPts)
            $tipBrush.Dispose()
            # Pencil eraser end
            $eraserBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220,220,100,100))
            $g.FillRectangle($eraserBrush, 125, 140, 23, 16)
            $eraserBrush.Dispose()
            # Ruler (behind pencil)
            $rulerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180,200,230,255))
            $g.FillRectangle($rulerBrush, 155, 135, 120, 22)
            # Ruler tick marks
            $tickPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(130,60,80,120), 1)
            for ($x = 165; $x -le 265; $x += 10) {
                $tickH = if (($x - 165) % 30 -eq 0) { 12 } else { 6 }
                $g.DrawLine($tickPen, $x, 135, $x, (135 + $tickH))
            }
            $tickPen.Dispose(); $rulerBrush.Dispose()
            # Scissors (simple shape)
            $g.FillEllipse($ab, 182, 225, 24, 20)
            $g.FillEllipse($ab, 208, 220, 24, 20)
            $sPts1 = @([System.Drawing.Point]::new(194,238),[System.Drawing.Point]::new(270,185),[System.Drawing.Point]::new(265,179),[System.Drawing.Point]::new(189,232))
            $sPts2 = @([System.Drawing.Point]::new(220,234),[System.Drawing.Point]::new(265,267),[System.Drawing.Point]::new(270,261),[System.Drawing.Point]::new(225,228))
            $g.FillPolygon($ab, $sPts1)
            $g.FillPolygon($ab, $sPts2)
        }
    }

    $ib.Dispose(); $ab.Dispose(); $db.Dispose()

    # Label at bottom with shadow
    $wb  = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $shb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(80,0,0,0))
    $fs  = if ($Label.Length -gt 16) { 15 } elseif ($Label.Length -gt 10) { 18 } else { 22 }
    $fnt = New-Object System.Drawing.Font("Segoe UI", $fs, [System.Drawing.FontStyle]::Bold)
    $sf  = New-Object System.Drawing.StringFormat
    $sf.Alignment     = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString($Label, $fnt, $shb, [System.Drawing.RectangleF]::new(2, 317, 400, 60), $sf)
    $g.DrawString($Label, $fnt, $wb,  [System.Drawing.RectangleF]::new(0, 315, 400, 60), $sf)
    $wb.Dispose(); $shb.Dispose(); $fnt.Dispose()
    $g.Dispose()

    $bmp.Save((Join-Path $outputDir $FileName), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Saved: $FileName"
}

# 1. Printing Papers — deep indigo → slate blue
New-OfficeImage -FileName "printing_papers.png" -Label "Printing Papers" 
    -TopColor    ([System.Drawing.Color]::FromArgb(255, 20, 30,  80)) 
    -BottomColor ([System.Drawing.Color]::FromArgb(255, 55, 90, 160)) 
    -IconType    'paper'

# 2. Toner and Ink Cartridges — deep charcoal → muted teal
New-OfficeImage -FileName "toner_ink_cartridges.png" -Label "Toner & Ink Cartridges" 
    -TopColor    ([System.Drawing.Color]::FromArgb(255, 15, 35,  50)) 
    -BottomColor ([System.Drawing.Color]::FromArgb(255, 20, 90, 100)) 
    -IconType    'toner'

# 3. Stationery items — deep plum → warm purple
New-OfficeImage -FileName "stationery_items.png" -Label "Stationery Items" 
    -TopColor    ([System.Drawing.Color]::FromArgb(255, 45, 15,  70)) 
    -BottomColor ([System.Drawing.Color]::FromArgb(255, 100, 40, 140)) 
    -IconType    'stationery'

Write-Host "All 3 office consumable images generated."
