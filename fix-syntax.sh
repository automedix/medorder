#!/bin/bash
# Fix alle className + style Syntaxfehler

files=(
  "src/app/dashboard/page.tsx"
  "src/app/admin/page.tsx"
  "src/app/orders/page.tsx"
  "src/app/patients/page.tsx"
  "src/app/order/new/page.tsx"
  "src/app/admin/orders/page.tsx"
  "src/app/admin/prices/page.tsx"
  "src/app/admin/products/ProductsClient.tsx"
)

for file in "${files[@]}"; do
  echo "Fixing $file..."
  # Fix: className="... style={{...}}" -> className="..." style={{...}}
  sed -i 's/className="min-h-screen style={{backgroundColor/className="min-h-screen" style={{backgroundColor/g' "$file" 2>/dev/null
  sed -i 's/hover:style={{backgroundColor/hover:bg-blue-100/g' "$file" 2>/dev/null
  sed -i 's/p-3 style={{backgroundColor/p-3 bg-blue-50/g' "$file" 2>/dev/null
  sed -i 's/p-6 style={{backgroundColor/p-6 bg-blue-50/g' "$file" 2>/dev/null
  sed -i 's/className="border-t border-gray-200 p-6 style={{backgroundColor/className="border-t border-gray-200 p-6 bg-blue-50/g' "$file" 2>/dev/null
done

echo "Done!"
