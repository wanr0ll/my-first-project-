Add-Type -AssemblyName System.Drawing
$out = 'C:\xampp\htdocs\gha-asset-manager\frontend\public\defaults\office_consumables'

# Shared draw helpers
function Draw-GlowRings($g) {
    $p1 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(40,255,255,255),2)
    $p2 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(20,255,255,255),1)
    $g.DrawEllipse($p1,60,60,280,280); $g.DrawEllipse($p2,30,30,340,340); $g.DrawEllipse($p2,105,105,190,190)
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

# ── 1. PRINTING PAPERS  (indigo → blue gradient via bands) ──────────────────
$bmp = New-Object System.Drawing.Bitmap(400,400)
$g   = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
for ($y=0;$y-lt400;$y++) {
    $t=$y/400; $r=[int](20+35*$t); $gr=[int](30+60*$t); $b=[int](80+80*$t)
    $pen=New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255,$r,$gr,$b),1)
    $g.DrawLine($pen,0,$y,400,$y); $pen.Dispose()
}
Draw-GlowRings $g
# Paper stack
$g.FillRectangle((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(90,0,0,0))),128,170,152,130)
$g.FillRectangle((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(170,210,225,245))),120,160,150,128)
$g.FillRectangle((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210,230,240,255))),128,150,150,128)
$g.FillRectangle((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245,255,255,255))),136,140,150,128)
$lp=New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(80,90,110,170),2)
150,166,182,198,214,230,246 | ForEach-Object { $g.DrawLine($lp,152,$_,268,$_) }
$lp.Dispose()
$fb=New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210,255,220,100))
$g.FillPolygon($fb,@([System.Drawing.Point]::new(266,140),[System.Drawing.Point]::new(286,160),[System.Drawing.Point]::new(266,160))); $fb.Dispose()
Draw-Label $g 'Printing Papers' 18
$g.Dispose(); $bmp.Save("$out\printing_papers.png",[System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
Write-Host 'Saved: printing_papers.png'

# ── 2. TONER AND INK CARTRIDGES  (dark charcoal → teal) ────────────────────
$bmp = New-Object System.Drawing.Bitmap(400,400)
$g   = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
for ($y=0;$y-lt400;$y++) {
    $t=$y/400; $r=[int](15+5*$t); $gr=[int](35+55*$t); $b=[int](50+60*$t)
    $pen=New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255,$r,$gr,$b),1)
    $g.DrawLine($pen,0,$y,400,$y); $pen.Dispose()
}
Draw-GlowRings $g
$ib=New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235,255,255,255))
$ab=New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210,255,220,100))
$db=New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(90,0,0,0))
$g.FillRectangle($ib,105,165,190,78)
$g.FillEllipse($ib,97,160,24,88); $g.FillEllipse($ib,279,160,24,88)
$g.FillRectangle($ab,120,162,160,18)
$g.FillRectangle($ab,162,140,76,28)
$g.FillRectangle($db,120,225,160,15)
$vb=New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(55,0,0,0))
125,153,181,209,237,265 | ForEach-Object { $g.FillRectangle($vb,$_,182,10,28) }
$ib.Dispose();$ab.Dispose();$db.Dispose();$vb.Dispose()
Draw-Label $g 'Toner & Ink Cartridges' 15
$g.Dispose(); $bmp.Save("$out\toner_ink_cartridges.png",[System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
Write-Host 'Saved: toner_ink_cartridges.png'

# ── 3. STATIONERY ITEMS  (plum → purple) ────────────────────────────────────
$bmp = New-Object System.Drawing.Bitmap(400,400)
$g   = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
for ($y=0;$y-lt400;$y++) {
    $t=$y/400; $r=[int](45+55*$t); $gr=[int](15+25*$t); $b=[int](70+70*$t)
    $pen=New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255,$r,$gr,$b),1)
    $g.DrawLine($pen,0,$y,400,$y); $pen.Dispose()
}
Draw-GlowRings $g
$ib=New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235,255,255,255))
$ab=New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210,255,220,100))
# Ruler
$rb=New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180,200,225,255))
$g.FillRectangle($rb,152,132,124,22); $rb.Dispose()
$tp=New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(130,60,80,120),1)
162,172,182,192,202,212,222,232,242,252,262 | ForEach-Object { $th=if(($_-162)%30-eq 0){12}else{6}; $g.DrawLine($tp,$_,132,$_,(132+$th)) }
$tp.Dispose()
# Pencil body
$g.FillPolygon($ib,@([System.Drawing.Point]::new(130,143),[System.Drawing.Point]::new(148,143),[System.Drawing.Point]::new(250,250),[System.Drawing.Point]::new(232,250)))
# Pencil tip
$tib=New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220,210,170,100))
$g.FillPolygon($tib,@([System.Drawing.Point]::new(232,250),[System.Drawing.Point]::new(250,250),[System.Drawing.Point]::new(241,274))); $tib.Dispose()
# Eraser
$eb=New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220,220,100,100))
$g.FillRectangle($eb,125,138,22,16); $eb.Dispose()
# Scissors
$g.FillEllipse($ab,180,224,24,20); $g.FillEllipse($ab,206,218,24,20)
$g.FillPolygon($ab,@([System.Drawing.Point]::new(192,237),[System.Drawing.Point]::new(268,183),[System.Drawing.Point]::new(263,177),[System.Drawing.Point]::new(187,231)))
$g.FillPolygon($ab,@([System.Drawing.Point]::new(218,233),[System.Drawing.Point]::new(263,265),[System.Drawing.Point]::new(268,259),[System.Drawing.Point]::new(223,227)))
$ib.Dispose();$ab.Dispose()
Draw-Label $g 'Stationery Items' 18
$g.Dispose(); $bmp.Save("$out\stationery_items.png",[System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
Write-Host 'Saved: stationery_items.png'
Write-Host 'All 3 done.'
