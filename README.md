# Musify — Full-stack React/Laravel aplikacija za organizaciju muzičkih događaja

![Logo](./music-app-frontend/public/images/musify-text.png)

Musify je web aplikacija za pregled, rezervaciju i upravljanje muzičkim događajima. Frontend je razvijen u **React-u** (Recharts za grafike, Lottie za animacije), a backend u **Laravel-u** (Sanctum autentifikacija, REST API).

Dokument ispod opisuje **ekrane i tokove** po korisničkim ulogama, kao i **navigacioni meni**, **futer** i **Loading** stranicu.

---

## 🧭 Navigacioni meni

- Gornji **glassmorphism** meni u obliku kapsule.
- Uvek prikazuje **logo**, **linkove relevantne ulozi**, i **user chip** (avatar, ime, uloga) sa **logout** ikonicom.
- Primeri linkova po ulozi:
  - Neulogovan: *Home*, *Login/Register* (ili vodi direktno na Auth).
  - Kupac: *Home*, *Events*, *My Reservations*.
  - Menadžer: *Home*, *My Events*, *Reservations*.
  - Administrator: *Home*, *Users*, *Analytics*.

## ⛳ Futer

- Minimalan **footer** sa © godinom i nazivom („Musify“).
- Centriran **mini logo**.
- Diskretan „Click me“ micro-interaction u desnom delu (animirani nagoveštaj).

## ⏳ Loading stranica

- Hero kompozicija sa **organskom tamno-zelenom “aurora” krivom**, gel **Musify** logotipom i **spinnerom**.
- Služi kao prijatan vizuelni most tokom učitavanja rute i API poziva.

---

## 👥 Korisničke uloge i ekrani

### 1) Neulogovan korisnik (samo prijava i registracija)

**Ekran: Auth (Login / Register)**  
- Centralna kartica sa **Musify** gel logotipom i dve kartice (tabovi): **Login** i **Register**.  
- **Login**: email + lozinka, link **Forgot password?** koji otvara modal za reset lozinke (email, nova lozinka, potvrda).  
- **Register**: ime, email, lozinka + potvrda, **uloga** (buyer/event_manager/administrator), adresa, telefon, opcioni URL slike.  
- Nakon uspešne prijave korisnik se preusmerava na početni ekran i dobija meni shodno ulozi.

**Tokovi:**
- Registracija → Auto-login (opciono) ili ručni login → dodela tokena (Sanctum) → čuvanje u sessionStorage.
- Reset lozinke: modal → POST na `/api/reset-password` → poruka o ishodu.

---

### 2) Kupac (Buyer)

**Home**  
- Dobrodošlica sa ilustracijom i gel naslovima („Welcome to Musify“), kratak opis aplikacije.

**Events (katalog)**  
- Grid kartica sa slikom, naslovom, lokacijom, izvođačem/žanrom, vremenskim opsegom.  
- **Search by title** + **Sort** (npr. „Oldest first“).  
- **View details** vodi na detalje konkretnog događaja.

**Event Details + selekcija sedišta**  
- Blokovi: opis događaja, vreme, broj rezervisanih i kapacitet.  
- Kartice za **venue** (slika, adresa, kapacitet) i **manager** (kontakt).  
- Sekcija **Select a Seat** sa legendom (*reserved/free/selected*) i „pozorišnom“ mapom sedišta.  
- Dugmad: **Reserve seats** / **Cancel**.

**My Reservations**  
- Tabela: **Event Title**, **Date** (sa vremenom), **Venue**, **Seats** (broj + lista), **Status** (badge: confirmed/pending/cancelled), **Actions** (View Event).  
- Istaknuti brojevi sedišta radi brze percepcije.

---

### 3) Event Manager (Menadžer događaja)

**My Events**  
- Pregled svih događaja menadžera u **karticama** (slika, naslov, meta podaci).  
- **Create New Event** dugme (modal/form).  
- **Delete Event** sa potvrdom (crveni gradijent).

**Reservations For My Events**  
- Tabela rezervacija vezanih **samo** za menadžerove događaje.  
- Kolone: **Event title**, **User**, **Date**, **Seats**, **Status**, **Actions**.  
- Akcije: **Reconfirm** (ponovno potvrđivanje) / **Cancel** (otkazivanje).  
- Statusi kolor-kodirani (zeleno/žuto/crveno).

**Event Details**  
- Isti ekran kao kod kupca, ali menadžer je prikazan kao odgovorno lice; u budućnosti moguće je dodati menadžerske akcije (edit, generate seats, itd.).

---

### 4) Administrator

**Users**  
- Tabela svih korisnika: **ID**, **Name** (sa avatar inicijalom), **Email**, **Role** (badge), **Registration Date**.  
- Sekcija **Top 5 Popular Artists** — brzi pregled popularnosti izvođača.

**Analytics (Reservations Analytics)**  
- Veliki gel naslov „Analytics“ i sažete metrike: **Days**, **Reservations**, **Statuses**.  
- **LineChart**: *Reservations per Day*.  
- **BarChart**: *Reservations by Status* (confirmed/pending/cancelled) sa odgovarajućim bojama.  
- **Net Worth widget (demo)**: jednostavan unos imena muzičara i prikaz procenjene neto vrednosti (besplatni izvor; informativno).

> Napomena: administratorski fajlovi i rute na backendu ograničavaju pristup ovim podacima isključivo korisnicima sa rolom **administrator**.

---

## 🧩 Dizajn i UX principi

- **Gel tipografija** i plavi gradijenti — dosledan brend identitet u naslovima („Musify“, „Analytics“, „My Reservations“…).
- **Glassmorphism** kartice, meke senke i radius-i, čitljive tabele sa blagim hover efektima.
- **Status** badge-evi u zelenoj/žutoj/crvenoj shemi (confirmed/pending/cancelled).
- **Recharts** grafici sa prilagođenom paletom i responzivnim kontejnerima.
- **Lottie** animacije za živost (Auth, Loading).

---

## 🔐 Autentifikacija i API (skraćeno)

- **Laravel Sanctum** za token-based API.
- Ključne javne rute: `POST /api/register`, `POST /api/login`.  
- Zaštićene rute (primeri): `GET /api/events`, `POST /api/reservations`, `GET /api/reservations/my`, …  
- **Reset lozinke (simple)**: `POST /api/reset-password` (email, new_password, new_password_confirmation) — vraća poruku o uspehu/grešci; forma se otvara iz Auth ekrana kroz **modal**.

---

## 🧭 Kratki tokovi upotrebe

- **Kupac**: Login → *Events* → *Event Details* → selektuje sedišta → *Reserve seats* → pregleda istoriju na *My Reservations*.  
- **Menadžer**: Login → *My Events* (kreira/uređuje/brise) → *Reservations* za svoje događaje (confirm/cancel).  
- **Admin**: Login → *Users* (tabela + top artists) → *Analytics* (grafici + net worth widget).  
- **Neulogovan**: *Auth* (Login/Register) + modal za reset lozinke.

---
Instalacija i pokretanje
---------------------------

1. Klonirajte repozitorijum:
```bash
    git clone https://github.com/elab-development/internet-tehnologije-2024-projekat-musicapp_2020_0331_2020_0210.git
```
2. Pokrenite backend:
```bash
   cd music-app-backend
   composer install
   php artisan migrate:fresh --seed
   php artisan serve
```
    
3. Pokrenite frontend:
```bash
   cd music-app-frontend
   npm install
   npm start
```
    
4.  Frontend pokrenut na: [http://localhost:3000](http://localhost:3000) Backend API pokrenut na: [http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)

