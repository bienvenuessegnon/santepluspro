#!/bin/bash

# Start the server in background
npm start &
SERVER_PID=$!
sleep 3

echo "=== Testing New Payment & Document Endpoints ==="
echo

# Test 1: Create a patient
echo "1. Creating patient profile..."
PATIENT_EMAIL="test_patient@example.com"
curl -s -X POST http://localhost:3000/api/wallet/patients \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$PATIENT_EMAIL\",\"name\":\"Test Patient\",\"walletBalance\":15000,\"satoshiBalance\":20000}" | jq .

echo
echo "2. Creating medical document (Doctor creates)..."
DOC_RESPONSE=$(curl -s -X POST http://localhost:3000/api/medical-documents \
  -H "Content-Type: application/json" \
  -d '{
    "patientNpi":"1234567890",
    "title":"Ordonnance - Consultation",
    "type":"prescription",
    "items":[{"name":"Amoxicilline 500mg","qty":1,"priceXOF":2500}],
    "priceXOF":2500,
    "priceSats":4165,
    "doctorName":"Dr. Sossou",
    "doctorEmail":"doctor@hospital.bj",
    "hospitalName":"Hôpital de Zone",
    "notes":"3x par jour pendant 7 jours"
  }')
echo "$DOC_RESPONSE" | jq .
DOC_ID=$(echo "$DOC_RESPONSE" | jq -r '.id')

echo
echo "3. Doctor sends document to patient with payment reference..."
curl -s -X POST "http://localhost:3000/api/medical-documents/$DOC_ID/send-to-patient" \
  -H "Content-Type: application/json" \
  -d "{
    \"patientEmail\":\"$PATIENT_EMAIL\",
    \"attachmentType\":\"prescription\",
    \"invoiceTotal\":2500,
    \"paymentReference\":\"REF-2500-XOF-001\",
    \"paymentQrCode\":\"data:image/png;base64,iVBORw0KGgo...\"
  }" | jq .

echo
echo "4. Patient receives notification of sent documents..."
curl -s -X GET "http://localhost:3000/api/patient/received-documents/$PATIENT_EMAIL" | jq .

echo
echo "5. Request blockchain anchor for document integrity..."
curl -s -X POST "http://localhost:3000/api/documents/$DOC_ID/request-blockchain-anchor" \
  -H "Content-Type: application/json" \
  -d '{"contentHash":"abc123"}' | jq .

echo
echo "6. Check blockchain anchor status..."
sleep 2
curl -s -X GET "http://localhost:3000/api/documents/$DOC_ID/anchor-status" | jq .

echo
echo "7. Verify document integrity..."
curl -s -X POST "http://localhost:3000/api/documents/$DOC_ID/verify-integrity" \
  -H "Content-Type: application/json" \
  -d '{"providedHash":"abc123"}' | jq .

echo
echo "=== Tests Complete ==="

# Kill server
kill $SERVER_PID 2>/dev/null || true
