# P2 — Food Database, Nutrition Calculator, PDF Export

**Date:** 2026-04-02
**Status:** Approved

---

## Overview

Three features requested by Carolina (P2 priority): curated Brazilian pet food database with autocomplete, NRC-based nutrition calculator, and PDF export of medical records via pdfkit.

## Decisions

| Decision | Choice |
|----------|--------|
| Food data source | Static curated dataset (~50 brands, seeded) |
| Calculator precision | Full NRC formula (weight, age, neutered, activity) |
| PDF generation | Server-side with pdfkit (no Chromium) |

---

## 1. Food Brand Database

### Prisma Model
```prisma
model FoodBrand {
  id           String   @id @default(cuid())
  name         String
  line         String
  species      Species
  sizeCategory String?
  type         FoodType @default(DRY)
  kcalPerKg    Float
  proteinPct   Float?
  fatPct       Float?
  fiberPct     Float?
  imageUrl     String?
  createdAt    DateTime @default(now())

  @@index([species, name])
  @@map("food_brands")
}
```

### Seed Data
~150 entries covering the top ~50 Brazilian brands with 2-5 product lines each:
- Royal Canin (Mini Adult, Medium Adult, Golden Retriever, Kitten, etc.)
- Premier (Raças Específicas, Golden, Seleção Natural)
- Golden (Filhotes, Adultos, Sênior, por porte)
- Granplus (Choice, Menu)
- Pro Plan (Puppy, Adult, Senior, por porte)
- N&D (Ancestral Grain, Prime, Quinoa)
- Hills (Science Diet, Prescription)
- Whiskas, Pedigree (linhas básicas)
- Guabi Natural, Biofresh, True, Farmina
- Cat lines: Whiskas, Royal Canin Feline, Premier Gatos, Golden Gatos

Each entry includes: name, line, species, sizeCategory, type, kcalPerKg (from package label).

### Endpoint
```
GET /food-brands?species=DOG&q=royal&size=medium
→ { data: [{ id, name, line, species, kcalPerKg, proteinPct, ... }] }
```

### Frontend
- Onboarding step 3: "Marca da ração" becomes autocomplete (like breed selector)
- Selecting a brand auto-fills kcalPerKg into FoodConfig
- Food page: same autocomplete when changing brand
- New hook: `useFoodBrands(species, query)`

---

## 2. Nutrition Calculator

### Formula (NRC Standard)
```
RER = 70 × (weight_kg ^ 0.75)

Base factor:
  Puppy (<12 months):        3.0
  Adult neutered:             1.6
  Adult intact:               1.8

Activity multiplier:
  LOW:                        0.9
  MODERATE:                   1.0
  HIGH:                       1.2

kcal_per_day = RER × base_factor × activity_multiplier
grams_per_day = (kcal_per_day / kcal_per_kg) × 1000
grams_per_meal = grams_per_day / meals_per_day
```

### Data Sources (all from existing pet fields)
- `pet.weight` → kg
- `pet.birthDate` → age → puppy or adult
- `pet.neutered` → base factor
- `pet.activityLevel` → activity multiplier
- `foodConfig.mealsPerDay` → division
- `foodBrand.kcalPerKg` → from selected brand OR foodConfig.kcalPerKg fallback

### Backend
New service: `src/services/nutrition.js`
```js
export function calculateNutrition({ weight, birthDate, neutered, activityLevel, kcalPerKg, mealsPerDay })
→ { rer, kcalPerDay, gramsPerDay, gramsPerMeal }
```

Endpoint `GET /pets/:petId/food` returns additional field:
```json
{
  "data": {
    ...foodConfig,
    "recommended": {
      "kcalPerDay": 1050,
      "gramsPerDay": 300,
      "gramsPerMeal": 150
    }
  }
}
```

### Frontend (Food page)
New card "Porção Recomendada":
- 🔢 **300g/dia** (total daily)
- 🍽️ **150g por refeição** (per meal)
- ⚡ **1050 kcal/dia** (energy need)
- ⚠️ Warning if configured portion differs >15% from recommended

---

## 3. PDF Export

### Backend
Endpoint: `GET /pets/:petId/records/export`

Dependencies: `pdfkit` (new)

Response headers:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="prontuario-{petName}.pdf"
```

### PDF Structure
1. **Header** — PetLife logo text + generation date
2. **Pet Info** — Name, breed, age, weight, neutered, microchip, allergies
3. **Vaccines** — Table with name, date, next due, clinic, vet
4. **Dewormings** — Table with name, product, date, next due
5. **Medications** — Active and past, with dose, frequency, duration
6. **Consultations** — Date, type, vet, notes
7. **Weight History** — Table with date + value
8. **Records** — Full chronological list

### Service
`src/services/pdfExport.js` — builds PDF document using pdfkit streams.

### Freemium Gate
- FREE: button disabled, shows "Disponível no Premium"
- PREMIUM: download works
- Backend: `planGate('pdf_export')` middleware on the endpoint

### Frontend
- Button "Exportar PDF" on Records page header
- Button "Exportar prontuário" on Settings
- Triggers: `window.open(API_URL + '/pets/' + petId + '/records/export?token=' + accessToken)`
- Token passed as query param (since browser download can't set Authorization header)

---

## 4. Files Summary

### Backend (new/modified)
```
prisma/schema.prisma          ← add FoodBrand model
prisma/seed-foods.js          ← NEW: seed ~150 food brands
src/services/nutrition.js     ← NEW: NRC calculator
src/services/pdfExport.js     ← NEW: pdfkit PDF generator
src/routes/food-brands.js     ← NEW: GET /food-brands
src/routes/food.js            ← modify: add recommended field
src/routes/records.js         ← modify: implement export endpoint
package.json                  ← add pdfkit dependency
```

### Frontend (new/modified)
```
src/hooks/useFoodBrands.js    ← NEW: React Query hook
src/pages/Onboarding.jsx      ← modify: brand autocomplete
src/pages/Food.jsx             ← modify: recommended card + brand autocomplete
src/pages/Records.jsx          ← modify: export button
src/pages/Settings.jsx         ← modify: export button
```
