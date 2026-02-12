Add-Type -AssemblyName System.Drawing

$currentDir = Get-Location
$sourcePath = Join-Path $currentDir "src\assets\logo.jpg"
$destPngPath = Join-Path $currentDir "public\icon.png"
$destIcoPath = Join-Path $currentDir "public\logo.ico"

Write-Host "Lendo imagem de: $sourcePath"

if (-not (Test-Path $sourcePath)) {
    Write-Error "Arquivo não encontrado: $sourcePath"
    exit 1
}

try {
    $img = [System.Drawing.Image]::FromFile($sourcePath)
    
    # Save as PNG
    Write-Host "Salvando PNG em: $destPngPath"
    $img.Save($destPngPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Resize for ICO
    $icoSize = 256
    $icoImg = new-object System.Drawing.Bitmap $icoSize, $icoSize
    $graph = [System.Drawing.Graphics]::FromImage($icoImg)
    $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graph.DrawImage($img, 0, 0, $icoSize, $icoSize)
    
    # Save as ICO
    $Hicon = $icoImg.GetHicon()
    $icon = [System.Drawing.Icon]::FromHandle($Hicon)
    
    Write-Host "Salvando ICO em: $destIcoPath"
    $fileStream = New-Object System.IO.FileStream($destIcoPath, [System.IO.FileMode]::Create)
    $icon.Save($fileStream)
    $fileStream.Close()
    
    [System.Runtime.InteropServices.Marshal]::DestroyIcon($Hicon)
    
    Write-Host "Conversão concluída com sucesso."
} catch {
    Write-Error "Erro na conversão: $_"
    exit 1
}
