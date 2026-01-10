import React, { useState, useRef, useEffect } from "react";
import {
    ChevronDown, BarChart3, Newspaper, Code, Book, Trash2,
    Wand2, Play, Settings, Calculator, Download, Upload
} from "lucide-react";

/**
 * ToolsDropdown - Utility tools and canvas actions
 */
export default function ToolsDropdown({
    onOpenCharts,
    onOpenNews,
    onOpenExport,
    onOpenDocs,
    onClearCanvas,
    onLayout,
    onLoadDemo,
    onOpenSettings,
    onOpenCostEstimator,
    onOpenImport,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toolSections = [
        {
            title: "Data",
            items: [
                { icon: BarChart3, label: "Charts", onClick: onOpenCharts },
                { icon: Newspaper, label: "News Feed", onClick: onOpenNews },
            ],
        },
        {
            title: "Workflow",
            items: [
                { icon: Calculator, label: "Cost Estimator", onClick: onOpenCostEstimator },
                { icon: Wand2, label: "Auto-Layout", onClick: onLayout },
                { icon: Play, label: "Load Demo", onClick: onLoadDemo },
            ],
        },
        {
            title: "Import/Export",
            items: [
                { icon: Upload, label: "Import JSON", onClick: onOpenImport },
                { icon: Download, label: "Export", onClick: onOpenExport },
            ],
        },
        {
            title: "Other",
            items: [
                { icon: Book, label: "Documentation", onClick: onOpenDocs },
                { icon: Settings, label: "Settings", onClick: onOpenSettings },
                { icon: Trash2, label: "Clear Canvas", onClick: onClearCanvas, danger: true },
            ],
        },
    ];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isOpen
                    ? "bg-slate-200 text-slate-800"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                    }`}
            >
                Tools
                <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
                    {toolSections.map((section, sIndex) => (
                        <div key={sIndex} className="py-1 border-b border-slate-100 last:border-b-0">
                            <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {section.title}
                            </p>
                            {section.items.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        item.onClick?.();
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left ${item.danger
                                            ? "text-red-600 hover:bg-red-50"
                                            : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                >
                                    <item.icon size={15} />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
