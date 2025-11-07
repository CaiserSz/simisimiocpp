import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { SimulationManager } from '../../simulator/SimulationManager.js';
// @deprecated: Using BackupService instead of BackupManager

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

describe('BackupManager', () => {
    let backupManager;
    let simulationManager;
    let testDataDir;
    let testBackupDir;

    beforeAll(async() => {
        testDataDir = path.join(__dirname, '../../../test-data');
        testBackupDir = path.join(testDataDir, 'backups');

        // Ensure test directories exist
        await fs.mkdir(testDataDir, { recursive: true });
        await fs.mkdir(testBackupDir, { recursive: true });
    });

    beforeEach(async() => {
        backupManager = new BackupManager('test-data');
        simulationManager = new SimulationManager();

        // Create test stations
        await simulationManager.createStation({
            stationId: 'TEST_STATION_1',
            vendor: 'TestVendor',
            model: 'TestModel',
            ocppVersion: '1.6J'
        });

        await simulationManager.createStation({
            stationId: 'TEST_STATION_2',
            vendor: 'TestVendor2',
            model: 'TestModel2',
            ocppVersion: '2.0.1'
        });
    });

    afterEach(async() => {
        // Clean up backups
        try {
            const backups = await backupManager.listBackups();
            for (const backup of backups) {
                await fs.unlink(backup.path).catch(() => {});
            }
        } catch (error) {
            // Ignore cleanup errors
        }

        // Clean up stations
        await simulationManager.removeAllStations();
    });

    afterAll(async() => {
        // Clean up test directories
        try {
            await fs.rm(testBackupDir, { recursive: true, force: true });
        } catch (error) {
            // Ignore cleanup errors
        }
    });

    describe('Initialization', () => {
        test('should initialize with default data directory', () => {
            const manager = new BackupManager();
            expect(manager).toBeDefined();
            expect(manager.dataDir).toBeDefined();
            expect(manager.backupDir).toBeDefined();
        });

        test('should initialize with custom data directory', () => {
            const customDir = 'custom-data';
            const manager = new BackupManager(customDir);
            expect(manager.dataDir).toContain(customDir);
            expect(manager.backupDir).toContain('backups');
        });
    });

    describe('Backup Creation', () => {
        test('should create backup successfully', async() => {
            const backupFile = await backupManager.backupState(simulationManager, {
                reason: 'test_backup',
                version: '1.0.0'
            });

            expect(backupFile).toBeDefined();
            expect(backupFile).toContain('simulation_backup');
            expect(backupFile).toContain('.json');

            // Verify backup file exists
            const fileExists = await fs.access(backupFile).then(() => true).catch(() => false);
            expect(fileExists).toBe(true);
        });

        test('should include all station data in backup', async() => {
            const backupFile = await backupManager.backupState(simulationManager);

            const backupData = JSON.parse(await fs.readFile(backupFile, 'utf8'));

            expect(backupData.stations).toHaveLength(2);
            expect(backupData.stations[0].stationId).toBe('TEST_STATION_1');
            expect(backupData.stations[1].stationId).toBe('TEST_STATION_2');
            expect(backupData.metadata).toBeDefined();
            expect(backupData.timestamp).toBeDefined();
        });

        test('should include metadata in backup', async() => {
            const metadata = {
                reason: 'test_backup',
                version: '1.0.0',
                user: 'test_user'
            };

            const backupFile = await backupManager.backupState(simulationManager, metadata);
            const backupData = JSON.parse(await fs.readFile(backupFile, 'utf8'));

            expect(backupData.metadata.reason).toBe('test_backup');
            expect(backupData.metadata.version).toBe('1.0.0');
            expect(backupData.metadata.user).toBe('test_user');
        });

        test('should include statistics in backup', async() => {
            const backupFile = await backupManager.backupState(simulationManager);
            const backupData = JSON.parse(await fs.readFile(backupFile, 'utf8'));

            expect(backupData.statistics).toBeDefined();
            expect(backupData.statistics.totalStations).toBe(2);
        });

        test('should handle empty simulation manager', async() => {
            const emptyManager = new SimulationManager();
            const backupFile = await backupManager.backupState(emptyManager);

            const backupData = JSON.parse(await fs.readFile(backupFile, 'utf8'));
            expect(backupData.stations).toHaveLength(0);
        });

        test('should cleanup old backups', async() => {
            // Create more than maxBackups (default 10)
            for (let i = 0; i < 12; i++) {
                await backupManager.backupState(simulationManager, { index: i });
                await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to ensure different timestamps
            }

            const backups = await backupManager.listBackups();
            expect(backups.length).toBeLessThanOrEqual(10);
        });
    });

    describe('Backup Restoration', () => {
        test('should restore simulation state from backup', async() => {
            // Create backup
            const backupFile = await backupManager.backupState(simulationManager);

            // Clear stations
            await simulationManager.removeAllStations();
            expect(simulationManager.stations.size).toBe(0);

            // Restore from backup
            const result = await backupManager.restoreState(simulationManager, backupFile);

            expect(result.restored).toBe(2);
            expect(simulationManager.stations.size).toBe(2);
            expect(simulationManager.getStation('TEST_STATION_1')).toBeDefined();
            expect(simulationManager.getStation('TEST_STATION_2')).toBeDefined();
        });

        test('should restore station configurations correctly', async() => {
            const backupFile = await backupManager.backupState(simulationManager);
            await simulationManager.removeAllStations();

            await backupManager.restoreState(simulationManager, backupFile);

            const station1 = simulationManager.getStation('TEST_STATION_1');
            expect(station1.config.vendor).toBe('TestVendor');
            expect(station1.config.model).toBe('TestModel');
            expect(station1.config.ocppVersion).toBe('1.6J');
        });

        test('should restore station metrics', async() => {
            // Set some metrics
            const station1 = simulationManager.getStation('TEST_STATION_1');
            station1.metrics.totalSessions = 10;
            station1.metrics.totalEnergyDelivered = 100;

            const backupFile = await backupManager.backupState(simulationManager);
            await simulationManager.removeAllStations();

            await backupManager.restoreState(simulationManager, backupFile);

            const restoredStation = simulationManager.getStation('TEST_STATION_1');
            expect(restoredStation.metrics.totalSessions).toBe(10);
            expect(restoredStation.metrics.totalEnergyDelivered).toBe(100);
        });

        test('should handle invalid backup file', async() => {
            const invalidFile = path.join(testBackupDir, 'invalid_backup.json');
            await fs.writeFile(invalidFile, 'invalid json');

            await expect(
                backupManager.restoreState(simulationManager, invalidFile)
            ).rejects.toThrow();
        });

        test('should handle missing backup file', async() => {
            await expect(
                backupManager.restoreState(simulationManager, 'nonexistent.json')
            ).rejects.toThrow();
        });
    });

    describe('Backup Listing', () => {
        test('should list all backups', async() => {
            await backupManager.backupState(simulationManager, { index: 1 });
            await backupManager.backupState(simulationManager, { index: 2 });
            await backupManager.backupState(simulationManager, { index: 3 });

            const backups = await backupManager.listBackups();

            expect(backups.length).toBeGreaterThanOrEqual(3);
            expect(backups[0]).toHaveProperty('file');
            expect(backups[0]).toHaveProperty('path');
            expect(backups[0]).toHaveProperty('timestamp');
            expect(backups[0]).toHaveProperty('stationCount');
        });

        test('should sort backups by creation date', async() => {
            await backupManager.backupState(simulationManager, { index: 1 });
            await new Promise(resolve => setTimeout(resolve, 100));
            await backupManager.backupState(simulationManager, { index: 2 });

            const backups = await backupManager.listBackups();

            if (backups.length >= 2) {
                const firstDate = new Date(backups[0].created);
                const secondDate = new Date(backups[1].created);
                expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
            }
        });

        test('should return empty array when no backups exist', async() => {
            const backups = await backupManager.listBackups();
            // Should be empty or contain only previous test backups
            expect(Array.isArray(backups)).toBe(true);
        });
    });

    describe('Export/Import Configuration', () => {
        test('should export configuration to file', async() => {
            const exportPath = path.join(testDataDir, 'export_test.json');

            try {
                await backupManager.exportConfiguration(simulationManager, exportPath);

                const fileExists = await fs.access(exportPath).then(() => true).catch(() => false);
                expect(fileExists).toBe(true);

                const config = JSON.parse(await fs.readFile(exportPath, 'utf8'));
                expect(config.stations).toHaveLength(2);

                // Cleanup
                await fs.unlink(exportPath);
            } catch (error) {
                // Cleanup on error
                await fs.unlink(exportPath).catch(() => {});
                throw error;
            }
        });

        test('should import configuration from file', async() => {
            const exportPath = path.join(testDataDir, 'import_test.json');

            try {
                // Export first
                await backupManager.exportConfiguration(simulationManager, exportPath);

                // Clear stations
                await simulationManager.removeAllStations();
                expect(simulationManager.stations.size).toBe(0);

                // Import
                await backupManager.importConfiguration(simulationManager, exportPath);

                expect(simulationManager.stations.size).toBe(2);

                // Cleanup
                await fs.unlink(exportPath);
            } catch (error) {
                // Cleanup on error
                await fs.unlink(exportPath).catch(() => {});
                throw error;
            }
        });

        test('should handle invalid export file path', async() => {
            const invalidPath = '/invalid/path/export.json';

            await expect(
                backupManager.exportConfiguration(simulationManager, invalidPath)
            ).rejects.toThrow();
        });
    });

    describe('Edge Cases', () => {
        test('should handle backup with corrupted data', async() => {
            const backupFile = await backupManager.backupState(simulationManager);

            // Corrupt the backup file
            await fs.writeFile(backupFile, 'corrupted data');

            await expect(
                backupManager.restoreState(simulationManager, backupFile)
            ).rejects.toThrow();
        });

        test('should handle backup with missing required fields', async() => {
            const invalidBackup = {
                timestamp: new Date().toISOString(),
                stations: []
                    // Missing metadata and statistics
            };

            const backupFile = path.join(testBackupDir, 'invalid_backup.json');
            await fs.writeFile(backupFile, JSON.stringify(invalidBackup));

            // Should still work but with empty data
            await expect(
                backupManager.restoreState(simulationManager, backupFile)
            ).resolves.toBeDefined();
        });

        test('should handle concurrent backup creation', async() => {
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(backupManager.backupState(simulationManager, { index: i }));
            }

            const backupFiles = await Promise.all(promises);
            expect(backupFiles.length).toBe(5);

            // All should be unique
            const uniqueFiles = new Set(backupFiles);
            expect(uniqueFiles.size).toBe(5);
        });
    });
});