import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, useParams } from "react-router-dom";
import { workspaceApi } from "../api/client";
import { AppHeader } from "../components/layout/AppHeader";
import { PageShell } from "../components/layout/PageShell";
import { InputModal } from "../components/ui/InputModal";
import { btnPrimary, btnSecondary, cardClass, inputClass } from "../components/ui/styles";
import { useAuthStore } from "../store/auth";
import type { Invitation, WorkspaceMember } from "../types";

function isAdminRole(role: string) {
  return role === "owner" || role === "admin";
}

function roleBadgeClass(role: string) {
  if (role === "owner") return "bg-amber-500/20 text-amber-300";
  if (role === "admin") return "bg-blue-500/20 text-blue-300";
  return "bg-gray-700 text-gray-300";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function InviteLinkCard({
  inviteUrl,
  onCopy,
  copied,
}: {
  inviteUrl: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className={`${cardClass} space-y-3`}>
      <p className="text-sm text-gray-400">Share this link — anyone with it can register and join the workspace.</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input readOnly value={inviteUrl} className={`${inputClass} flex-1 text-xs sm:text-sm`} />
        <button type="button" onClick={onCopy} className={btnPrimary}>
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}

export function WorkspaceAdminPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [latestInviteUrl, setLatestInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: () => workspaceApi.members(workspaceId!).then((r) => r.data),
    enabled: !!workspaceId,
  });

  const currentMembership = members.find((m) => m.user_id === currentUser?.id);
  const isAdmin = currentMembership ? isAdminRole(currentMembership.role) : false;

  const { data: invitations = [], isLoading: invitationsLoading } = useQuery({
    queryKey: ["workspace-invitations", workspaceId],
    queryFn: () => workspaceApi.listInvitations(workspaceId!).then((r) => r.data),
    enabled: !!workspaceId && isAdmin,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["workspace-members", workspaceId] });
    queryClient.invalidateQueries({ queryKey: ["workspace-invitations", workspaceId] });
  };

  const generateLink = useMutation({
    mutationFn: () => workspaceApi.createInvitation(workspaceId!),
    onSuccess: (res) => {
      setLatestInviteUrl(res.data.invite_url);
      invalidate();
    },
  });

  const inviteByEmail = useMutation({
    mutationFn: (email: string) => workspaceApi.createInvitation(workspaceId!, email),
    onSuccess: (res) => {
      setEmailModalOpen(false);
      setLatestInviteUrl(res.data.invite_url);
      invalidate();
    },
  });

  const updateRole = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: "admin" | "member" }) =>
      workspaceApi.updateMember(workspaceId!, memberId, role),
    onSuccess: invalidate,
  });

  const removeMember = useMutation({
    mutationFn: (memberId: string) => workspaceApi.removeMember(workspaceId!, memberId),
    onSuccess: invalidate,
  });

  const revokeInvitation = useMutation({
    mutationFn: (invitationId: string) => workspaceApi.revokeInvitation(workspaceId!, invitationId),
    onSuccess: invalidate,
  });

  const copyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!membersLoading && members.length > 0 && !isAdmin) {
    return <Navigate to={`/workspaces/${workspaceId}`} replace />;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <AppHeader
        backTo={{ label: "Boards", href: `/workspaces/${workspaceId}` }}
        title="Team admin"
        actions={
          <>
            <button
              type="button"
              onClick={() => generateLink.mutate()}
              disabled={generateLink.isPending}
              className={btnPrimary}
            >
              {generateLink.isPending ? "Generating..." : "Generate invite link"}
            </button>
            <button type="button" onClick={() => setEmailModalOpen(true)} className={btnSecondary}>
              Invite by email
            </button>
          </>
        }
      />

      <PageShell>
        {membersLoading ? (
          <p className="text-gray-500">Loading team...</p>
        ) : (
          <div className="space-y-8">
            {latestInviteUrl && (
              <InviteLinkCard
                inviteUrl={latestInviteUrl}
                onCopy={() => copyLink(latestInviteUrl)}
                copied={copied}
              />
            )}

            <section>
              <h2 className="text-lg font-semibold text-white mb-4">
                Members ({members.length})
              </h2>
              <div className="overflow-x-auto rounded-xl border border-gray-800">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {members.map((member: WorkspaceMember) => (
                      <tr key={member.id} className="bg-gray-950/50">
                        <td className="px-4 py-3 text-white">{member.user.name}</td>
                        <td className="px-4 py-3 text-gray-400">{member.user.email}</td>
                        <td className="px-4 py-3">
                          {member.role === "owner" ? (
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs capitalize ${roleBadgeClass(member.role)}`}>
                              {member.role}
                            </span>
                          ) : (
                            <select
                              value={member.role}
                              onChange={(e) =>
                                updateRole.mutate({
                                  memberId: member.id,
                                  role: e.target.value as "admin" | "member",
                                })
                              }
                              disabled={updateRole.isPending}
                              className={`${inputClass} w-auto py-1 text-xs capitalize`}
                            >
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {member.role !== "owner" && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Remove ${member.user.name} from this workspace?`)) {
                                  removeMember.mutate(member.id);
                                }
                              }}
                              disabled={removeMember.isPending}
                              className="text-red-400 hover:text-red-300 text-xs"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Pending invites</h2>
              {invitationsLoading ? (
                <p className="text-gray-500">Loading invites...</p>
              ) : invitations.length === 0 ? (
                <p className="text-gray-500 text-sm">No pending invite links. Generate one above.</p>
              ) : (
                <div className="space-y-3">
                  {invitations.map((inv: Invitation) => (
                    <div key={inv.id} className={`${cardClass} flex flex-col sm:flex-row sm:items-center gap-3 justify-between`}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white truncate">
                          {inv.email ?? "Link invite (any email)"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Expires {formatDate(inv.expires_at)}</p>
                        <p className="text-xs text-gray-600 truncate mt-1">{inv.invite_url}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyLink(inv.invite_url)}
                          className={btnSecondary}
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => revokeInvitation.mutate(inv.id)}
                          disabled={revokeInvitation.isPending}
                          className="text-red-400 hover:text-red-300 text-sm px-3 py-2"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </PageShell>

      <InputModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        title="Invite by email"
        label="Email"
        type="email"
        placeholder="user@example.com"
        submitLabel="Send invite"
        onSubmit={(email) => inviteByEmail.mutate(email)}
        isSubmitting={inviteByEmail.isPending}
      />
    </div>
  );
}
