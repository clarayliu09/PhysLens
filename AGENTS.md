# PhysLens 2.0 — Agent Instructions

## Project Overview

PhysLens is an AI-powered physics education app that helps students visualize forces and understand physics concepts in real-world scenes.

The goal of PhysLens 2.0 is to develop a reliable, free educational application for students and teachers, targeting an initial public release in spring 2027.

## Technology Stack

- Frontend: React Native, TypeScript, Expo Router
- Backend: Python, FastAPI
- Object detection: YOLO
- Scene understanding: Qwen3-VL
- Physics reasoning: Rule-based physics engine
- Visualization: Interactive force overlays and explanations

## Expo Requirements

Read the documentation matching the project's installed Expo SDK version before modifying frontend code.

Existing project reference:
https://docs.expo.dev/versions/v57.0.0/

Do not upgrade Expo or major dependencies without explicit approval.

## Development Guidelines

- Inspect relevant existing code before proposing changes.
- Preserve existing PhysLens 1.0 functionality unless a change is explicitly requested.
- Prefer small, modular, testable changes.
- Explain architectural changes and their tradeoffs.
- Do not introduce unnecessary dependencies.
- Never commit secrets, credentials, local environment files, or generated caches.
- Do not assume an AI model's output is physically correct.

## AI Pipeline

The existing pipeline uses YOLO for object detection, Qwen3-VL for scene relationships, a rule-based physics engine for force determination, and Qwen for explanations.

Before modifying the pipeline:

1. Establish reproducible baseline test cases.
2. Record existing model outputs and performance.
3. Define measurable evaluation criteria.
4. Compare proposed improvements against the baseline.
5. Check for regressions in previously supported scenes.

Do not replace the existing pipeline without explicit approval.

## Testing

- Add automated tests for physics rules and scene relationships.
- Use deterministic test fixtures wherever possible.
- Keep AI model benchmarks separate from unit tests.
- Test frontend and backend changes independently when practical.
- Report test results and known limitations.

## Git Workflow

- `main`: Stable, release-ready branch.
- `develop`: Integration branch for PhysLens 2.0.
- `feature/*`: Branches for individual improvements.

Do not commit directly to `main` during 2.0 development.

Preserve the `v1.0.0` release tag.

Before committing, review changed files and ensure unrelated changes are excluded.

Recommend descriptive Git commits at coherent development milestones.

## Collaboration

Explain significant code changes so the project owner can understand and maintain the implementation.

Ask before making major architectural decisions, upgrading dependencies, or deleting existing functionality.
