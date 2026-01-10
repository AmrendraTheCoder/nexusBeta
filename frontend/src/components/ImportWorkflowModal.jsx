
import React, { useState } from "react";
import { X, Upload, FileJson, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ImportWorkflowModal({ isOpen, onClose, onImport }) {
    const [jsonCode, setJsonCode] = useState("");
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                // Validate JSON
                JSON.parse(content);
                setJsonCode(content);
                setError(null);
            } catch (err) {
                setError("Invalid JSON file");
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    };

    const handleImport = () => {
        if (!jsonCode.trim()) {
            setError("Please enter JSON code or upload a file");
            return;
        }

        try {
            const parsed = JSON.parse(jsonCode);
            onImport(parsed);
            onClose();
            setJsonCode("");
            setError(null);
        } catch (err) {
            setError("Invalid JSON format: " + err.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                            <Upload size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Import Workflow</h2>
                            <p className="text-sm text-slate-500">Upload a file or paste JSON code</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* File Upload Area */}
                    <div className="relative group">
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center group-hover:border-indigo-400 group-hover:bg-indigo-50/30 transition-all">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-500 transition-colors">
                                <FileJson size={24} />
                            </div>
                            <p className="text-sm font-medium text-slate-700">Click to upload JSON file</p>
                            <p className="text-xs text-slate-400 mt-1">or drag and drop here</p>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-slate-400 font-semibold tracking-wider">Or paste code</span>
                        </div>
                    </div>

                    {/* Code Textarea */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Workflow JSON</label>
                        <textarea
                            value={jsonCode}
                            onChange={(e) => {
                                setJsonCode(e.target.value);
                                setError(null);
                            }}
                            placeholder='{ "type": "workflow", ... }'
                            className="w-full h-48 bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm animate-in slide-in-from-top-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-200/50 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={!jsonCode.trim()}
                        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                    >
                        <CheckCircle2 size={18} />
                        Import Workflow
                    </button>
                </div>

            </div>
        </div>
    );
}
