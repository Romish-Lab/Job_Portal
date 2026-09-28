import { useEffect, useState } from "react";
import client from "../api/client";
import { User } from "../types";

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await client.get("/users");
    setUsers(data.users);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onDelete = async (id: string) => {
    if (!confirm("Delete this user? This can't be undone.")) return;
    await client.delete(`/users/${id}`);
    fetchUsers();
  };

  if (loading) return <div className="page-loading">Loading…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Manage users</h1>
        <p className="page-subtitle">All candidates, employers, and admins on the platform.</p>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u: any) => (
            <tr key={u._id || u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <span className="role-tag">{u.role}</span>
              </td>
              <td>
                {u.role !== "admin" && (
                  <button className="btn-ghost btn-danger" onClick={() => onDelete(u._id || u.id)}>
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
