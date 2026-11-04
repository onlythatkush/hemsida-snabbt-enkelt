/** Customer-scoped demo proposals exported from Lovable. No runtime Lovable dependency. */
export const lovableDemos: Record<string, any> = { "ORD-982DZR": {
  "schemaVersion": 1,
  "reference": "ORD-982DZR",
  "designSource": "lovable",
  "status": "proposal",
  "language": "sv",
  "previewUrl": "https://id-preview--c4c5821b-8445-4392-bd5d-b2c5cacd625f.lovable.app",
  "company": {
    "name": "Peters däck & fälgar",
    "city": "Karlshamn",
    "tagline": "Personlig service för däck och fälgar i Karlshamn."
  },
  "customerFacts": {
    "address": {
      "street": "Horsarydsvägen 2",
      "postalCode": "374 93",
      "city": "Karlshamn",
      "full": "Horsarydsvägen 2, 374 93 Karlshamn"
    },
    "phone": {
      "display": "070-533 87 42",
      "href": "tel:+46705338742"
    },
    "openingHours": null,
    "openingHoursText": "Kontakta oss för öppettider.",
    "email": null,
    "socialLinks": [],
    "notes": [
      "Öppettider är inte verifierade och ska inte hittas på.",
      "Inga omdömen, priser eller utmärkelser är verifierade och ska inte visas.",
      "Facebook-länk utelämnas tills en verifierad URL finns."
    ]
  },
  "requestedServices": [
    {
      "id": "dack",
      "title": "Sommar- & vinterdäck",
      "category": "product"
    },
    {
      "id": "falgar",
      "title": "Fälgar",
      "category": "product"
    },
    {
      "id": "hjulpaket",
      "title": "Kompletta hjulpaket",
      "category": "product"
    },
    {
      "id": "dackbyte",
      "title": "Däckbyte",
      "category": "service"
    },
    {
      "id": "balansering",
      "title": "Balansering",
      "category": "service"
    },
    {
      "id": "punktering",
      "title": "Punkteringslagning",
      "category": "service"
    },
    {
      "id": "dackhotell",
      "title": "Däckhotell",
      "category": "service"
    }
  ],
  "palette": {
    "mode": "dark",
    "accent": "#2563eb",
    "accentGlow": "#5b8def",
    "background": "#0d1117",
    "surface": "#161b24",
    "foreground": "#f4f6fa",
    "mutedForeground": "#9aa3b2",
    "border": "#262d3a",
    "onAccent": "#fafafa"
  },
  "typography": {
    "display": {
      "family": "Sora",
      "weights": [
        500,
        600,
        700
      ],
      "source": "Google Fonts"
    },
    "body": {
      "family": "Manrope",
      "weights": [
        400,
        500,
        600,
        700
      ],
      "source": "Google Fonts"
    },
    "eyebrow": {
      "style": "uppercase",
      "letterSpacing": "0.25em",
      "size": "small"
    }
  },
  "hero": {
    "eyebrow": "Däck & fälgar · Karlshamn",
    "headline": "Personlig service med rätt grepp i Karlshamn",
    "highlight": "rätt grepp",
    "subheadline": "Sommardäck, vinterdäck och fälgar till de flesta fordon – med däckskifte, balansering och däckhotell.",
    "image": "hero",
    "overlay": "Mörk gradient över bilden för läsbar text",
    "primaryCta": "book",
    "secondaryCta": "call"
  },
  "sections": [
    {
      "id": "products",
      "route": "/dack-falgar",
      "eyebrow": "Däck & Fälgar",
      "title": "Rätt hjul för din bil",
      "items": [
        {
          "title": "Sommar- & Vinterdäck",
          "text": "Däck för sommar och vinter till de flesta fordon. Vi hjälper dig välja rätt däck för din bil och din körning.",
          "image": "tires"
        },
        {
          "title": "Snygga fälgar",
          "text": "Fälgar som ger bilen ett lyft. Vi hjälper dig hitta fälgar som passar ditt fordon.",
          "image": "rims"
        },
        {
          "title": "Kompletta hjulpaket",
          "text": "Däck och fälg i ett – monterat och klart, så att du enkelt kan rulla vidare.",
          "image": "package"
        }
      ]
    },
    {
      "id": "services",
      "route": "/tjanster",
      "eyebrow": "Tjänster",
      "title": "Vi tar hand om hjulen",
      "items": [
        {
          "title": "Däckskifte & Balansering",
          "text": "Vi byter dina däck och balanserar hjulen för en jämn och trygg körning.",
          "image": "balancing"
        },
        {
          "title": "Punkteringslagning",
          "text": "Fått punktering? Vi lagar däcket när det är möjligt, så att du kommer vidare.",
          "image": "puncture"
        },
        {
          "title": "Däckhotell",
          "text": "Låt oss förvara dina däck mellan säsongerna – du slipper släpa och sparar plats hemma.",
          "image": "hotel"
        }
      ]
    },
    {
      "id": "cta-band",
      "title": "Dags för däckbyte?",
      "text": "Ring Peter så hittar vi en tid som passar dig.",
      "cta": "call"
    },
    {
      "id": "contact",
      "route": "/kontakt",
      "eyebrow": "Kontakt",
      "title": "Boka däckbyte",
      "text": "Enklast är att ringa – då hittar vi en tid direkt.",
      "blocks": [
        "phone",
        "address",
        "openingHoursText",
        "map"
      ],
      "map": {
        "provider": "google-maps-embed",
        "query": "Horsarydsvägen 2, 374 93 Karlshamn",
        "directionsUrl": "https://www.google.com/maps/search/?api=1&query=Horsarydsv%C3%A4gen%202%2C%20374%2093%20Karlshamn"
      }
    }
  ],
  "imagery": [
    {
      "key": "hero",
      "path": "src/assets/hero.jpg",
      "width": 1920,
      "height": 1088,
      "subject": "Närbild på en elegant svart fälg med lågprofildäck i dramatiskt, mörkt ljus med blå reflexer."
    },
    {
      "key": "tires",
      "path": "src/assets/tires.jpg",
      "subject": "Rad av nya sommar- och vinterdäck med tydligt mönster i verkstadsmiljö."
    },
    {
      "key": "rims",
      "path": "src/assets/rims.jpg",
      "subject": "Moderna lättmetallfälgar på rad, blankpolerade."
    },
    {
      "key": "package",
      "path": "src/assets/package.jpg",
      "subject": "Komplett hjul – däck monterat på fälg – redo att sättas på bilen."
    },
    {
      "key": "balancing",
      "path": "src/assets/balancing.jpg",
      "subject": "Hjul i balanseringsmaskin i verkstad."
    },
    {
      "key": "puncture",
      "path": "src/assets/puncture.jpg",
      "subject": "Närbild på punkteringslagning av ett däck."
    },
    {
      "key": "hotel",
      "path": "src/assets/hotel.jpg",
      "subject": "Prydligt staplade däck i förvaringsställ (däckhotell)."
    }
  ],
  "callsToAction": [
    {
      "id": "call",
      "label": "Ring 070-533 87 42",
      "href": "tel:+46705338742",
      "priority": 1,
      "placement": [
        "header",
        "hero",
        "cta-band",
        "contact",
        "mobile-menu"
      ]
    },
    {
      "id": "book",
      "label": "Boka däckbyte",
      "href": "/kontakt",
      "priority": 2,
      "placement": [
        "hero"
      ]
    },
    {
      "id": "directions",
      "label": "Vägbeskrivning i Google Maps",
      "href": "https://www.google.com/maps/search/?api=1&query=Horsarydsv%C3%A4gen%202%2C%20374%2093%20Karlshamn",
      "priority": 3,
      "placement": [
        "contact",
        "footer"
      ]
    }
  ],
  "visualDirection": {
    "mood": "Mörk, modern verkstadskänsla med blå accent – tekniskt men personligt.",
    "layout": "Helskärmshero med bild, kortrutnät i tre kolumner för produkter och tjänster, tydligt ring-band, kontaktsida med karta.",
    "components": [
      "sticky header med blur",
      "rundade kort med bild och hover-lyft",
      "pillerformade knappar med blå gradient och glöd",
      "karta i sidfot och på kontaktsidan"
    ],
    "responsive": "Mobil först; meny fälls ihop till knapp, kort staplas i en kolumn, ring-knapp alltid nåbar.",
    "accessibility": [
      "Hoppa till innehåll-länk",
      "tangentbordsnavigerbar meny med aria-expanded",
      "aria-current på aktiv sida",
      "alt-text på hero-bild",
      "lang=sv"
    ],
    "avoid": [
      "påhittade öppettider",
      "omdömen",
      "priser",
      "utmärkelser",
      "kontaktformulär som låtsas skicka"
    ]
  }
} }
