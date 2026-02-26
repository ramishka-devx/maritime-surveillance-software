export function TabNavigation({ tabs, activeTab, onTabChange }) {
  return (
    <div className="md:w-48 rounded-2xl border border-white/10 bg-white/5 p-3">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        return (
          <button
            key={tab.id}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold text-base transition-all mb-2 ${
              activeTab === tab.id
                ? 'bg-accent-orange/15 text-accent-orange'
                : 'text-text-muted hover:text-white hover:bg-white/5'
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
