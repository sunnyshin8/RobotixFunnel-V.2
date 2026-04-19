# Second pass: Fix remaining dark-theme classes
# Target all tsx/ts files recursively

$paths = @(
    "G:\AItron\frontend\src\modules",
    "G:\AItron\frontend\src\app"
)

$replacements = @{
    'bg-dark-900/80'                    = 'bg-white'
    'bg-dark-900/70'                    = 'bg-white/90'
    'bg-dark-900'                       = 'bg-gray-50'
    'bg-dark-800/50'                    = 'bg-white'
    'bg-dark-800/30'                    = 'bg-white'
    'bg-dark-800/80'                    = 'bg-white'
    'bg-dark-800'                       = 'bg-white'
    'bg-dark-700/50'                    = 'bg-gray-100'
    'bg-dark-700/30'                    = 'bg-gray-50'
    'bg-dark-700'                       = 'bg-gray-100'
    'bg-dark-600'                       = 'bg-gray-200'
    'bg-dark-500'                       = 'bg-gray-300'
    'text-dark-200'                     = 'text-gray-700'
    'text-dark-300'                     = 'text-gray-600'
    'text-dark-400'                     = 'text-gray-500'
    'text-dark-500'                     = 'text-gray-400'
    'text-dark-600'                     = 'text-gray-300'
    'text-dark-700'                     = 'text-gray-200'
    'border-dark-500'                   = 'border-gray-300'
    'border-dark-600/50'                = 'border-gray-200'
    'border-dark-600'                   = 'border-gray-200'
    'border-dark-700'                   = 'border-gray-200'
    'border-dark-800'                   = 'border-gray-200'
    'divide-dark-700/50'                = 'divide-gray-100'
    'divide-dark-700'                   = 'divide-gray-200'
    'divide-dark-600'                   = 'divide-gray-200'
    'hover:bg-dark-700/50'              = 'hover:bg-gray-50'
    'hover:bg-dark-700/30'              = 'hover:bg-gray-50'
    'hover:bg-dark-700'                 = 'hover:bg-gray-100'
    'hover:bg-dark-600'                 = 'hover:bg-gray-200'
    'hover:bg-dark-500'                 = 'hover:bg-gray-300'
    'hover:text-dark-200'               = 'hover:text-gray-700'
    'hover:border-dark-500'             = 'hover:border-gray-300'
    'hover:border-dark-400'             = 'hover:border-gray-400'
    'hover:border-dark-600'             = 'hover:border-gray-300'
    'active:bg-dark-600'                = 'active:bg-gray-200'
    'active:bg-dark-500'                = 'active:bg-gray-300'
    'focus:border-dark-500'             = 'focus:border-blue-500'
    'placeholder-dark-400'              = 'placeholder-gray-400'
    'placeholder-dark-500'              = 'placeholder-gray-400'
    'ring-dark-600'                     = 'ring-gray-200'
    'ring-dark-700'                     = 'ring-gray-200'
    'disabled:text-dark-500'            = 'disabled:text-gray-400'
    'disabled:text-dark-600'            = 'disabled:text-gray-300'
    'text-primary-400'                  = 'text-blue-600'
    'text-primary-500'                  = 'text-blue-600'
    'bg-primary-500/20'                 = 'bg-blue-100'
    'bg-primary-500/10'                 = 'bg-blue-50'
    'bg-primary-500/30'                 = 'bg-blue-100'
    'bg-primary-500'                    = 'bg-blue-600'
    'bg-primary-600'                    = 'bg-blue-700'
    'bg-primary-700'                    = 'bg-blue-800'
    'border-primary-500/50'             = 'border-blue-300'
    'border-primary-500/30'             = 'border-blue-200'
    'border-primary-500'                = 'border-blue-500'
    'border-primary-400'                = 'border-blue-500'
    'hover:text-primary-400'            = 'hover:text-blue-600'
    'hover:text-primary-500'            = 'hover:text-blue-600'
    'hover:bg-primary-500/10'           = 'hover:bg-blue-50'
    'hover:bg-primary-500/20'           = 'hover:bg-blue-50'
    'hover:bg-primary-600'              = 'hover:bg-blue-700'
    'hover:bg-primary-500'              = 'hover:bg-blue-600'
    'hover:border-primary-500/50'       = 'hover:border-blue-300'
    'hover:border-primary-500'          = 'hover:border-blue-400'
    'hover:shadow-primary-500/20'       = 'hover:shadow-blue-200'
    'hover:shadow-primary-500/30'       = 'hover:shadow-blue-200'
    'focus:border-primary-500'          = 'focus:border-blue-500'
    'focus:ring-primary-500/20'         = 'focus:ring-blue-500/20'
    'focus:ring-primary-500'            = 'focus:ring-blue-500'
    'active:text-primary-400'           = 'active:text-blue-600'
    'group-hover:text-primary-400'      = 'group-hover:text-blue-600'
    'group-hover:bg-primary-500/10'     = 'group-hover:bg-blue-50'
    'group-hover:border-primary-500/30' = 'group-hover:border-blue-200'
    'group-hover:border-primary-500/50' = 'group-hover:border-blue-300'
    'group-hover:border-primary-500'    = 'group-hover:border-blue-300'
    'group-hover:shadow-primary-500/20' = 'group-hover:shadow-blue-200'
    'from-primary-500'                  = 'from-blue-500'
    'from-primary-600'                  = 'from-blue-600'
    'to-primary-600'                    = 'to-blue-600'
    'to-primary-700'                    = 'to-blue-700'
    'hover:from-primary-600'            = 'hover:from-blue-600'
    'hover:to-primary-700'              = 'hover:to-blue-700'
    'active:from-primary-700'           = 'active:from-blue-700'
    'active:to-primary-800'             = 'active:to-blue-800'
    'border-t-primary-500'              = 'border-t-blue-500'
    'prose-invert'                      = 'prose'
    'from-dark-900/80'                  = 'from-white/60'
    'from-dark-900'                     = 'from-gray-50'
    'from-dark-800'                     = 'from-white'
    'bg-neon-purple'                    = 'bg-blue-600'
    'text-neon-cyan'                    = 'text-blue-600'
    'text-neon-purple'                  = 'text-blue-600'
    'border-neon-purple'                = 'border-blue-500'
}

# Process longer patterns first to avoid partial matches
$sortedKeys = $replacements.Keys | Sort-Object { $_.Length } -Descending

$filesModified = 0

foreach ($basePath in $paths) {
    $files = Get-ChildItem -Path $basePath -Recurse -File | Where-Object { $_.Extension -eq ".tsx" -or $_.Extension -eq ".ts" }
    
    foreach ($file in $files) {
        try {
            $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
            $content = [System.Text.Encoding]::UTF8.GetString($bytes)
        }
        catch {
            Write-Host "  SKIP (read error): $($file.FullName)"
            continue
        }
        
        if ($content -notmatch 'dark-|primary-|neon-|prose-invert') {
            continue
        }
        
        $original = $content
        
        foreach ($key in $sortedKeys) {
            $content = $content.Replace($key, $replacements[$key])
        }
        
        if ($content -ne $original) {
            [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
            $filesModified++
            Write-Host "  Modified: $($file.FullName.Replace('G:\AItron\frontend\', ''))"
        }
    }
}

Write-Host ""
Write-Host "=== DONE ==="
Write-Host "Files modified: $filesModified"
