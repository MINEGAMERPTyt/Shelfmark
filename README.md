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
[![Version](https://img.shields.io/badge/version-v1.5.0-d6ff4b?style=flat-square)](https://github.com/MINEGAMERPTyt/Shelfmark/releases)

[**Live Demo →**](https://shelfmark-app.netlify.app/)

</div>

---

## About

Shelfmark is an open-source web application for cataloguing, documenting and tracking personal physical collections.

The project currently focuses on **physical video games**, allowing users to record not only the game itself, but the specific copy they own — including its condition, completeness, physical format, packaging, media, photographs, purchase information and estimated market value.

Shelfmark also includes a separate **Wishlist** for tracking physical games that the user would like to acquire. Wishlist entries remain distinct from owned Collection entries and can later be converted into Collection records once the game is acquired.

Owned games can be organised into **custom Collections** without duplicating the original game record. Insights can be scoped to an individual custom Collection, and users can optionally create read-only public links for either their full archive or a specific custom Collection.

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
* Grid and list collection views
* Collection insights for total spent, estimated value and tracked profit / loss
* Platform, genre and media breakdowns
* Custom Collections for grouping existing games without duplicating records
* Games can belong to multiple custom Collections
* Collection-specific Insights
* Optional read-only sharing for the full archive or individual custom Collections
* Responsive collection layout
* Individual detail page for every game

### Wishlist

Shelfmark includes a separate wishlist for physical games the user would like to acquire.

Wishlist entries can include:

* Title and platform
* Release year
* Genre
* Region and country
* Game type and edition
* Developer and publisher
* Physical media and case format
* Priority
* Target price
* Desired condition
* Desired completeness
* Notes
* Optional front artwork
* Optional disc, UMD or cartridge reference image

Wishlist entries can be:

* Searched by title and other metadata
* Filtered by platform
* Filtered by priority
* Sorted by date, title, priority or target price
* Edited
* Removed
* Added directly to the Collection once acquired

When a game is acquired, **Add to Collection** carries its general release information into the Collection form while deliberately leaving copy-specific information blank.

The user can then record the actual:

* Condition
* Completeness
* Purchase date
* Purchase price
* Estimated value
* Notes
* Physical copy photographs

Wishlist reference artwork is **never transferred** to the owned Collection entry. The user instead photographs and documents the physical copy they actually acquired.

After the game has been successfully added to the Collection, its original Wishlist entry is removed.

### Game metadata

Shelfmark can record information including:

* Title
* Platform
* Release year
* Genre
* Region
* Country
* Game type
* Edition, including custom edition names
* Developer
* Publisher
* Media type
* Media format
* Case format

### Physical copy documentation

Each Collection entry describes the actual copy owned by the user rather than only the game itself.

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

### Physical 3D viewer

Shelfmark includes an interactive physical viewer for cases and physical media.

The viewer:

* Generates the case and media dynamically in the browser
* Uses the physical proportions already defined by Shelfmark
* Maps uploaded front, back and spine photographs across the complete case faces
* Displays discs, GameCube discs, PSP UMDs and supported cartridge formats alongside the case
* Keeps case and media on the same physical scale
* Lets the case and media rotate independently inside the same viewer
* Preserves physical proportions while zooming the complete scene
* Uses Shelfmark's physical-media silhouettes for UMDs and cartridges
* Gives physical media visible depth in the 3D scene
* Uses a reflective silver reverse side for standard and GameCube optical discs
* Supports mouse and touch dragging
* Supports keyboard and on-screen controls
* Includes zooming and reset-view controls
* Works for boxed and media-only copies
* Is also available on public shared Collections when the required photographs are shared
* Requires no stored 3D model files or external 3D engine

Case dimensions vary according to the selected physical format, including DVD-style, Blu-ray, PlayStation/CD jewel, GameCube, PSP, PS Vita, Nintendo DS, Nintendo 3DS and Nintendo Switch cases.

Missing photographs are represented by Shelfmark's own physical-format placeholders rather than preventing the viewer from opening.

### Image cropper

Shelfmark includes a reusable custom image cropping system designed around physical game packaging and media formats.

The same cropper is used for Collection photography and optional Wishlist reference images.

The cropper supports:

* Zoom and image positioning
* Fine image rotation for correcting tilted photographs
* Case-specific cover, spine and manual proportions
* Circular optical disc crops with transparent centre holes
* Transparent physical-media silhouettes for UMDs and cartridges
* Custom case dimensions

Supported case presets include:

* PlayStation / CD jewel case
* DVD-style game case
* Blu-ray game case
* Nintendo GameCube
* Nintendo DS
* Nintendo 3DS
* Nintendo Switch
* PSP
* PS Vita
* Custom dimensions

Supported physical media shapes include:

* Standard optical discs
* GameCube discs
* PSP UMDs
* NES cartridges
* SNES PAL / Japanese cartridges
* SNES North American cartridges
* Nintendo 64 cartridges
* Game Boy cartridges
* Game Boy Color cartridges
* Game Boy Advance cartridges
* Nintendo DS Game Cards
* Nintendo 3DS Game Cards
* Nintendo Switch Game Cards
* PS Vita Game Cards

Media formats are automatically suggested based on the selected platform and region, but can be overridden manually.

### Backup and import

Shelfmark can create portable ZIP backups from Settings.

A backup can include:

* Collection records
* Wishlist records
* Custom Collections
* Custom Collection memberships
* Optional Collection and Wishlist photographs

Backups intentionally exclude account credentials and public sharing tokens.

Imports are non-destructive: imported records are added to the current account rather than replacing the existing Collection or Wishlist. If a custom Collection name already exists, Shelfmark creates an imported-name variant instead of overwriting it. Photograph backups are restored into the current user's private Storage paths.

### Interface and performance settings

Settings includes browser-local interface and performance preferences. These do not create additional Supabase database traffic.

Available options include:

* Motion: Follow system, Full, Reduced or Off
* Image loading: Standard or Data saver
* Default Collection view
* Default games-per-page value
* Default Collection sorting
* Default physical-viewer focus: Case, Media or Last used

The motion system respects the operating system's reduced-motion preference when Follow system is selected. The animations are intentionally short and archive-inspired, using mostly transforms and opacity rather than continuous effects.

Data Saver reduces nonessential card-image downloads while keeping full-resolution images available when the user explicitly opens Game Details, a lightbox, editing or the physical viewer.

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
* Protected Collection and Wishlist pages
* User-specific collection data
* User-specific wishlist data
* User-specific private image storage
* Row Level Security through Supabase
* Private Storage bucket with signed image URLs
* Owner-controlled public share links backed by a server-side Edge Function

Each authenticated user can only access their own private Collection, Wishlist, custom Collection and associated image data. Public sharing is opt-in and exposes only the fields selected for that share.

---

## Technology

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript
* CSS 3D transforms
* JSZip for portable backup creation/import

No frontend framework or external 3D engine is required.

### Backend

* [Supabase](https://supabase.com/)
  * Authentication
  * PostgreSQL database
  * Row Level Security
  * Storage
  * Signed URLs
  * Edge Functions

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
├── wishlist.html
├── add-wishlist.html
├── shared.html
├── login.html
├── register.html
├── profile.html
├── settings.html
├── forgot-password.html
├── reset-password.html
├── delete-account.html
├── privacy.html
├── 404.html
│
├── assets/
│   └── images/
│       ├── icons/
│       │   ├── Shelfmark_logo.png
│       │   ├── PriceCharting_logo.png
│       │   ├── eBay_logo.png
│       │   └── CeX_logo.png
│       │
│       ├── cropper/
│       │   ├── umd-outline.png
│       │   ├── nes-outline.png
│       │   ├── snes-pal-outline.png
│       │   ├── snes-ntsc-outline.png
│       │   ├── n64-outline.png
│       │   ├── gb-outline.png
│       │   ├── gbc-outline.png
│       │   ├── gba-outline.png
│       │   ├── ds-outline.png
│       │   ├── 3ds-outline.png
│       │   ├── switch-outline.png
│       │   └── psvita-outline.png
│       │
│       └── viewer/
│           ├── umd-silhouette.png
│           ├── nes-silhouette.png
│           ├── snes-pal-silhouette.png
│           ├── snes-ntsc-silhouette.png
│           ├── n64-silhouette.png
│           ├── gb-silhouette.png
│           ├── gbc-silhouette.png
│           ├── gba-silhouette.png
│           ├── ds-silhouette.png
│           ├── 3ds-silhouette.png
│           ├── switch-silhouette.png
│           └── psvita-silhouette.png
│
├── css/
│   ├── style.css
│   ├── navbar.css
│   ├── collection.css
│   ├── case-viewer.css
│   ├── wishlist.css
│   ├── shared.css
│   ├── game.css
│   ├── forms.css
│   ├── auth.css
│   ├── legal.css
│   ├── data-transfer.css
│   └── responsive.css
│
├── js/
│   ├── main.js
│   ├── collection.js
│   ├── case-viewer.js
│   ├── wishlist.js
│   ├── wishlist-form.js
│   ├── shared.js
│   ├── game.js
│   ├── forms.js
│   ├── image-cropper.js
│   ├── formats.js
│   ├── auth.js
│   ├── password-recovery.js
│   ├── delete-account.js
│   ├── data-transfer.js
│   └── supabase.js
│
├── supabase/
│   └── functions/
│       ├── delete-account/
│       └── shared-collection/
│
└── README.md
```

---

## Database

Shelfmark uses Supabase PostgreSQL.

### `profiles`

Stores profile information associated with authenticated users.

### `collection_items`

Contains information shared by Collection entries.

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

Contains game-specific information for Collection entries.

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
media_format
case_format
custom_case_width
custom_case_height
disc_count
```

### `item_images`

Tracks photographs stored for Collection items.

```text
id
item_id
image_type
storage_path
thumbnail_path
disc_number
sort_order
created_at
```

Supported Collection image types include:

```text
front
back
side
manual
disc
cartridge
```

Game and image records are associated with their parent Collection item.

Deleting a Collection item also removes its linked database records.

### `collections`

Stores user-created custom Collections such as publisher, series or personal grouping lists.

```text
id
user_id
name
description
created_at
updated_at
```

### `collection_members`

Links existing Collection items to custom Collections. A game can belong to more than one custom Collection without duplicating its main record.

```text
collection_id
item_id
added_at
```

### `collection_shares`

Stores owner-controlled sharing configuration for the full archive or a specific custom Collection.

```text
id
user_id
scope_type
collection_id
share_token
is_enabled
show_photos
show_estimated_value
show_purchase_price
show_purchase_date
show_value_difference
created_at
updated_at
```

Share tokens are random and can be disabled or regenerated. Anonymous viewers do not read this table or the underlying Collection tables directly.

### `wishlist_items`

Stores physical games the user would like to acquire.

Important fields include:

```text
id
user_id
title
platform
release_year
genre
game_type
edition
developer
publisher
region
country
media_type
media_format
case_format
custom_case_width
custom_case_height
priority
target_price
desired_condition
desired_completeness
notes
created_at
updated_at
```

Wishlist priorities are:

```text
low
medium
high
```

### `wishlist_images`

Tracks optional reference artwork associated with Wishlist entries.

```text
id
wishlist_item_id
image_type
storage_path
thumbnail_path
created_at
```

Supported Wishlist image types are:

```text
front
disc
cartridge
```

Wishlist reference images remain separate from photographs belonging to owned Collection items.

Deleting a Wishlist entry also removes its linked Wishlist image records.

---

## Image Storage

Game photographs and Wishlist reference images are stored in a private Supabase Storage bucket named:

```text
item-images
```

### Collection photographs

Collection files are organised by user and Collection item:

```text
USER_UUID/
└── GAME_UUID/
    ├── front.webp
    ├── back.webp
    ├── side.webp
    ├── manual.webp
    ├── disc-1.webp
    ├── disc-2.webp
    └── cartridge.webp
```

Replacement images created while editing use unique filenames to prevent the existing image from being overwritten before an edit has completed successfully.

### Wishlist reference images

Wishlist reference images use a separate path inside the same private bucket:

```text
USER_UUID/
└── wishlist/
    └── WISHLIST_UUID/
        ├── front-UNIQUE_ID.webp
        ├── disc-UNIQUE_ID.webp
        └── cartridge-UNIQUE_ID.webp
```

A Wishlist entry can contain an optional front artwork reference and one relevant media reference image.

When a Wishlist game is added to the Collection, these reference images are **not transferred** to the owned Collection item.

The Collection entry receives its own independently uploaded photographs of the physical copy that the user actually acquired.

Newly processed images are exported as WebP to reduce file size while preserving transparency for discs, UMDs and cartridge silhouettes. Older PNG/JPEG uploads remain supported.

New uploads also create an approximately 420 px WebP thumbnail. Collection and Wishlist cards use these smaller files where available, while full-resolution originals are reserved for places that actually need them, such as Game Details, editing, lightboxes, backup export and the physical 3D viewer. Existing images without thumbnails remain compatible and fall back to their original Storage file.

New uploads use long-lived browser cache metadata, and Shelfmark reuses temporary signed URLs within the browser session where possible. Paginated Collection, Wishlist and public-share views only sign and activate the images required for the currently visible page. List view and Data Saver can reduce those requests further.

Full back, spine and media assets are fetched on demand for the physical viewer instead of being downloaded pre-emptively for every Collection card. Public sharing uses the same on-demand approach through the sharing Edge Function.

Shelfmark uses temporary signed URLs when displaying private images.

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
* Public share tokens validated through a Supabase Edge Function
* Anonymous viewers receive only the data enabled for a specific share
* No service-role key exposed to the frontend

Collection, Wishlist and custom Collection tables use Row Level Security so authenticated users can only access records that belong to their own account.

Storage access is similarly restricted to paths beginning with the authenticated user's ID. Public sharing does not weaken these owner-only policies: the public page calls a server-side Edge Function that validates the share token and returns a controlled read-only representation. Financial fields and photographs are exposed only when the owner enables the corresponding sharing options.

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

Shelfmark also uses Supabase Edge Functions for account deletion and public collection sharing. Deploy them from the project directory with the Supabase CLI:

```bash
npx supabase functions deploy delete-account
npx supabase functions deploy shared-collection
```

The public sharing function validates random share tokens server-side. Administrative Supabase credentials remain inside the Edge Function environment and are never included in browser JavaScript.

### 3. Start a local server

Shelfmark should be served through a local web server rather than opening the HTML files directly.

For example, using the **Live Server** extension in Visual Studio Code:

1. Open the project folder in VS Code.
2. Open `index.html`.
3. Select **Open with Live Server**.

> Some local development servers do not automatically display `404.html` for invalid routes. The deployed Netlify site handles the custom 404 page normally.

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
* Physical proportions derived from real game packaging where applicable

The physical 3D viewer follows the same visual system, combining Shelfmark's case styling with the user's uploaded case and media photographs while preserving the recorded physical proportions.

---

## Current Status

Shelfmark currently supports complete physical-game **Collection, Wishlist, custom Collection and read-only sharing workflows**.

### Collection

```text
Create account
      ↓
Add game
      ↓
Collection
      ↓
Browse / search / filter
      ↓
View physical copy
      ↓
Physical 3D view
      ↓
Game details
      ↓
Edit or remove
```

### Wishlist

```text
Add wishlist item
      ↓
Track desired release
      ↓
Search / filter / prioritise
      ↓
Acquire game
      ↓
Add to Collection
      ↓
Record the actual physical copy
      ↓
Wishlist entry removed
```

### Custom Collections and sharing

```text
Existing Collection games
      ↓
Create a custom Collection
      ↓
Add games without duplicating them
      ↓
View Collection-specific Insights
      ↓
Optionally enable a read-only share link
      ↓
Disable or regenerate the link at any time
```

Current functionality includes:

* Physical game Collection management
* Individual game detail pages
* Wishlist management
* Wishlist-to-Collection workflow
* Custom edition entry through the Edition selector
* Custom Collections with many-to-many game membership
* Collection-specific Insights
* Read-only public sharing for full archives or individual custom Collections
* Per-share privacy controls for photographs and financial fields
* Private Collection photography
* Optional Wishlist reference images
* Shared physical-media image cropper
* Fine image rotation and positioning
* Physical cartridge and UMD silhouettes
* Interactive physical 3D viewer with separate case and media interaction
* Manual valuation tracking
* Market-research shortcuts
* Collection financial insights
* Platform, genre and media breakdowns
* Search, filtering, sorting and pagination
* Responsive desktop and mobile layouts
* Responsive authenticated navigation
* User-specific data protected through Supabase Row Level Security
* Private image storage with signed URLs
* WebP image output with automatically generated card thumbnails
* On-demand full-resolution image loading for the physical viewer and public shares
* Improved browser caching and signed-URL reuse for lower Storage egress
* Lazy image activation across paginated Collection, Wishlist and shared views
* Data Saver mode for reducing nonessential image downloads
* Portable Collection/Wishlist/custom-Collection backup and import
* App-wide motion controls and configurable Collection/viewer defaults
* Custom 404 page on deployment

---

## Planned Features

Possible future development includes:

* Collection value history
* Additional collection categories
* Consoles
* Computers
* Phones
* Peripherals
* Music and physical media
* Collectibles
* Additional statistics and collection insights

---

## License

Shelfmark is open-source software licensed under the [MIT License](LICENSE).

You are free to use, modify, distribute and build upon the project in accordance with the terms of the license.

Contributions and forks are welcome.

---

## Author

Developed by **MINEGAMERPT**.

GitHub: [@MINEGAMERPTyt](https://github.com/MINEGAMERPTyt)

---

<div align="center">

**Shelfmark**

*Catalog what you keep.*

A personal collection archive.

</div>