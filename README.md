# zettacamp-be

Backend service for **Zettacamp**, built with Node.js, GraphQL, and MongoDB. This application handles entities such as **User**, **Student**, and **School**, each with a modular and validated schema-resolver-model structure.

## Getting Started

### 1. Configure environtment

```bash
cp .env.example .env
```

This will install all required Node.js modules listed in `package.json`.
### 2. Install Dependencies

```bash
npm install
```

This will install all required Node.js modules listed in `package.json`.

### 3. Start the Development Server

```bash
npm run dev
```

Runs the server in development mode using `nodemon`. GraphQL Playground will be accessible at:

```
http://localhost:4000/graphql
```

---

## Application Flow

1. Client sends a GraphQL request (query or mutation) to `/graphql`.
2. The request is routed to the appropriate resolver based on schema.
3. Input is validated using functions in `*.validator.js`.
4. The resolver interacts with the Mongoose model to query or mutate the database.
5. Relationships like `student -> school` are optimized using DataLoader (`*.loader.js`).
6. Errors are handled using helper functions (e.g., `CreateAppError`, `HandleCaughtError`), ensuring structured responses.

---

## Tech Stack

* **Node.js** & **Express** for server environment
* **GraphQL** for API schema and communication
* **Mongoose** for MongoDB object modeling
* **DataLoader** to batch and cache relational queries
* **Custom Validators** for input sanitization
* **Custom Error Handler** for consistent error formatting

---

## Scripts

| Command                | Description                                                 |
| ---------------------- | -------------------------------------------------- |
| `cp .env.example .env` | Copy environment variables template to actual file |
| `npm install`          | Install all project dependencies                   |
| `npm run dev`          | Run the server in development mode                 |

---