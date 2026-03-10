# 🚀 WorkflowPro Automation Engine

**WorkflowPro** is a powerful, low-code automation platform built on the MERN stack (MongoDB, Express, React, Node.js). It allows users to visually design complex business logic flows using a drag-and-drop interface, connecting disparate services like Webhooks, APIs, Databases, and Communication tools (Discord, WhatsApp).

Designed for scalability and extensibility, WorkflowPro features a real-time execution engine capable of handling event-driven architectures.

---

## ✨ Key Features

*   **Visual Workflow Builder**: Intuitive node-based editor powered by React Flow.
*   **Event-Driven Architecture**: Real-time webhook triggers and asynchronous execution.
*   **Diverse Node Library**:
    *   **Triggers**: Webhooks, Schedule (Cron).
    *   **Logic**: Conditional Branching (If/Else), JavaScript Code Execution.
    *   **Data**: Set/Transform Variables, Filter Data.
    *   **Integrations**: HTTP Requests, Google Sheets, Discord, WhatsApp, OpenAI.
*   **Execution Logs**: Comprehensive history of every workflow run with detailed success/failure states.
*   **Secure**: Environment variable management for API keys and secrets.

---

## 🛠️ Tech Stack

*   **Frontend**: React, TypeScript, React Flow, TailwindCSS (for styling components).
*   **Backend**: Node.js, Express, TypeScript.
*   **Database**: MongoDB (Mongoose ODM).
*   **APIs**: Axios for HTTP requests, Google APIs for Sheets integration.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v16+)
*   MongoDB (Local or Atlas)

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/kvtrishagautam/workflowpro.git
    cd workflowpro
    ```

2.  **Install Dependencies**
    ```bash
    # Install Backend Dependencies
    cd ai-workflow-automation/backend
    npm install

    # Install Frontend Dependencies
    cd ../frontend
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in `ai-workflow-automation/backend`:
    ```env
    PORT=4000
    MONGODB_URI=mongodb://localhost:27017/workflow-automation
    JWT_SECRET=your_jwt_secret
    ```

4.  **Run the Application**
    ```bash
    # Start Backend (from backend dir)
    npm run dev

    # Start Frontend (from frontend dir)
    npm start
    ```

---

## 💡 Example Workflow: "Nathan's Sales Order Processing"

This project includes a fully configured demonstration workflow designed to automate e-commerce order handling.

### The Scenario
When a new order is received:
1.  **Webhook Trigger**: Listens for incoming POST requests at `/api/webhook/nathans-orders`.
2.  **HTTP Request**: Fetches customer details from an external API (simulated via JSONPlaceholder).
3.  **Conditional Logic**: Checks the `orderStatus`.
    *   **If "Processing"**: Appends the order to a **Google Sheet** for finance review.
    *   **If "Booked"**: Calculates weekly revenue using custom JavaScript and sends a **Discord** notification.

### How to Test
A custom HTML trigger page is included for easy testing:
1.  Open `webhook_trigger.html` in your browser.
2.  Fill out the Order Form (Status: "Processing" or "Booked").
3.  Click **Submit Order**.
4.  Watch the magic happen in your Google Sheet or Discord channel!

---

## 📂 Project Structure

```
workflowpro/
├── ai-workflow-automation/
│   ├── backend/            # Express Server & Logic
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── executors/  # Node Execution Logic (The Brains)
│   │   │   ├── models/     # Database Schemas
│   │   │   └── services/   # Workflow Engine
│   └── frontend/           # React Application
│       ├── src/
│       │   ├── components/ # Nodes & UI Elements
│       │   ├── pages/      # Editor & Dashboard
│       │   └── services/   # API Clients
├── webhook_trigger.html    # Testing Tool
└── README.md               # Documentation
```

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## 📄 License

This project is licensed under the MIT License.
