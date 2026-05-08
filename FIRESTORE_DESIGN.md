# Firestore Database Design for Online Voting System

## Collections Structure

To ensure security, scalability, and prevent duplicate voting, the database is structured into three main collections:

### 1. `candidates` Collection
Stores information about the people/options users can vote for. The vote count is denormalized here for quick retrieval and real-time charts.
*   **Security:** Anyone signed in can read. Only admins can create, update (except the vote count), or delete. The vote count can be updated by any user but is strictly guarded by atomic constraints and a +1 increment rule.
*   **Document ID:** Auto-generated Firebase ID.

**Example Document (`candidates/cand_123`):**
```json
{
  "name": "Alice Smith",
  "description": "Platform focused on education and infrastructure.",
  "imageUrl": "https://example.com/alice.jpg",
  "votes": 142
}
```

### 2. `votes` Collection
Records the actual votes cast. By using the user's UID as the document ID, we guarantee mathematically that a user can only vote once (one document per UID).
*   **Security:** Users can list/read their own vote. Admins can read all. Users can create **only** their own document (where `docId == user.uid`) and it must be created simultaneously with the `candidate.votes` increment via atomic operations. Once created, votes are immutable (cannot be updated or deleted).
*   **Document ID:** The User's Authentication UID.

**Example Document (`votes/user_uid_456`):**
```json
{
  "candidateId": "cand_123",
  "timestamp": "2026-05-07T19:35:00Z" // Firestore Server Timestamp
}
```

### 3. `admins` Collection
Manages role-based access control (RBAC). If a user's UID exists in this collection, they are considered an admin. This is a secure alternative to custom claims for client-side evaluation.
*   **Security:** Any signed-in user can check existence to verify admin status. Admins can only be managed manually from the Firebase Console (cannot be written from the client app).
*   **Document ID:** The User's Authentication UID.

**Example Document (`admins/user_uid_789`):**
```json
{
  "email": "admin@example.com"
}
```

## Why this design is secure & scalable:
1.  **Duplicate Voting Prevention:** The structure `votes/{userId}` natively prevents double voting because the document ID is the `userId`. The security rules lock this down.
2.  **Scalable counting:** Instead of querying all votes and counting them (which costs 1 read per vote), we keep a running tally in the `candidates` collection. This allows real-time dashboards with minimal read costs.
3.  **Security Rules:** The system is protected by robust Firestore security rules `firestore.rules` that enforce atomic transactions (using `existsAfter`/`getAfter` parity or batched writes) ensuring a user can't increment a candidate's vote count without simultaneously generating their own immutable vote receipt.
