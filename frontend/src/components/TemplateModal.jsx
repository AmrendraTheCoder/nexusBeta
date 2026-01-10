import React, { useState } from "react";
import { X, FileText, Play, Sparkles, Zap, Lock, Search, Star, ArrowRight, Info, TrendingUp, HeartPulse, Globe, Brain } from "lucide-react";
import { allTemplates } from "../constants/workflowTemplate";

const categories = [
  { id: "all", label: "All", icon: <Sparkles size={14} /> },
  { id: "nexus", label: "x402", icon: <Lock size={14} /> },
  { id: "defi", label: "DeFi", icon: <Zap size={14} /> },
  { id: "risk", label: "Risk", icon: <HeartPulse size={14} /> },
  { id: "crosschain", label: "Cross-Chain", icon: <Globe size={14} /> },
  { id: "ai", label: "AI", icon: <Brain size={14} /> },
];

const difficultyColors = {
  Beginner: "bg-green-100 text-green-700",
  Intermediate: "bg-amber-100 text-amber-700",
  Advanced: "bg-red-100 text-red-700",
};

const categoryIcons = {
  nexus: <Lock size={18} className="text-violet-500" />,
  defi: <TrendingUp size={18} className="text-amber-500" />,
  risk: <HeartPulse size={18} className="text-red-500" />,
  crosschain: <Globe size={18} className="text-blue-500" />,
  ai: <Brain size={18} className="text-purple-500" />,
};

export default function TemplateModal({ isOpen, onClose, onLoadTemplate }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleLoadTemplate = (template) => {
    onLoadTemplate(template);
    onClose();
  };

  const filteredTemplates = allTemplates.filter((template) => {
    const matchesCategory = activeCategory === "all" || template.category === activeCategory;
    const matchesSearch = !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Sliding Panel - Wide */}
      <div className={`fixed top-0 right-0 h-full w-[700px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-indigo-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">Workflow Templates</h2>
              <p className="text-xs text-slate-500">Pre-built x402 workflows</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
            <X size={18} />
          </button>
        </div>

        {/* Search & Categories */}
        <div className="px-5 py-3 border-b border-slate-100 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeCategory === cat.id
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content - Split View */}
        <div className="flex-1 overflow-hidden flex">
          {/* Template List */}
          <div className="w-2/5 border-r border-slate-100 overflow-y-auto">
            <div className="p-3 space-y-2">
              {filteredTemplates.map((template, index) => {
                const icon = categoryIcons[template.category] || <FileText size={18} className="text-slate-400" />;
                const isSelected = selectedTemplate === template;
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedTemplate(template)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${isSelected
                      ? "border-violet-400 bg-violet-50"
                      : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                  >
                    <div className="flex items-start gap-2">
                      {icon}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h4 className="font-medium text-slate-800 text-sm truncate">{template.name}</h4>
                          {template.featured && <Star size={10} className="text-amber-500 fill-amber-500" />}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{template.description}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${difficultyColors[template.difficulty]}`}>
                            {template.difficulty}
                          </span>
                          <span className="text-[10px] text-slate-400">{template.nodes.length} nodes</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredTemplates.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-sm">No templates found</div>
              )}
            </div>
          </div>

          {/* Details Panel */}
          <div className="flex-1 overflow-y-auto p-5">
            {selectedTemplate ? (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-800">{selectedTemplate.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{selectedTemplate.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${difficultyColors[selectedTemplate.difficulty]}`}>
                      {selectedTemplate.difficulty}
                    </span>
                    <span className="text-xs text-slate-500">{selectedTemplate.nodes.length} nodes</span>
                  </div>
                </div>

                {selectedTemplate.learnMore && (
                  <div className="mb-4 p-3 bg-violet-50 border border-violet-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info size={14} className="text-violet-500 mt-0.5" />
                      <p className="text-xs text-violet-700">{selectedTemplate.learnMore}</p>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">Workflow Steps</h4>
                  <div className="space-y-1.5">
                    {selectedTemplate.nodes.map((node, i) => (
                      <div key={node.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                        <div className="w-5 h-5 bg-violet-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                          {i + 1}
                        </div>
                        <span className="text-xs text-slate-700">{node.data.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleLoadTemplate(selectedTemplate)}
                  className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white px-4 py-3 rounded-xl hover:bg-violet-700 transition-all font-medium"
                >
                  <Play size={16} />
                  Load Template
                </button>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <FileText size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a template</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
