import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Badge } from "../../components/ui/Badge";
import { cn } from "../../utils/cn";
import { GeneralSettingsTab } from "./Settings/GeneralSettingsTab";
import { IntegrationsTab } from "./Settings/IntegrationsTab";
import { ServicesTab } from "./Settings/ServicesTab";
import { MultiAgendaTab } from "./Settings/MultiAgendaTab";

type Tab = "general" | "services" | "multi-agenda" | "integrations";

export function DashboardSettings() {
  const [activeTab, setActiveTab] = useState<Tab>("general");

  const tabs = [
    { id: "general" as Tab, label: "Geral", icon: "⚙️" },
    { id: "services" as Tab, label: "Serviços", icon: "🛠️" },
    { id: "multi-agenda" as Tab, label: "Multi-Agenda", icon: "👥" },
    { id: "integrations" as Tab, label: "Integrações", icon: "🔌" }
  ];

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden">
      <header className="flex flex-col gap-2 flex-shrink-0">
        <Badge variant="secondary" className="bg-primary/10 text-primary w-fit">
          Configurações
        </Badge>
        <h1 className="text-2xl font-bold text-secondary-900">Configurações do Sistema</h1>
        <p className="text-sm text-secondary-600 max-w-2xl">
          Gerencie as configurações gerais, integrações e serviços do sistema
        </p>
      </header>

      {/* Tabs */}
      <div className="flex-shrink-0 border-b-2 border-primary/20">
        <nav className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-6 py-3 text-sm font-semibold transition-all border-b-2 relative",
                activeTab === tab.id
                  ? "text-primary border-primary"
                  : "text-secondary-600 border-transparent hover:text-primary hover:border-primary/30"
              )}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto min-h-0">
        {activeTab === "general" && <GeneralSettingsTab />}
        {activeTab === "services" && <ServicesTab />}
        {activeTab === "multi-agenda" && <MultiAgendaTab />}
        {activeTab === "integrations" && <IntegrationsTab />}
      </div>
    </div>
  );
}

