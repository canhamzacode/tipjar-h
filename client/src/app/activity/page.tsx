import { RecentActivityList } from '@/components';
import React from 'react';

const ActivityPage = () => {
  return (
    <div className="max-w-[1440px] mx-auto p-6">
      <h3 className="text-3xl font-bold mb-5">Transaction Activity</h3>
      <RecentActivityList showViewAllLink={false} showTitle={false} />
    </div>
  );
};

export default ActivityPage;
