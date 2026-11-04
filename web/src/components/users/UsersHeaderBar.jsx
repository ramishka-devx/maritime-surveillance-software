import React from 'react';
import { Download, UserPlus } from 'lucide-react';
import Skeleton from '../ui/Skeleton.jsx';
import { btn, btnNeutral, btnPrimary, pageTitle } from '../ui/bs.js';

export default function UsersHeaderBar({ totalUsers, activeUsers, isLoading, onExport, onOpenCreateDrawer }) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div>
        <h1 className={pageTitle}>Users</h1>
        <div className="mt-0.5 text-[14px] italic">
          {isLoading && !totalUsers ? (
            <Skeleton className="h-4 w-44 mt-1" />
          ) : (
            `${totalUsers} account${totalUsers === 1 ? '' : 's'} · ${activeUsers} active`
          )}
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2.5">
        <button type="button" onClick={onExport} className={`${btn} ${btnNeutral}`}>
          <Download size={16} />
          Export CSV
        </button>
        <button type="button" onClick={onOpenCreateDrawer} className={`${btn} ${btnPrimary}`}>
          <UserPlus size={16} />
          Add user
        </button>
      </div>
    </div>
  );
}
