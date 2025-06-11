# HomeSchool Project Brief

## Project Overview
A web application for managing homeschool education, providing tools for guardians and students to track academic progress, manage courses, and analyze test scores.

## Core Features
- Guardian dashboard with student management
- Test score tracking and analysis (SAT/ACT)
- Standard course catalog with search/filter
- PDF transcript generation
- Invitation system for guardian access
- Error handling and monitoring system
- Automated testing suite (Playwright for integration and E2E tests)

## Technical Stack
- Frontend: React + TypeScript + Vite
- Database: Supabase PostgreSQL
- Testing: React Testing Library, Playwright (Jest tests removed)
- Styling: Tailwind CSS
- CI/CD: Netlify

## Current Objectives
- Finalize and stabilize course and test score management features
- Complete PDF transcript generation
- Ensure robust error handling and user notifications
- Focus on reliable integration and E2E testing with Playwright
- Prepare for production deployment

## Current Phase
**Testing & Refinement**
- Transitioned away from Jest tests; focus on Playwright for integration and E2E
- Address remaining test failures in Playwright tests
- Finalize code quality and documentation

## Success Metrics
- High test pass rate
- Fast component and page load times
- No critical production issues