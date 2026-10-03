# Ifyoumind

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## ifYouMind 2.0 foundation

The intelligence domain is separate from the legacy ideas application. This
change adds organization APIs and local isolation; the existing UI remains the
legacy product until the next UI slice.

### Local development (no production Firebase resources)

Use the declared Functions Node 20 runtime, Java 17 or later for this pinned
Firebase CLI emulator, and install from both lockfiles:

```bash
npm ci
npm --prefix functions ci
npm run emulators
```

In a second terminal:

```bash
npm run start:local
```

The explicit `local` Angular configuration replaces Firebase settings with the
`demo-ifyoumind` project. Auth (9099), Firestore (8080), Functions (5001), Storage
(9199), and the emulator UI (4000) bind to 127.0.0.1. Firebase Analytics is disabled.
`npm start` retains the existing Firebase configuration; use `start:local` for 2.0
work. `build:local` skips the production sitemap script.

### Organization access

`createIntelligenceOrganization({ name })` requires authentication and creates
one initial workspace per identity. A transaction creates the organization,
owner membership, and private owner index together. Repeated calls return the
same workspace and cannot restore disabled membership.

`getIntelligenceOrganization({ organizationId })` loads active membership using
the authenticated UID. Client-supplied roles and legacy profile flags grant no
access. The Angular `OrganizationService` wraps these callables.

Data lives under `intelligenceOrganizations/{organizationId}`. Clients can read
their organization, their own membership, insights, and Pulse reports when active.
All client writes and other subcollection reads are denied. New API endpoints
must use the shared `authorizeOrganization` helper; the Admin SDK bypasses rules.
No invitation, role editing, connector, or billing endpoint is exposed yet.

### Checks

```bash
npm --prefix functions test
npm run test:rules
npm run test:organizations
npm run build:local
npm run build
```

The existing lint errors and legacy test compilation errors are recorded in the
Notion audit. They are not a passing baseline. Functions dependencies and emitted
`lib` output are no longer tracked; build before running or deploying Functions.
