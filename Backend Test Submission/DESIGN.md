# URL Shortener Microservice Design

## 1. Technology Selections
- **Language/Runtime:** Node.js
- **Web Framework:** Express.js
  - **Justification:** Express is a lightweight, minimalist, and widely-used framework, making it ideal for rapid development of a microservice with clear API requirements. Its routing and middleware system are perfectly suited for this task.
- **Key Libraries:**
  - `nanoid@3`: Chosen for generating unique, URL-friendly, and collision-resistant shortcodes. Version 3.x is used for CommonJS compatibility.
  - `date-fns`: A modern and reliable library for performing date calculations, specifically for adding minutes to determine the expiry timestamp.

## 2. Data Storage Strategy
- **Method:** In-memory storage using a JavaScript `Map`.
- **Justification:** For the scope and time constraints of this evaluation, an in-memory solution is the most efficient choice. It provides extremely fast read/write access without the overhead of setting up a database connection. This is suitable for a short-lived microservice evaluation.
- **Data Model:** The `Map` will use the `shortcode` as its key. The value will be an object containing all relevant information for the URL.

  ```javascript
  // Example structure of the value stored in the Map
  {
    originalUrl: "https://example.com/a-very-long-url",
    creationDate: "2025-07-29T10:00:00.000Z", // ISO 8601 Format
    expiryDate: "2025-07-29T10:30:00.000Z",   // ISO 8601 Format
    clicks: [
      {
        timestamp: "2025-07-29T10:15:21.123Z",
        referrer: "direct", // or actual referrer header
        location: "N/A" // Per instructions, location is coarse-grained
      }
    ]
  }