import { LUNCH_DAYS, LUNCH_TIMES, LUNCH_BUDGETS, LUNCH_AREAS } from "@/constants/lunch";
import { Label } from "@/components/ui/label";

interface LunchSettingsFormProps {
  selectedDays: string[];
  onDaysChange: (days: string[]) => void;
  selectedTime: string;
  onTimeChange: (time: string) => void;
  selectedBudget: string;
  onBudgetChange: (budget: string) => void;
  selectedArea: string;
  onAreaChange: (area: string) => void;
  mode?: "edit" | "filter";
}

export default function LunchSettingsForm({
  selectedDays,
  onDaysChange,
  selectedTime,
  onTimeChange,
  selectedBudget,
  onBudgetChange,
  selectedArea,
  onAreaChange,
  mode = "edit",
}: LunchSettingsFormProps) {
  const isFilter = mode === "filter";

  function handleDayClick(day: string) {
    if (isFilter) {
      // Single-select in filter mode
      onDaysChange(selectedDays.includes(day) ? [] : [day]);
    } else {
      // Multi-select in edit mode
      onDaysChange(
        selectedDays.includes(day)
          ? selectedDays.filter((d) => d !== day)
          : [...selectedDays, day]
      );
    }
  }

  function handleToggle(
    current: string,
    value: string,
    onChange: (v: string) => void,
  ) {
    onChange(current === value ? "" : value);
  }

  // Style configuration based on mode
  const dayBtnSize = isFilter ? "h-8 w-8" : "h-10 w-10";
  const dayTextSize = isFilter ? "text-xs" : "text-sm";
  const pillPad = isFilter ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";
  const gap = isFilter ? "gap-1.5" : "gap-2";
  const activeClass = "bg-orange-500 text-white";
  const inactiveClass = isFilter
    ? "bg-gray-50 text-gray-500"
    : "bg-gray-100 text-gray-600";
  const spacing = isFilter ? "space-y-3" : "space-y-4";

  return (
    <div className={spacing}>
      {/* Days */}
      <div>
        {isFilter ? (
          <p className="text-[10px] font-semibold text-gray-400 mb-1.5">曜日</p>
        ) : (
          <Label>ランチ可能な曜日</Label>
        )}
        <div className={`flex ${gap} ${isFilter ? "" : "mt-2"}`}>
          {LUNCH_DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => handleDayClick(day)}
              className={`flex ${dayBtnSize} items-center justify-center rounded-full ${dayTextSize} font-medium transition-all ${
                selectedDays.includes(day) ? activeClass : inactiveClass
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Time */}
      <div>
        {isFilter ? (
          <p className="text-[10px] font-semibold text-gray-400 mb-1.5">時間</p>
        ) : (
          <Label>希望時間</Label>
        )}
        <div className={`flex flex-wrap ${gap} ${isFilter ? "" : "mt-2"}`}>
          {LUNCH_TIMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleToggle(selectedTime, t, onTimeChange)}
              className={`rounded-full ${pillPad} transition-all ${
                selectedTime === t ? activeClass : inactiveClass
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div>
        {isFilter ? (
          <p className="text-[10px] font-semibold text-gray-400 mb-1.5">予算</p>
        ) : (
          <Label>予算</Label>
        )}
        <div className={`flex flex-wrap ${gap} ${isFilter ? "" : "mt-2"}`}>
          {LUNCH_BUDGETS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => handleToggle(selectedBudget, b, onBudgetChange)}
              className={`rounded-full ${pillPad} transition-all ${
                selectedBudget === b ? activeClass : inactiveClass
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Area */}
      <div>
        {isFilter ? (
          <p className="text-[10px] font-semibold text-gray-400 mb-1.5">エリア</p>
        ) : (
          <Label>エリア</Label>
        )}
        <div className={`flex flex-wrap ${gap} ${isFilter ? "" : "mt-2"}`}>
          {LUNCH_AREAS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => handleToggle(selectedArea, a, onAreaChange)}
              className={`rounded-full ${pillPad} transition-all ${
                selectedArea === a ? activeClass : inactiveClass
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
