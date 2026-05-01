const Topbar = () => {
  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 ml-64">
      <div className="text-slate-600 text-sm font-medium">Maritime Surveillance System</div>
      <div className="flex items-center gap-3">
        <span className="text-slate-700 text-sm font-bold">Operator</span>
        <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
      </div>
    </div>
  );
};

export default Topbar;
