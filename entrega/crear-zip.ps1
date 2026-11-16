# Genera entrega/enlaces.zip con el archivo de enlaces, listo para subir a la tarea.
$aqui = Split-Path -Parent $MyInvocation.MyCommand.Path
Compress-Archive -Path (Join-Path $aqui "enlaces.txt") -DestinationPath (Join-Path $aqui "enlaces.zip") -Force
Write-Host "Creado: $(Join-Path $aqui 'enlaces.zip')"
