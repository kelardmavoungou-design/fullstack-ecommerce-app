#!/usr/bin/env node

/**
 * Health Check Script for SOMBAGO Production
 * Tests all critical components before deployment
 */

const mysql = require('mysql2/promise');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class HealthChecker {
    constructor() {
        this.results = {
            database: false,
            environment: false,
            oauth: false,
            filesystem: false,
            network: false
        };
        this.errors = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const colors = {
            success: '\x1b[32m',
            error: '\x1b[31m',
            warning: '\x1b[33m',
            info: '\x1b[36m',
            reset: '\x1b[0m'
        };

        console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
    }

    async checkEnvironment() {
        this.log('🔍 Checking environment variables...', 'info');

        const requiredVars = [
            'NODE_ENV',
            'PORT',
            'DB_HOST',
            'DB_USER',
            'DB_NAME',
            'JWT_SECRET',
            'GOOGLE_CLIENT_ID',
            'GOOGLE_CLIENT_SECRET',
            'FACEBOOK_APP_ID',
            'FACEBOOK_APP_SECRET'
        ];

        const missing = requiredVars.filter(varName => !process.env[varName]);

        if (missing.length > 0) {
            this.errors.push(`Missing environment variables: ${missing.join(', ')}`);
            return false;
        }

        // Check JWT secret length
        if (process.env.JWT_SECRET.length < 32) {
            this.errors.push('JWT_SECRET should be at least 32 characters long');
            return false;
        }

        this.log('✅ Environment variables OK', 'success');
        return true;
    }

    async checkDatabase() {
        this.log('🔍 Checking database connection...', 'info');

        try {
            const connection = await mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME,
                connectTimeout: 5000
            });

            await connection.execute('SELECT 1');
            await connection.end();

            this.log('✅ Database connection OK', 'success');
            return true;
        } catch (error) {
            this.errors.push(`Database connection failed: ${error.message}`);
            return false;
        }
    }

    async checkOAuth() {
        this.log('🔍 Checking OAuth configuration...', 'info');

        try {
            // Test Google OAuth endpoint
            const googleResponse = await axios.get(`${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`}/api/auth/google`, {
                maxRedirects: 0,
                validateStatus: function (status) {
                    return status === 302; // Expect redirect
                }
            });

            if (googleResponse.status !== 302) {
                throw new Error('Google OAuth endpoint not responding correctly');
            }

            // Test Facebook OAuth endpoint
            const facebookResponse = await axios.get(`${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`}/api/auth/facebook`, {
                maxRedirects: 0,
                validateStatus: function (status) {
                    return status === 302; // Expect redirect
                }
            });

            if (facebookResponse.status !== 302) {
                throw new Error('Facebook OAuth endpoint not responding correctly');
            }

            this.log('✅ OAuth endpoints OK', 'success');
            return true;
        } catch (error) {
            this.errors.push(`OAuth check failed: ${error.message}`);
            return false;
        }
    }

    async checkFilesystem() {
        this.log('🔍 Checking filesystem permissions...', 'info');

        try {
            const uploadPath = path.join(__dirname, 'uploads');
            const avatarsPath = path.join(uploadPath, 'avatars');

            // Check if directories exist
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }

            if (!fs.existsSync(avatarsPath)) {
                fs.mkdirSync(avatarsPath, { recursive: true });
            }

            // Test write permissions
            const testFile = path.join(avatarsPath, 'test.txt');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);

            this.log('✅ Filesystem permissions OK', 'success');
            return true;
        } catch (error) {
            this.errors.push(`Filesystem check failed: ${error.message}`);
            return false;
        }
    }

    async checkNetwork() {
        this.log('🔍 Checking network connectivity...', 'info');

        try {
            // Test external API connectivity
            await axios.get('https://www.google.com', { timeout: 5000 });

            this.log('✅ Network connectivity OK', 'success');
            return true;
        } catch (error) {
            this.errors.push(`Network check failed: ${error.message}`);
            return false;
        }
    }

    async runAllChecks() {
        this.log('🚀 Starting SOMBAGO Health Check...', 'info');
        this.log('=====================================', 'info');

        this.results.environment = await this.checkEnvironment();
        this.results.database = await this.checkDatabase();
        this.results.oauth = await this.checkOAuth();
        this.results.filesystem = await this.checkFilesystem();
        this.results.network = await this.checkNetwork();

        this.log('=====================================', 'info');

        const passed = Object.values(this.results).filter(Boolean).length;
        const total = Object.keys(this.results).length;

        if (passed === total) {
            this.log(`✅ All checks passed! (${passed}/${total})`, 'success');
            this.log('🎉 Your SOMBAGO application is ready for production!', 'success');
            process.exit(0);
        } else {
            this.log(`❌ Some checks failed (${passed}/${total})`, 'error');
            this.log('Errors found:', 'error');
            this.errors.forEach(error => this.log(`  - ${error}`, 'error'));
            this.log('\n🔧 Please fix the above issues before deploying to production.', 'warning');
            process.exit(1);
        }
    }
}

// Load environment variables
require('dotenv').config();

const checker = new HealthChecker();
checker.runAllChecks().catch(error => {
    console.error('Health check failed with error:', error);
    process.exit(1);
});