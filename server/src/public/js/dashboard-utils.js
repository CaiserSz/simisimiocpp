const DashboardUtils = {
    normalizePower(value) {
        const numeric = Number(value || 0);
        if (!Number.isFinite(numeric)) {
            return 0;
        }
        return numeric >= 1000 ? numeric / 1000 : numeric;
    },

    formatPower(value) {
        const numeric = Number(value || 0);
        if (!Number.isFinite(numeric)) {
            return '0.0 kW';
        }

        if (numeric >= 1000) {
            return `${(numeric / 1000).toFixed(1)} kW`;
        }

        return `${numeric.toFixed(1)} kW`;
    },

    canManageSimulator(authEnabled, authenticated, role) {
        if (!authEnabled) {
            return true;
        }

        if (!authenticated) {
            return false;
        }

        return ['admin', 'operator'].includes(role);
    },
};

if (typeof globalThis !== 'undefined') {
    globalThis.DashboardUtils = DashboardUtils;
}

export const normalizePower = DashboardUtils.normalizePower;
export const formatPower = DashboardUtils.formatPower;
export const canManageSimulator = DashboardUtils.canManageSimulator;
export default DashboardUtils;
