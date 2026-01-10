import React, { useState, useEffect } from "react";
import { X, Settings, Save, RotateCcw, Globe, Zap, Server, Wallet } from "lucide-react";

const DEFAULT_SETTINGS = {
  chainId: 240,
  apiUrl: "http://localhost:3000",
  nexusBackendUrl: "http://localhost:3001",
  mockProviderUrl: "http://localhost:4000",
  autoUseConnectedWallet: true,
};

export default function GlobalSettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("nexus_global_settings");
    if (stored) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      } catch (e) {
        console.error("Failed to parse settings:", e);
      }
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? parseInt(value) : value,
    }));
  };

  const handleSave = () => {
    localStorage.setItem("nexus_global_settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem("nexus_global_settings");
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      
      <div className={`fixed top-0 right-0 h-full w-[420px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`}>
        {/* Header with Cronos Branding */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
              <Settings size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">Settings</h2>
              <p className="text-xs text-slate-500">Cronos zkEVM Configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Network Section */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={16} className="text-blue-600" />
              <span className="text-sm font-semibold text-slate-700">Network</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Chain ID</label>
                <select
                  name="chainId"
                  value={settings.chainId}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={240}>Cronos zkEVM Testnet (240)</option>
                  <option value={25}>Cronos Mainnet (25)</option>
                  <option value={338}>Cronos Testnet (338)</option>
                  <option value={84532}>Base Sepolia (84532)</option>
                </select>
              </div>
            </div>
          </div>

          {/* API Endpoints Section */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <Server size={16} className="text-blue-600" />
              <span className="text-sm font-semibold text-slate-700">API Endpoints</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Workflow Engine URL</label>
                <input
                  type="text"
                  name="apiUrl"
                  value={settings.apiUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  placeholder="http://localhost:3000"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Nexus Backend URL</label>
                <input
                  type="text"
                  name="nexusBackendUrl"
                  value={settings.nexusBackendUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  placeholder="http://localhost:3001"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Mock Provider URL</label>
                <input
                  type="text"
                  name="mockProviderUrl"
                  value={settings.mockProviderUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  placeholder="http://localhost:4000"
                />
              </div>
            </div>
          </div>

          {/* Wallet Section */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <Wallet size={16} className="text-blue-600" />
              <span className="text-sm font-semibold text-slate-700">Wallet</span>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="autoUseConnectedWallet"
                checked={settings.autoUseConnectedWallet}
                onChange={handleChange}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Auto-use connected wallet</span>
            </label>
          </div>

          {/* Cronos Info */}
          <div className="px-5 py-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-blue-600" />
                <span className="text-xs font-semibold text-blue-700">Powered by Cronos zkEVM</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Experience fast, low-cost transactions with zero-knowledge security on the Cronos ecosystem.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg text-sm font-medium transition-all"
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              saved 
                ? "bg-green-600 text-white" 
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <Save size={14} />
            {saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      </div>
    </>
  );
}

// Hook to access settings from other components
export function useGlobalSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const loadSettings = () => {
    const stored = localStorage.getItem("nexus_global_settings");
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  };

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  return settings;
}
