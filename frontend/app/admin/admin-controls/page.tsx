'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'

type Permission = { id: string; key: string; label: string; permission_group: string; display_order: number }
type Role = { id: string; name: string; is_super_admin: boolean; created_at?: string }
type RoleDetail = Role & { permission_ids: string[]; permissions: Permission[] }
type AdminUser = {
  id: string
  email: string
  role_id: string | null
  role_name: string | null
  is_super_admin: boolean
  created_at: string
}

const PERMISSION_GROUP_LABEL: Record<string, string> = {
  general: 'General',
}

export default function AdminControlsPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRole, setEditingRole] = useState<RoleDetail | null>(null)
  const [creating, setCreating] = useState(false)
  const [formName, setFormName] = useState('')
  const [formPermissionIds, setFormPermissionIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateCredentials, setShowCreateCredentials] = useState(false)
  const [createRoleId, setCreateRoleId] = useState<string>('')
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createCredentialsSaving, setCreateCredentialsSaving] = useState(false)
  const [createCredentialsError, setCreateCredentialsError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadRoles = useCallback(async () => {
    try {
      const res = await api.get('/admin/roles')
      setRoles(res.data ?? [])
    } catch (e) {
      setRoles([])
    }
  }, [])

  const loadPermissions = useCallback(async () => {
    try {
      const res = await api.get('/admin/permissions')
      setPermissions(res.data ?? [])
    } catch (e) {
      setPermissions([])
    }
  }, [])

  const loadAdminUsers = useCallback(async () => {
    try {
      const res = await api.get('/admin/admin-users')
      setAdminUsers(res.data ?? [])
    } catch (e) {
      setAdminUsers([])
    }
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      await Promise.all([loadRoles(), loadPermissions(), loadAdminUsers()])
      setLoading(false)
    }
    load()
  }, [loadRoles, loadPermissions, loadAdminUsers])

  const openCreate = () => {
    setEditingRole(null)
    setCreating(true)
    setFormName('')
    setFormPermissionIds(new Set())
    setError(null)
  }

  const openEdit = async (role: Role) => {
    setCreating(false)
    setError(null)
    try {
      const res = await api.get(`/admin/roles/${role.id}`)
      const r = res.data
      setEditingRole(r)
      setFormName(r.name ?? '')
      setFormPermissionIds(new Set(r.permission_ids ?? []))
    } catch (e) {
      setError('Failed to load role')
    }
  }

  const closeForm = () => {
    setEditingRole(null)
    setCreating(false)
    setFormName('')
    setFormPermissionIds(new Set())
    setError(null)
  }

  const togglePermission = (id: string) => {
    setFormPermissionIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const saveRole = async () => {
    const name = formName.trim()
    if (!name) {
      setError('Role name is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (creating) {
        await api.post('/admin/roles', {
          name,
          permission_ids: Array.from(formPermissionIds),
        })
      } else if (editingRole) {
        await api.patch(`/admin/roles/${editingRole.id}`, {
          name,
          permission_ids: Array.from(formPermissionIds),
        })
      }
      await loadRoles()
      await loadAdminUsers()
      closeForm()
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to save'
      setError(String(msg))
    } finally {
      setSaving(false)
    }
  }

  const deleteRole = async (role: Role) => {
    if (role.is_super_admin) return
    if (!confirm(`Delete role "${role.name}"?`)) return
    try {
      await api.delete(`/admin/roles/${role.id}`)
      await loadRoles()
      await loadAdminUsers()
      if (editingRole?.id === role.id) closeForm()
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to delete'
      alert(msg)
    }
  }

  const changeAdminRole = async (adminId: string, roleId: string) => {
    try {
      await api.patch(`/admin/admin-users/${adminId}/role`, { role_id: roleId })
      await loadAdminUsers()
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to update role'
      alert(msg)
    }
  }

  const openCreateCredentials = (roleId?: string) => {
    setCreateRoleId(roleId ?? roles[0]?.id ?? '')
    setCreateEmail('')
    setCreatePassword('')
    setCreateCredentialsError(null)
    setShowCreateCredentials(true)
  }

  const closeCreateCredentials = () => {
    setShowCreateCredentials(false)
    setCreateEmail('')
    setCreatePassword('')
    setCreateCredentialsError(null)
  }

  const saveCreateCredentials = async () => {
    const email = createEmail.trim()
    if (!email) {
      setCreateCredentialsError('Email is required')
      return
    }
    if (!createPassword || createPassword.length < 8) {
      setCreateCredentialsError('Password must be at least 8 characters')
      return
    }
    if (!createRoleId) {
      setCreateCredentialsError('Role is required')
      return
    }
    setCreateCredentialsSaving(true)
    setCreateCredentialsError(null)
    try {
      await api.post('/admin/admin-users', {
        email,
        password: createPassword,
        role_id: createRoleId,
      })
      await loadAdminUsers()
      closeCreateCredentials()
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to create credentials'
      setCreateCredentialsError(String(msg))
    } finally {
      setCreateCredentialsSaving(false)
    }
  }

  const deleteAdminCredentials = async (u: AdminUser) => {
    if (!confirm(`Remove credentials for ${u.email}? They will no longer be able to log in.`)) return
    setDeletingId(u.id)
    try {
      await api.delete(`/admin/admin-users/${u.id}`)
      await loadAdminUsers()
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to delete'
      alert(msg)
    } finally {
      setDeletingId(null)
    }
  }

  const permissionsByGroup = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const g = p.permission_group || 'general'
    if (!acc[g]) acc[g] = []
    acc[g].push(p)
    return acc
  }, {})

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Admin Controls</h1>
        <p className="text-gray-500">Loading…</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Admin Controls</h1>

      {/* Roles list */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Roles</h2>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            Create role
          </button>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Super Admin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="border-b last:border-0">
                  <td className="px-6 py-4 font-medium">{role.name}</td>
                  <td className="px-6 py-4">{role.is_super_admin ? 'Yes' : 'No'}</td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => openCreateCredentials(role.id)}
                      className="text-green-600 hover:underline mr-4"
                    >
                      Create credentials
                    </button>
                    {!role.is_super_admin && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEdit(role)}
                          className="text-pink-600 hover:underline mr-4"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRole(role)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create / Edit role form */}
      {(creating || editingRole) && (
        <section className="mb-10 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            {creating ? 'Create role' : 'Edit role'}
          </h2>
          {error && (
            <p className="mb-4 text-red-600 text-sm">{error}</p>
          )}
          <div className="mb-4">
            <label className="block font-medium text-gray-700 mb-2">Role name</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full max-w-md px-4 py-2 border rounded-lg"
              placeholder="e.g. Operations"
              disabled={!!editingRole?.is_super_admin}
            />
          </div>
          <div className="mb-4">
            <label className="block font-medium text-gray-700 mb-2">Permissions</label>
            <div className="flex flex-col gap-2">
              {Object.entries(permissionsByGroup).map(([group, perms]) => (
                <div key={group} className="flex flex-wrap gap-4">
                  <span className="text-xs font-semibold text-gray-500 w-24">
                    {PERMISSION_GROUP_LABEL[group] ?? group}
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {perms
                      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                      .map((p) => (
                        <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formPermissionIds.has(p.id)}
                            onChange={() => togglePermission(p.id)}
                            disabled={!!editingRole?.is_super_admin}
                          />
                          <span className="text-sm">{p.label}</span>
                        </label>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveRole}
              disabled={saving || !!editingRole?.is_super_admin}
              className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {/* Create admin credentials form */}
      {showCreateCredentials && (
        <section className="mb-10 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Create admin credentials</h2>
          {createCredentialsError && (
            <p className="mb-4 text-red-600 text-sm">{createCredentialsError}</p>
          )}
          <div className="flex flex-wrap gap-4 mb-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1 text-sm">Role</label>
              <select
                value={createRoleId}
                onChange={(e) => setCreateRoleId(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                    {r.is_super_admin ? ' (Super Admin)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1 text-sm">Email</label>
              <input
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1 text-sm">Password</label>
              <input
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
                placeholder="Min 8 characters"
                minLength={8}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveCreateCredentials}
              disabled={createCredentialsSaving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {createCredentialsSaving ? 'Creating…' : 'Create credentials'}
            </button>
            <button
              type="button"
              onClick={closeCreateCredentials}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {/* Admin users */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Admin users</h2>
          <button
            type="button"
            onClick={() => openCreateCredentials()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Create credentials
          </button>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-6 py-4">
                    {u.email}
                    {u.is_super_admin && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                        Super Admin
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">{u.role_name ?? '—'}</td>
                  <td className="px-6 py-4">
                    {!u.is_super_admin ? (
                      <select
                        value={u.role_id ?? ''}
                        onChange={(e) => changeAdminRole(u.id, e.target.value)}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        <option value="">No role</option>
                        {roles.filter((r) => !r.is_super_admin).map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => deleteAdminCredentials(u)}
                      disabled={deletingId === u.id}
                      className="text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deletingId === u.id ? 'Deleting…' : 'Delete credentials'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
