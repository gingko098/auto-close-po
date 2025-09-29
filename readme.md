🚀 Auto Close PO + Accrual Adjustment System

📋 Overview

Solusi NetSuite untuk mengotomatiskan penutupan Purchase Order (PO) dan melakukan penyesuaian akuntansi accrual (GR/IR) secara end-to-end.
Menggabungkan User Event Script + Map/Reduce Script untuk menciptakan workflow yang sepenuhnya otomatis.

🏗️ Architecture

┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│   UE Script     │ →  │   MR Script      │ →  │  Journal Entry     │
│   (Trigger)     │    │   (Processor)    │    │  (Adjustment)      │
└─────────────────┘    └──────────────────┘    └────────────────────┘
