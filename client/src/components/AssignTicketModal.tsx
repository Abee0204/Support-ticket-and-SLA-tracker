import { useState, useEffect } from "react";
import { fetchGraphQL } from "../lib/api";
import { Ticket, User } from "../types";

const AGENTS_QUERY = `
  query Agents {
    agents {
      id
      email
    }
  }
`;

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
  const [agents, setAgents] = useState<User[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agentId);
  const [fetchingAgents, setFetchingAgents] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAgents() {
      try {
        const data = await fetchGraphQL<{ agents: User[] }>(AGENTS_QUERY);
        setAgents(data.agents || []);
        if (data.agents && data.agents.length > 0) {
          const match = data.agents.find((a) => a.id === agentId);
          setSelectedAgentId(match ? match.id : data.agents[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load agents list"
        );
      } finally {
        setFetchingAgents(false);
      }
    }
    loadAgents();
  }, [agentId]);

  const handleAssign = async () => {
    if (!selectedAgentId) return;

    setLoading(true);
    setError("");

    try {
      await fetchGraphQL<{ assignTicket: Ticket }>(ASSIGN_TICKET_MUTATION, {
        ticketId,
        agentId: selectedAgentId,
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
          Select an agent to assign this ticket to:
        </p>

        {fetchingAgents ? (
          <div className="py-4 text-center text-sm text-gray-500">
            Loading agents...
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Select Agent
            </label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.email} {agent.id === agentId ? "(You)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

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
            disabled={loading || fetchingAgents || !selectedAgentId}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? "Assigning..." : "Assign Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}
