# 🏛️ Campus Voice

Campus Voice is a secure, modern, and anonymous complaint management web application designed to bridge the communication gap between students and college administration. Students can submit concerns anonymously, while department representatives (institution role) and system administrators (admin role) can view, track, respond to, and resolve complaints with data-driven analytics.

---

## 🚀 Key Features

*   **🔒 100% Anonymous Student Feedback**: Students can register and submit complaints securely without their identity being linked to their reports.
*   **📊 Comprehensive Admin Dashboard**: Global overview of all complaints across the institution, displaying status distributions, category distributions, priority charts, and real-time response rates.
*   **🏢 Department Dashboards (Institution Role)**: Custom dashboards for specific categories (Canteen, Hostel, Faculty, Infrastructure, Maintenance, Other) with relevant analytical breakdowns.
*   **💬 Responsive Resolution Thread**: Department handlers and admins can review detailed descriptions, photos, mark reports as "Seen", and post official resolution responses.
*   **⭐ Performance Ratings**: Students can rate the resolution quality (1 to 5 stars) once action is taken on their complaints.
*   **📧 OTP Verification**: Secure password reset flow using OTP emails.
*   **📱 Modern UI/UX**: Designed with sleek Tailwind CSS styles, rich micro-animations, glassmorphism card items, and modern icons.

---

## 🛠️ Tech Stack

*   **Frontend**: React, Vite, Tailwind CSS, Recharts (for Analytics), Lucide Icons, Framer Motion
*   **Backend**: Node.js, Express, TypeScript (run with tsx)
*   **Database**: SQLite (`better-sqlite3` for light, file-based structured storage)
*   **Security**: JSON Web Tokens (JWT) for secure authentication, BcryptJS for password hashing

---

## ⚙️ Configuration & Environment Variables

Create a `.env` file in the root directory (based on `.env.example`). The application loads these variables automatically at startup:

```env
# Gemini AI Configuration (Optional)
GEMINI_API_KEY="your-gemini-api-key"

# JSON Web Token Secret
JWT_SECRET="campus-voice-secret-key-1234567890"

# Google Authentication Keys (OAuth Client ID)
GOOGLE_CLIENT_ID="your-google-client-id"
VITE_GOOGLE_CLIENT_ID="your-google-client-id"

# SMTP Configuration for OTP Verification Emails
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="your-email@example.com"
SMTP_PASS="your-password"
SMTP_FROM="Campus Voice <noreply@campusvoice.com>"
```

---

## 💻 Local Setup & Installation

### Prerequisites

Ensure you have **Node.js** (v18 or higher) installed on your system.

### Steps

1.  **Clone and navigate to the project directory**:
    ```bash
    cd campus-voice
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Setup environment variables**:
    *   Create a copy of `.env.example` named `.env`.
    *   Fill in the required configurations (such as `JWT_SECRET`, SMTP settings, etc.).

4.  **Start the development server**:
    ```bash
    npm run dev
    ```

    The application will launch on **`http://localhost:3000`** containing both the Express backend API and the Vite React frontend.

---

## 🔑 Default Test Accounts (Auto-seeded)

When the application starts for the first time, it automatically initializes the SQLite database (`campus_voice.db`) and seeds the following default accounts for testing:

| Role | Email | Password | Department / Description |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@campusvoice.com` | `admin123` | Global system control dashboard |
| **Canteen Dept** | `canteen@campusvoice.com` | `dept123` | Canteen complaint handler dashboard |
| **Hostel Dept** | `hostel@campusvoice.com` | `dept123` | Hostel complaint handler dashboard |
| **Faculty Dept** | `faculty@campusvoice.com` | `dept123` | Faculty complaint handler dashboard |
| **Infrastructure Dept** | `infrastructure@campusvoice.com` | `dept123` | Infrastructure complaint handler dashboard |
| **Maintenance Dept** | `maintenance@campusvoice.com` | `dept123` | Maintenance complaint handler dashboard |
| **Other Dept** | `other@campusvoice.com` | `dept123` | Miscellaneous complaint handler dashboard |

*Note: Students can register freely via the sign-up page or by using Google Sign-in Mock Mode.*
