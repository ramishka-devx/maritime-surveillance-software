export function TabNavigation({ tabs, activeTab, onTabChange }) {
  return (
    <div className="md:w-48 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm h-fit">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        return (
          <button
            key={tab.id}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold text-sm transition-all mb-2 ${
              activeTab === tab.id
                ? 'bg-[#0b74c9]/10 text-[#0b74c9]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            <IconComponent size={16} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
