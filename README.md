# 🕓 10-Hour Time — Web Prototype

## Concept

This project implements a **custom time system** where  
a day = 10 hours, an hour = 100 minutes, a minute = 100 seconds.  
Each “new-second” lasts **0.864 SI seconds**, so one full custom day equals exactly 24 Earth hours (86 400 s).

This prototype is designed as both a **functional web clock** and a **foundation for a future Apple Watch app**.

---

## 🧮 Time System Overview

| Quantity | Value | Relation |
|-----------|--------|-----------|
| Hours per day | 10 | |
| Minutes per hour | 100 | |
| Seconds per minute | 100 | |
| New second length | 0.864 s (real seconds) | 100 000 × 0.864 = 86 400 s = 1 Earth day |

### Conversion formula

Let  
`t_real` = current UNIX time in seconds (UTC).  

Then

SCALE = 100000 / 86400 // ≈ 1.157407407
seconds_today_real = t_real % 86400
custom_seconds_today = seconds_today_real * SCALE

Derive:

H = floor(custom_seconds_today / 10000) // 0–9
M = floor((custom_seconds_today % 10000) / 100) // 0–99
S = floor(custom_seconds_today % 100) // 0–99


Display format: `HH : MM : SS`

---

## 💻 Web Prototype Goals

1. **Display custom time numerically** (`HH:MM:SS`) updated every 0.864 s.  
2. **Optional analog mode** with animated SVG hands.  
3. **Accurate sync to real time** (no drift; always recomputed from UNIX time).  
4. **Clean modular structure** so logic can later be reused in SwiftUI for watchOS.

---

## 📂 Suggested File Structure

/10hour-time
├── index.html
├── style.css
├── script.js
├── assets/
│ ├── clock_face.svg
│ ├── hour_hand.svg
│ ├── minute_hand.svg
│ └── second_hand.svg
└── README.md


---

## 🧠 Implementation Notes

### 1. Time logic (`script.js`)
- Compute current UTC seconds since midnight.  
- Apply scaling factor `SCALE = 100000/86400`.  
- Update display every `864 ms`.  
- Recompute directly from system time instead of accumulating elapsed intervals.

### 2. Animation
- Use **SVG** for precision and easy design import (e.g., from Illustrator or Figma).  
- Animate rotation via `requestAnimationFrame`:  
  - Hour hand → `(H + M/100 + S/10000) / 10 × 360°`  
  - Minute hand → `(M + S/100) / 100 × 360°`  
  - Second hand → `S / 100 × 360°`  
- Smooth motion by interpolating between real time fractions.

### 3. Design integration
- Replace placeholder SVGs with your own artwork.  
- Keep rotation pivot at SVG center for each hand.  
- Add CSS variables for themes (light/dark).

### 4. Responsiveness
- Scale SVG to viewport width.  
- Offer toggle between **numeric view** and **analog view** (click/tap).

### 5. Accuracy tests
- Verify that `09:99:99` rolls over cleanly to `00:00:00`.  
- Compare displayed custom seconds with computed formula every few minutes.  
- Test midnight UTC rollover.

