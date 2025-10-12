# Copilot Instructions

This document provides guidance for AI coding agents to effectively contribute to the Ifyoumind project.

## Project Overview

Ifyoumind is a web application built with Angular and Firebase. It allows users to share and discover ideas. The project uses Tailwind CSS for styling and `ngx-joyride` for user onboarding.

### Key Technologies

- **Angular**: The core framework for the frontend application.
- **Firebase**: Provides the backend services, including Authentication, Firestore, and Storage.
- **Tailwind CSS**: Used for styling the application.
- **ngx-joyride**: A library for creating guided tours and onboarding experiences.

## Architecture

The application follows a standard Angular architecture with components, services, and routing.

### Components

- **`app.component`**: The root component of the application.
- **`idea-card`**: A reusable component for displaying an idea.
- **`idea-list`**: Displays a list of ideas.
- **`idea-submit`**: A form for submitting a new idea.
- **`onboarding`**: The user onboarding flow, powered by `ngx-joyride`.

### Services

- **`auth-helper.service.ts`**: Provides helper functions for Firebase Authentication.
- **`idea.service.ts`**: Handles all CRUD operations for ideas, interacting with the Firestore database.
- **`bookmark.service.ts`**: Manages user bookmarks.
- **`analytics.service.ts`**: Logs analytics events.

### Routing

The application's routes are defined in `src/app/app.routes.ts`. Key routes include:

- `/`: The main page, displaying a list of ideas.
- `/idea/:id`: The detail page for a single idea.
- `/submit`: The page for submitting a new idea.
- `/onboarding`: The user onboarding flow.

## Development Workflow

### Getting Started

1.  Install the dependencies:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm start
    ```
    The application will be available at `http://localhost:4200`.

### Building

To create a production build, run:

```bash
npm run build
```

This command also generates a `sitemap.xml` file using the `scripts/generate-sitemap.js` script.

### Testing

To run the unit tests, use the following command:

```bash
npm test
```

## Key Integrations

### Firebase

The project is tightly integrated with Firebase. The Firebase configuration is located in `src/app/firebase.config.ts`.

- **Authentication**: User authentication is handled by Firebase Authentication. The `auth.guard.ts` and `onboarding.guard.ts` protect routes that require authentication.
- **Firestore**: The application's data, including ideas and user information, is stored in Firestore. The `idea.service.ts` is a good example of how the application interacts with Firestore.
- **Storage**: User-generated content, such as profile photos, is stored in Firebase Storage.

### Tailwind CSS

The project uses Tailwind CSS for styling. The configuration file is `tailwind.config.js`.

### ngx-joyride

The `ngx-joyride` library is used for the user onboarding flow. The `onboarding.component.ts` and `onboarding.component.html` files contain the implementation of the onboarding tour.

## Conventions and Patterns

- **Service-Based Architecture**: The application makes extensive use of services to encapsulate business logic and data access.
- **Smart and Dumb Components**: The project follows the smart and dumb component pattern. Smart components are responsible for fetching and managing data, while dumb components are responsible for displaying data.
- **Reactive Programming**: The application uses RxJS for managing asynchronous operations.
- **Custom Scripts**: The project includes a custom script, `scripts/generate-sitemap.js`, which is run as part of the build process.
