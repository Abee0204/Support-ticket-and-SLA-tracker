import { useState, useEffect, useCallback } from "react";
import { fetchGraphQL } from "../lib/api";
import { Ticket, User, TicketStatus, Priority } from "../types";
import Navbar from "../components/Navbar";
import TicketCard from "../components/TicketCard";
import Filters from "../components/Filters";
import Pagination from "../components/Pagination";
import CreateTicketModal from "../components/CreateTicketModal";
import AssignTicketModal from "../components/AssignTicketModal";

const TICKETS_QUERY = `
  query Tickets($status: TicketStatus, $priority: Priority, $page: Int, $limit: Int) {
    tickets(status: $status, priority: $priority, page: $page, limit: $limit) {
      tickets {
        id
        title
        description
        status
        priority
        createdAt
        slaDeadline
        slaStatus
        assignedToId
      }
      total
      page
      limit
    }
  }
`;

const LIMIT = 10;

interface DashboardPageProps {
  user: User;
  onLogout: () => void;
}

export default function DashboardPage({ user, onLogout }: DashboardPageProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "">("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assigningTicketId, setAssigningTicketId] = useState<string | null>(
    null
  );

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const variables: Record<string, unknown> = {
        page,
        limit: LIMIT,
      };
      if (statusFilter) variables.status = statusFilter;
      if (priorityFilter) variables.priority = priorityFilter;

      const data = await fetchGraphQL<{
        tickets: {
          tickets: Ticket[];
          total: number;
          page: number;
          limit: number;
        };
      }>(TICKETS_QUERY, variables);
      setTickets(data.tickets.tickets);
      setTotal(data.tickets.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleStatusChange = (status: TicketStatus | "") => {
    setStatusFilter(status);
    setPage(1);
  };

  const handlePriorityChange = (priority: Priority | "") => {
    setPriorityFilter(priority);
    setPage(1);
  };

  const handleAssign = (ticketId: string) => {
    setAssigningTicketId(ticketId);
  };

  const handleAssigned = () => {
    setAssigningTicketId(null);
    fetchTickets();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={onLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Tickets</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Filters
              status={statusFilter}
              priority={priorityFilter}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
            />
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              + New Ticket
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="text-gray-500">Loading tickets...</div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-sm rounded-md mb-4">
            {error}
          </div>
        )}

        {!loading && !error && tickets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No tickets found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-3 text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            >
              Create your first ticket
            </button>
          </div>
        )}

        {!loading && !error && tickets.length > 0 && (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                user={user}
                onAssign={handleAssign}
                onRefresh={fetchTickets}
              />
            ))}
          </div>
        )}

        {!loading && tickets.length > 0 && (
          <Pagination
            page={page}
            hasMore={page * LIMIT < total}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        )}
      </main>

      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchTickets}
        />
      )}

      {assigningTicketId && (
        <AssignTicketModal
          ticketId={assigningTicketId}
          agentId={user.id}
          onClose={() => setAssigningTicketId(null)}
          onAssigned={handleAssigned}
        />
      )}
    </div>
  );
}
