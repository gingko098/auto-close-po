Auto Close PO + Accrual Adjustment System

📋 Overview
Sebuah solusi NetSuite yang mengotomatiskan penutupan Purchase Order (PO) dan penyesuaian akuntansi accrual (GR/IR) secara end-to-end. Sistem ini menggabungkan User Event Script dan Map/Reduce Script untuk menciptakan workflow yang sepenuhnya otomatis.

🏗️ Architecture

┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│   UE Script     │    │   MR Script      │    │  Journal Entry     │
│   (Trigger)     │ →  │   (Processor)    │ →  │  (Adjustment)      │
└─────────────────┘    └──────────────────┘    └────────────────────┘

📁 Script Structure
1. User Event Script (ue_detect_po_fully_billed.js)
Type: User Event Script

Deployment: Pada record Purchase Order

Function: Mendeteksi perubahan status PO ke "Fully Billed"

2. Map/Reduce Script (mr_auto_close_processor.js)
Type: Map/Reduce Script

Schedule: Harian atau sesuai kebutuhan

Function: Batch processing PO + accrual adjustment

3. Scheduled Script (sched_auto_close_trigger.js) - Optional
Type: Scheduled Script

Schedule: Daily

Function: Trigger MR script execution

🚀 Installation & Setup
Prerequisites
NetSuite Account dengan permission SuiteScript

Access ke Custom Records dan Fields

Knowledge dasar SuiteScript 2.1

Step 1: Create Custom Fields

// Custom Field 1: Ready for Auto Close
Label: Ready for Auto Close
ID: custbody_ready_for_auto_close
Type: Checkbox
Applies To: Purchase Order

// Custom Field 2: Auto Close Date
Label: Auto Close Date  
ID: custbody_auto_close_date
Type: Date
Applies To: Purchase Order

// Custom Field 3: Auto Close Processed
Label: Auto Close Processed
ID: custbody_auto_close_processed
Type: Checkbox
Applies To: Purchase Order

Step 2: Deploy Scripts
User Event Script Deployment
// Deployment Details:
Target Record: Purchase Order
Status: Released
Event Types: beforeSubmit
Log Level: Debug

Map/Reduce Script Deployment
// Deployment Details:
Status: Released
Script Type: Map/Reduce
Schedule: Custom (sesuai kebutuhan)

⚙️ Configuration
Account Mapping
Update account IDs di MR script:
function getAccrualAccountId(subsidiaryId) {
    // Ganti dengan GR/IR account ID yang sesuai
    return 123; // Contoh: GR/IR Account ID
}

function getExpenseAccountId(subsidiaryId) {
    // Ganti dengan expense account ID yang sesuai  
    return 456; // Contoh: Expense Account ID
}

Email Configuration
Update recipient email di MR script:
email.send({
    recipients: 'abc@company.com', // Update dengan email yang sesuai
    // ... lainnya
});

🔧 Customization
Modify Search Filters
Sesuaikan search criteria di MR script getInputData():
filters: [
    ['status', 'is', 'F'], // Fully Billed
    'AND',
    ['custbody_ready_for_auto_close', 'is', 'T'],
    'AND', 
    ['mainline', 'is', 'F'],
    'AND',
    ['closed', 'is', 'F'] // Not already closed
]

Adjust Processing Logic
Modify calculateAccrualAmount() untuk business rules yang berbeda:
// Current: Total Received - Total Billed
// Customize sesuai kebutuhan accrual policy


🧪 Testing
Test Scenario 1: Basic PO Closure
// Input: PO dengan status Fully Billed
// Expected: PO tertutup, no JE created (jika accrual = 0)

Test Scenario 2: PO dengan Accrual
// Input: PO dengan Item Receipt > Vendor Bill
// Expected: PO tertutup + JE adjustment created

Test Scenario 3: Error Handling
// Input: PO dengan data corrupt
// Expected: Error logged, process continues dengan PO lainnya

📊 Monitoring & Logging
Key Metrics to Monitor
Success Rate: % PO berhasil diproses

Processing Time: Average waktu processing per PO

Accrual Amount: Total adjustment yang dibuat

Error Count: Jumlah failure dan penyebab

Log Analysis
// Sample log query
System Notes > Scripted Record Update
Saved Search > Script Execution Log


🚨 Troubleshooting
Common Issues
Issue 1: PO Tidak Terproses
Solution:

Check custom field custbody_ready_for_auto_close

Verify PO status = "Fully Billed"

Check script deployment status

Issue 2: JE Tidak Terbuat
Solution:

Validate account IDs di configuration

Check user permissions untuk create JE

Verify accrual amount > 0

Issue 3: Performance Issues
Solution:

Adjust batch size di MR script

Schedule di off-peak hours

Monitor system usage


📈 Performance Optimization
Best Practices
Batch Size: Process 100-500 PO per execution

Schedule: Run during non-peak hours

Monitoring: Set up alert untuk failed executions

Maintenance: Regular review of success rates

Scaling Considerations
Untuk volume tinggi (>1000 PO/hari), consider multiple scheduled executions

Monitor system limits (governance units)

Implement queue system jika diperlukan

🔒 Security & Compliance
Permission Requirements
Lists > Purchase Orders: View, Edit

Transactions > Journal Entries: Create

Setup > Custom Records: View, Edit

Reports > SuiteScript Debug Log: View

Audit Trail
Semua perubahan tercatat di System Notes

JE reference disimpan di PO custom fields

Detailed execution logs tersedia

🔒 Security & Compliance
Permission Requirements
Lists > Purchase Orders: View, Edit

Transactions > Journal Entries: Create

Setup > Custom Records: View, Edit

Reports > SuiteScript Debug Log: View

Audit Trail
Semua perubahan tercatat di System Notes

JE reference disimpan di PO custom fields

Detailed execution logs tersedia

🤝 Support
Documentation
NetSuite API Documentation

SuiteScript 2.1 Reference

Contact
Untuk pertanyaan teknis atau support, hubungi:

Developer: Fahri Jummadil Iqram Selayan

Email: fahri.selayan98@gmail.com

📄 License
Copyright (c) 2025. All rights reserved.