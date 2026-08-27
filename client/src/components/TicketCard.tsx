import { useState, useEffect } from "react";
import { Ticket, User, Comment } from "../types";
import { fetchGraphQL } from "../lib/api";
import SLABadge from "./SLABadge";
import CommentSection from "./CommentSection";

const RESOLVE_TICKET_MUTATION = `
  mutation ResolveTicket($ticketId: ID!) {
    resolveTicket(ticketId: $ticketId) {
      id
      status
    }
  }
`;

interface TicketCardProps {
  ticket: Ticket;
  user: User;
  onAssign: (ticketId: string) => void;
  onRefresh: () => void;
}

const statusStyles: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-orange-100 text-orange-800",
  RESOLVED: "bg-green-100 text-green-800",
};

const statusLabels: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

const priorityStyles: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-red-100 text-red-800",
};

function getTimeDiff(start: string, end: string) {
  const startMs = isNaN(Number(start)) ? new Date(start).getTime() : Number(start);
  const endMs = isNaN(Number(end)) ? new Date(end).getTime() : Number(end);
  const diff = endMs - startMs;
  const minutes = Math.max(0, Math.floor(diff / (1000 * 60)));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) return `${hours}h ${remainingMinutes}m`;
  return `${remainingMinutes}m`;
}

export default function TicketCard({
  ticket,
  user,
  onAssign,
  onRefresh,
}: TicketCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>(ticket.comments || []);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");

  useEffect(() => {
    setComments(ticket.comments || []);
  }, [ticket.comments]);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const handleCommentAdded = (newComment: Comment) => {
    setComments((prev) => [...prev, newComment]);
    onRefresh();
  };

  const handleResolve = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setResolving(true);
    setResolveError("");
    try {
      await fetchGraphQL(RESOLVE_TICKET_MUTATION, { ticketId: ticket.id });
      onRefresh();
    } catch (err) {
      setResolveError(
        err instanceof Error ? err.message : "Failed to resolve ticket"
      );
    } finally {
      setResolving(false);
    }
  };

  const assignedEmail = ticket.assignedTo?.email || ticket.assignedToId;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {ticket.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Created{" "}
              {new Date(
                isNaN(Number(ticket.createdAt))
                  ? ticket.createdAt
                  : Number(ticket.createdAt)
              ).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[ticket.status]}`}
            >
              {statusLabels[ticket.status]}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityStyles[ticket.priority]}`}
            >
              {ticket.priority}
            </span>
            <SLABadge status={ticket.slaStatus} />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="mt-3">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
            <span>
              SLA Deadline:{" "}
              {new Date(
                isNaN(Number(ticket.slaDeadline))
                  ? ticket.slaDeadline
                  : Number(ticket.slaDeadline)
              ).toLocaleString()}
            </span>
            <span>
              First Response:{" "}
              {ticket.firstResponseAt
                ? getTimeDiff(ticket.createdAt, ticket.firstResponseAt)
                : "No response yet"}
            </span>
            {assignedEmail && <span>Assigned To: {assignedEmail}</span>}
          </div>

          {resolveError && (
            <div className="mt-2 p-2 bg-red-50 text-red-700 text-xs rounded-md">
              {resolveError}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            {user.role === "AGENT" &&
              ticket.status === "OPEN" &&
              !ticket.assignedToId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssign(ticket.id);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                >
                  Assign Ticket
                </button>
              )}

            {user.role === "AGENT" &&
              ticket.status === "IN_PROGRESS" &&
              ticket.assignedToId === user.id && (
                <button
                  onClick={handleResolve}
                  disabled={resolving}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {resolving ? "Resolving..." : "Resolve Ticket"}
                </button>
              )}
          </div>

          <CommentSection
            ticketId={ticket.id}
            comments={comments}
            onCommentAdded={handleCommentAdded}
          />
        </div>
      )}
    </div>
  );
}
