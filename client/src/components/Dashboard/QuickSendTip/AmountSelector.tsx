'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { PRESET_AMOUNTS } from '@/lib/validations/tip';

interface AmountSelectorProps {
  value: number;
  onChange: (amount: number) => void;
  error?: string;
}

export const AmountSelector: React.FC<AmountSelectorProps> = ({
  value,
  onChange,
  error,
}) => {
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const handlePresetClick = (amount: number) => {
    setIsCustom(false);
    setCustomValue('');
    onChange(amount);
  };

  const handleCustomClick = () => {
    setIsCustom(true);
    setCustomValue(
      value > 0 &&
        !PRESET_AMOUNTS.includes(value as (typeof PRESET_AMOUNTS)[number])
        ? value.toString()
        : ''
    );
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setCustomValue(inputValue);

    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue) && numValue > 0) {
      onChange(numValue);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {PRESET_AMOUNTS.map((amount) => (
          <Button
            key={amount}
            type="button"
            variant={value === amount && !isCustom ? 'default' : 'outline'}
            className={cn(
              'h-12 text-base font-medium',
              value === amount && !isCustom && 'bg-primary hover:bg-primary/20'
            )}
            onClick={() => handlePresetClick(amount)}
          >
            ${amount}.00
          </Button>
        ))}

        <Button
          type="button"
          variant={isCustom ? 'default' : 'outline'}
          className={cn(
            'h-12 text-base font-medium',
            isCustom && 'bg-primary hover:bg-primary/20'
          )}
          onClick={handleCustomClick}
        >
          $ Custom
        </Button>
      </div>

      {isCustom && (
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            $
          </span>
          <Input
            type="number"
            placeholder="0.00"
            value={customValue}
            onChange={handleCustomChange}
            className={cn(
              'pl-8 h-12 text-base',
              error && 'border-red-500 focus-visible:ring-red-500'
            )}
            min="0.01"
            max="1000"
            step="0.01"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
};
