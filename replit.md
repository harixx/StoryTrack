# Overview

This is an LLM Citation Tracker application that helps journalists and content creators monitor where their published stories are being cited across large language model platforms. The system allows users to publish stories, generate search queries automatically or manually, and track when their content appears in LLM responses with confidence scoring and context analysis.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with dedicated pages for Dashboard, Stories, Queries, and Citations
- **UI Components**: Radix UI primitives with shadcn/ui design system and Tailwind CSS for styling
- **State Management**: TanStack Query for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form schemas

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **API Design**: RESTful API with endpoints for stories, search queries, citations, and dashboard analytics
- **Storage Layer**: Abstracted storage interface with in-memory implementation (MemStorage) that can be swapped for database implementations
- **Request Processing**: Custom middleware for logging API requests and responses with duration tracking

## Data Storage Solutions
- **Database**: PostgreSQL configured via Drizzle ORM with migration support
- **Schema Design**: Four main entities - Stories, Search Queries, Search Results, and Citations with proper foreign key relationships
- **Connection**: Neon Database serverless PostgreSQL with connection pooling
- **Migration Strategy**: Drizzle Kit for schema migrations and database evolution

## Authentication and Authorization
- **Session Management**: Express sessions with connect-pg-simple for PostgreSQL session storage
- **Security**: CORS handling and request validation middleware
- **API Protection**: Centralized error handling with status code management

## External Dependencies

### Core LLM Integration
- **OpenAI API**: Primary LLM service integration using GPT-5 model for query generation and citation searching
- **Citation Detection**: Custom algorithm that analyzes LLM responses for story mentions with confidence scoring
- **Query Generation**: AI-powered generation of natural search queries based on story content and tags

### Development and Build Tools
- **Vite**: Frontend build tool with React plugin and development server
- **TypeScript**: Full-stack type safety with shared schema definitions
- **ESBuild**: Production backend bundling for optimized server deployment
- **Replit Integration**: Development environment plugins for error overlay and cartographer tooling

### UI and Styling Framework
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Radix UI**: Accessible component primitives for complex UI interactions
- **Shadcn/ui**: Pre-built component library with consistent design patterns
- **Embla Carousel**: Responsive carousel components for content display

### Data Validation and Processing
- **Zod**: Runtime type validation and schema definition shared between client and server
- **Drizzle Zod**: Integration between Drizzle ORM and Zod for database schema validation
- **Date-fns**: Date manipulation and formatting utilities