import { normalizePower, formatPower, canManageSimulator } from '../../../public/js/dashboard-utils.js';

describe('DashboardUtils', () => {
    describe('normalizePower', () => {
        test('returns 0 for non-numeric values', () => {
            expect(normalizePower(undefined)).toBe(0);
            expect(normalizePower('abc')).toBe(0);
        });

        test('keeps watt values below 1000 unchanged', () => {
            expect(normalizePower(750)).toBe(750);
            expect(normalizePower('500')).toBe(500);
        });

        test('converts watt values above or equal 1000 to kilowatts', () => {
            expect(normalizePower(1500)).toBeCloseTo(1.5);
            expect(normalizePower('2000')).toBeCloseTo(2);
        });
    });

    describe('formatPower', () => {
        test('returns default string for invalid input', () => {
            expect(formatPower(undefined)).toBe('0.0 kW');
            expect(formatPower('xyz')).toBe('0.0 kW');
        });

        test('formats sub kilowatt values with one decimal', () => {
            expect(formatPower(850)).toBe('850.0 kW');
        });

        test('converts large watt values to kilowatt string', () => {
            expect(formatPower(4500)).toBe('4.5 kW');
        });
    });

    describe('canManageSimulator', () => {
        test('allows management when auth is disabled', () => {
            expect(canManageSimulator(false, false, null)).toBe(true);
        });

        test('denies when auth enabled but user unauthenticated', () => {
            expect(canManageSimulator(true, false, 'admin')).toBe(false);
        });

        test('allows admin and operator roles', () => {
            expect(canManageSimulator(true, true, 'admin')).toBe(true);
            expect(canManageSimulator(true, true, 'operator')).toBe(true);
        });

        test('denies other roles', () => {
            expect(canManageSimulator(true, true, 'viewer')).toBe(false);
            expect(canManageSimulator(true, true, undefined)).toBe(false);
        });
    });
});
