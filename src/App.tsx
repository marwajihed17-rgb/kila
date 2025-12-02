import { useState } from "react";
import { LoginPage } from "./components/LoginPage";
import { Dashboard } from "./components/Dashboard";
import { InvoiceProcessing } from "./components/InvoiceProcessing";
import { KDRProcessing } from "./components/KDRProcessing";
import { GAProcessing } from "./components/GAProcessing";
import { KDRInvoicing } from "./components/KDRInvoicing";
import { ChatInterface } from "./components/ChatInterface";

export default function App() {
  const [currentPage, setCurrentPage] = useState<
    "login" | "dashboard" | "invoice" | "kdr" | "ga" | "kdr-invoicing" | "chat"
  >("login");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#1a1233] to-[#0f1419] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#4A90F5] opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#C74AFF] opacity-10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-[#5EC5E5] opacity-5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {currentPage === "login" && (
          <LoginPage
            onLogin={() => setCurrentPage("dashboard")}
          />
        )}
        {currentPage === "dashboard" && (
          <Dashboard
            onNavigate={(page) => setCurrentPage(page)}
            onLogout={() => setCurrentPage("login")}
          />
        )}
        {currentPage === "invoice" && (
          <InvoiceProcessing
            onBack={() => setCurrentPage("dashboard")}
            onLogout={() => setCurrentPage("login")}
          />
        )}
        {currentPage === "kdr" && (
          <KDRProcessing
            onBack={() => setCurrentPage("dashboard")}
            onLogout={() => setCurrentPage("login")}
          />
        )}
        {currentPage === "ga" && (
          <GAProcessing
            onBack={() => setCurrentPage("dashboard")}
            onLogout={() => setCurrentPage("login")}
          />
        )}
        {currentPage === "kdr-invoicing" && (
          <KDRInvoicing
            onBack={() => setCurrentPage("dashboard")}
            onLogout={() => setCurrentPage("login")}
          />
        )}
        {currentPage === "chat" && (
          <ChatInterface
            onBack={() => setCurrentPage("dashboard")}
            onLogout={() => setCurrentPage("login")}
          />
        )}
      </div>
    </div>
  );
}