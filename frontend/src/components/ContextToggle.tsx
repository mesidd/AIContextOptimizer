import { useState } from "react";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

export default function ContextToggle(
  {
    onChange,
  }: {
    onChange?: (value: boolean) => void;
  }) {

  const [isContextual, setIsContextual] = useState(true);
  const handleToggle = (checked: boolean) => {
    setIsContextual(checked);
    onChange?.(checked);
  };

  return (
    <div className="flex justify-center items-center gap-3 pb-3">
      <Label htmlFor="context-switch" className="text-sm font-medium">
        Context Mode
      </Label>
      <Switch
        id="context-switch"
        checked={isContextual}
        onCheckedChange={handleToggle}
      />
      <span className="text-xs text-muted-foreground">
        {isContextual ? "Remembering chat" : "Single response"}
      </span>
    </div>
  );
}