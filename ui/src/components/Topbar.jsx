const Topbar = () => {
  return (
    <div className="h-16 bg-[#0b1220] border-b border-gray-800 flex items-center justify-between px-6 ml-64">
      <div className="text-gray-400 text-sm">Maritime Surveillance System</div>
      <div className="flex items-center gap-3">
        <span className="text-gray-300 text-sm">Operator</span>
        <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
      </div>
    </div>
  );
};

export default Topbar;
