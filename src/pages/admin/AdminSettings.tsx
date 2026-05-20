import { useState, useEffect } from "react";
import { useGetSystemConfigQuery, useUpdateSystemConfigMutation } from "@/services/api/hospital";
import { MOCK_SYSTEM_CONFIG } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminSettings() {
  const { data: configData } = useGetSystemConfigQuery();
  const [updateConfig] = useUpdateSystemConfigMutation();

  const config = configData ?? MOCK_SYSTEM_CONFIG;

  const [reminderMinutes, setReminderMinutes] = useState(String(config.taskOverdueReminderMinutes));
  const [escalationMinutes, setEscalationMinutes] = useState(String(config.taskEscalationMinutes));
  const [errors, setErrors] = useState<{ reminder?: string; escalation?: string }>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setReminderMinutes(String(config.taskOverdueReminderMinutes));
    setEscalationMinutes(String(config.taskEscalationMinutes));
  }, [config.taskOverdueReminderMinutes, config.taskEscalationMinutes]);

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
      }).unwrap();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
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
