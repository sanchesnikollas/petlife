# PetLife Community Feature — Design Spec

**Date:** 2026-03-30
**Status:** Approved

## Overview

Add a Community section to PetLife — a social layer where pet tutors can interact, share tips, and connect through breed, city, and topic-based groups. The feature is fully client-side with mock data (localStorage, same architecture as existing features).

## Decisions Log

| Decision | Choice |
|----------|--------|
| Navigation | 6 tabs in BottomNav (add Community as 4th tab) |
| Pet social card | Customizable — tutor chooses which fields to display |
| Group structure | Fixed categories (breed, city, topic) — no user-created groups |
| Feed format | Instagram-style social feed (large photos, like, comment, share) |
| Share mechanism | Web Share API (external only) with copy-link fallback |
| Internal navigation | Top tab bar: Feed, Grupos, Meu Cartão (same pattern as Health page) |
| Architecture | Separate CommunityContext (isolated from PetContext) |

---

## 1. Navigation — BottomNav Changes

- Add "Comunidade" as 6th tab at position 4 (between Alimentacao and Prontuario)
- Icon: `Users` from lucide-react
- Order: Home | Saude | Alimentacao | **Comunidade** | Prontuario | Config
- Reduce label font from `text-[10px]` to `text-[9px]`, min-width from `3.5rem` to `3rem`
- Same active/inactive visual pattern (primary bg + scale when active)

## 2. Community Page — Sub-tabs

Container page `Community.jsx` with 3 horizontal pill tabs at the top:

- **Feed** — social feed showing posts from followed groups
- **Grupos** — browseable grid of all available groups
- **Meu Cartão** — pet social card editor

Sub-tabs follow the same visual pattern as Health page (horizontal pills with optional counts).

## 3. Feed Social

### Post Card Layout
- **Header:** Pet avatar (circular, 40px) + pet name (bold) + group name (secondary text) + relative time ("ha 2h")
- **Image:** Large photo, aspect-ratio 4:3, rounded-lg
- **Action bar:** Heart (like), MessageCircle (comment), Share2 (share) — icons aligned left
- **Like count:** "12 curtidas" next to heart
- **Caption:** Pet name bold + post text. Truncated at 2 lines with "ver mais" expand
- **Comments teaser:** "Ver todos os 5 comentarios" — opens comment modal

### Interactions
- **Like:** Toggle Heart icon with scale-in animation + danger color (red). Double-tap on image also likes (large heart animation overlay, Instagram-style)
- **Comment:** Opens Modal bottom-sheet with flat comment list + fixed input at bottom
- **Share:** `navigator.share({ title, text, url })` with fallback to clipboard copy + toast confirmation
- **Feed composition:** Shows posts from all followed groups, sorted by date descending
- **Empty state:** "Siga grupos para ver posts aqui" with CTA to Grupos tab

## 4. Groups

### Groups Grid
- 2-column card grid, separated by category headers
- Each card: emoji/icon + group name + member count + "Seguindo" badge if followed
- 3 fixed categories:
  - **Por Raca:** Golden Retriever, Siamese, Bulldog, Poodle, Labrador, SRD
  - **Por Cidade:** Sao Paulo, Rio de Janeiro, Belo Horizonte, Curitiba, Brasilia
  - **Por Tema:** Saude, Alimentacao, Adestramento, Passeios, Filhotes

### Group Interactions
- Tap card → opens filtered feed (same feed UI, posts from that group only)
- Follow/Unfollow toggle button on card with animation
- Group feed header: group name + emoji + member count + back button
- FAB inside group feed to create new post → opens CreatePostModal (text + optional photo + category)

### Auto-suggestion
- On first load, groups matching the active pet's breed and popular topics are pre-followed in mock data

## 5. Pet Social Card (Meu Cartão)

### Card Visual
- Premium "business card" style — subtle gradient background (primary-lighter → white)
- Pet photo: centered, circular, primary border, shadow
- Pet name: font-display (DM Serif Display), breed below in font-body
- Configurable fields in 2-column grid: age, weight, city, personality
- Group badges: pills with emoji + group name (max 3 visible + "+N" overflow)
- Edit icon (Pencil) top-right corner

### Edit Modal
- Toggle per field: name, breed, age, weight, city, personality, photo — each toggle shows/hides the field on the card
- City: free text input
- Personality: select with options — Brincalhao, Calmo, Aventureiro, Timido, Protetor, Bagunceiro
- Live preview of the card while editing

### Data Source
- Reads name, breed, age, weight, photo from PetContext via `usePet()` hook (read-only)
- Extra fields (city, personality, field visibility) stored in CommunityContext
- Switching pets via PetSwitcher updates the card automatically

## 6. Architecture

### New Files
```
src/
  context/CommunityContext.jsx
  data/communityMockData.js
  pages/Community.jsx
  components/community/
    CommunityFeed.jsx
    PostCard.jsx
    CommentModal.jsx
    CreatePostModal.jsx
    CommunityGroups.jsx
    GroupFeed.jsx
    PetSocialCard.jsx
    EditCardModal.jsx
```

### Modified Files
- `src/components/BottomNav.jsx` — add 6th tab, adjust sizing
- `src/App.jsx` — add `/community` route, wrap with CommunityProvider

### CommunityContext.jsx
- **State:** `followedGroups[]`, `posts[]`, `petCards{}`, `comments{}`
- **Persistence:** localStorage key `petlife_community_data`
- **Functions:**
  - `toggleFollow(groupId)` — follow/unfollow a group
  - `toggleLike(postId)` — like/unlike a post
  - `addComment(postId, comment)` — add comment to a post
  - `createPost(post)` — add new post to feed
  - `updatePetCard(petId, cardData)` — update social card settings

### communityMockData.js
- 15-20 posts distributed across groups with placeholder photos
- 15 fixed groups (5 breed + 5 city + 5 topic) with names, emojis, member counts
- 3-5 comments on popular posts
- Fictional tutor profiles (name + pet + avatar) for mock posts
- Pre-configured pet cards for Luna (mockPet) and Milo (mockPet2)

### Integration
- PetContext is NOT modified — CommunityContext reads pet data via `usePet()` hook
- CommunityProvider wraps only the `/community` route (not the entire app)
- Route: `/community` inside Layout (has BottomNav)

## 7. Design System Compliance

- All components use existing CSS variables (--color-primary, --color-accent, etc.)
- Animations: fade-in-up for page, scale-in for likes, slide-up for modals
- Typography: DM Serif Display for headings, Plus Jakarta Sans for body
- Cards follow `.card-interactive` pattern
- Modals follow existing Modal.jsx bottom-sheet pattern
- Mobile-first: max-w-lg container, safe-area support
- Staggered children animations with nth-child delays
