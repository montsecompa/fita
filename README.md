# FITA – Fotografia d'Incidències al Territori Ambiental

A simple public form for reporting litter and debris in Mallorca. Anyone can open the link on their phone, take a photo, and send it with the time, the location and (optionally) the type of litter from the EU Joint List of Litter Categories (J-List). No app or account is needed.

The form is available in Mallorquí, Castellano, Deutsch and English. Add `?lang=ca`, `?lang=es`, `?lang=de` or `?lang=en` to the link to open it in a specific language.

**Live form:** https://montsecompa.github.io/fita/

## How it works

- `index.html` is the form, hosted with GitHub Pages.
- Each report is sent to a Google Apps Script web app (`Code.gs`). The script saves the photo to the Google Drive folder "FITA – fotos" and adds a row to the Google Sheet "FITA – Avisos".

## Location

1. If the photo contains GPS coordinates, those are used.
2. Otherwise, if the photo was taken in the last 15 minutes, the form asks the phone for its location. For older photos it doesn't, because the person has probably moved, and asks them to type the place instead. Change the 15 minutes with `MAX_AGE_MIN` in `index.html`.
3. People can also type the place or paste a Google Maps link, and coordinates in the text are picked up.

The Sheet records which source was used.

## Updating

- **The form:** edit `index.html` in this repository. GitHub Pages republishes it within a minute or two.
- **The script:** edit it in Apps Script, then Deploy → Manage deployments → Edit → Version: New version → Deploy. The web app address stays the same.

## Categories

Litter types and J-codes follow *A Joint List of Litter Categories for Marine Macrolitter Monitoring* (Fleet et al., JRC, 2021).
