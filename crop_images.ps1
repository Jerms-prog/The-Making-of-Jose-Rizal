Add-Type -AssemblyName System.Drawing

$srcDir = "C:\Users\Admin\Downloads\rizal_pages"
$outDir = "C:\Users\Admin\jose-rizal-website\assets"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

function Crop($srcFile, $x, $y, $w, $h, $outFile) {
    $img = [System.Drawing.Image]::FromFile($srcFile)
    $x = [Math]::Max(0, [Math]::Min($x, $img.Width - 1))
    $y = [Math]::Max(0, [Math]::Min($y, $img.Height - 1))
    $w = [Math]::Min($w, $img.Width - $x)
    $h = [Math]::Min($h, $img.Height - $y)
    $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
    $bmp = New-Object System.Drawing.Bitmap($rect.Width, $rect.Height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.DrawImage($img, (New-Object System.Drawing.Rectangle(0,0,$rect.Width,$rect.Height)), $rect, [System.Drawing.GraphicsUnit]::Pixel)
    $bmp.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose(); $img.Dispose()
}

Crop "$srcDir\page_001.png" 196 1012 710 520  "$outDir\birthplace-house.png"
Crop "$srcDir\page_002.png" 196 959  615 830  "$outDir\baptism-marker.png"
Crop "$srcDir\page_005.png" 196 376  355 745  "$outDir\rizal-11.png"
Crop "$srcDir\page_008.png" 196 201  430 680  "$outDir\rizal-teen.png"
Crop "$srcDir\page_010.png" 196 1484 625 460  "$outDir\moth-candle.png"
Crop "$srcDir\page_011.png" 196 975  505 765  "$outDir\poem-scan.png"
Crop "$srcDir\page_013.png" 196 196  750 570  "$outDir\rizal-shrine.png"
Crop "$srcDir\page_015.png" 196 201  630 870  "$outDir\oil-portrait.png"
Crop "$srcDir\page_004.png" 196 201  300 415  "$outDir\father-portrait.png"
Crop "$srcDir\page_004.png" 196 758  295 400  "$outDir\oval-portrait.png"
Crop "$srcDir\page_006.png" 196 519  535 690  "$outDir\jose-alberto.png"
Crop "$srcDir\page_014.png" 196 196  1240 1000 "$outDir\family-group.png"
Crop "$srcDir\page_014.png" 196 1350 355 420  "$outDir\luna-portrait.png"
Crop "$srcDir\page_009.png" 196 201  460 630  "$outDir\rizal-sketches.png"
Crop "$srcDir\page_010.png" 196 201  720 415  "$outDir\rizal-books.png"

Write-Output "DONE"
Get-ChildItem $outDir | Select-Object Name, Length
