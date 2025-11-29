#!/bin/bash

현재 Figma Make의 파일들을 출력
echo "=== QuotationPage.tsx ===" > /tmp/document_files.txt
cat /components/QuotationPage.tsx >> /tmp/document_files.txt

echo "\n\n=== PurchaseOrderPage.tsx ===" >> /tmp/document_files.txt
cat /components/PurchaseOrderPage.tsx >> /tmp/document_files.txt  

echo "\n\n=== TransactionStatementPage.tsx ===" >> /tmp/document_files.txt
cat /components/TransactionStatementPage.tsx >> /tmp/document_files.txt

echo "파일들이 /tmp/document_files.txt에 저장되었습니다."
open /tmp/document_files.txt
