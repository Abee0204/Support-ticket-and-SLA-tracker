import { TicketStatus, Priority } from "../types";

interface FiltersProps {
  status: TicketStatus | "";
  priority: Priority | "";
  onStatusChange: (status: TicketStatus | "") => void;
  onPriorityChange: (priority: Priority | "") => void;
}

export default function Filters({
  status,
  priority,
  onStatusChange,
  onPriorityChange,
}: FiltersProps) {
  return (
    <div className="flex gap-4">
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as TicketStatus | "")}
        className="block rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">All Statuses</option>
        <option value="OPEN">Open</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="RESOLVED">Resolved</option>
      </select>
      <select
        value={priority}
        onChange={(e) => onPriorityChange(e.target.value as Priority | "")}
        className="block rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">All Priorities</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
      </select>
    </div>
  );
}
