import React, { useState } from "react";

const helpSections = [
  {
    id: "dashboard",
    title: "Dashboard & Map",
    points: [
      "View live vessel locations with real-time AIS updates.",
      "Click on any vessel pin to view its detailed tracking history.",
      "Geofenced zones are highlighted in red on the map."
    ]
  },
  {
    id: "alerts",
    title: "Alerts Management",
    points: [
      "Alerts are generated when a vessel enters a restricted zone or loses AIS signal.",
      "You can Assign an alert to a specific operator or yourself.",
      "Change the status of an alert (New, In Progress, Resolved, False Positive) to track investigation progress."
    ]
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    points: [
      "Filter reports by specific dates, vessels, or severity levels.",
      "Download a generated report as a PDF document for offline review.",
      "Review the total count of alerts by status and category."
    ]
  },
  {
    id: "permissions",
    title: "Permissions & Access",
    points: [
      "Select an operator from the left sidebar to view their permissions.",
      "Grant or revoke specific module permissions instantly.",
      "View a detailed audit log of an operator's activity by clicking 'View Activity'."
    ]
  }
];

export default function Help() {
  const [activeSectionId, setActiveSectionId] = useState(helpSections[0].id);
  const activeSection = helpSections.find(s => s.id === activeSectionId);

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9]">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex h-[calc(100vh-120px)]">
        
        {/* Left Sidebar Navigation */}
        <div className="w-72 border-r border-gray-100 bg-gray-50/30 flex flex-col">
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="text-gray-800 font-bold mb-3 text-sm px-1">Documentation</div>
            <div className="space-y-1.5">
              {helpSections.map((section) => {
                const isActive = section.id === activeSectionId;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSectionId(section.id)}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg border text-left transition-colors ${
                      isActive 
                        ? 'border-[#1b397e]/30 bg-white ring-1 ring-[#1b397e] shadow-sm'
                        : 'border-transparent bg-transparent hover:bg-gray-200/50 hover:border-gray-300'
                    }`}
                  >
                    <span className={`text-sm font-bold truncate ${isActive ? 'text-[#1b397e]' : 'text-gray-700'}`}>
                      {section.title}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 px-1">
              <div className="text-gray-800 font-bold mb-3 text-sm">Support</div>
              <a 
                href="mailto:support@maritime.com"
                className="w-full flex items-center px-3 py-2.5 rounded-lg border border-transparent bg-transparent hover:bg-gray-200/50 hover:border-gray-300 transition-colors"
              >
                <span className="text-sm font-bold text-gray-700">Contact IT</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 overflow-y-auto py-4 px-8 bg-white">
          <div className="max-w-4xl">
            <div className="flex items-center mb-6 border-b border-gray-100 pb-4">
              <div>
                <h1 className="text-lg font-extrabold text-gray-800">{activeSection.title}</h1>
              </div>
            </div>

            <div className="space-y-4">
              {activeSection.points.map((point, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 bg-gray-50/50">
                  <div className="w-6 h-6 rounded-full bg-[#1b397e]/10 text-[#1b397e] flex items-center justify-center shrink-0 font-bold text-xs">
                    {index + 1}
                  </div>
                  <p className="text-sm font-semibold text-gray-700 leading-relaxed pt-0.5">
                    {point}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
