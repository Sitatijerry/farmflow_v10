# FarmFlow 2.0 UI Specification

## Overview
FarmFlow 2.0 is a comprehensive farm management system designed to streamline agricultural operations, provide data-driven insights, and facilitate efficient team coordination. This document outlines the user interface specifications, covering visual identity, screen layouts, component behaviors, and key interactions.

## Visual Identity

### Colors
The application primarily uses a palette of greens, grays, and whites, with accent colors for alerts and interactive elements.

| Category        | Color Name      | Hex Code (Approximate) | Usage                                       |
| :-------------- | :-------------- | :--------------------- | :------------------------------------------ |
| **Primary**     | Forest Green    | `#2D5A27`              | Main branding, active states, primary buttons |
| **Secondary**   | Light Green     | `#A5D6A7`              | Secondary accents, background elements      |
| **Background**  | Light Gray      | `#F5F5F5`              | Page backgrounds, card backgrounds          |
| **Text Primary**| Dark Gray       | `#212121`              | Main text, headings                         |
| **Text Secondary**| Medium Gray     | `#757575`              | Subheadings, descriptive text, disabled states |
| **Alert (Critical)**| Red             | `#D32F2F`              | Error messages, critical status indicators  |
| **Alert (Warning)**| Yellow          | `#FBC02D`              | Warning messages, attention indicators      |

### Spacing
Spacing appears to follow a consistent system, likely based on multiples of 4px or 8px, ensuring visual harmony and readability.

- **Small**: 8px (e.g., spacing between icons and text, internal padding within small components)
- **Medium**: 16px (e.g., padding within cards, spacing between form elements)
- **Large**: 24px - 32px (e.g., section margins, spacing between major UI blocks)

### Typography
The application utilizes the Inter font family for a clean, modern, and highly readable interface.

| Element         | Font Family   | Weight      | Size (Approximate) | Usage                                       |
| :-------------- | :------------ | :---------- | :----------------- | :------------------------------------------ |
| **Headings (H1)**| Inter         | Semi-bold   | 32px               | Main page titles                            |
| **Headings (H2)**| Inter         | Semi-bold   | 24px               | Section titles                              |
| **Body Text**   | Inter         | Regular     | 16px               | General content, paragraphs                 |
| **Labels/Inputs**| Inter         | Regular     | 14px               | Form labels, input text                     |
| **Captions**    | Inter         | Regular     | 12px               | Small descriptive text, footnotes           |

## Component States

### Buttons
- **Default**: Solid background with primary green, white text. Rounded corners.
- **Hover**: Background darkens slightly, indicating interactivity.
- **Pressed**: Background darkens further, providing tactile feedback.
- **Disabled**: Grayed out background and text, reduced opacity, non-interactive.

### Input Fields
- **Default**: Light gray background, subtle border, rounded corners.
- **Focus**: Border color changes to primary green, indicating active input.
- **Error**: Border color changes to red, often accompanied by an error message below the field.
- **Read-only**: Similar to default but with a distinct background shade or dashed border, non-editable.

### Navigation Items
- **Default**: Icon and text in secondary text color.
- **Active**: Icon and text in primary green, possibly with a highlight bar or background.
- **Hover**: Slight background change or text color shift.

## Mobile Responsiveness
The design is adaptive, ensuring optimal viewing and interaction across various screen sizes.

- **Sidebar**: On smaller screens (e.g., mobile, tablet), the persistent left sidebar collapses into a hamburger menu, accessible from the top-left corner.
- **Card Layouts**: Content cards and data visualizations transition from multi-column grids to a single-column stacked layout on mobile devices.
- **Data Tables**: Complex data tables are either horizontally scrollable or transform into simplified card-like views, displaying key information per row.

## Screens

