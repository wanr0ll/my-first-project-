import React from 'react';
import { Check, X, Shield } from 'lucide-react';
import { calculatePasswordStrength, getPasswordRequirements, getStrengthColor, getStrengthTextColor, isCommonPassword } from '../utils/passwordUtils';

const PasswordStrengthIndicator = ({ password, showRequirements = true }) => {
    const { score, level, feedback } = calculatePasswordStrength(password);
    const requirements = getPasswordRequirements();
    const strengthColor = getStrengthColor(level);
    const strengthTextColor = getStrengthTextColor(level);
    const isCommon = password && isCommonPassword(password);

    return (
        <div className="space-y-3">
            {/* Strength Bar */}
            {password && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Shield size={14} className={strengthTextColor} />
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                                Password Strength
                            </span>
                        </div>
                        <span className={`text-xs font-bold uppercase ${strengthTextColor}`}>
                            {level}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
                        <div
                            className={`h-full ${strengthColor} transition-all duration-300 ease-out`}
                            style={{ width: `${score}%` }}
                        />
                    </div>

                    {/* Common Password Warning */}
                    {isCommon && (
                        <div className="flex items-center gap-2 p-2 bg-danger/10 border border-danger/20 rounded-lg">
                            <X size={14} className="text-danger" />
                            <span className="text-xs text-danger font-semibold">
                                This is a common password. Please choose something more unique.
                            </span>
                        </div>
                    )}

                    {/* Feedback */}
                    {!isCommon && feedback && (
                        <p className="text-xs text-text-muted italic">
                            {feedback}
                        </p>
                    )}
                </div>
            )}

            {/* Requirements List */}
            {showRequirements && (
                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        Password Requirements
                    </p>
                    <div className="space-y-1.5">
                        {requirements.map((req) => {
                            const isMet = password && req.test(password);
                            return (
                                <div key={req.id} className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isMet ? 'bg-success/20 text-success' : 'bg-bg-hover text-text-muted'
                                        }`}>
                                        {isMet ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={2} />}
                                    </div>
                                    <span className={`text-xs ${isMet ? 'text-text-primary font-semibold' : 'text-text-muted'}`}>
                                        {req.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PasswordStrengthIndicator;
