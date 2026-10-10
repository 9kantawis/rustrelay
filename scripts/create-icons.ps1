Add-Type -AssemblyName System.Drawing
$assetDirectory = Join-Path $PSScriptRoot '../electron/assets'
New-Item -ItemType Directory -Path $assetDirectory -Force | Out-Null
$frames = @()
foreach ($size in @(16, 24, 32, 48, 64, 128, 256)) {
    $bitmap = [System.Drawing.Bitmap]::new($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.ScaleTransform(($size / 256.0), ($size / 256.0))
    $background = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#202020'))
    $accent = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#E89662'))
    $tile = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $tile.AddArc(4, 4, 56, 56, 180, 90)
    $tile.AddArc(196, 4, 56, 56, 270, 90)
    $tile.AddArc(196, 196, 56, 56, 0, 90)
    $tile.AddArc(4, 196, 56, 56, 90, 90)
    $tile.CloseFigure()
    $graphics.FillPath($background, $tile)
    $letter = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $letter.StartFigure()
    $letter.AddLine(66, 57, 137, 57)
    $letter.AddBezier(137, 57, 177, 57, 195, 78, 195, 106)
    $letter.AddBezier(195, 106, 195, 129, 182, 144, 160, 150)
    $letter.AddLine(160, 150, 201, 200)
    $letter.AddLine(201, 200, 161, 200)
    $letter.AddLine(161, 200, 123, 153)
    $letter.AddLine(123, 153, 100, 153)
    $letter.AddLine(100, 153, 100, 200)
    $letter.AddLine(100, 200, 66, 200)
    $letter.CloseFigure()
    $letter.StartFigure()
    $letter.AddLine(100, 87, 100, 123)
    $letter.AddLine(100, 123, 134, 123)
    $letter.AddBezier(134, 123, 153, 123, 161, 118, 161, 105)
    $letter.AddBezier(161, 105, 161, 92, 153, 87, 134, 87)
    $letter.CloseFigure()
    $graphics.FillPath($accent, $letter)
    $memory = [System.IO.MemoryStream]::new()
    $bitmap.Save($memory, [System.Drawing.Imaging.ImageFormat]::Png)
    $frames += @{ Size = $size; Bytes = $memory.ToArray() }
    if ($size -eq 32) { [System.IO.File]::WriteAllBytes((Join-Path $assetDirectory 'tray.png'), $memory.ToArray()) }
    if ($size -eq 256) { [System.IO.File]::WriteAllBytes((Join-Path $assetDirectory 'app.png'), $memory.ToArray()) }
    $memory.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
    $background.Dispose(); $accent.Dispose(); $tile.Dispose(); $letter.Dispose()
}
$iconStream = [System.IO.MemoryStream]::new()
$writer = [System.IO.BinaryWriter]::new($iconStream)
$writer.Write([uint16]0); $writer.Write([uint16]1); $writer.Write([uint16]$frames.Count)
$offset = 6 + 16 * $frames.Count
foreach ($frame in $frames) {
    $dimension = if ($frame.Size -eq 256) { 0 } else { $frame.Size }
    $writer.Write([byte]$dimension); $writer.Write([byte]$dimension)
    $writer.Write([byte]0); $writer.Write([byte]0)
    $writer.Write([uint16]1); $writer.Write([uint16]32)
    $writer.Write([uint32]$frame.Bytes.Length); $writer.Write([uint32]$offset)
    $offset += $frame.Bytes.Length
}
foreach ($frame in $frames) { $writer.Write([byte[]]$frame.Bytes) }
[System.IO.File]::WriteAllBytes((Join-Path $assetDirectory 'app.ico'), $iconStream.ToArray())
$writer.Dispose(); $iconStream.Dispose()
Write-Output 'Created app.ico, app.png and tray.png'
