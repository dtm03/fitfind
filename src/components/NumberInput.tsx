import type { InputHTMLAttributes } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
};

export function NumberInput({ value, onChange, ...rest }: Props) {
  return (
    <input
      {...rest}
      type="number"
      inputMode="decimal"
      value={value ?? ''}
      onChange={(e) => {
        const raw = e.target.value;
        onChange(raw === '' ? undefined : Number(raw));
      }}
    />
  );
}
