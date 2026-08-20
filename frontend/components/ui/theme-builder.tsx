"use client";

import React, { useState } from "react";
import { useTheme } from "@/contexts/theme-context";
import { Sun, Moon, Monitor, Check, X, Palette, RotateCcw } from "lucide-react";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-[#2B2E33] w-24">{label}</label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-10 rounded cursor-pointer border-2 border-[#C1C4C8]"
      />
      <span className="text-sm text-[#7B7F85] font-mono">{value}</span>
    </div>
  );
}

export function ThemeBuilder() {
  const { 
    theme, 
    setTheme, 
    actualTheme,
    customColors,
    setCustomColors,
    previewTheme,
    applyPreview,
    cancelPreview,
    isPreviewing,
    resetCustomColors,
  } = useTheme();

  const [localColors, setLocalColors] = useState(customColors);

  const handleColorChange = (key: keyof typeof customColors, value: string) => {
    const updated = { ...localColors, [key]: value };
    setLocalColors(updated);
    setCustomColors({ [key]: value });
  };

  const handlePreview = () => {
    previewTheme(theme, localColors);
  };

  const handleApply = () => {
    applyPreview();
    setLocalColors(customColors);
  };

  const handleCancel = () => {
    cancelPreview();
    setLocalColors(customColors);
  };

  const handleReset = () => {
    resetCustomColors();
    setLocalColors(customColors);
  };

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ];

  return (
    <div className="p-6 rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-[#2B2E33]" />
          <h3 className="text-lg font-semibold text-[#2B2E33]">Theme Builder</h3>
        </div>
        {isPreviewing && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#C1C4C8] text-[#2B2E33] text-sm font-medium hover:bg-[#7B7F85] transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#10B981] text-white text-sm font-medium hover:bg-[#059669] transition-colors"
            >
              <Check className="w-4 h-4" />
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Theme Mode Selection */}
      <div>
        <label className="block text-sm font-medium text-[#2B2E33] mb-2">Theme Mode</label>
        <div className="flex gap-2">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isActive = theme === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive
                    ? "bg-[#2B2E33] text-white"
                    : "bg-white text-[#2B2E33] border border-[#C1C4C8] hover:bg-[#C1C4C8]/20"
                }`}
              >
                <Icon className="w-4 h-4" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Picker */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-[#2B2E33]">Custom Colors</label>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-sm text-[#7B7F85] hover:text-[#2B2E33] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </button>
        </div>
        
        <div className="space-y-3 p-4 rounded-lg bg-white border border-[#C1C4C8]">
          <ColorPicker
            label="Primary"
            value={localColors.primary}
            onChange={(value) => handleColorChange("primary", value)}
          />
          <ColorPicker
            label="Secondary"
            value={localColors.secondary}
            onChange={(value) => handleColorChange("secondary", value)}
          />
          <ColorPicker
            label="Accent"
            value={localColors.accent}
            onChange={(value) => handleColorChange("accent", value)}
          />
          <ColorPicker
            label="Background"
            value={localColors.background}
            onChange={(value) => handleColorChange("background", value)}
          />
          <ColorPicker
            label="Surface"
            value={localColors.surface}
            onChange={(value) => handleColorChange("surface", value)}
          />
          <ColorPicker
            label="Text"
            value={localColors.text}
            onChange={(value) => handleColorChange("text", value)}
          />
          <ColorPicker
            label="Border"
            value={localColors.border}
            onChange={(value) => handleColorChange("border", value)}
          />
        </div>
      </div>

      {/* Preview Actions */}
      {!isPreviewing && (
        <div className="flex gap-2">
          <button
            onClick={handlePreview}
            className="flex-1 px-4 py-2 rounded-lg bg-[#2B2E33] text-white font-medium hover:bg-[#7B7F85] transition-colors"
          >
            Preview Changes
          </button>
        </div>
      )}

      {/* Current Theme Info */}
      <div className="text-sm text-[#7B7F85]">
        <p>Current mode: <span className="font-medium text-[#2B2E33]">{theme}</span></p>
        <p>Resolved theme: <span className="font-medium text-[#2B2E33]">{actualTheme}</span></p>
        {isPreviewing && (
          <p className="text-[#F59E0B] mt-1">Previewing changes - Apply or Cancel to continue</p>
        )}
      </div>
    </div>
  );
}
