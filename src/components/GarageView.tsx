import React, { useState } from 'react';
import { Car, Check } from 'lucide-react';
import {
  Vehicle,
  VehicleCategory,
  filterVehicles,
} from '../utils/dashboardLogic';

interface GarageViewProps {
  vehicles: Vehicle[];
  activeVehicleId: string;
  onSelectActiveVehicle: (id: string) => void;
}

const VEHICLE_CATEGORIES: { id: VehicleCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'sport', label: 'Sport' },
  { id: 'bike', label: 'Bike' },
  { id: 'classic', label: 'Classic' },
];

export const GarageView: React.FC<GarageViewProps> = ({
  vehicles,
  activeVehicleId,
  onSelectActiveVehicle,
}) => {
  const [category, setCategory] = useState<VehicleCategory>('all');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const visibleVehicles = filterVehicles(vehicles, category);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
            Garage
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Select your primary ride to display on the main Overview screen.
          </p>
        </div>

        <div
          role="group"
          aria-label="Filter garage vehicles"
          className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#14181F] border border-white/10 self-start sm:self-auto"
        >
          {VEHICLE_CATEGORIES.map((tab) => {
            const isActive = category === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategory(tab.id)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623] ${
                  isActive
                    ? 'bg-[#F5A623] text-[#0B0D10]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleVehicles.map((vehicle) => {
          const isCurrent = vehicle.id === activeVehicleId;
          const imgFailed = failedImages[vehicle.id];

          return (
            <article
              key={vehicle.id}
              className="rounded-2xl bg-[#14181F] border border-white/10 overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[4/3] w-full bg-[#1B2029] overflow-hidden">
                  {!imgFailed ? (
                    <img
                      src={vehicle.imageUrl}
                      alt={vehicle.name}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({
                          ...prev,
                          [vehicle.id]: true,
                        }))
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#1F242D] to-[#12151B]">
                      <Car
                        className="w-10 h-10 text-[#F5A623] mb-2"
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium text-slate-300">
                        {vehicle.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <p className="text-xs text-slate-400 capitalize">
                    {vehicle.category} · {vehicle.bay}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-white">
                    {vehicle.name}
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300 tabular-nums">
                    {vehicle.topSpeedMph} mph · {vehicle.acceleration}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5">
                <button
                  type="button"
                  onClick={() => onSelectActiveVehicle(vehicle.id)}
                  aria-pressed={isCurrent}
                  className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623] ${
                    isCurrent
                      ? 'bg-[#F5A623] text-[#0B0D10]'
                      : 'bg-white/8 hover:bg-white/14 text-white border border-white/12'
                  }`}
                >
                  {isCurrent && <Check className="w-4 h-4" aria-hidden="true" />}
                  <span>{isCurrent ? 'Active Ride' : 'Set Active Ride'}</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
