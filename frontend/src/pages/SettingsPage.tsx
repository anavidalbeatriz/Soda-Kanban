import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "../components/layout/AppHeader";
import { PageShell } from "../components/layout/PageShell";
import { userApi } from "../api/client";
import type { NotificationPreference } from "../types";

const EVENT_LABELS: Record<string, string> = {
  card_assigned: "Card assigned to me",
  due_date_reminder: "Due date reminders",
  comment_added: "Comments on my cards",
  board_invite: "Board invitations",
  card_moved: "Card moved",
};

export function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: preferences = [], isLoading } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => userApi.getNotificationPreferences().then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: (prefs: NotificationPreference[]) => userApi.updateNotificationPreferences(prefs),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notification-preferences"] }),
  });

  const toggle = (eventType: string) => {
    const updated = preferences.map((p) =>
      p.event_type === eventType ? { ...p, email_enabled: !p.email_enabled } : p
    );
    updateMutation.mutate(updated);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <AppHeader backTo={{ label: "Back", href: "/" }} title="Notification settings" />

      <PageShell narrow>
        {isLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="rounded-xl border border-gray-800 bg-gray-900 divide-y divide-gray-800">
            {preferences.map((pref) => (
              <label
                key={pref.event_type}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
              >
                <span className="text-sm text-gray-300">
                  {EVENT_LABELS[pref.event_type] ?? pref.event_type}
                </span>
                <input
                  type="checkbox"
                  checked={pref.email_enabled}
                  onChange={() => toggle(pref.event_type)}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                />
              </label>
            ))}
          </div>
        )}
      </PageShell>
    </div>
  );
}
