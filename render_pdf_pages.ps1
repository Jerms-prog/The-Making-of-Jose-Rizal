param(
    [string]$PdfPath = "C:\Users\Admin\Downloads\Rizal's Childhood.pdf",
    [string]$OutDir = "C:\Users\Admin\Downloads\rizal_pages"
)

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

Add-Type -AssemblyName System.Runtime.WindowsRuntime

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
})[0]

function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    $netTask.Result
}

function AwaitAction($WinRtAction) {
    $asTaskAction = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
        $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncAction'
    })[0]
    $netTask = $asTaskAction.Invoke($null, @($WinRtAction))
    $netTask.Wait(-1) | Out-Null
}

[Windows.Data.Pdf.PdfDocument,Windows.Data.Pdf,ContentType=WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime] | Out-Null
[Windows.Storage.Streams.RandomAccessStream,Windows.Storage.Streams,ContentType=WindowsRuntime] | Out-Null

$file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($PdfPath)) ([Windows.Storage.StorageFile])
$pdfDoc = Await ([Windows.Data.Pdf.PdfDocument]::LoadFromFileAsync($file)) ([Windows.Data.Pdf.PdfDocument])

$count = $pdfDoc.PageCount
Write-Output "PageCount: $count"

for ($i = 0; $i -lt $count; $i++) {
    $page = $pdfDoc.GetPage([uint32]$i)
    $outFile = Join-Path $OutDir ("page_{0:D3}.png" -f ($i + 1))

    $stream = New-Object Windows.Storage.Streams.InMemoryRandomAccessStream

    $options = New-Object Windows.Data.Pdf.PdfPageRenderOptions
    # render at ~2x for readability
    $options.DestinationWidth = [uint32]([Math]::Round($page.Size.Width * 2))
    $options.DestinationHeight = [uint32]([Math]::Round($page.Size.Height * 2))

    AwaitAction ($page.RenderToStreamAsync($stream, $options))

    $netStream = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead($stream.GetInputStreamAt(0))
    $fileStream = [System.IO.File]::Create($outFile)
    $netStream.CopyTo($fileStream)
    $fileStream.Dispose()
    $netStream.Dispose()
    $stream.Dispose()
    $page.Dispose()

    Write-Output "Rendered $outFile"
}

Write-Output "DONE"
