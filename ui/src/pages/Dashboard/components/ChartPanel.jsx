import React from "react";
import { ChevronDown } from "lucide-react";

export function ChartPanel() {
  const chartData = [
    { height: "35%", color: "bg-blue-100" },
    { height: "40%", color: "bg-blue-100" },
    { height: "30%", color: "bg-blue-100" },
    { height: "55%", color: "bg-blue-100" },
    { height: "80%", color: "bg-orange-400" }, // The orange highlight
    { height: "65%", color: "bg-blue-100" },
    { height: "50%", color: "bg-blue-100" },
    { height: "35%", color: "bg-blue-100" },
    { height: "25%", color: "bg-blue-100" },
    { height: "20%", color: "bg-blue-100" },
    { height: "30%", color: "bg-blue-100" },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-800">Fleet Activity Volume (Last 24H)</h3>
        <button className="flex items-center gap-2 text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors">
          All Sectors <ChevronDown size={16} />
        </button>
      </div>

      {/* Chart Area */}
      <div className="flex-1 p-6 flex flex-col justify-end relative h-64">
        {/* Y Axis Guidelines */}
        <div className="absolute inset-0 p-6 pb-8 pt-8 flex flex-col justify-between z-0">
          <div className="flex items-center w-full">
            <span className="text-xs text-gray-400 w-8">500</span>
            <div className="h-px bg-gray-100 flex-1 ml-2"></div>
          </div>
          <div className="flex items-center w-full">
            <span className="text-xs text-gray-400 w-8">250</span>
            <div className="h-px bg-gray-100 flex-1 ml-2"></div>
          </div>
          <div className="flex items-center w-full">
            <span className="text-xs text-gray-400 w-8">0</span>
            <div className="h-px bg-gray-100 flex-1 ml-2"></div>
          </div>
        </div>

        {/* Bars */}
        <div className="flex justify-between items-end h-full z-10 ml-12 pr-4 space-x-1.5 pb-[2px]">
          {chartData.map((data, idx) => (
            <div 
              key={idx} 
              className={`w-full flex-1 rounded-sm ${data.color} hover:opacity-80 transition-opacity cursor-pointer`}
              style={{ height: data.height }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
