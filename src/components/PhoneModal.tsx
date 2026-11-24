import React, { useState } from 'react';
import { Car, MessageSquare, Shirt, Volume2, VolumeX, X } from 'lucide-react';
import {
  CAR_CATALOG,
  OUTFITS,
  PersistedGameSave,
} from '../game/worldLogic';

interface PhoneModalProps {
  save: PersistedGameSave;
  onOrderCar: (catalogId: string) => { status: 'ordered' | 'insufficient_coins'; carName?: string };
  onSelectOutfit: (outfitId: string) => { status: 'equipped' | 'unlocked' | 'insufficient_coins' };
  onToggleMute: () => void;
  onClose: () => void;
}

type PhoneAppTab = 'cars' | 'messages' | 'style';

export const PhoneModal: React.FC<PhoneModalProps> = ({
  save,
  onOrderCar,
  onSelectOutfit,
  onToggleMute,
  onClose,
}) => {
  const [tab, setTab] = useState<PhoneAppTab>('cars');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleOrder = (catalogId: string) => {
    const res = onOrderCar(catalogId);
    if (res.status === 'insufficient_coins') {
      setStatusMsg('Not enough Coins! Collect coins in the city or talk to Aisha.');
    } else {
      setStatusMsg(`${res.carName ?? 'Car'} delivered outside your house in the City!`);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="phone-title"
      className="fixed inset-0 z-50 bg-black/75 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto"
    >
      {/* Realistic Smartphone Frame */}
      <div className="w-full sm:max-w-[380px] rounded-t-3xl sm:rounded-[34px] bg-[#0B0D10] border-2 border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Phone Top Notch / Header */}
        <div className="px-5 pt-4 pb-3 bg-[#14181F] border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#F5A623]">
              ShoaibPhone · {save.coins.toLocaleString()} Coins
            </p>
            <h2
              id="phone-title"
              className="font-display text-xl font-bold text-white"
            >
              {tab === 'cars'
                ? 'StarMotors Car Order'
                : tab === 'messages'
                  ? 'Wife Messages'
                  : 'Quick Wardrobe'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close phone"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div
            role="status"
            className="mx-4 mt-3 rounded-xl bg-[#F5A623]/15 border border-[#F5A623]/40 px-3.5 py-2.5 text-xs font-semibold text-[#FDE68A]"
          >
            {statusMsg}
          </div>
        )}

        {/* Phone Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tab === 'cars' && (
            <>
              {CAR_CATALOG.map((car) => {
                const isOwned = save.ownedCarIds.includes(car.id);
                return (
                  <div
                    key={car.id}
                    className="rounded-2xl bg-[#14181F] border border-white/10 p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={car.imageUrl}
                        alt={car.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-12 rounded-xl object-cover shrink-0 bg-[#1B2029]"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {car.name}
                        </p>
                        <p className="text-xs text-slate-400 tabular-nums">
                          {car.category} · {isOwned ? 'Owned' : `${car.price} Coins`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOrder(car.id)}
                      aria-label={`Order ${car.name}`}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#F5A623] hover:bg-[#e29518] text-[#0B0D10] text-xs font-bold shrink-0 transition-colors"
                    >
                      Order
                    </button>
                  </div>
                );
              })}
            </>
          )}

          {tab === 'messages' && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-[#14181F] border border-white/10 p-3.5">
                <p className="text-xs font-semibold text-[#F5A623]">Aisha (Wife) · Just now</p>
                <p className="mt-1 text-sm text-slate-200">
                  “Husband, our Lamborghini, BMW, Mercedes & Tata are parked outside! Or come inside for a cheerful family welcome or nursery celebration.”
                </p>
              </div>
              <div className="rounded-2xl bg-[#1B2029] border border-white/10 p-3.5 ml-6">
                <p className="text-xs font-semibold text-slate-400">Shoaib</p>
                <p className="mt-1 text-sm text-white">
                  “On my way! Checking out the rides right now.”
                </p>
              </div>
            </div>
          )}

          {tab === 'style' && (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={onToggleMute}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#14181F] border border-white/10 text-sm font-semibold text-white flex items-center justify-between"
              >
                <span>Game Audio</span>
                {save.muted ? (
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <VolumeX className="w-4 h-4" /> Muted
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[#F5A623]">
                    <Volume2 className="w-4 h-4" /> On
                  </span>
                )}
              </button>

              {OUTFITS.map((outfit) => {
                const isOwned = save.unlockedOutfitIds.includes(outfit.id);
                const isSelected = save.selectedOutfitId === outfit.id;
                return (
                  <button
                    key={outfit.id}
                    type="button"
                    onClick={() => {
                      const res = onSelectOutfit(outfit.id);
                      if (res.status === 'insufficient_coins') {
                        setStatusMsg('Not enough coins for this dress.');
                      } else {
                        setStatusMsg(`Wearing ${outfit.name}!`);
                      }
                    }}
                    className={`w-full min-h-[48px] px-4 py-2.5 rounded-xl border text-left flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#F5A623]/15 border-[#F5A623] text-white'
                        : 'bg-[#14181F] border-white/10 text-slate-200'
                    }`}
                  >
                    <span className="text-sm font-semibold">{outfit.name}</span>
                    <span className="text-xs text-[#F5A623] tabular-nums">
                      {isSelected ? 'Equipped' : isOwned ? 'Wear' : `${outfit.price} C`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Phone Bottom App Switcher */}
        <div className="grid grid-cols-3 border-t border-white/10 bg-[#14181F] pb-safe">
          <button
            type="button"
            onClick={() => setTab('cars')}
            className={`min-h-[52px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
              tab === 'cars' ? 'text-[#F5A623]' : 'text-slate-400'
            }`}
          >
            <Car className="w-4 h-4" aria-hidden="true" />
            <span>Order Car</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('messages')}
            className={`min-h-[52px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
              tab === 'messages' ? 'text-[#F5A623]' : 'text-slate-400'
            }`}
          >
            <MessageSquare className="w-4 h-4" aria-hidden="true" />
            <span>Wife</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('style')}
            className={`min-h-[52px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
              tab === 'style' ? 'text-[#F5A623]' : 'text-slate-400'
            }`}
          >
            <Shirt className="w-4 h-4" aria-hidden="true" />
            <span>Dress</span>
          </button>
        </div>
      </div>
    </div>
  );
};
