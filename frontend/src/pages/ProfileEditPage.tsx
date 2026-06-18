import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { userApi } from "../api/client";
import { UserAvatar } from "../components/UserAvatar";
import { AppHeader } from "../components/layout/AppHeader";
import { btnPrimary, inputClass, labelClass } from "../components/ui/styles";
import { useAuthStore } from "../store/auth";

export function ProfileEditPage() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  const storedUser = useAuthStore((s) => s.user);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => userApi.me().then((r) => r.data),
    initialData: storedUser ?? undefined,
  });

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? "");
    }
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: () => userApi.updateMe({ name: name.trim(), phone: phone.trim() || null }),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      queryClient.setQueryData(["me"], updatedUser);
      setError("");
    },
    onError: () => setError("Could not save profile. Please try again."),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    saveMutation.mutate();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <AppHeader backTo={{ label: "Back to profile", href: "/profile" }} title="Profile details" />

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow-xl">
          <div className="border-b border-gray-800 px-6 md:px-8 py-6 flex flex-col sm:flex-row items-center gap-6">
            <UserAvatar user={user} size="lg" />
            <div className="text-center sm:text-left">
              <p className="text-lg font-semibold text-white">{user.name}</p>
              <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className={labelClass}>Name</label>
                <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div>
                <label className={labelClass}>Phone</label>
                <input
                  className={inputClass}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 000 0000"
                />
              </div>

              <div>
                <label className={labelClass}>Email</label>
                <input className={`${inputClass} text-gray-500`} value={user.email} disabled />
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
            {saveMutation.isSuccess && !error && (
              <p className="text-sm text-green-400">Profile saved successfully.</p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button type="submit" disabled={saveMutation.isPending} className={`${btnPrimary} px-6 py-2.5`}>
                {saveMutation.isPending ? "Saving..." : "Save changes"}
              </button>
              <Link
                to="/profile"
                className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
