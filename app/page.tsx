'use client'

import DashboardCard from '@/component/dashboard/card';
import '@/app/globals.css';
import AnalyticsChart from "@/component/dashboard/chart";
import { useData } from '@/component/providers/DataProvider';

export default function Home() {
  const { t700Now, t500Now } = useData();

  return (
    <>
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-4 mt-2 max-w-[1280px] mx-auto px-2'>
      {/* Block T-700 */}
      <div className='flex flex-col items-center bg-card rounded-3xl p-4 text-center border shadow-xs'>
        <h2 className='text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-black'>Effluent (T-700)</h2>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm sm:text-base md:text-lg'>
            <DashboardCard
              title='COD' 
              count={t700Now?.cod} 
              unit='mg/L'
            />
            <DashboardCard 
              title='TSS' 
              count={t700Now?.tss} 
              unit='mg/L'
            />
            <DashboardCard 
              title='pH' 
              count={t700Now?.pH} 
              unit=''
            />
            <DashboardCard 
              title='Suhu' 
              count={t700Now?.temperature} 
              unit='°C'
            />
        </div>
      </div>

      {/* Block T-500 */}
      <div className='flex flex-col items-center bg-card rounded-3xl p-4 text-center border shadow-xs'>
        <h2 className='text-2xl md:text-3xl font-bold mb-2 text-black'>Pre-Effluent (T-500)</h2>
        <div className='grid grid-cols-2 gap-4'>
          <DashboardCard 
            title='COD' count={t500Now?.cod} unit='mg/L'
          />
          <DashboardCard 
            title='TSS' count={t500Now?.tss} unit='mg/L' 
          />
        </div>
      </div>
    </div>
    
    {/* Chart */}
  <div className="w-full max-w-[1280px] mx-auto px-2">
  <AnalyticsChart />
  </div>


    </>
  );
}

