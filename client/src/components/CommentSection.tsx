import { useState } from "react";
import { fetchGraphQL } from "../lib/api";
import { Comment } from "../types";

const ADD_COMMENT_MUTATION = `
  mutation AddComment($ticketId: ID!, $message: String!) {
    addComment(ticketId: $ticketId, message: $message) {
      id
      message
      createdAt
      ticketId
      userId
      user {
        id
        email
      }
    }
  }
`;

interface CommentSectionProps {
  ticketId: string;
  comments: Comment[];
  onCommentAdded: (comment: Comment) => void;
}

export default function CommentSection({
  ticketId,
  comments,
  onCommentAdded,
}: CommentSectionProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");

    try {
      const data = await fetchGraphQL<{ addComment: Comment }>(
        ADD_COMMENT_MUTATION,
        {
          ticketId,
          message: trimmed,
        }
      );
      setMessage("");
      onCommentAdded(data.addComment);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add comment"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const timestamp = Number(dateStr);
    const date = isNaN(timestamp) ? new Date(dateStr) : new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        Comments ({comments.length})
      </h4>

      {comments.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No comments yet</p>
      ) : (
        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-md p-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span className="font-medium text-gray-700">
                  {comment.user?.email || "User"}
                </span>
                <span>{formatDate(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-800">{comment.message}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-3 p-2 bg-red-50 text-red-700 text-sm rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