### 1. Dashboard (Command Center)
- **Purpose**: Provides a real-time, high-level overview of farm operations, environmental conditions, and critical alerts.
- **Key Components**:
  - **Weather Widget**: Displays current temperature, humidity, and a short-term forecast. Includes visual icons for weather conditions.
  - **Activity Feed**: Lists upcoming and recently completed tasks, such as irrigation schedules and fertilizing events.
  - **Key Metrics Cards**: Displays vital statistics like UV Index, Soil Moisture levels (with visual indicators), and Expected Yield (with comparison to previous seasons).
  - **AI Alert Center**: A prominent section for notifications requiring immediate attention.
- **Interactions**:
  - Clicking on the "AI Alert Center" or individual alerts reveals detailed notifications or suggested actions.
  - A "Schedule Next Task" button likely triggers a modal or navigates to a task creation interface.

### 2. Operational Management
- **Purpose**: Facilitates the tracking and management of ongoing farm tasks and resource utilization.
- **Key Components**:
  - **Active Task Queue**: A list or table showing current tasks with their progress bars, status, and assigned workers.
  - **Resource Usage Monitor**: Visualizations (e.g., charts) for water and power consumption, with historical data and real-time updates.
  - **Live Field Monitoring**: A mini-map or simplified visual representation of the farm, showing active equipment or worker locations.

### 3. Plots Management
- **Purpose**: Offers a spatial view of the farm, allowing users to monitor individual plot health and details.
- **Key Components**:
  - **Interactive Farm Map**: A central map displaying all farm plots, color-coded based on their health status (e.g., Green for Healthy, Orange for Needs Attention, Red for Critical).
  - **Sector Detail Cards**: Upon selecting a plot, a sidebar or overlay displays detailed information such as Health Index percentage, current Moisture levels, and the date of the Last Feed.
  - **Boundary Editor**: A tool that allows administrators to define or modify the boundaries of farm plots directly on the map.
- **Interactions**:
  - Clicking on a plot on the map highlights it and displays its detailed information.
  - The boundary editor provides tools for drawing, resizing, and saving plot areas.

### 4. Farm Analytics & Reports
- **Purpose**: Provides data-driven insights into farm performance, resource allocation, and historical trends.
- **Key Components**:
  - **Yield Trends Graph**: A line graph showing crop yield over a specified period (e.g., 6 months), allowing for comparison with previous periods.
  - **Resource Allocation Pie Chart**: Visualizes the distribution of resources such as water, fertilizer, and seeds across different farm activities or plots.
  - **Performance Audit Table**: A detailed table presenting plot-wise performance metrics, potentially including yield per acre, resource efficiency, and growth rates.
  - **Custom Report Generation**: Options to filter data and generate custom reports based on various parameters.

### 5. Settings Management
- **Purpose**: Allows administrators to configure system settings, manage user accounts, and integrate with external devices.
- **Key Components**:
  - **Profile Identity**: Section for managing the administrator's profile, including name, contact information, and avatar.
  - **Access Hierarchy**: Manages user roles and permissions, including the creation and management of farm worker accounts.
  - **Operational Integrations**: Settings for connecting and configuring IoT sensors, automated irrigation systems, and other farm technologies.
  - **System Preferences**: General application settings, notifications, and language options.

## Special Feature: Farm Worker Management
Within the **Settings Management** page, there is a dedicated section for managing farm workers. This feature is crucial for enabling field operations and ensuring proper access control.

- **Worker Creation Form**: Administrators can create new farm worker profiles by providing essential details:
  - **Name**: Full name of the farm worker.
  - **Role**: The specific role or designation of the worker (e.g., Harvester, Irrigation Specialist).
  - **Contact**: Contact information, such as phone number or email.
  - **Assigned Sector**: The specific farm plots or areas the worker is responsible for.
- **Login Workflow**: Upon creation, the system automatically generates a unique login ID for the new farm worker. This ID is then used by the worker to log in to a separate, simplified "Farm Worker UI" (which is outside the scope of this document but acknowledged as an existing interface). This ensures that farm workers have access only to the functionalities relevant to their tasks, maintaining security and operational focus.

## Conclusion
This UI specification provides a detailed overview of the FarmFlow 2.0 application, highlighting its visual design, interactive elements, and functional flows. The design prioritizes clarity, ease of use, and data acce