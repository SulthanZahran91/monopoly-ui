# Keliling UI — Complete Project Documentation
DON'T FORGET TO READ AGENTS.MD AND TECHNICAL_DOCUMENTS.MD
> **Monopoly-style web game themed around Universitas Indonesia**
> 
> "Kuasai kampus, taklukkan fakultas!"

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Development Roadmap](#3-development-roadmap)
4. [Theme Configuration](#4-theme-configuration)
5. [Board Data](#5-board-data)
6. [Cards Data](#6-cards-data)
7. [Game Mechanics](#7-game-mechanics)
8. [UI/UX Design](#8-uiux-design)
9. [Asset Checklist](#9-asset-checklist)
10. [Feature List](#10-feature-list)
11. [File Structure](#11-file-structure)
12. [Technical Specifications](#12-technical-specifications)

---

# 1. Project Overview

## Game Identity

| Property | Value |
|----------|-------|
| **Name** | Keliling UI |
| **Tagline** | Kuasai kampus, taklukkan fakultas! |
| **Type** | Online multiplayer board game |
| **Theme** | Universitas Indonesia |
| **Platform** | Web (mobile-first, responsive) |
| **Players** | 2-6 players |
| **Tech Stack** | React (frontend) + Rust (backend) |

## Core Concept

A Monopoly-style game where:
- **Properties** = UI Faculties & Majors
- **Color Groups** = 8 Faculties (FMIPA, FIB, FISIP, FH, FEB, Fasilkom, FT, FK)
- **Railroads** = Campus landmarks (Stasiun UI, Bikun, Gerbang Utama, Balairung)
- **Utilities** = Campus facilities (Perpustakaan UI, Danau UI)
- **Chance Cards** = SIAK-NG Cards
- **Community Chest** = BEM Cards

## Design Goals

1. **Playable ASAP** — Each milestone = friends can test
2. **Mobile-first** — Optimized for phones, scales to desktop
3. **Incremental shipping** — Stop anytime with a working game
4. **Flexible theming** — Easy to customize properties, cards, visuals

---

# 2. Architecture

> **Detailed architecture and API documentation has been moved to [technical_documents.md](./technical_documents.md).**

---

---

# 3. Development Roadmap

## Philosophy

```
┌─────────────────────────────────────────────────────────────────┐
│  Each milestone = playable game                                 │
│  Stop anytime and you have something usable                     │
│  Theme work can happen in parallel                              │
└─────────────────────────────────────────────────────────────────┘
```

## Visual Timeline

```
M0          M1          M2          M3          M4          M5          M6          M7          M8          M9
 │           │           │           │           │           │           │           │           │           │
 ▼           ▼           ▼           ▼           ▼           ▼           ▼           ▼           ▼           ▼
┌───┐      ┌───┐      ┌───┐      ┌───┐      ┌───┐      ┌───┐      ┌───┐      ┌───┐      ┌───┐      ┌───┐
│ 🔌 │ ──► │ 🎲 │ ──► │ 🏠 │ ──► │ ⊠ │ ──► │ 🔄 │ ──► │ 🏨 │ ──► │ 💀 │ ──► │ 🔨 │ ──► │ ✨ │ ──► │ 💬 │
│skel│      │dice│      │buy │      │jail│      │trade│     │build│      │bank│      │auct│      │polish│    │QoL │
└───┘      └───┘      └───┘      └───┘      └───┘      └───┘      └───┘      └───┘      └───┘      └───┘
            ▲           ▲           ▲                                           ▲
            │           │           │                                           │
      ┌─────┴───────────┴───────────┴─────┐                         ┌───────────┴───────────┐
      │     🎮 PLAYABLE WITH FRIENDS      │                         │  🎮 FULL MONOPOLY     │
      └───────────────────────────────────┘                         └───────────────────────┘
```

---

## Milestone 0: Walking Skeleton

**Goal:** Prove the whole stack works end-to-end

### Backend
- [x] Basic axum server with WebSocket endpoint
- [x] Room creation → returns room code
- [x] Room joining → broadcasts "player joined"
- [x] Simple message echo

### Frontend
- [x] Landing page (Create / Join buttons)
- [x] Join flow (name + room code input)
- [x] Waiting room (shows players in room)
- [x] WebSocket hook (connect, send, receive)
- [x] Basic state management

### Deliverable
> "Open 2 browser tabs, create room in one, join from another, see both players listed"

---

## Milestone 1: Dice & Movement

**Goal:** Players can take turns rolling and moving

### Backend
- [x] Game state struct (players, positions, current turn)
- [x] Start game action (host only)
- [x] Roll dice action → validate turn → broadcast result
- [x] Move player → update position → broadcast state
- [x] Turn rotation
- [x] Pass GO detection → add Rp 200.000
- [x] **Vote kick system:**
  - [x] Any player can initiate vote to kick another
  - [x] Majority vote required (>50% of remaining players)
  - [x] Vote timeout (30 seconds)
  - [x] Kicked player removed, assets return to Rektorat
  - [ ] Auto-kick suggestion after 60s of inactivity on turn
- [ ] **Turn timeout (optional):**
  - [ ] Configurable timer (60-180 seconds)
  - [ ] Warning at 15 seconds remaining
  - [ ] Auto-end turn or auto-kick vote on timeout

### Frontend
- [x] Game screen layout (board + players + actions)
- [x] Mini board with tokens
- [x] Dice roll button + dice overlay
- [x] Token movement animation
- [x] Player chips showing money + turn indicator
- [x] End turn button
- [x] **Vote kick UI:**
  - [x] Kick button on player chip (long press or menu)
  - [x] Vote kick modal (player name, reason, vote buttons)
  - [x] Vote progress indicator
  - [x] "Player kicked" notification
  - [ ] AFK indicator on inactive players

### Deliverable
> "3 friends join, take turns rolling, watch tokens move, collect Rp 200.000 passing Wisuda. If someone goes AFK, vote kick them and continue playing."

---

## Milestone 2: Property & Rent

**Goal:** Core economic loop works

### Backend
- [x] Property data (names, prices, rents, groups)
- [x] Ownership tracking
- [x] Buy property action → validate funds → transfer
- [x] Rent calculation (base rent)
- [x] Pay rent action → transfer money
- [ ] Decline purchase (skip for now)

### Frontend
- [x] Current tile strip
- [x] Buy button with price
- [x] Pay rent button with amount
- [x] Property ownership colors on board
- [x] Money change animations
- [x] Basic property sheet

### Deliverable
> "Land on Kedokteran, buy it, friend lands on it later, pays you rent"

---

## Milestone 3: Jail & Special Tiles

**Goal:** Full board is functional

### Backend
- [x] Jail state (in jail, turns remaining)
- [x] Go To Jail tile → send to jail
- [x] Jail escape: pay Rp 50.000 or roll doubles
- [x] Three doubles → go to jail
- [x] Tax tiles
- [x] SIAK-NG / BEM cards → random effects
- [x] Card deck management

### Frontend
- [x] Jail indicator on player chip
- [x] Jail escape UI
- [x] Card draw animation + display
- [x] Card effect toast

### Deliverable
> "Full board works — Skorsing, UKT, cards all functional"

---

## Milestone 4: Trading

**Goal:** Players can negotiate deals

### Backend
- [ ] Trade proposal (from, to, offer, request)
- [ ] Trade validation
- [ ] Accept → execute trade
- [ ] Reject → notify
- [ ] Counter-offer

### Frontend
- [ ] Trade button → select player
- [ ] Trade builder
- [ ] Incoming trade modal
- [ ] Accept / Reject / Counter buttons
- [ ] Trade notification badge

### Deliverable
> "Offer friend Ilmu Komputer + Rp 100.000 for their Kedokteran, they counter, you accept"

---

## Milestone 5: Houses & Monopolies

**Goal:** Building empire mechanics

### Backend
- [x] Monopoly detection (own full faculty)
- [x] Buy Gedung action → validate + even building
- [x] Sell Gedung action → 50% return
- [x] Building limits (32 Gedung, 12 Fakultas)
- [x] Rent scaling with buildings
- [x] Rent doubling for unimproved monopoly

### Frontend
- [x] Building indicators on board tiles
- [x] Build button in property sheet
- [x] Building count display
- [x] Monopoly highlight

### Deliverable
> "Collect all FMIPA, build 4 Gedung on Fisika, charge Rp 450.000 rent"

---

## Milestone 6: Bankruptcy & Victory

**Goal:** Games can actually end

### Backend
- [ ] Bankruptcy detection
- [ ] Bankruptcy to Rektorat → properties return unowned
- [ ] Bankruptcy to player → assets transfer
- [ ] Cuti Akademik (mortgage) → get 50% cash
- [ ] Aktif Kembali (unmortgage) → pay 110%
- [ ] Victory condition (last player standing)
- [ ] Game over state

### Frontend
- [ ] Drop Out modal
- [ ] Cuti Akademik button in property sheet
- [ ] Cuti indicator on board
- [ ] Game over screen (winner + standings)
- [ ] Play again button

### Deliverable
> "Friend goes DO paying your rent, you win, everyone sees final standings"

---

## Milestone 7: Auctions

**Goal:** Declined properties go to auction

### Backend
- [ ] Auction state
- [ ] Start auction (when property declined)
- [ ] Bid action → validate funds → update
- [ ] Pass action
- [ ] Auction end → transfer property
- [ ] Timer logic

### Frontend
- [ ] Auction overlay
- [ ] Bid controls
- [ ] Pass button
- [ ] Current bid display
- [ ] Timer countdown

### Deliverable
> "Decline Kedokteran, auction starts, friend wins it for Rp 250.000"

---

## Milestone 8: Polish & Feel

**Goal:** Actually enjoyable to play

### Sound
- [ ] Dice roll sound
- [ ] Money sounds
- [ ] Turn notification
- [ ] Property purchase
- [ ] Jail door clang
- [ ] Victory fanfare
- [ ] Sound toggle

### Animations
- [ ] Smoother token movement
- [ ] Money ticker animation
- [ ] Card flip effect
- [ ] Confetti on victory
- [ ] Button press feedback

### UX
- [x] Loading states
- [ ] Error handling + toasts
- [ ] Reconnection handling
- [ ] Connection status indicator
- [ ] Haptic feedback (mobile)

### Deliverable
> "Game feels satisfying — sounds, animations, polish"

---

## Milestone 9: Quality of Life

**Goal:** Smooth multiplayer experience

### Features
- [ ] Chat system
- [ ] Quick reactions (emoji)
- [ ] Game log (event history)
- [ ] Turn timer (optional)
- [ ] AFK detection
- [ ] Spectator mode
- [ ] Room settings (house rules)

### Deliverable
> "Chat with friends, see game history, kick AFK players"

---

## Playtest Points

| After | Invite Friends To Test |
|-------|----------------------|
| M1 | "Roll dice and move around, that's it" |
| M2 | "Buy properties, pay rent — core loop works" |
| M3 | "Full board works, real game feel" |
| M6 | "Complete game — someone can win" |
| M8 | "Polished experience" |

---

# 4. Theme Configuration

## Game Identity

```typescript
const GAME_IDENTITY = {
  name: 'Keliling UI',
  tagline: 'Kuasai kampus, taklukkan fakultas!',
  version: '1.0.0',
  centerImage: 'makara',
  centerText: 'KELILING UI',
};
```

## Player Tokens

| ID | Name | Emoji | Description |
|----|------|-------|-------------|
| jas | Jas Almamater | 🧥 | Jas kuning kebanggaan mahasiswa UI |
| laptop | Laptop | 💻 | Senjata utama anak Fasilkom |
| buku | Buku Tebal | 📚 | Referensi wajib anak FH |
| sepeda | Sepeda | 🚲 | Kendaraan eco-friendly keliling kampus |
| kopi | Gelas Kopi | ☕ | Bahan bakar mahasiswa tingkat akhir |
| stetoskop | Stetoskop | 🩺 | Identitas anak FK |
| kalkulator | Kalkulator | 🔢 | Andalan anak FMIPA dan FEB |
| helm | Helm | ⛑️ | Safety first ala anak FT |

## Player Colors

| ID | Name | Hex | Tailwind |
|----|------|-----|----------|
| kuning | Kuning UI | #F7B217 | bg-yellow-500 |
| biru | Biru | #3B82F6 | bg-blue-500 |
| merah | Merah | #EF4444 | bg-red-500 |
| hijau | Hijau | #22C55E | bg-green-500 |
| ungu | Ungu | #A855F7 | bg-purple-500 |
| oranye | Oranye | #F97316 | bg-orange-500 |

## Buildings

| Level | Name | Icon | Description |
|-------|------|------|-------------|
| 1-4 | Gedung | 🏛️ | Gedung perkuliahan |
| 5 (Hotel) | Fakultas | 🏫 | Gedung fakultas lengkap |

## Corner Tiles

| Position | Name | Icon | Description |
|----------|------|------|-------------|
| GO | Wisuda | 🎓 | Terima Rp 200.000 setiap melewati |
| Jail | Skorsing | ⛔ | Skorsing akademik |
| Free Parking | Pusgiwa | 🅿️ | Pusat Kegiatan Mahasiswa |
| Go To Jail | Sanksi Akademik | ⚠️ | Langsung ke Skorsing! |

## UI-Themed Terminology

| Standard | Keliling UI |
|----------|-------------|
| Your turn | Giliran kamu |
| Roll dice | Lempar dadu |
| End turn | Selesai giliran |
| Salary | Gaji wisuda |
| Rent | Biaya fasilitas |
| Buy | Beli |
| Auction | Lelang |
| Mortgage | Cuti Akademik |
| Unmortgage | Aktif Kembali |
| Build house | Bangun Gedung |
| Build hotel | Upgrade ke Fakultas |
| In jail | Kena Skorsing |
| Just visiting | Berkunjung |
| Pay bail | Bayar denda |
| Get out of jail free | Kartu Bebas Skorsing |
| Bankrupt | Drop Out (DO) |
| Winner | Lulus Cumlaude! |
| Bank | Rektorat |
| Chance | SIAK-NG |
| Community Chest | BEM |
| Trade | Tukar Guling |
| Room code | Kode Ruangan |
| Create room | Buat Ruangan |
| Join | Gabung |
| Host | Ketua |
| Vote kick | Voting Keluarkan |
| AFK | Tidak aktif |
| Kick player | Keluarkan pemain |
| Vote yes | Setuju |
| Vote no | Tidak setuju |

## Game Constants

```typescript
const GAME_CONSTANTS = {
  startingMoney: 1500000,       // Rp 1.500.000
  goSalary: 200000,             // Rp 200.000
  jailBailCost: 50000,          // Rp 50.000
  maxHouses: 32,
  maxHotels: 12,
  maxPlayers: 6,
  minPlayers: 2,
  currency: 'Rp',
};
```

---

# 5. Board Data

## Faculty Groups (Property Colors)

| Color | Faculty | Full Name | Properties |
|-------|---------|-----------|------------|
| 🟤 Brown | FMIPA | Fakultas Matematika dan Ilmu Pengetahuan Alam | 2 |
| 🔵 Light Blue | FIB | Fakultas Ilmu Budaya | 3 |
| 🩷 Pink | FISIP | Fakultas Ilmu Sosial dan Ilmu Politik | 3 |
| 🟠 Orange | FH | Fakultas Hukum | 3 |
| 🔴 Red | FEB | Fakultas Ekonomi dan Bisnis | 3 |
| 🟡 Yellow | Fasilkom | Fakultas Ilmu Komputer | 3 |
| 🟢 Green | FT | Fakultas Teknik | 3 |
| 🔵 Dark Blue | FK | Fakultas Kedokteran | 2 |

## Complete Board Layout (40 Tiles)

### Bottom Row (0-10)

| ID | Name | Type | Group | Price |
|----|------|------|-------|-------|
| 0 | Wisuda | Corner (GO) | — | — |
| 1 | Matematika | Property | FMIPA | Rp 60.000 |
| 2 | BEM | Chest | — | — |
| 3 | Fisika | Property | FMIPA | Rp 60.000 |
| 4 | Bayar UKT | Tax | — | Rp 200.000 |
| 5 | Stasiun UI | Railroad | — | Rp 200.000 |
| 6 | Sastra Inggris | Property | FIB | Rp 100.000 |
| 7 | SIAK-NG | Chance | — | — |
| 8 | Arkeologi | Property | FIB | Rp 100.000 |
| 9 | Filsafat | Property | FIB | Rp 120.000 |
| 10 | Skorsing | Corner (Jail) | — | — |

### Left Column (11-19)

| ID | Name | Type | Group | Price |
|----|------|------|-------|-------|
| 11 | Ilmu Komunikasi | Property | FISIP | Rp 140.000 |
| 12 | Perpustakaan UI | Utility | — | Rp 150.000 |
| 13 | Hubungan Internasional | Property | FISIP | Rp 140.000 |
| 14 | Sosiologi | Property | FISIP | Rp 160.000 |
| 15 | Bikun | Railroad | — | Rp 200.000 |
| 16 | Hukum Perdata | Property | FH | Rp 180.000 |
| 17 | BEM | Chest | — | — |
| 18 | Hukum Pidana | Property | FH | Rp 180.000 |
| 19 | Hukum Tata Negara | Property | FH | Rp 200.000 |

### Top Row (20-30)

| ID | Name | Type | Group | Price |
|----|------|------|-------|-------|
| 20 | Pusgiwa | Corner (Free Parking) | — | — |
| 21 | Akuntansi | Property | FEB | Rp 220.000 |
| 22 | SIAK-NG | Chance | — | — |
| 23 | Manajemen | Property | FEB | Rp 220.000 |
| 24 | Ilmu Ekonomi | Property | FEB | Rp 240.000 |
| 25 | Gerbang Utama | Railroad | — | Rp 200.000 |
| 26 | Ilmu Komputer | Property | Fasilkom | Rp 260.000 |
| 27 | Sistem Informasi | Property | Fasilkom | Rp 260.000 |
| 28 | Danau UI | Utility | — | Rp 150.000 |
| 29 | Teknologi Informasi | Property | Fasilkom | Rp 280.000 |
| 30 | Sanksi Akademik | Corner (Go To Jail) | — | — |

### Right Column (31-39)

| ID | Name | Type | Group | Price |
|----|------|------|-------|-------|
| 31 | Teknik Sipil | Property | FT | Rp 300.000 |
| 32 | Teknik Elektro | Property | FT | Rp 300.000 |
| 33 | BEM | Chest | — | — |
| 34 | Teknik Mesin | Property | FT | Rp 320.000 |
| 35 | Balairung | Railroad | — | Rp 200.000 |
| 36 | SIAK-NG | Chance | — | — |
| 37 | Kedokteran Gigi | Property | FK | Rp 350.000 |
| 38 | Biaya Praktikum | Tax | — | Rp 100.000 |
| 39 | Kedokteran | Property | FK | Rp 400.000 |

## Property Rent Tables

### FMIPA (Brown)

| Property | Price | Base | 1🏛️ | 2🏛️ | 3🏛️ | 4🏛️ | 🏫 |
|----------|-------|------|-----|-----|-----|-----|-----|
| Matematika | 60k | 2k | 10k | 30k | 90k | 160k | 250k |
| Fisika | 60k | 4k | 20k | 60k | 180k | 320k | 450k |

### FIB (Light Blue)

| Property | Price | Base | 1🏛️ | 2🏛️ | 3🏛️ | 4🏛️ | 🏫 |
|----------|-------|------|-----|-----|-----|-----|-----|
| Sastra Inggris | 100k | 6k | 30k | 90k | 270k | 400k | 550k |
| Arkeologi | 100k | 6k | 30k | 90k | 270k | 400k | 550k |
| Filsafat | 120k | 8k | 40k | 100k | 300k | 450k | 600k |

### FISIP (Pink)

| Property | Price | Base | 1🏛️ | 2🏛️ | 3🏛️ | 4🏛️ | 🏫 |
|----------|-------|------|-----|-----|-----|-----|-----|
| Ilmu Komunikasi | 140k | 10k | 50k | 150k | 450k | 625k | 750k |
| Hubungan Internasional | 140k | 10k | 50k | 150k | 450k | 625k | 750k |
| Sosiologi | 160k | 12k | 60k | 180k | 500k | 700k | 900k |

### FH (Orange)

| Property | Price | Base | 1🏛️ | 2🏛️ | 3🏛️ | 4🏛️ | 🏫 |
|----------|-------|------|-----|-----|-----|-----|-----|
| Hukum Perdata | 180k | 14k | 70k | 200k | 550k | 750k | 950k |
| Hukum Pidana | 180k | 14k | 70k | 200k | 550k | 750k | 950k |
| Hukum Tata Negara | 200k | 16k | 80k | 220k | 600k | 800k | 1.000k |

### FEB (Red)

| Property | Price | Base | 1🏛️ | 2🏛️ | 3🏛️ | 4🏛️ | 🏫 |
|----------|-------|------|-----|-----|-----|-----|-----|
| Akuntansi | 220k | 18k | 90k | 250k | 700k | 875k | 1.050k |
| Manajemen | 220k | 18k | 90k | 250k | 700k | 875k | 1.050k |
| Ilmu Ekonomi | 240k | 20k | 100k | 300k | 750k | 925k | 1.100k |

### Fasilkom (Yellow)

| Property | Price | Base | 1🏛️ | 2🏛️ | 3🏛️ | 4🏛️ | 🏫 |
|----------|-------|------|-----|-----|-----|-----|-----|
| Ilmu Komputer | 260k | 22k | 110k | 330k | 800k | 975k | 1.150k |
| Sistem Informasi | 260k | 22k | 110k | 330k | 800k | 975k | 1.150k |
| Teknologi Informasi | 280k | 24k | 120k | 360k | 850k | 1.025k | 1.200k |

### FT (Green)

| Property | Price | Base | 1🏛️ | 2🏛️ | 3🏛️ | 4🏛️ | 🏫 |
|----------|-------|------|-----|-----|-----|-----|-----|
| Teknik Sipil | 300k | 26k | 130k | 390k | 900k | 1.100k | 1.275k |
| Teknik Elektro | 300k | 26k | 130k | 390k | 900k | 1.100k | 1.275k |
| Teknik Mesin | 320k | 28k | 150k | 450k | 1.000k | 1.200k | 1.400k |

### FK (Dark Blue)

| Property | Price | Base | 1🏛️ | 2🏛️ | 3🏛️ | 4🏛️ | 🏫 |
|----------|-------|------|-----|-----|-----|-----|-----|
| Kedokteran Gigi | 350k | 35k | 175k | 500k | 1.100k | 1.300k | 1.500k |
| Kedokteran | 400k | 50k | 200k | 600k | 1.400k | 1.700k | 2.000k |

### Railroads

| Property | Price | 1 owned | 2 owned | 3 owned | 4 owned |
|----------|-------|---------|---------|---------|---------|
| Stasiun UI | 200k | 25k | 50k | 100k | 200k |
| Bikun | 200k | 25k | 50k | 100k | 200k |
| Gerbang Utama | 200k | 25k | 50k | 100k | 200k |
| Balairung | 200k | 25k | 50k | 100k | 200k |

### Utilities

| Property | Price | Rent |
|----------|-------|------|
| Perpustakaan UI | 150k | 4× dice (1 owned), 10× dice (2 owned) |
| Danau UI | 150k | 4× dice (1 owned), 10× dice (2 owned) |

---

# 6. Cards Data

## SIAK-NG Cards (Chance) — 16 Cards

| ID | Title | Effect |
|----|-------|--------|
| 1 | IP Semester Naik! | Maju ke Wisuda (GO), terima Rp 200.000 |
| 2 | Lolos SNMPTN Kedokteran | Maju ke Kedokteran |
| 3 | Pindah ke Ilmu Komputer | Maju ke Ilmu Komputer |
| 4 | Rapat BEM | Maju ke Pusgiwa (Free Parking) |
| 5 | Naik Bikun | Maju ke Railroad terdekat, bayar 2× jika dimiliki |
| 6 | Ke Perpustakaan | Maju ke Utility terdekat |
| 7 | Dapat Beasiswa | Terima Rp 150.000 |
| 8 | Menang Lomba Karya Tulis | Terima Rp 100.000 |
| 9 | SIAK Error | Mundur 3 langkah |
| 10 | Ketahuan Titip Absen | Langsung ke Skorsing |
| 11 | Renovasi Kosan | Bayar Rp 25.000/Gedung, Rp 100.000/Fakultas |
| 12 | Tilang Parkir Liar | Bayar Rp 15.000 |
| 13 | Maju ke Gerbang Utama | Maju ke Gerbang Utama |
| 14 | Maju ke Akuntansi | Maju ke Akuntansi |
| 15 | Kartu Bebas Skorsing | Simpan untuk keluar dari Skorsing |
| 16 | Bayar SPP Tambahan | Bayar Rp 50.000 |

## BEM Cards (Community Chest) — 16 Cards

| ID | Title | Effect |
|----|-------|--------|
| 1 | Dana Kemahasiswaan | Terima Rp 200.000 |
| 2 | Salah Transfer UKT | Terima Rp 75.000 |
| 3 | Ospek Selesai | Terima Rp 50.000 |
| 4 | Konsultasi ke Dokter Kampus | Bayar Rp 50.000 |
| 5 | Iuran Makrab | Bayar Rp 25.000 |
| 6 | Menang Lomba UI | Terima Rp 100.000 |
| 7 | Refund UKT | Terima Rp 20.000 |
| 8 | Ulang Tahun! | Terima Rp 10.000 dari setiap pemain |
| 9 | Asuransi Jatuh Tempo | Terima Rp 100.000 |
| 10 | Bayar Jas Almamater | Bayar Rp 50.000 |
| 11 | Hasil Jualan Makrab | Terima Rp 25.000 |
| 12 | Kartu Bebas Skorsing | Simpan untuk keluar dari Skorsing |
| 13 | Langsung ke Wisuda | Maju ke Wisuda (GO) |
| 14 | Plagiarisme Terdeteksi | Langsung ke Skorsing |
| 15 | Warisan dari Senior | Terima Rp 100.000 |
| 16 | Perbaikan Gedung Fakultas | Bayar Rp 40.000/Gedung, Rp 115.000/Fakultas |

## Card Effect Types

```typescript
type CardEffectType =
  | 'collect'           // Receive money from bank
  | 'pay'               // Pay money to bank
  | 'payAll'            // Pay each player
  | 'collectAll'        // Collect from each player
  | 'advance'           // Move to specific tile
  | 'advanceNearest'    // Move to nearest railroad/utility
  | 'back'              // Move backward X spaces
  | 'goToJail'          // Go directly to jail
  | 'getOutOfJail'      // Keep card until used
  | 'repair'            // Pay per house/hotel
  | 'birthday';         // Collect from all players
```

---

# 7. Game Mechanics

## Turn Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        TURN START                           │
│                    "Giliran [Player]!"                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │     IN SKORSING?      │
              └───────────┬───────────┘
                    │           │
                   YES          NO
                    │           │
                    ▼           │
         ┌──────────────────┐   │
         │  JAIL ESCAPE     │   │
         │  • Pay Rp 50k    │   │
         │  • Roll doubles  │   │
         │  • Use card      │   │
         └────────┬─────────┘   │
                  │             │
                  ▼             ▼
              ┌───────────────────────┐
              │      ROLL DICE        │
              │    (Lempar Dadu)      │
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │    MOVE TOKEN         │
              │  (animate along path) │
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   RESOLVE LANDING     │
              │  (see Landing Logic)  │
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │     ROLLED DOUBLES?   │
              └───────────┬───────────┘
                    │           │
                   YES          NO
                    │           │
                    ▼           ▼
         ┌──────────────┐  ┌──────────────┐
         │ 3rd double?  │  │  END TURN    │
         └──────┬───────┘  │  (optional   │
              │     │      │   actions)   │
             YES    NO     └──────────────┘
              │     │
              ▼     ▼
         ┌──────┐ ┌──────┐
         │ JAIL │ │ROLL  │
         │      │ │AGAIN │
         └──────┘ └──────┘
```

## Landing Logic

```
┌─────────────────────────────────────────────────────────────┐
│                     LANDED ON TILE                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ PROPERTY │   │  CORNER  │   │   CARD   │
    └────┬─────┘   └────┬─────┘   └────┬─────┘
         │              │              │
         ▼              ▼              ▼
    ┌─────────┐   ┌─────────┐   ┌─────────┐
    │ Owned?  │   │ Wisuda: │   │  Draw   │
    └────┬────┘   │ +200k   │   │  Card   │
      │     │     │         │   │         │
     YES    NO    │ Skorsing│   │ Execute │
      │     │     │ (visit) │   │ Effect  │
      ▼     ▼     │         │   └─────────┘
    ┌────┐ ┌────┐ │ Pusgiwa │
    │Pay │ │Buy │ │ (rest)  │
    │Rent│ │or  │ │         │
    │    │ │Auct│ │ Sanksi  │
    └────┘ └────┘ │ → Jail  │
                  └─────────┘
```

## Rent Calculation

```typescript
function calculateRent(property, diceRoll, owner) {
  // Mortgaged = no rent
  if (property.mortgaged) return 0;
  
  // Utilities
  if (property.type === 'utility') {
    const utilitiesOwned = countUtilitiesOwned(owner);
    const multiplier = utilitiesOwned === 1 ? 4 : 10;
    return diceRoll * multiplier;
  }
  
  // Railroads
  if (property.type === 'railroad') {
    const railroadsOwned = countRailroadsOwned(owner);
    return property.rent[railroadsOwned - 1];
  }
  
  // Properties
  const houses = property.houses;
  
  if (houses > 0) {
    return property.rent[houses]; // rent[1-5] for 1-4 houses or hotel
  }
  
  // No houses — check for monopoly (2× rent)
  if (ownsFullColorGroup(owner, property.group)) {
    return property.rent[0] * 2;
  }
  
  return property.rent[0]; // base rent
}
```

## Skorsing (Jail) Rules

**Ways to enter Skorsing:**
1. Land on "Sanksi Akademik" tile
2. Draw "Go to Skorsing" card
3. Roll doubles 3 times in a row

**Ways to exit Skorsing:**
1. Pay Rp 50.000 at start of turn
2. Use "Kartu Bebas Skorsing"
3. Roll doubles (up to 3 attempts)
4. After 3 failed attempts, must pay Rp 50.000

## Bankruptcy Rules

**Debt to Rektorat (Bank):**
1. Sell all Gedung (50% value)
2. Mortgage all properties
3. If still can't pay → Drop Out
4. All properties return to Rektorat (unmortgaged)

**Debt to Player:**
1. Sell all Gedung (50% value)
2. Mortgage properties
3. If still can't pay → Drop Out
4. All assets transfer to creditor (mortgages remain)

---

# 8. UI/UX Design

## Screen Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Landing   │────►│   Lobby     │────►│  Waiting    │
│   (Home)    │     │ Create/Join │     │    Room     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │ Host starts
                                               ▼
                                        ┌─────────────┐
                                        │    Game     │
                                        │   Board     │
                                        └──────┬──────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    ▼                          ▼                          ▼
             ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
             │  Your Turn  │           │ Other Turn  │           │  Game Over  │
             │  (Active)   │           │ (Spectate)  │           │  (Results)  │
             └─────────────┘           └─────────────┘           └─────────────┘
```

## Main Game Screen Layout (Mobile)

```
┌─────────────────────────┐
│ Rp 1.280.000    ≡   💬  │◄── Top bar
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ ┌──┬──┬──┬──┬──┬──┐ │ │
│ │ │  │  │  │  │  │  │ │ │
│ │ ├──┼──┴──┴──┴──┼──┤ │ │
│ │ │  │           │  │ │ │
│ │ ├──┤   MAKARA  ├──┤ │ │◄── Mini board
│ │ │  │  KELILING │  │ │ │
│ │ ├──┤     UI    ├──┤ │ │
│ │ │  │           │  │ │ │
│ │ ├──┼──┬──┬──┬──┼──┤ │ │
│ │ │  │  │  │  │  │  │ │ │
│ │ └──┴──┴──┴──┴──┴──┘ │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│  KEDOKTERAN • Blake     │◄── Current tile
├─────────────────────────┤
│ ┌─────┐┌─────┐┌─────┐   │
│ │ 🧥  ││ 💻★ ││ 📚  │   │◄── Player chips
│ │You  ││Blake││Casey│   │
│ │1.2M ││950k ││1.5M │   │
│ └─────┘└─────┘└─────┘   │
├─────────────────────────┤
│                         │
│   [ 🎲 Lempar Dadu ]    │◄── Primary action
│                         │
│   [Tukar]   [Properti]  │◄── Secondary actions
│                         │
└─────────────────────────┘
```

## Component Hierarchy

```
App
├── LandingPage
├── JoinSheet
├── CreateSheet
├── WaitingRoom
└── GamePage
    ├── TopBar
    │   ├── MoneyDisplay
    │   ├── MenuButton
    │   └── ChatButton
    ├── BoardSection
    │   ├── MiniBoard
    │   │   ├── BoardGrid (11×11)
    │   │   ├── TileCell (× 40)
    │   │   └── PlayerTokens
    │   └── ExpandedBoardModal
    ├── CurrentTileStrip
    ├── PlayerStrip
    │   └── PlayerChip (× n)
    ├── ActionArea
    │   ├── PrimaryAction
    │   └── SecondaryActions
    ├── DiceOverlay
    ├── PropertySheet
    ├── TradeModal
    ├── AuctionOverlay
    ├── CardModal
    └── GameOverModal
```

---

# 9. Asset Checklist

## Priority Levels
- 🔴 **P0** — Required for MVP
- 🟡 **P1** — Required for polished game
- 🟢 **P2** — Nice to have

## Logo & Branding

| Asset | Size | Priority |
|-------|------|----------|
| Logo (full) | 512×512 | 🔴 P0 |
| Logo (icon) | 192×192 | 🔴 P0 |
| Makara (board center) | 300×300 | 🟡 P1 |
| Splash screen | 1080×1920 | 🟢 P2 |

## Player Tokens

| Token | Emoji | Custom | Priority |
|-------|-------|--------|----------|
| Jas Almamater | 🧥 | Optional | 🟡 P1 |
| Laptop | 💻 | Optional | 🟡 P1 |
| Buku Tebal | 📚 | Optional | 🟡 P1 |
| Sepeda | 🚲 | Optional | 🟡 P1 |
| Gelas Kopi | ☕ | Optional | 🟡 P1 |
| Stetoskop | 🩺 | Optional | 🟡 P1 |
| Kalkulator | 🔢 | Optional | 🟡 P1 |
| Helm | ⛑️ | Optional | 🟡 P1 |

## Sound Effects

| Sound | Priority |
|-------|----------|
| Dice roll | 🟡 P1 |
| Money gain | 🟡 P1 |
| Money lose | 🟡 P1 |
| Card flip | 🟡 P1 |
| Your turn | 🟡 P1 |
| Victory | 🟡 P1 |
| Jail door | 🟢 P2 |
| Bankruptcy | 🟢 P2 |

## Fonts

| Usage | Font | Fallback |
|-------|------|----------|
| Headers | Poppins Bold | sans-serif |
| Body | Inter | system-ui |
| Numbers | JetBrains Mono | monospace |

## MVP Note

**You can build the entire MVP with zero custom assets** — emoji tokens, CSS colors, and text-based UI all work fine.

---

# 10. Feature List

## Complete Feature Categories

### Core Gameplay (Milestones 0-6)
- [x] Room creation & joining
- [x] Dice rolling & movement
- [x] **Vote kick system**
- [x] **Turn timeout**
- [x] **AFK detection**
- [x] Property buying
- [x] Rent payment
- [x] Jail mechanics
- [x] Chance/Chest cards
- [x] Trading
- [x] Houses & hotels
- [x] Mortgaging
- [x] Bankruptcy
- [x] Victory condition
- [x] Auctions

### Polish (Milestone 8)
- [ ] Sound effects
- [ ] Animations
- [ ] Haptic feedback
- [ ] Loading states
- [ ] Error handling
- [ ] Reconnection

### Social (Milestone 9)
- [ ] Text chat
- [ ] Quick reactions
- [ ] Game log

### Future
- [ ] User accounts
- [ ] Game history
- [ ] Leaderboards
- [ ] Achievements
- [ ] AI opponents
- [ ] Custom themes
- [ ] Mobile app (PWA)

---

# 11. File Structure

```
keliling-ui/
├── README.md
├── docs/
│   └── PROJECT.md          ← This file
│
├── backend/
│   ├── Cargo.toml
│   └── src/
│       ├── main.rs
│       ├── ws/
│       │   ├── mod.rs
│       │   ├── handler.rs
│       │   └── messages.rs
│       ├── game/
│       │   ├── mod.rs
│       │   ├── state.rs
│       │   ├── board.rs
│       │   ├── cards.rs
│       │   ├── actions.rs
│       │   └── logic.rs
│       ├── room/
│       │   ├── mod.rs
│       │   ├── manager.rs
│       │   └── room.rs
│       └── error.rs
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.css
│       │
│       ├── hooks/
│       │   ├── useWebSocket.ts
│       │   └── useGameState.ts
│       │
│       ├── stores/
│       │   └── gameStore.ts
│       │
│       ├── components/
│       │   ├── Landing/
│       │   │   └── LandingPage.tsx
│       │   ├── Lobby/
│       │   │   ├── CreateSheet.tsx
│       │   │   ├── JoinSheet.tsx
│       │   │   └── WaitingRoom.tsx
│       │   ├── Game/
│       │   │   ├── GamePage.tsx
│       │   │   ├── Board/
│       │   │   │   ├── MiniBoard.tsx
│       │   │   │   ├── TileCell.tsx
│       │   │   │   └── ExpandedBoard.tsx
│       │   │   ├── Players/
│       │   │   │   ├── PlayerStrip.tsx
│       │   │   │   └── PlayerChip.tsx
│       │   │   ├── Actions/
│       │   │   │   ├── ActionArea.tsx
│       │   │   │   ├── DiceOverlay.tsx
│       │   │   │   └── CurrentTileStrip.tsx
│       │   │   └── Modals/
│       │   │       ├── PropertySheet.tsx
│       │   │       ├── TradeModal.tsx
│       │   │       ├── AuctionOverlay.tsx
│       │   │       ├── CardModal.tsx
│       │   │       └── GameOverModal.tsx
│       │   └── shared/
│       │       ├── Button.tsx
│       │       ├── Modal.tsx
│       │       └── Toast.tsx
│       │
│       ├── types/
│       │   ├── game.ts
│       │   └── messages.ts
│       │
│       ├── data/
│       │   ├── board.ts        ← Board configuration
│       │   ├── cards.ts        ← Card definitions
│       │   └── theme.ts        ← Theme configuration
│       │
│       └── utils/
│           ├── format.ts
│           └── helpers.ts
│
└── public/
    └── assets/
        ├── logo/
        ├── tokens/
        ├── cards/
        ├── tiles/
        └── sounds/
```

---

# 12. Technical Specifications

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

## Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| WebSocket latency | < 100ms |
| Animation FPS | 60 FPS |

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, compact board |
| Tablet | 640-1024px | Larger board, side panels |
| Desktop | > 1024px | Full board, all panels visible |

## WebSocket Reconnection

```typescript
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000]; // ms
const MAX_RECONNECT_ATTEMPTS = 5;
const HEARTBEAT_INTERVAL = 30000; // ms
```

## Rate Limits

| Action | Limit |
|--------|-------|
| Room creation | 5 per minute |
| Chat messages | 10 per minute |
| Game actions | 60 per minute |

---

# Appendix: Quick Reference

## Keyboard Shortcuts (Desktop)

| Key | Action |
|-----|--------|
| R | Roll dice |
| E | End turn |
| T | Open trade |
| P | Open properties |
| Esc | Close modal |

## Room Code Format

- 4 uppercase letters (A-Z)
- Examples: ABCD, XKCD, UIUI
- Case-insensitive input
- ~450,000 possible codes

## Currency Format

```typescript
const formatMoney = (amount: number) => 
  `Rp ${amount.toLocaleString('id-ID')}`;

// Examples:
// 1500000 → "Rp 1.500.000"
// 50000   → "Rp 50.000"
```

---

**Last Updated:** 2025
**Version:** 1.0.0
**Author:** Built with Claude