# 🚀 Auto Close PO + Accrual Adjustment System
---
## 📋 Overview

Solusi NetSuite untuk mengotomatiskan penutupan Purchase Order (PO) dan melakukan penyesuaian akuntansi accrual (GR/IR) secara end-to-end.
Menggabungkan User Event Script + Map/Reduce Script untuk menciptakan workflow yang sepenuhnya otomatis.

---
## 🏗️ Architecture

┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│   UE Script     │ →  │   MR Script      │ →  │  Journal Entry     │
│   (Trigger)     │    │   (Processor)    │    │  (Adjustment)      │
└─────────────────┘    └──────────────────┘    └────────────────────┘

---
## 📁 Script Structure

1. User Event (ue_detect_po_fully_billed.js)

      - Detect perubahan status PO ke Fully Billed.

      - Deployment: record Purchase Order.

2. Map/Reduce (mr_auto_close_processor.js)

      - Batch processing PO + accrual adjustment.

      - Schedule: Harian / sesuai kebutuhan.

3. Scheduled Script (sched_auto_close_trigger.js) [Opsional]

      - Trigger MR script execution secara otomatis.
---
## ⚙️ Installation & Setup
## 🔑 Prerequisites
  - NetSuite Account dengan izin SuiteScript
  - Akses Custom Records & Fields
  - Pengetahuan dasar SuiteScript 2.1

## 🛠️ Custom Fields
  - `custbody_ready_for_auto_close` → Checkbox (PO)
  - `custbody_auto_close_date` → Date (PO)
  - `custbody_auto_close_processed` → Checkbox (PO)

## 📂 Deployment
  - UE Script → Purchase Order, event beforeSubmit.
  - MR Script → Released, schedule sesuai kebutuhan.
---
## 🔧 Configuration
Account Mapping:
```
function getAccrualAccountId(subsidiaryId) { 
    return 123; 
}
function getExpenseAccountId(subsidiaryId) { 
    return 456; 
}
```
Email Notification:
```
email.send({
  recipients: 'abc@company.com',
  subject: 'Auto Close PO Result'
});
```
---
## 🧪 Testing
  1. Basic PO Closure → Fully Billed → PO closed, no JE.
  2. PO with Accrual → Item Receipt > Vendor Bill → PO closed + JE created.
  3. Error Handling → Corrupt data → Error logged, process lanjut ke PO lain.
---
## 📊 Monitoring & Logging
  - Key Metrics: Success Rate, Processing Time, Accrual Amount, Error Count.
  - Log Source: System Notes, Script Execution Log, Saved Search.

---

## 🚨 Troubleshooting
  - PO tidak terproses → cek field `custbody_ready_for_auto_close` & status PO.
  - JE tidak terbentuk → cek account ID & izin create JE.
  - Lambat → kecilkan batch size, schedule off-peak.
---
## 📈 Performance Tips
  - Batch size: 100–500 PO.
  - Jalankan saat non-peak hours.
  - Monitor error & governance usage.
  - Untuk >1000 PO/hari → multiple execution / queue system.
---
## 🤝 Support
  - Docs: NetSuite API + SuiteScript 2.1 Reference
  - Contact:
      👨‍💻 Developer: Fahri Jummadil Iqram Selayan
      📧 Email: fahri.selayan98@gmail.com
---
## 📄 License
© 2025 Fahri Jummadil Iqram Selayan. All rights reserved.
