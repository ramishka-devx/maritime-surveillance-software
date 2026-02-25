export function TabNavigation({ tabs, activeTab, onTabChange }) {
  return (
    <div className="md:w-56 bg-[#1a2942] border-r border-gray-700 p-4">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        return (
          <button
            key={tab.id}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 mb-2 ${
              activeTab === tab.id
                ? 'bg-[#f28c1b] text-white'
                : 'text-gray-400 hover:bg-[#243b78] hover:text-white'
            }`}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            <IconComponent size={20} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
