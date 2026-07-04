export function TabNavigation({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex flex-col w-full h-fit">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        return (
          <button
            key={tab.id}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold text-sm transition-all mb-2 ${
              activeTab === tab.id
                ? 'bg-[#1b397e] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
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
