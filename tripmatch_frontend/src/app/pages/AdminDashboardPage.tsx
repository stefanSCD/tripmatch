import { useEffect, useMemo, useState } from 'react';
import { Building2, CheckCircle2, Loader2, RefreshCw, Search, Shield, ShieldOff, User2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import type { AdminAccountListItem, AgencyApprovalStatus } from '../services/adminApi';

type UserTab = 'users' | 'agencies' | 'admins';

interface AccountsState {
  content: AdminAccountListItem[];
  page: number;
  totalPages: number;
  totalElements: number;
}

const PAGE_SIZE = 20;

function roleLabel(role: AdminAccountListItem['role']) {
  if (role === 'AGENCY') return 'Agency';
  if (role === 'ADMIN') return 'Admin';
  return 'Traveler';
}

function displayName(account: AdminAccountListItem) {
  if (account.role === 'AGENCY') {
    if (account.agencyName?.trim()) return account.agencyName.trim();
    return account.email.split('@')[0] ?? `Agency #${account.id}`;
  }

  const fullName = [account.firstName, account.lastName].filter(Boolean).join(' ').trim();
  if (fullName) return fullName;
  return account.email.split('@')[0] ?? `User #${account.id}`;
}

function toRoleFilter(activeTab: UserTab): AdminAccountListItem['role'] {
  if (activeTab === 'agencies') return 'AGENCY';
  if (activeTab === 'admins') return 'ADMIN';
  return 'USER';
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function statusBadge(account: AdminAccountListItem) {
  if (!account.isActive) {
    return { label: 'Blocked', className: 'bg-red-50 text-red-700 border-red-200' };
  }
  if (account.role === 'AGENCY' && !account.isApproved) {
    return { label: 'Pending Approval', className: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
  return { label: 'Active', className: 'bg-green-50 text-green-700 border-green-200' };
}

export default function AdminDashboardPage() {
  const {
    user,
    fetchAdminAccounts,
    blockAccount,
    unblockAccount,
    fetchPendingAgencies,
    approvePendingAgency,
    approvePendingAgenciesBulk,
  } = useApp();

  const [activeTab, setActiveTab] = useState<UserTab>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pendingAgencies, setPendingAgencies] = useState<AgencyApprovalStatus[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [accountsState, setAccountsState] = useState<AccountsState>({
    content: [],
    page: 0,
    totalPages: 0,
    totalElements: 0,
  });
  const [stats, setStats] = useState({ users: 0, agencies: 0, admins: 0 });

  const isAdmin = user.role === 'admin';

  const refreshStats = async () => {
    if (!isAdmin) return;
    try {
      const [usersPage, agenciesPage, adminsPage] = await Promise.all([
        fetchAdminAccounts({ role: 'USER', page: 0, size: 1 }),
        fetchAdminAccounts({ role: 'AGENCY', page: 0, size: 1 }),
        fetchAdminAccounts({ role: 'ADMIN', page: 0, size: 1 }),
      ]);

      setStats({
        users: usersPage.totalElements,
        agencies: agenciesPage.totalElements,
        admins: adminsPage.totalElements,
      });
    } catch {
      // Stats are secondary; table load still drives actual operations.
    }
  };

  const loadPendingAgencies = async () => {
    if (!isAdmin) return;
    setPendingLoading(true);
    try {
      const data = await fetchPendingAgencies();
      setPendingAgencies(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load pending agencies.';
      toast.error(message);
    } finally {
      setPendingLoading(false);
    }
  };

  const loadAccounts = async () => {
    if (!isAdmin) return;
    setAccountsLoading(true);
    setAccountsError(null);

    try {
      const response = await fetchAdminAccounts({
        role: toRoleFilter(activeTab),
        q: searchQuery.trim() || undefined,
        page: pageIndex,
        size: PAGE_SIZE,
        sort: 'createdAt,desc',
      });

      setAccountsState({
        content: response.content,
        page: response.page,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load accounts.';
      setAccountsError(message);
      setAccountsState({
        content: [],
        page: pageIndex,
        totalPages: 0,
        totalElements: 0,
      });
    } finally {
      setAccountsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    void refreshStats();
    void loadPendingAgencies();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    void loadAccounts();
  }, [isAdmin, activeTab, pageIndex, searchQuery]);

  const pendingToApprove = useMemo(
    () => pendingAgencies.filter(item => !item.approved).map(item => item.accountId),
    [pendingAgencies],
  );

  const onToggleBlock = async (account: AdminAccountListItem) => {
    try {
      const response = account.isActive
        ? await blockAccount(account.id)
        : await unblockAccount(account.id);

      toast.success(response.message);
      await Promise.all([loadAccounts(), refreshStats()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update account status.');
    }
  };

  const onApproveAgency = async (accountId: number) => {
    try {
      const result = await approvePendingAgency(accountId);
      toast.success(result.message);
      await Promise.all([loadPendingAgencies(), loadAccounts(), refreshStats()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Approval failed.');
    }
  };

  const onApproveAllPending = async () => {
    if (pendingToApprove.length === 0) {
      toast.info('No pending agencies to approve.');
      return;
    }

    try {
      const results = await approvePendingAgenciesBulk(pendingToApprove);
      const approvedCount = results.filter(item => item.approved).length;
      toast.success(`Approved ${approvedCount} of ${results.length} pending agencies.`);
      await Promise.all([loadPendingAgencies(), loadAccounts(), refreshStats()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk approval failed.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#92400E' }}>
            This section is available only for admin accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>Admin Dashboard</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <Users className="mb-3 h-5 w-5 text-sky-500" />
          <p style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>{stats.users}</p>
          <p style={{ fontSize: '12.5px', color: '#9CA3AF' }}>Travelers</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <Building2 className="mb-3 h-5 w-5 text-teal-500" />
          <p style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>{stats.agencies}</p>
          <p style={{ fontSize: '12.5px', color: '#9CA3AF' }}>Agencies</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <Shield className="mb-3 h-5 w-5 text-purple-500" />
          <p style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>{stats.admins}</p>
          <p style={{ fontSize: '12.5px', color: '#9CA3AF' }}>Admins</p>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>Pending Agency Approvals</h3>
            <p style={{ fontSize: '12.5px', color: '#6B7280' }}>{pendingToApprove.length} pending</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadPendingAgencies()}
              className="rounded-xl border border-gray-200 px-3 py-2 hover:bg-gray-50"
              style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151' }}
            >
              <RefreshCw className={`mr-1.5 inline h-3.5 w-3.5 ${pendingLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void onApproveAllPending()}
              className="rounded-xl px-3 py-2 text-white"
              style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)', fontSize: '12.5px', fontWeight: 700 }}
            >
              Approve All
            </button>
          </div>
        </div>

        {pendingLoading ? (
          <div className="flex items-center gap-2" style={{ fontSize: '13px', color: '#6B7280' }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading pending agencies...
          </div>
        ) : pendingAgencies.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#9CA3AF' }}>No agencies returned by backend.</p>
        ) : (
          <div className="space-y-2">
            {pendingAgencies.map(item => (
              <div key={item.accountId} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div>
                  <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>Account #{item.accountId}</p>
                  <p style={{ fontSize: '12px', color: '#6B7280' }}>{item.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 ${item.approved ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}
                    style={{ fontSize: '11.5px', fontWeight: 700 }}
                  >
                    {item.approved ? 'Approved' : 'Pending'}
                  </span>
                  {!item.approved && (
                    <button
                      type="button"
                      onClick={() => void onApproveAgency(item.accountId)}
                      className="rounded-lg border border-sky-200 px-3 py-1.5 hover:bg-sky-50"
                      style={{ fontSize: '12px', fontWeight: 700, color: '#0EA5E9' }}
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
            {[
              { key: 'users', label: 'Travelers', count: stats.users },
              { key: 'agencies', label: 'Agencies', count: stats.agencies },
              { key: 'admins', label: 'Admins', count: stats.admins },
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key as UserTab);
                  setPageIndex(0);
                }}
                className={`rounded-lg px-4 py-2 transition-all ${activeTab === tab.key ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                style={{ fontSize: '13.5px', fontWeight: activeTab === tab.key ? 700 : 500 }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setPageIndex(0);
              }}
              placeholder="Search by email or name..."
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
              style={{ fontSize: '13.5px' }}
            />
          </div>
        </div>

        {accountsError && (
          <div className="border-b border-red-100 bg-red-50 px-5 py-3">
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#B91C1C' }}>{accountsError}</p>
          </div>
        )}

        {accountsLoading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span style={{ fontSize: '13.5px', fontWeight: 600 }}>Loading accounts...</span>
          </div>
        ) : accountsState.content.length === 0 ? (
          <div className="p-10 text-center">
            <p style={{ fontSize: '14px', color: '#9CA3AF' }}>No accounts found for this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Account', 'Email', 'Role', 'Status', 'Approved', 'Created', 'Last Login', 'Actions'].map(col => (
                    <th key={col} className="px-5 py-3 text-left" style={{ fontSize: '11.5px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accountsState.content.map(account => {
                  const status = statusBadge(account);
                  const canApproveAgency = account.role === 'AGENCY' && account.isActive && !account.isApproved;

                  return (
                    <tr key={account.id} className="border-b border-gray-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-teal-500">
                            {account.role === 'AGENCY' ? (
                              <Building2 className="h-4 w-4 text-white" />
                            ) : account.role === 'ADMIN' ? (
                              <Shield className="h-4 w-4 text-white" />
                            ) : (
                              <User2 className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <div>
                            <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>{displayName(account)}</p>
                            <p style={{ fontSize: '12px', color: '#9CA3AF' }}>#{account.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4" style={{ fontSize: '13px', color: '#6B7280' }}>{account.email}</td>
                      <td className="px-5 py-4" style={{ fontSize: '13px', color: '#374151' }}>{roleLabel(account.role)}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full border px-2.5 py-1 ${status.className}`} style={{ fontSize: '11.5px', fontWeight: 700 }}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {account.role === 'AGENCY' ? (
                          account.isApproved ? (
                            <span className="inline-flex items-center gap-1 text-green-700" style={{ fontSize: '12.5px', fontWeight: 600 }}>
                              <CheckCircle2 className="h-4 w-4" /> Yes
                            </span>
                          ) : (
                            <span className="text-amber-700" style={{ fontSize: '12.5px', fontWeight: 600 }}>No</span>
                          )
                        ) : (
                          <span style={{ fontSize: '12.5px', color: '#9CA3AF' }}>-</span>
                        )}
                      </td>
                      <td className="px-5 py-4" style={{ fontSize: '12.5px', color: '#6B7280' }}>{formatDateTime(account.createdAt)}</td>
                      <td className="px-5 py-4" style={{ fontSize: '12.5px', color: '#6B7280' }}>{formatDateTime(account.lastLoginAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {canApproveAgency && (
                            <button
                              type="button"
                              onClick={() => void onApproveAgency(account.id)}
                              className="rounded-lg border border-sky-200 px-3 py-1.5 hover:bg-sky-50"
                              style={{ fontSize: '12px', fontWeight: 700, color: '#0EA5E9' }}
                            >
                              Approve
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void onToggleBlock(account)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50"
                            style={{ fontSize: '12px', fontWeight: 700, color: account.isActive ? '#DC2626' : '#059669' }}
                          >
                            {account.isActive ? (
                              <span className="inline-flex items-center gap-1"><ShieldOff className="h-3.5 w-3.5" /> Block</span>
                            ) : (
                              <span className="inline-flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Unblock</span>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <span style={{ fontSize: '13px', color: '#9CA3AF' }}>
            Showing {accountsState.content.length} of {accountsState.totalElements}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPageIndex(prev => Math.max(0, prev - 1))}
              disabled={pageIndex === 0 || accountsLoading}
              className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-50"
              style={{ fontSize: '12.5px', color: '#6B7280' }}
            >
              Previous
            </button>
            <span className="rounded-lg bg-sky-500 px-3 py-1.5 text-white" style={{ fontSize: '12.5px', fontWeight: 700 }}>
              {accountsState.totalPages === 0 ? 0 : pageIndex + 1}
            </span>
            <button
              type="button"
              onClick={() => setPageIndex(prev => prev + 1)}
              disabled={accountsLoading || accountsState.totalPages === 0 || pageIndex >= accountsState.totalPages - 1}
              className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-50"
              style={{ fontSize: '12.5px', color: '#6B7280' }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
