# fitfind

This repository contains a website that allows you to filter clothes to direct specifications e.g. shoulderwidth or length for t-shirts so everyone can find cloths that fit like they were tailored

erstmal kein backend einfach nur daten per api von verschiedenen websites die dann gefiltert werde am anspruchvollsten wird das webscraping von verschiedenen marken oder so deshalb maybe erstmal nur design

am besten mit persönlichem profil wo man dann irgendwann gut fittende sachen vorgeschlagen bekommt seine maße speichern kann und dann marken bekommt die einem liegen

kein klassisches schwarz weiß design wie bei anderen marken maybe diese schriftart hier und dunkler hintergrund und dan nweiße schrift wie so neue welt in die man eintaucht beim shoppenn also diese klassische coding schrift das logo momentan einfach nur ei nplatzhalter unnd dann kann man oben nso filter einstellen obe nrechts persönliches profil mit einer einkaufsliste was man so sucht und seinen measurements für unterschiedliche kategorien mach erstmal so standardfilter wie größe kategorie preis und marke udn so glaubst du man kann gleich irgednwie von versdchiedenen websiten die produkte scrapen und filtern ob die konkrete daten nfür länge und breite der sachen haben oder lieber erstmal nur das frontend mit desig nam besten nur schwarz weiß so minimalistisch und klassischer checkoutflow mit warenkorb und bezahlen und ne merkliste und dann kann man schauen was von seinen sachen auf der einkaufsliste (needs was ma nbraucht) schon im warenkorb ist und so

use react and javascript please maybe typescript

## entwicklung

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
```

stack: react 19, typescript, vite, react-router. schrift: jetbrains mono.

### struktur

- `src/data/products.ts` – beispielkatalog (fiktive marken) mit maßen pro größe in cm
- `src/data/source.ts` – einziger einstiegspunkt für produktdaten; hier später echte api / scraper-backend anschließen
- `src/lib/fit.ts` – fit-score: vergleicht die maße jeder größe mit deinen zielmaßen
- `src/lib/filter.ts` – standardfilter + filter nach konkreten maßen (min/max in cm)
- `src/lib/needs.ts` – gleicht die einkaufsliste mit warenkorb und merkliste ab
- `src/store/store.tsx` – profil, maße, einkaufsliste, warenkorb, merkliste, bestellungen (in `localStorage`)
- `src/pages/` – shop, produktseite, warenkorb, kasse, merkliste, profil
