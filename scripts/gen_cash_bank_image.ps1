Add-Type -AssemblyName System.Drawing
$outDir = 'C:\xampp\htdocs\gha-asset-manager\frontend\public\defaults'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }

function Draw-GlowRings($g) {
    $p1 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(40,255,255,255),2)
    $p2 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(20,255,255,255),1)
    $g.DrawEllipse($p1,60,60,280,280)
    $g.DrawEllipse($p2,30,30,340,340)
    $g.DrawEllipse($p2,105,105,190,190)
    $p1.Dispose(); $p2.Dispose()
}

function Draw-Label($g, $text, $size) {
    $wb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $sb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(80,0,0,0))
    $fn = New-Object System.Drawing.Font('Segoe UI',$size,[System.Drawing.FontStyle]::Bold)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString($text,$fn,$sb,[System.Drawing.RectangleF]::new(2,317,400,60),$sf)
    $g.DrawString($text,$fn,$wb,[System.Drawing.RectangleF]::new(0,315,400,60),$sf)
    $wb.Dispose();$sb.Dispose();$fn.Dispose()
}

$bmp = New-Object System.Drawing.Bitmap(400,400)
$g   = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

# Forest Green gradient
for ($y=0;$y-lt400;$y++) {
    $t=$y/400; $r=[int](10+20*$t); $gr=[int](45+60*$t); $b=[int](25+35*$t)
    $pen=New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255,$r,$gr,$b),1)
    $g.DrawLine($pen,0,$y,400,$y)
    $pen.Dispose()
}

Draw-GlowRings $g

# Bank / Vault / Cash icon
$ib = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235,255,255,255))
$ab = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210,255,220,100))
$db = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(90,0,0,0))

# Bank Building (Classical pillars)
$g.FillPolygon($ib, @([System.Drawing.Point]::new(200,120), [System.Drawing.Point]::new(280,160), [System.Drawing.Point]::new(120,160)))
$g.FillRectangle($ib, 120, 160, 160, 20)
# Pillars
$g.FillRectangle($ab, 130, 180, 20, 80)
$g.FillRectangle($ab, 170, 180, 20, 80)
$g.FillRectangle($ab, 210, 180, 20, 80)
$g.FillRectangle($ab, 250, 180, 20, 80)
# Steps
$g.FillRectangle($ib, 110, 260, 180, 15)
$g.FillRectangle($ib, 100, 275, 200, 15)

# Dollar/Money sign inside the bank pediment
$moneyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180,255,255,255))
$g.FillEllipse($moneyBrush, 185, 130, 30, 30)
$moneyBrush.Dispose()

$ib.Dispose(); $ab.Dispose(); $db.Dispose()

Draw-Label $g 'Cash & Bank Balance' 18

$g.Dispose()
$bmp.Save("$outDir\cash_bank_balance.png",[System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "Saved: cash_bank_balance.png"
