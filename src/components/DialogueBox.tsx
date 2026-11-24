import React from 'react';
import { MessageCircle, X } from 'lucide-react';
import { DialogueNode } from '../game/worldLogic';

interface DialogueBoxProps {
  node: DialogueNode;
  spouseName?: string;
  onSelectChoice: (nextId: string | null, rewardCoins?: number) => void;
  onClose: () => void;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  node,
  spouseName = 'Aisha',
  onSelectChoice,
  onClose,
}) => {
  const isWifeSpeaker =
    node.speaker === 'Aisha' || node.speaker === spouseName;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialogue-speaker"
      className="fixed inset-x-0 bottom-0 sm:bottom-6 z-40 px-3 sm:px-6 pb-safe pointer-events-auto"
    >
      <div className="max-w-2xl mx-auto rounded-t-3xl sm:rounded-2xl bg-[#0F131A]/95 border border-[#F5A623]/40 p-4 sm:p-5 shadow-2xl space-y-3.5 max-h-[82vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#F5A623] text-[#0B0D10] flex items-center justify-center font-display text-lg font-extrabold">
              {node.speaker.slice(0, 1)}
            </div>
            <div>
              <h2
                id="dialogue-speaker"
                className="font-display text-xl font-bold text-[#F5A623]"
              >
                {isWifeSpeaker
                  ? `${node.speaker} (Wife)`
                  : `${node.speaker} (Vice Resident)`}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialogue"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p className="text-sm sm:text-base text-white leading-relaxed">
          “{node.text}”
        </p>

        <div className="space-y-2 pt-1">
          {node.choices.map((choice) => (
            <button
              key={choice.label}
              type="button"
              onClick={() => onSelectChoice(choice.nextId, choice.rewardCoins)}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1A202B] hover:bg-[#F5A623] text-slate-100 hover:text-[#0B0D10] border border-white/12 text-left text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 transition-colors"
            >
              <span className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{choice.label}</span>
              </span>
              {choice.rewardCoins ? (
                <span className="text-xs font-bold tabular-nums shrink-0">
                  +{choice.rewardCoins} Coins
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
