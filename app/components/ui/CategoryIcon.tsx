import { categoryIcons, categoryColors } from "@/app/lib/categoryConfig"; 
import {  type LucideIcon } from "lucide-react";

type Props = {
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: { container: 24, icon: 12, font: 10, radius: 6 },
  md: { container: 36, icon: 15, font: 13, radius: 10 },
  lg: { container: 44, icon: 18, font: 16, radius: 12 },
};

export function CategoryIcon({ name, color, size = "md" }: Props) {
  const s = sizes[size];

  // Check if this category has a Lucide icon in our map
  const Icon: LucideIcon | undefined = categoryIcons[name];

  // Use the color from props (custom category) or from our map (built-in)
  const iconColor =
    color ?? categoryColors[name] ?? "rgba(255,255,255,0.4)";

  // Built-in category — use Lucide icon
  if (Icon) {
    return (
      <span
        style={{
          width: `${s.container}px`,
          height: `${s.container}px`,
          borderRadius: `${s.radius}px`,
          background: `${iconColor}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={s.icon} color={iconColor} strokeWidth={2} />
      </span>
    );
  }

  // Custom category — use letter avatar
  return (
    <span
      style={{
        width: `${s.container}px`,
        height: `${s.container}px`,
        borderRadius: `${s.radius}px`,
        background: `${iconColor}18`,
        border: `1px solid ${iconColor}30`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontFamily: "(--font-display)",
        fontWeight: 800,
        fontSize: `${s.font}px`,
        color: iconColor,
      }}
    >
      {name[0]?.toUpperCase() ?? "?"}
    </span>
  );
}