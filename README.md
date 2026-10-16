# SYNERY Short URL System

ระบบออกแบบและพัฒนา Short URL สำหรับทดสอบตำแหน่ง Developer (SYNERY CORPORATION)

- **Live URL:** [https://synerrytest-short-url.vercel.app](https://synerrytest-short-url.vercel.app)
- **Repository:** [https://github.com/Peerapat2256/synerrytest_Short_URL-](https://github.com/Peerapat2256/synerrytest_Short_URL-)

---

## ฟังก์ชันการทำงานหลัก

1. **สร้าง Short URL:** แปลง Full URL เป็นรหัสสั้น (Base62) พร้อมตรวจสอบความถูกต้องของ URL
2. **Redirect ไปยัง URL ต้นแบบ:** เมื่อเปิดใช้งาน Short URL ระบบจะค้นหาข้อมูลและทำการ HTTP 302 Redirect ไปยัง URL ต้นทาง
3. **สร้าง QR Code:** สร้าง QR Code ของแต่ละ Short URL สำหรับสแกนเข้าถึงเว็บไซต์ต้นทาง พร้อมปุ่มดาวน์โหลดไฟล์ PNG
4. **เก็บประวัติและสถิติการคลิก:** แสดงรายการประวัติ URL ที่สร้างทั้งหมด สถิติจำนวนครั้งที่คลิก และประวัติการคลิกเชิงลึก (IP Address, User Agent, Referer, วันเวลาที่คลิก)
5. **ฟังก์ชันเพิ่มเติม:**
   - กำหนดชื่อลิงก์สั้นด้วยตัวเอง (Custom Alias)
   - กำหนดวันหมดอายุของลิงก์ (Expiration Date)

---

## 1. Data Flow Diagram (DFD Level 0)

```mermaid
flowchart TD
    User([ผู้ใช้งานทั่วไป])

    subgraph System ["0.0 ระบบ Short URL และจัดการสถิติ"]
        P1["สร้าง Short URL และ QR Code"]
        P2["ตรวจสอบและ Redirect ลิงก์"]
        P3["จัดการประวัติและสถิติการคลิก"]
    end

    D1[(D1: urls)]
    D2[(D2: click_logs)]

    User -->|ข้อมูล Full URL / Custom Alias / วันหมดอายุ| P1
    P1 -->|บันทึกข้อมูล URL| D1
    P1 -->|ผลลัพธ์ Short URL และรูปภาพ QR Code| User

    User -->|เปิดลิงก์ Short URL / สแกน QR Code| P2
    D1 -->|ค้นหา Full URL| P2
    P2 -->|HTTP 302 Redirect ไปยัง URL ปลายทางจริง| User
    P2 -->|บันทึกประวัติการคลิก| D2

    User -->|คำขอเรียกดูประวัติและสถิติการใช้งาน| P3
    D1 -->|รายการ URL ทั้งหมด| P3
    D2 -->|ข้อมูลสถิติการคลิก| P3
    P3 -->|รายการประวัติ URL และจำนวนคลิก| User
```

*(ไฟล์ต้นฉบับ draw.io: `dfd_level_0.drawio`)*

---

## 2. Database Design (ER Diagram)

ใช้ฐานข้อมูล **MySQL (TiDB Cloud)** แบ่งออกเป็น 2 ตารางหลัก (`urls` และ `click_logs`) ความสัมพันธ์แบบ One-to-Many (1:N):

```mermaid
erDiagram
    URLS ||--o{ CLICK_LOGS : "has (1:N)"

    URLS {
        int id PK
        text original_url
        varchar short_code UK
        varchar title
        int click_count
        datetime created_at
        datetime expires_at
    }

    CLICK_LOGS {
        int id PK
        int url_id FK
        varchar ip_address
        text user_agent
        text referer
        datetime clicked_at
    }
```

*(ไฟล์ต้นฉบับ draw.io: `er_diagram.drawio`)*

---

## 3. Architecture Diagram

```mermaid
flowchart LR
    Client([Web Browser / Mobile]) --> Gateway[API / Redirect Router]

    subgraph Application_Layers ["Layered Architecture (Nuxt Nitro)"]
        Gateway --> Controller["Controller Layer\n(server/api & middleware)"]
        Controller --> Service["Service Layer\n(server/service)"]
        Service --> Repository["Repository Layer\n(server/repository)"]
    end

    Repository --> DB[(MySQL Database - TiDB Cloud)]
```

---

## 4. โครงสร้างโปรเจกต์ (Layered Architecture)

```text
synerry-shorturl/
├── app/                              # Frontend (Vue 3 / Nuxt)
│   ├── assets/css/main.css           # Tailwind CSS
│   ├── layouts/default.vue           # Layout หลักและ Navbar
│   ├── model/url.model.ts            # โครงสร้างข้อมูล Model ฝั่ง Frontend
│   ├── pages/index.vue               # หน้าเพจหลัก
│   └── app.vue                       # Root Component
│
├── server/                           # Backend (Node.js / Nitro)
│   ├── api/                          # Controller Layer (REST API)
│   │   ├── shorten.post.ts           # POST /api/shorten
│   │   ├── urls.get.ts               # GET /api/urls
│   │   └── urls/
│   │       ├── [id].delete.ts        # DELETE /api/urls/:id
│   │       └── [id]/logs.get.ts      # GET /api/urls/:id/logs
│   ├── middleware/
│   │   └── redirect.ts               # Redirect Handler (GET /:code)
│   ├── controller/dto/
│   │   └── url.dto.ts                # Data Transfer Objects
│   ├── service/
│   │   └── url.service.ts            # Business Logic Layer
│   ├── repository/
│   │   ├── dbconnect.ts              # Database Connection
│   │   └── url.repository.ts         # Data Access Layer (SQL Queries)
│   ├── model/
│   │   ├── url.model.ts              # Entity Model ตาราง urls
│   │   └── clickLog.model.ts         # Entity Model ตาราง click_logs
│   └── utils/
│       ├── container.ts              # Dependency Injection
│       └── urlHelper.ts              # URL Validation & Code Generator
```

---

## 5. วิธีการติดตั้งและรันโปรเจกต์

1. **Clone Repository**
   ```bash
   git clone https://github.com/Peerapat2256/synerrytest_Short_URL-.git
   cd synerrytest_Short_URL-
   ```

2. **ติดตั้ง Dependencies**
   ```bash
   npm install
   ```

3. **ตั้งค่า Environment Variables**
   สร้างไฟล์ `.env` ที่ root directory:
   ```env
   DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
   DB_PORT=4000
   DB_USERNAME=3NQ7BdWo4atCyZj.root
   DB_PASSWORD=KkJ21lQQvI0TG00S
   DB_DATABASE=test
   ```

4. **รันโหมดพัฒนา (Development)**
   ```bash
   npm run dev
   ```
   เข้าใช้งานที่ `http://localhost:3000`

5. **Build สำหรับใช้งานจริง (Production)**
   ```bash
   npm run build
   node .output/server/index.mjs
   ```
