#!/bin/bash

# Fix All Syntax Errors Script
# Tüm optional chaining syntax hatalarını düzeltir
#
# Created: 2025-11-09
# Purpose: Kalıcı syntax düzeltmesi

set -e

echo "================================================"
echo "SYNTAX HATALARI TEMİZLİYOR"
echo "================================================"
echo ""

cd "$(dirname "$0")/.."

echo "1. server/src dizinini tarıyor..."
cd server

# Fix all "? ." patterns
find src -name "*.js" -type f -exec sed -i '' 's/\? \./\?./g' {} \;
find src -name "*.js" -type f -exec sed -i '' 's/ \. \?/\?./g' {} \;

echo "2. Syntax kontrolü yapılıyor..."
ERROR_COUNT=0
for file in $(find src -name "*.js" -type f); do
    if ! node --check "$file" 2>/dev/null; then
        echo "❌ Syntax error: $file"
        node --check "$file"
        ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
done

echo ""
echo "================================================"
if [ $ERROR_COUNT -eq 0 ]; then
    echo "✅ TÜM SYNTAX HATALARI TEMİZLENDİ"
    echo "================================================"
    exit 0
else
    echo "❌ $ERROR_COUNT dosyada hala hata var"
    echo "================================================"
    exit 1
fi

