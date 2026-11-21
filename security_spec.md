# TileTown Firestore Security Specification

## Data Invariants
1. A `UserProfile` document at `/users/{userId}` can only be read, created, or updated by an authenticated Google user with `request.auth.uid == userId` and `request.auth.token.email_verified == true`.
2. A `CitySaveState` document at `/users/{userId}/gameState/{saveId}` requires its parent `/users/{userId}` document to exist (Master Gate), and can only be read, created, or updated by `request.auth.uid == userId` (`email_verified == true`).
3. Cloud save deletion (`delete`) and collection `list` scraping are strictly denied (`if false`) so user progress is never deleted and cannot be enumerated by other users.
4. `uid`, `ownerId`, and `createdAt` are immutable after creation; `createdAt` and `updatedAt` must match server `request.time`.
5. `lots` must always be a bounded list of 225 map entries and `boardCells` must always be a bounded list of 225 map entries; numeric counters (`timber`, `brick`, `gold`, `power`, `civicPop`, `turnsPlayed`, `bestPopulation`) must be non-negative integers.

## Dirty Dozen Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Unauthenticated read/write**: `request.auth == null` reading `/users/abc` or `/users/abc/gameState/primary`.
2. **Unverified email**: `request.auth.token.email_verified == false` attempting to create `/users/abc`.
3. **Cross-user PII read**: User `bob` calling `get(/users/alice)`.
4. **Cross-user save overwrite**: User `bob` calling `set(/users/alice/gameState/primary, ...)`.
5. **Identity spoofing on create**: User `bob` creating `/users/bob` with `uid: "alice"`, or `/users/bob/gameState/primary` with `ownerId: "alice"`.
6. **Ghost / shadow field injection**: Creating or updating `/users/bob` with extra key `isAdmin: true`.
7. **Collection list scraping**: Any user calling `list(/users)` or `list(/users/bob/gameState)`.
8. **Cloud save deletion**: Even owner `bob` calling `delete(/users/bob/gameState/primary)`.
9. **Oversized ID poisoning**: Writing `/users/bob/gameState/<150-char string>` or invalid characters in `saveId`.
10. **Tampered timestamp**: Writing `updatedAt` with a client-forged timestamp instead of `request.time`.
11. **Mutating immutable owner/createdAt**: Updating `/users/bob/gameState/primary` while altering `ownerId` or `createdAt`.
12. **Unbounded/malformed array poisoning**: Writing `lots` with size `!= 225` (e.g. `1000` elements) or `boardCells` with size `!= 225`, or negative resources (`gold: -50`).
