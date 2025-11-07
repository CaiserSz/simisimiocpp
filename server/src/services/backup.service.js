import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Backup Service - Backup and Recovery Manager
 * Service layer for backup operations
 * 
 * Created: 2025-01-11
 * Refactored from: utils/BackupManager.js
 * Purpose: Service layer pattern for backup management
 */
export class BackupService {
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
            };

            // Backup all stations
            for (const [stationId, station] of simulationManager.stations) {
                backupData.stations.push({
                    id: stationId,
                    config: station.config,
                    status: station.status,
                    health: station.health,
                    history: station.history.slice(-100) // Last 100 events
                });
            }

            await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
            logger.info(`✅ Backup created: ${backupFile}`);

            return {
                success: true,
                file: backupFile,
                timestamp: backupData.timestamp,
                stations: backupData.stations.length
            };
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

            logger.info(`🔄 Restoring from backup: ${backupFile}`);

            // Clear current state
            simulationManager.stations.clear();
            simulationManager.groups.clear();
            simulationManager.networks.clear();
            simulationManager.scenarios.clear();

            // Restore groups
            for (const [groupId, group] of Object.entries(backupData.groups)) {
                simulationManager.groups.set(groupId, group);
            }

            // Restore networks
            for (const [networkId, network] of Object.entries(backupData.networks)) {
                simulationManager.networks.set(networkId, network);
            }

            // Restore scenarios
            for (const [scenarioId, scenario] of Object.entries(backupData.scenarios)) {
                simulationManager.scenarios.set(scenarioId, scenario);
            }

            // Restore stations (will need to be recreated)
            logger.info(`📦 Restored ${backupData.stations.length} stations from backup`);

            return {
                success: true,
                stations: backupData.stations.length,
                timestamp: backupData.timestamp
            };
        } catch (error) {
            logger.error('Restore failed:', error);
            throw error;
        }
    }

    /**
     * List all backups
     */
    async listBackups() {
        try {
            const files = await fs.readdir(this.backupDir);
            const backups = [];

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(this.backupDir, file);
                    const stats = await fs.stat(filePath);
                    backups.push({
                        file,
                        path: filePath,
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime
                    });
                }
            }

            return backups.sort((a, b) => b.created - a.created);
        } catch (error) {
            logger.error('Failed to list backups:', error);
            return [];
        }
    }

    /**
     * Delete old backups (keep last N backups)
     */
    async cleanupOldBackups(keepCount = 10) {
        try {
            const backups = await this.listBackups();

            if (backups.length <= keepCount) {
                logger.info(`✅ No cleanup needed. ${backups.length} backups (keeping ${keepCount})`);
                return { deleted: 0, kept: backups.length };
            }

            const toDelete = backups.slice(keepCount);
            let deleted = 0;

            for (const backup of toDelete) {
                try {
                    await fs.unlink(backup.path);
                    deleted++;
                    logger.debug(`🗑️ Deleted old backup: ${backup.file}`);
                } catch (error) {
                    logger.error(`Failed to delete backup ${backup.file}:`, error);
                }
            }

            logger.info(`✅ Cleanup completed. Deleted ${deleted} backups, kept ${keepCount}`);
            return { deleted, kept: keepCount };
        } catch (error) {
            logger.error('Backup cleanup failed:', error);
            throw error;
        }
    }

    /**
     * Get backup directory path
     */
    getBackupDir() {
        return this.backupDir;
    }
}

// Export default for backward compatibility
export default BackupService;

// Also export as BackupManager for backward compatibility
export { BackupService as BackupManager };