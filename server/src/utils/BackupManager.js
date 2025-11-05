import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Backup and Recovery Manager for Simulation State
 */
export class BackupManager {
    constructor(dataDir = './src/data') {
        this.dataDir = path.join(__dirname, '../../..', dataDir);
        this.backupDir = path.join(this.dataDir, 'backups');
        this.ensureDirectories();
    }

    /**
     * Ensure backup directories exist
     */
    async ensureDirectories() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            await fs.mkdir(this.backupDir, { recursive: true });
        } catch (error) {
            logger.error('Failed to create backup directories:', error);
        }
    }

    /**
     * Backup simulation state
     */
    async backupState(simulationManager, metadata = {}) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(this.backupDir, `simulation_backup_${timestamp}.json`);

            const backupData = {
                timestamp: new Date().toISOString(),
                metadata: {
                    version: '1.0.0',
                    ...metadata
                },
                stations: [],
                groups: Object.fromEntries(simulationManager.groups),
                networks: Object.fromEntries(simulationManager.networks),
                statistics: simulationManager.getStatistics(),
                scenarios: Object.fromEntries(simulationManager.scenarios),
                profiles: Object.fromEntries(simulationManager.profiles)
            };

            // Backup station configurations and states
            for (const station of simulationManager.stations.values()) {
                backupData.stations.push({
                    stationId: station.stationId,
                    config: station.config,
                    status: station.getStatus(),
                    health: station.getHealth(),
                    metrics: station.metrics,
                    history: {
                        sessions: station.history.sessions.slice(-100), // Last 100 sessions
                        errors: station.history.errors.slice(-100), // Last 100 errors
                        metrics: station.history.metrics.slice(-100) // Last 100 metrics
                    }
                });
            }

            await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));

            logger.info(`💾 Backup created: ${backupFile}`);

            // Cleanup old backups (keep last 10)
            await this.cleanupOldBackups();

            return backupFile;
        } catch (error) {
            logger.error('Backup failed:', error);
            throw error;
        }
    }

    /**
     * Restore simulation state from backup
     */
    async restoreState(simulationManager, backupFile) {
        try {
            const backupData = JSON.parse(await fs.readFile(backupFile, 'utf8'));

            logger.info(`📥 Restoring simulation state from: ${backupFile}`);

            // Clear existing stations
            await simulationManager.removeAllStations();

            // Restore stations
            for (const stationData of backupData.stations) {
                const station = await simulationManager.createStation(stationData.config);

                // Restore health state
                if (stationData.health) {
                    station.health = stationData.health;
                }

                // Restore metrics
                if (stationData.metrics) {
                    station.metrics = stationData.metrics;
                }

                // Restore history
                if (stationData.history) {
                    station.history = stationData.history;
                }

                // Restore station state if it was online
                if (stationData.status.isOnline) {
                    try {
                        await station.start();
                    } catch (error) {
                        logger.warn(`Failed to restore station ${station.stationId}:`, error);
                    }
                }
            }

            logger.info(`✅ Simulation state restored: ${backupData.stations.length} stations`);

            return {
                restored: backupData.stations.length,
                timestamp: backupData.timestamp
            };
        } catch (error) {
            logger.error('Restore failed:', error);
            throw error;
        }
    }

    /**
     * List available backups
     */
    async listBackups() {
        try {
            const files = await fs.readdir(this.backupDir);
            const backups = [];

            for (const file of files) {
                if (file.startsWith('simulation_backup_') && file.endsWith('.json')) {
                    const filePath = path.join(this.backupDir, file);
                    const stats = await fs.stat(filePath);
                    const content = JSON.parse(await fs.readFile(filePath, 'utf8'));

                    backups.push({
                        file,
                        path: filePath,
                        size: stats.size,
                        timestamp: content.timestamp,
                        stationCount: content.stations?.length || 0,
                        created: stats.birthtime
                    });
                }
            }

            return backups.sort((a, b) => new Date(b.created) - new Date(a.created));
        } catch (error) {
            logger.error('Failed to list backups:', error);
            return [];
        }
    }

    /**
     * Cleanup old backups (keep last N)
     */
    async cleanupOldBackups(maxBackups = 10) {
        try {
            const backups = await this.listBackups();

            if (backups.length > maxBackups) {
                const toDelete = backups.slice(maxBackups);

                for (const backup of toDelete) {
                    await fs.unlink(backup.path);
                    logger.debug(`🗑️ Deleted old backup: ${backup.file}`);
                }
            }
        } catch (error) {
            logger.error('Backup cleanup failed:', error);
        }
    }

    /**
     * Export configuration (for manual backup)
     */
    async exportConfiguration(simulationManager, exportPath) {
        try {
            const config = simulationManager.exportConfiguration();
            await fs.writeFile(exportPath, JSON.stringify(config, null, 2));
            logger.info(`📤 Configuration exported to: ${exportPath}`);
            return exportPath;
        } catch (error) {
            logger.error('Export failed:', error);
            throw error;
        }
    }

    /**
     * Import configuration (for manual restore)
     */
    async importConfiguration(simulationManager, importPath) {
        try {
            const config = JSON.parse(await fs.readFile(importPath, 'utf8'));
            await simulationManager.importConfiguration(config);
            logger.info(`📥 Configuration imported from: ${importPath}`);
        } catch (error) {
            logger.error('Import failed:', error);
            throw error;
        }
    }
}

export default BackupManager;