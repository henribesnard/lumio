interface TabItem {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
}

export function Tabs({ tabs, activeKey, onChange }: TabsProps) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-border">
      {tabs.map((tab) => {
        const active = activeKey === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={`px-4 py-2 text-small font-medium transition-colors duration-fast focus:outline-none ${
              active
                ? "border-b-2 border-primary text-primary"
                : "border-b-2 border-transparent text-foreground-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
