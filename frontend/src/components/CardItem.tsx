import type { Card } from "../types";
import { useAuthStore } from "../store/auth";

interface CardItemProps {
  card: Card;
  onClick?: () => void;
  isDragging?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

export function CardItem({ card, onClick, isDragging }: CardItemProps) {
  const user = useAuthStore((s) => s.user);
  const showAvatar = card.assignee_id && user && card.assignee_id === user.id;

  return (
    <div
      onClick={onClick}
      className={`bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-700/80 border border-gray-700/50 hover:border-gray-600 transition-all ${
        isDragging ? "shadow-xl rotate-1 ring-2 ring-blue-500/50" : ""
      }`}
    >
      <p className="text-sm font-medium text-white leading-snug">{card.title}</p>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2 text-gray-400">
          {card.due_date && (
            <span className="flex items-center gap-1 text-xs">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formatDueDate(card.due_date)}
            </span>
          )}
        </div>

        {showAvatar && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white">
            {getInitials(user.name)}
          </div>
        )}
      </div>
    </div>
  );
}
