# Healthcare & Vehicle Monitoring Dashboard

## Overview
This project is a real-time healthcare and vehicle monitoring dashboard application. It provides comprehensive monitoring of user health metrics and vehicle performance data, featuring real-time updates, alerts, and analytics. The system aims to ensure immediate alerts and data visualization for critical healthcare and vehicle safety management, adapting to scenarios like patient bed movement monitoring in nursing homes.

## User Preferences
Preferred communication style: Simple, everyday language.
Alert frequency: Health and vehicle alerts should appear every 30 seconds maximum to prevent spam.
Branding: System logo should display "하이퍼네트워크 헬스케어" with Network icon.
Authentication: Login system with hardcoded credentials (ID: "test", Password: "test123").
Language: Korean language interface preferred.
Analytics: Weekly statistics should show dynamic, changing data when period buttons are clicked.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Build Tool**: Vite
- **UI/UX Decisions**: Incorporates Radix UI primitives, dynamic data visualization (charts, log-style displays), color-coded health status indicators (정상/경고/위험), and visual status dashboards with SVG icons for bed positions. Full Korean localization is applied across the interface.

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Real-time Communication**: WebSocket server for live data streaming
- **Development**: Hot module replacement with Vite middleware integration

### Database & ORM
- **Database**: PostgreSQL (configured for Neon database)
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Migrations**: Drizzle Kit

### Core Features
- **Data Models**: Users, Health Data (biometric measurements, body temperature), Bed Movement Data (position, intensity, mobility score), Alerts.
- **Real-time Monitoring**: Live data visualization, automated alert generation based on thresholds, real-time chart updates, connection status monitoring.
- **Analytics**: Weekly statistics and trend analysis.
- **Member Management**: User selection, profile management, individual member detail pages with AI health prediction and 7-day forecasting.
- **Location Tracking**: Comprehensive location tracking with dual map visualization and interactive markers, including bed movement patterns.
- **Reporting**: PDF report generation for member health reports and rehabilitation reports.
- **Rehabilitation Management**: Comprehensive rehabilitation therapy tracking system with 5 categories (물리치료, 운동치료, 침상치료, 기능회복훈련, 직원교육), session management, and personal rehabilitation history reports with PDF download functionality.
- **System Transformation**: Designed to be adaptable, with a documented transition from vehicle tracking to patient bed movement monitoring.

## External Dependencies

- **React Ecosystem**: React 18, React DOM, React Query
- **UI Framework**: Radix UI primitives, shadcn/ui components
- **Database**: Drizzle ORM with PostgreSQL support, @neondatabase/serverless
- **Real-time**: WebSocket (ws)
- **Styling**: Tailwind CSS, PostCSS
- **Mapping/PDF**: jsPDF, html2canvas (for PDF generation, specifically for Korean text rendering)

## Recent Changes

### 2025-01-25
- **Visual Status Dashboard for Administrators**: Created comprehensive status overview dashboard
  - Built status-dashboard.tsx with visual patient monitoring interface
  - Added real-time status cards showing bed positions (누움/앉음/서있음) with enhanced SVG icons
  - Implemented health status monitoring with color-coded alerts (위험/주의/정상)
  - Created statistical summary cards for quick overview (위험, 주의, 정상, 누움, 앉음, 서있음 counts)
  - Added navigation button in main admin dashboard header for easy access
  - Integrated real-time health metrics display (heart rate, temperature, blood pressure)
- **Enhanced Status Dashboard Interactivity**: Improved user experience and visual design
  - Added click-to-navigate functionality from status cards to individual member detail pages
  - Enhanced bed position SVG icons with larger size (80x60) and improved visual details
  - Added drop shadows, stroke effects, and enhanced color schemes for better visual appeal
  - Improved icon details with pillow, blanket patterns, and anatomical accuracy
  - Added hover effects and cursor pointer for better user interaction feedback
- **Floor-Based Room Management System with Sidebar Navigation**: Complete restructure of admin dashboard
  - Implemented comprehensive sidebar navigation with floor selection (1F, 2F, 3F) and room management
  - Added room-based member organization system (101-110 per floor format)
  - Created expandable user database with 8 patients across multiple floors and rooms
  - Integrated real-time health status indicators for each member in room selection
  - Designed intuitive navigation flow: Floor → Room → Member selection in left sidebar
  - Restructured main content area to show selected room dashboard with member management
  - Enhanced health data display formatting (fixed heart rate layout to single line display)
  - Added empty room state handling and member count badges for each room
- **Personal Rehabilitation Report System**: Added individual member access to rehabilitation history
  - Created member-rehabilitation-report.tsx with comprehensive personal rehabilitation report format
  - Added "재활치료 내역" button to member profile pages for personal access
  - Implemented PDF download functionality for personal rehabilitation reports with proper Korean formatting
  - Included statistics dashboard, therapy category breakdown, recent sessions, and complete history table
  - Added Progress component from Radix UI for completion rate visualization
  - Structured report includes patient information, treatment statistics, and detailed session records