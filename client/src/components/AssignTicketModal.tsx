import { useState } from "react";
import { fetchGraphQL } from "../lib/api";
import { Ticket } from "../types";

const ASSIGN_TICKET_MUTATION = `
  mutation AssignTicket($ticketId: ID!, $agentId: ID!) {
    assignTicket(ticketId: $ticketId, agentId: $agentId) {
      id
      status
      assignedToId
    }
  }
`;

interface AssignTicketModalProps {
  ticketId: string;
  agentId: string;
  onClose: () => void;
  onAssigned: () => void;
}

export default function AssignTicketModal({
  ticketId,
  agentId,
  onClose,
  onAssigned,
}: AssignTicketModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAssign = async () => {
    setLoading(true);
    setError("");

    try {
      await fetchGraphQL<{ assignTicket: Ticket }>(ASSIGN_TICKET_MUTATION, {
        ticketId,
        agentId,
      });
      onAssigned();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to assign ticket"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Assign Ticket
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to assign this ticket to yourself?
        </p>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? "Assigning..." : "Assign to Me"}
          </button>
        </div>
      </div>
    </div>
  );
}
