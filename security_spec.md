# Security Specification - MOTOFIT.PK

## Data Invariants
1. A user profile cannot be created by another user.
2. A review must belong to a valid product ID.
3. Only verified emails can post reviews.
4. Admin status is strictly controlled by the `/admins` collection.
5. Products/Categories are static/admin-only for writes.

## The Dirty Dozen Payloads (Targeting Firestore)

1. **Self-Promotion to Admin**: Try to update user profile with `isAdmin: true`.
2. **Review Hijacking**: Create a review with a different `userName` than the logged-in user.
3. **Product Price Sabotage**: Anonymously update a product price to 0.
4. **PII Scraping**: List all documents in `/users` as a standard user.
5. **Shadow Fields**: Create a product with extra hidden fields like `verified: true`.
6. **Orphaned Review**: Create a review for a product ID that doesn't exist.
7. **Identity Spoofing**: Create a user profile with a UID that doesn't match `request.auth.uid`.
8. **Spam Attack**: Submit 1000 contact messages in a loop with massive payloads.
9. **ID Poisoning**: Create a product with a 2MB string as an ID.
10. **Terminal State Bypass**: (If status existed) Skip "pending" to "delivered".
11. **Email Spoofing**: Post a review with `email_verified: false` in token.
12. **Array Injection**: Inject a list of 10,000 items into a `fitment` array.

## Test Runner (Mock)
(Verification of permission denied for all above payloads via security rules)
