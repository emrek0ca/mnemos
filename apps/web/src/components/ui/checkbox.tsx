import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    description?: string;
    error?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, label, description, error, id, ...props }, ref) => {
        const generatedId = React.useId();
        const inputId = id || generatedId;
        return (
            <div className="flex items-start gap-3">
                <div className="relative flex items-center justify-center">
                    <input
                        type="checkbox"
                        id={inputId}
                        className="peer sr-only"
                        ref={ref}
                        {...props}
                    />
                    <div
                        className={cn(
                            'h-5 w-5 shrink-0 rounded border-2 border-slate-300 bg-white transition-all duration-200',
                            'peer-checked:border-indigo-600 peer-checked:bg-indigo-600',
                            'peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-2',
                            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
                            error && 'border-red-500',
                            className
                        )}
                    >
                        <Check className="h-full w-full text-white opacity-0 peer-checked:opacity-100 transition-opacity p-0.5" />
                    </div>
                    {/* Visual check overlay */}
                    <Check className="absolute h-3.5 w-3.5 text-white opacity-0 pointer-events-none peer-checked:opacity-100 transition-opacity" />
                </div>
                {(label || description) && (
                    <div className="flex flex-col gap-0.5">
                        {label && (
                            <label
                                htmlFor={inputId}
                                className={cn(
                                    'text-sm font-medium text-slate-700 cursor-pointer select-none',
                                    props.disabled && 'cursor-not-allowed opacity-50'
                                )}
                            >
                                {label}
                            </label>
                        )}
                        {description && (
                            <p className="text-xs text-slate-500">{description}</p>
                        )}
                        {error && (
                            <p className="text-xs text-red-600">{error}</p>
                        )}
                    </div>
                )}
            </div>
        );
    }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
