# Support Ticket & SLA Tracker

A full-stack Support Ticket and SLA (Service Level Agreement) tracking system built with a focus on backend architecture, role-based workflows, and business-hour-aware SLA calculations.

---

## Overview

This project implements a role-based ticket management system where users can create tickets and agents can manage, respond, and resolve them. The system tracks SLA deadlines strictly within working hours and provides clear status indicators based on remaining time.

The application is designed with a clean separation between backend services and frontend UI, using GraphQL for structured communication.

---

## Features

### Authentication & Roles

* JWT-based authentication (register/login)
* Role-based access control (`USER`, `AGENT`)
* Password validation (minimum length enforced)

### Ticket Management

* Users can create tickets with priority levels:

  * `HIGH`
  * `MEDIUM`
  * `LOW`
* Ticket lifecycle:

  * `OPEN` → `IN_PROGRESS` → `RESOLVED`
* Agents can:

  * Assign tickets to themselves or other agents
  * Work only on assigned tickets
* Prevents invalid or duplicate assignments

### Comments System

* Users and assigned agents can add comments
* Comments include author details
* First response time is automatically tracked

### SLA Tracking

* SLA deadlines based on priority:

  * HIGH → 2 hours
  * MEDIUM → 8 hours
  * LOW → 24 hours
* Only business hours are counted:

  * 9 AM – 6 PM
  * Monday to Friday
* SLA status:

  * `ON_TRACK`
  * `AT_RISK`
  * `BREACHED`

### Ticket Resolution

* Only assigned agents can resolve tickets
* Only tickets in `IN_PROGRESS` state can be resolved

### Pagination & Filtering

* Paginated ticket listing
* Filters:

  * Status
  * Priority
  * Assigned agent
* Response includes metadata:

  * `total`
  * `page`
  * `limit`

---

## Tech Stack

### Backend

* Bun (runtime and package manager)
* Node.js (ecosystem compatibility)
* TypeScript
* GraphQL
* Prisma ORM
* PostgreSQL

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### Dev & Tooling

* Docker (database setup)
* Prisma Client
* JWT Authentication

---

## Runtime Choice

The backend uses **Bun** as the primary runtime and package manager to improve development speed and performance, while still leveraging the Node.js ecosystem and libraries.

---

## Project Structure

```
server/
  src/
    modules/
      auth/
      ticket/
      utils/
    schema.graphql
    server.ts

client/
  src/
    components/
    pages/
    lib/
    types/
```

---

## Key Backend Concepts

### SLA Calculation

* Deadlines are computed using business-hour-aware logic
* Weekends and non-working hours are excluded
* SLA status is calculated based on remaining business time

### RBAC (Role-Based Access Control)

* Enforced at service and resolver level
* Controls access to:

  * Ticket assignment
  * Commenting
  * Ticket resolution

### Database Design

* Managed with Prisma ORM
* Relationships:

  * Ticket → Creator (User)
  * Ticket → Assigned Agent (User)
  * Ticket → Comments
  * Comment → User

---

## Running the Project

### Backend Setup

```
cd server
bun install
```

Create a `.env` file:

```
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_secret
```

Run database setup:

```
bun prisma db push
bun prisma generate
```

Start server:

```
bun run dev
```

---

### Frontend Setup

```
cd client
npm install
npm run dev
```

---

## Testing

### Backend Tests

```
cd server
npx vitest run
```

### Type Checking

```
cd client
npx tsc --noEmit
```

---

## Database Reset (for clean testing)

```
npx prisma db push --force-reset
npx prisma generate
```

---

## Notes

* GraphQL is used for all API communication
* Errors are handled using `GraphQLError` with structured codes
* Business logic is separated into service layers
* Designed to be simple, modular, and extensible

---

## Possible Improvements

* Email notifications for SLA breaches
* Admin role for centralized assignment control
* Activity logs for ticket history
* Real-time updates using GraphQL subscriptions

---
