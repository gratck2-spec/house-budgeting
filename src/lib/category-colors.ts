export const categoryColors: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  Material: {
    bg: "bg-[#C2703E]",
    text: "text-white",
    darkBg: "dark:bg-[#E8956A]",
    darkText: "dark:text-[#1A1612]",
  },
  "Upah tukang": {
    bg: "bg-[#7A9B76]",
    text: "text-white",
    darkBg: "dark:bg-[#9ABF96]",
    darkText: "dark:text-[#1A1612]",
  },
  Alat: {
    bg: "bg-[#D4A23A]",
    text: "text-[#2D2318]",
    darkBg: "dark:bg-[#E6B84D]",
    darkText: "dark:text-[#1A1612]",
  },
  Transport: {
    bg: "bg-[#8B7CB3]",
    text: "text-white",
    darkBg: "dark:bg-[#A99BC8]",
    darkText: "dark:text-[#1A1612]",
  },
  Konsumsi: {
    bg: "bg-[#B87A7A]",
    text: "text-white",
    darkBg: "dark:bg-[#C98B8B]",
    darkText: "dark:text-[#1A1612]",
  },
  Perizinan: {
    bg: "bg-[#6B9BA5]",
    text: "text-white",
    darkBg: "dark:bg-[#8BBCC6]",
    darkText: "dark:text-[#1A1612]",
  },
  Lainnya: {
    bg: "bg-[#A89F91]",
    text: "text-white",
    darkBg: "dark:bg-[#B8AE9F]",
    darkText: "dark:text-[#1A1612]",
  },
};

export function getCategoryColor(category: string) {
  return categoryColors[category] ?? {
    bg: "bg-muted",
    text: "text-foreground",
    darkBg: "",
    darkText: "",
  };
}

export function cnCategoryColor(category: string) {
  const c = getCategoryColor(category);
  return `${c.bg} ${c.text} ${c.darkBg} ${c.darkText}`;
}