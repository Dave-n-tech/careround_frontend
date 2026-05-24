import { useState, useEffect } from "react";
import { useGetSystemConfigQuery, useUpdateSystemConfigMutation } from "@/services/api/hospital";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminSettings() {
  const { data: configData } = useGetSystemConfigQuery();
  const [updateConfig] = useUpdateSystemConfigMutation();

  const [reminderMinutes, setReminderMinutes] = useState("");
  const [escalationMinutes, setEscalationMinutes] = useState("");
  const [pushEnabled, setPushEnabled] = useState(true);
  const [errors, setErrors] = useState<{ reminder?: string; escalation?: string }>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!configData) return;
    setReminderMinutes(String(configData.taskOverdueReminderMinutes));
    setEscalationMinutes(String(configData.taskEscalationMinutes));
    setPushEnabled(configData.pushNotificationsEnabled);
  }, [configData]);

  function validate(): boolean {
    const errs: typeof errors = {};
    const r = Number(reminderMinutes);
    const e = Number(escalationMinutes);
    if (!reminderMinutes || isNaN(r) || r < 1) errs.reminder = "Must be at least 1 minute";
    if (!escalationMinutes || isNaN(e) || e < 1) errs.escalation = "Must be at least 1 minute";
    if (!errs.reminder && !errs.escalation && r >= e)
      errs.escalation = "Must be greater than the reminder window";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSaved(false);
    try {
      await updateConfig({
        taskOverdueReminderMinutes: Number(reminderMinutes),
        taskEscalationMinutes: Number(escalationMinutes),
        pushNotificationsEnabled: pushEnabled,
      }).unwrap();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--cr-ink)]">Settings</h1>
        <p className="text-sm text-[var(--cr-muted)] mt-0.5">Hospital-wide configuration</p>
      </div>

      <form onSubmit={handleSave}>
        <div className="bg-white border border-[var(--cr-line)] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--cr-line)]">
            <h2 className="text-sm font-semibold text-[var(--cr-ink)]">Task Overdue Settings</h2>
            <p className="text-xs text-[var(--cr-muted)] mt-0.5">
              Controls when nurses are reminded and when tasks appear as critically overdue on the supervisor dashboard.
            </p>
          </div>

          <div className="px-5 py-6 flex flex-col gap-5">
            <Input
              label="Send nurse reminder after (minutes)"
              type="number"
              min={1}
              value={reminderMinutes}
              onChange={(e) => {
                setReminderMinutes(e.target.value);
                setErrors((err) => ({ ...err, reminder: undefined }));
                setSaved(false);
              }}
              error={errors.reminder}
              hint="Nurses receive a push notification when a task is this many minutes overdue"
            />
            <Input
              label="Show as critically overdue on supervisor dashboard after (minutes)"
              type="number"
              min={1}
              value={escalationMinutes}
              onChange={(e) => {
                setEscalationMinutes(e.target.value);
                setErrors((err) => ({ ...err, escalation: undefined }));
                setSaved(false);
              }}
              error={errors.escalation}
              hint="Tasks overdue by this many minutes appear highlighted in the supervisor's overdue alert panel"
            />
          </div>

          <div className="px-5 py-5 border-t border-[var(--cr-line)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--cr-ink)]">Push Notifications</p>
                <p className="text-xs text-[var(--cr-muted)] mt-0.5">
                  Send push notifications to nurses for overdue task reminders
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={pushEnabled}
                onClick={() => { setPushEnabled((v) => !v); setSaved(false); }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                  pushEnabled ? "bg-[var(--cr-accent)]" : "bg-[var(--cr-line)]"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                    pushEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="px-5 py-4 border-t border-[var(--cr-line)] flex items-center justify-between">
            {saved ? (
              <span className="text-sm text-[var(--cr-accent)] font-medium">Settings saved.</span>
            ) : (
              <span />
            )}
            <Button type="submit" variant="primary" size="md" loading={loading}>
              Save Settings
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
