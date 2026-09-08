<div align="center">

<img src="assets/images/icons/Shelfmark_logo.png" alt="Shelfmark logo" width="96">

# Shelfmark

**Catalog what you keep.**

A personal collection archive for cataloguing, documenting and tracking physical video games.

[![GitHub repo size](https://img.shields.io/github/repo-size/MINEGAMERPTyt/Shelfmark?style=flat-square)](https://github.com/MINEGAMERPTyt/Shelfmark)
[![GitHub last commit](https://img.shields.io/github/last-commit/MINEGAMERPTyt/Shelfmark?style=flat-square)](https://github.com/MINEGAMERPTyt/Shelfmark)
[![GitHub language count](https://img.shields.io/github/languages/count/MINEGAMERPTyt/Shelfmark?style=flat-square)](https://github.com/MINEGAMERPTyt/Shelfmark)
[![GitHub top language](https://img.shields.io/github/languages/top/MINEGAMERPTyt/Shelfmark?style=flat-square)](https://github.com/MINEGAMERPTyt/Shelfmark)
[![License: MIT](https://img.shields.io/badge/License-MIT-d6ff4b?style=flat-square)](LICENSE)

</div>

---

## About

Shelfmark is an open-source web application for cataloguing, documenting and tracking personal physical collections.

The project currently focuses on **physical video games**, allowing users to record not only the game itself, but the specific copy they own — including its condition, completeness, physical format, packaging, media, photographs, purchase information and estimated market value.

Shelfmark is designed to remain simple to use while keeping collection data detailed and organised. In the future, the project is intended to expand beyond games to support other types of physical items and technology.

The interface and source code can be modified to suit different collections, workflows and visual preferences.

Shelfmark uses a lightweight frontend built with vanilla HTML, CSS and JavaScript, with Supabase providing authentication, database storage and private image hosting.

---

## Features

### Collection management

* Add physical games to a personal collection
* Edit existing collection entries
* Permanently remove games and associated images
* Search the collection by title
* Filter by platform and genre
* Sort collection entries
* Responsive collection grid
* Individual detail page for every game

### Game metadata

Shelfmark can record information including:

* Title
* Platform
* Release year
* Genre
* Region
* Country
* Game type
* Edition
* Developer
* Publisher
* Media type
* Case format

### Physical copy documentation

Each entry describes the actual copy owned by the user rather than only the game itself.

Supported information includes:

* Physical condition
* Completeness
* Disc or cartridge format
* Number of discs
* Custom case dimensions
* Front cover
* Back cover
* Spine
* Manual
* Individual disc images
* Cartridge image

All photographs are optional.

### Image cropper

Shelfmark includes a custom image cropping interface designed around common physical game packaging formats.

Supported case presets include:

* PlayStation / CD jewel case
* DVD-style game case
* Blu-ray game case
* Nintendo GameCube
* Nintendo DS / 3DS
* Nintendo Switch
* PSP
* PS Vita
* Custom dimensions

Disc images use a circular crop with transparency and a transparent centre hole.

### Purchase and valuation tracking

Shelfmark can record:

* Purchase date
* Purchase price
* Estimated current value
* Value source
* Date the value was last checked
* Profit or loss

Market values are entered manually by the user.

Shelfmark provides shortcuts for researching prices on external services such as:

* PriceCharting
* eBay sold listings
* CeX

Shelfmark does **not** scrape or redistribute pricing data from these services.

### Accounts and security

* Email and password authentication
* Email confirmation
* Protected collection pages
* User-specific collection data
* User-specific private image storage
* Row Level Security through Supabase
* Private Storage bucket with signed image URLs

Each authenticated user can only access their own collection data.

---

## Technology

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript

No frontend framework is required.

### Backend

* [Supabase](https://supabase.com/)

  * Authentication
  * PostgreSQL database
  * Row Level Security
  * Storage
  * Signed URLs

### Development

* Visual Studio Code
* Live Server
* Git
* GitHub

---

## Project Structure

```text
Shelfmark/
├── index.html
├── collection.html
├── game.html
├── add-game.html
├── login.html
├── register.html
├── profile.html
├── settings.html
│
├── assets/
│   └── images/
│       └── icons/
│           ├── Shelfmark_logo.png
│           ├── PriceCharting_logo.png
│           ├── eBay_logo.png
│           └── CeX_logo.png
│
├── css/
│   ├── style.css
│   ├── navbar.css
│   ├── collection.css
│   ├── game.css
│   ├── forms.css
│   ├── auth.css
│   └── responsive.css
│
├── js/
│   ├── main.js
│   ├── collection.js
│   ├── game.js
│   ├── forms.js
│   ├── auth.js
│   └── supabase.js
│
└── README.md
```

---

## Database

Shelfmark uses Supabase PostgreSQL.

### `profiles`

Stores profile information associated with authenticated users.

### `collection_items`

Contains information shared by collection entries.

Important fields include:

```text
id
user_id
category
title
condition
completeness
region
country
purchase_date
purchase_price
estimated_value
value_source
value_checked_at
notes
created_at
updated_at
```

### `games`

Contains game-specific information.

```text
item_id
platform
release_year
genre
game_type
edition
developer
publisher
media_type
case_format
custom_case_width
custom_case_height
disc_count
```

### `item_images`

Tracks images stored for each collection item.

```text
id
item_id
image_type
storage_path
disc_number
sort_order
created_at
```

Game and image records are associated with their parent collection item.

Deleting a collection item also removes its linked database records.

---

## Image Storage

Game photographs are stored in a private Supabase Storage bucket named:

```text
item-images
```

Files are organised by user and collection item:

```text
USER_UUID/
└── GAME_UUID/
    ├── front.png
    ├── back.png
    ├── side.png
    ├── manual.png
    ├── disc-1.png
    ├── disc-2.png
    └── cartridge.png
```

Shelfmark uses temporary signed URLs when displaying private images.

Replacement images created while editing use unique filenames to prevent the existing image from being overwritten before an edit has completed successfully.

---

## Security

Shelfmark is designed so that client-side code never requires administrative Supabase credentials.

The application uses a Supabase publishable key in the browser while access control is enforced by the backend.

Security measures include:

* Supabase Authentication
* Row Level Security
* User ownership checks
* Private Storage
* Storage path restrictions based on authenticated user IDs
* Signed URLs for image access
* No service-role key exposed to the frontend

> Never place a Supabase service-role key or other private backend credential in the frontend source code.

---

## Running Shelfmark Locally

### 1. Clone the repository

```bash
git clone https://github.com/MINEGAMERPTyt/Shelfmark.git
```

Move into the project directory:

```bash
cd Shelfmark
```

### 2. Configure Supabase

Create a Supabase project and configure the required:

* Authentication settings
* Database tables
* Row Level Security policies
* Storage bucket and policies

Then configure `js/supabase.js` with your project URL and publishable key:

```js
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";

window.shelfmarkSupabase =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
  );
```

The publishable key is intended for frontend use when database and storage access are correctly protected by Row Level Security.

### 3. Start a local server

Shelfmark should be served through a local web server rather than opening the HTML files directly.

For example, using the **Live Server** extension in Visual Studio Code:

1. Open the project folder in VS Code.
2. Open `index.html`.
3. Select **Open with Live Server**.

---

## Market Value Research

Shelfmark intentionally does not depend on a paid pricing API.

Instead, users can research the current value of a game through external marketplaces and pricing services.

Shelfmark automatically builds searches using information such as:

```text
Title
Platform
Region
Edition
```

For example:

```text
Silent Hill 2 PAL PlayStation 2
```

The user can then compare available market information and save their own estimated value together with its source and the date it was checked.

This keeps valuation transparent while avoiding reliance on proprietary pricing data.

---

## Design

Shelfmark uses a restrained archive-inspired interface designed around physical media.

### Palette

```css
--background: #111111;
--surface: #181818;
--surface-light: #222222;

--text: #f1f0eb;
--text-muted: #999994;

--accent: #d6ff4b;
--accent-dark: #b8dc35;

--border: #2b2b2b;
```

The interface deliberately uses:

* Sharp geometry
* Flat surfaces
* Minimal decoration
* Strong typography
* High-contrast metadata
* Consistent lime-green accent colour
* Responsive layouts across desktop and mobile devices

---

## Current Status

Shelfmark currently supports the complete game collection workflow:

```text
Create account
      ↓
Add game
      ↓
Collection
      ↓
Game details
      ↓
Edit game
      ↓
Save changes
      ↓
Delete game
```

Game collection management, image storage, edit handling and manual valuation tracking are functional.

---

## Planned Features

Possible future development includes:

* Collection statistics dashboard
* Total collection value
* Total amount spent
* Overall profit / loss
* Platform breakdowns
* Collection value history
* Wishlist support
* Additional collection categories
* Consoles
* Computers
* Phones
* Peripherals
* Music and physical media
* Collectibles
* Import / export tools

---

## License

Shelfmark is open-source software licensed under the [MIT License](LICENSE).

You are free to use, modify, distribute and build upon the project in accordance with the terms of the license.

Contributions and forks are welcome.

---

## Author

Developed by **MINEGAMERPTyt**.

GitHub: [@MINEGAMERPTyt](https://github.com/MINEGAMERPTyt)

---

<div align="center">

**Shelfmark**

*Catalog what you keep.*

A personal collection archive.

</div>
