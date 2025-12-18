'use client';

import { useState } from 'react';
import { updateSetting } from '@/lib/actions/settings';

interface DaySchedule {
    enabled: boolean;
    start: string;
    end: string;
}

interface SettingsFormProps {
    settings: Record<string, { value: any; description: string; updatedAt: string }>;
    userId: string;
}

const DAY_NAMES: Record<string, string> = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
};

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function SettingsForm({ settings, userId }: SettingsFormProps) {
    const [businessHours, setBusinessHours] = useState<Record<string, DaySchedule>>(
        settings.business_hours?.value || {}
    );
    const [slotDuration, setSlotDuration] = useState(settings.slot_duration?.value?.minutes || 60);
    const [bookingBuffer, setBookingBuffer] = useState(settings.booking_buffer?.value?.hours || 2);
    const [maxDaily, setMaxDaily] = useState(settings.max_daily_appointments?.value?.value || 8);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const handleDayChange = (day: string, field: keyof DaySchedule, value: string | boolean) => {
        setBusinessHours(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [field]: value,
            },
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');

        try {
            await updateSetting('business_hours', businessHours, userId);
            await updateSetting('slot_duration', { minutes: slotDuration }, userId);
            await updateSetting('booking_buffer', { hours: bookingBuffer }, userId);
            await updateSetting('max_daily_appointments', { value: maxDaily }, userId);

            setMessage('✅ Settings saved successfully!');
        } catch (error) {
            setMessage('❌ Failed to save settings');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Business Hours */}
            <section className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    🕐 Horario de Atención
                </h2>

                <div className="space-y-3">
                    {DAY_ORDER.map(day => (
                        <div key={day} className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg">
                            <label className="flex items-center gap-2 w-32">
                                <input
                                    type="checkbox"
                                    checked={businessHours[day]?.enabled || false}
                                    onChange={(e) => handleDayChange(day, 'enabled', e.target.checked)}
                                    className="w-5 h-5 rounded bg-gray-700 border-gray-600"
                                />
                                <span className="font-medium">{DAY_NAMES[day]}</span>
                            </label>

                            <div className="flex items-center gap-2">
                                <input
                                    type="time"
                                    value={businessHours[day]?.start || '09:00'}
                                    onChange={(e) => handleDayChange(day, 'start', e.target.value)}
                                    disabled={!businessHours[day]?.enabled}
                                    className="bg-gray-700 rounded px-3 py-2 disabled:opacity-50"
                                />
                                <span className="text-gray-400">hasta</span>
                                <input
                                    type="time"
                                    value={businessHours[day]?.end || '17:00'}
                                    onChange={(e) => handleDayChange(day, 'end', e.target.value)}
                                    disabled={!businessHours[day]?.enabled}
                                    className="bg-gray-700 rounded px-3 py-2 disabled:opacity-50"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Slot Configuration */}
            <section className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    📅 Configuración de Citas
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            Duración de cada cita (minutos)
                        </label>
                        <select
                            value={slotDuration}
                            onChange={(e) => setSlotDuration(Number(e.target.value))}
                            className="w-full bg-gray-800 rounded-lg px-4 py-3 border border-gray-700"
                        >
                            <option value={30}>30 minutos</option>
                            <option value={45}>45 minutos</option>
                            <option value={60}>1 hora</option>
                            <option value={90}>1.5 horas</option>
                            <option value={120}>2 horas</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            Anticipación mínima (horas)
                        </label>
                        <select
                            value={bookingBuffer}
                            onChange={(e) => setBookingBuffer(Number(e.target.value))}
                            className="w-full bg-gray-800 rounded-lg px-4 py-3 border border-gray-700"
                        >
                            <option value={1}>1 hora</option>
                            <option value={2}>2 horas</option>
                            <option value={4}>4 horas</option>
                            <option value={24}>24 horas</option>
                            <option value={48}>48 horas</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            Máximo de citas por día
                        </label>
                        <input
                            type="number"
                            value={maxDaily}
                            onChange={(e) => setMaxDaily(Number(e.target.value))}
                            min={1}
                            max={20}
                            className="w-full bg-gray-800 rounded-lg px-4 py-3 border border-gray-700"
                        />
                    </div>
                </div>
            </section>

            {/* Save Button */}
            <div className="flex items-center gap-4">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg font-semibold
                             hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 transition-all"
                >
                    {saving ? '⏳ Guardando...' : '💾 Guardar Cambios'}
                </button>

                {message && (
                    <span className={message.includes('✅') ? 'text-emerald-400' : 'text-red-400'}>
                        {message}
                    </span>
                )}
            </div>

            {/* Last Updated Info */}
            {settings.business_hours?.updatedAt && (
                <p className="text-sm text-gray-500">
                    Última actualización: {new Date(settings.business_hours.updatedAt).toLocaleString('es-CO')}
                </p>
            )}
        </div>
    );
}
