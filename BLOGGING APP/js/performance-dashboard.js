// Performance monitoring dashboard
import { perfMonitor } from './performance.js';
import { cache } from './cache.js';

class PerformanceDashboard {
    constructor() {
        this.isVisible = false;
        this.updateInterval = null;
        this.createDashboard();
    }

    createDashboard() {
        // Create dashboard HTML
        const dashboard = document.createElement('div');
        dashboard.id = 'performance-dashboard';
        dashboard.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 300px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            display: none;
            max-height: 400px;
            overflow-y: auto;
        `;

        dashboard.innerHTML = `
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                <h4 style="margin: 0; color: #4CAF50;">Performance Monitor</h4>
                <button id="close-perf-dashboard" style="background: none; border: none; color: white; cursor: pointer; font-size: 16px;">×</button>
            </div>
            <div id="perf-metrics"></div>
            <div id="cache-stats"></div>
            <div id="memory-stats"></div>
            <div id="connection-stats"></div>
        `;

        document.body.appendChild(dashboard);

        // Add close functionality
        document.getElementById('close-perf-dashboard').addEventListener('click', () => {
            this.hide();
        });

        this.dashboard = dashboard;
    }

    show() {
        this.isVisible = true;
        this.dashboard.style.display = 'block';
        this.startUpdating();
    }

    hide() {
        this.isVisible = false;
        this.dashboard.style.display = 'none';
        this.stopUpdating();
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    startUpdating() {
        this.updateInterval = setInterval(() => {
            this.updateStats();
        }, 1000);
        this.updateStats();
    }

    stopUpdating() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    updateStats() {
        this.updateMetrics();
        this.updateCacheStats();
        this.updateMemoryStats();
        this.updateConnectionStats();
    }

    updateMetrics() {
        const metrics = perfMonitor.getMetrics();
        const metricsHtml = Object.entries(metrics)
            .map(([name, data]) => `
                <div style="margin-bottom: 5px;">
                    <span style="color: #2196F3;">${name}:</span> 
                    <span style="color: #4CAF50;">${data.duration?.toFixed(2) || 'N/A'}ms</span>
                </div>
            `).join('');

        document.getElementById('perf-metrics').innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong style="color: #FF9800;">⏱️ Performance Metrics</strong>
                ${metricsHtml || '<div style="color: #666;">No metrics available</div>'}
            </div>
        `;
    }

    updateCacheStats() {
        const stats = cache.getStats();
        document.getElementById('cache-stats').innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong style="color: #9C27B0;">📦 Cache Stats</strong>
                <div style="margin-bottom: 5px;">
                    <span style="color: #2196F3;">Size:</span> 
                    <span style="color: #4CAF50;">${stats.size}/${stats.maxSize}</span>
                </div>
                <div style="margin-bottom: 5px;">
                    <span style="color: #2196F3;">Usage:</span> 
                    <span style="color: #4CAF50;">${((stats.size / stats.maxSize) * 100).toFixed(1)}%</span>
                </div>
            </div>
        `;
    }

    updateMemoryStats() {
        const memory = this.getMemoryUsage();
        if (memory) {
            document.getElementById('memory-stats').innerHTML = `
                <div style="margin-bottom: 10px;">
                    <strong style="color: #F44336;">🧠 Memory Usage</strong>
                    <div style="margin-bottom: 5px;">
                        <span style="color: #2196F3;">Used:</span> 
                        <span style="color: #4CAF50;">${memory.used}MB</span>
                    </div>
                    <div style="margin-bottom: 5px;">
                        <span style="color: #2196F3;">Total:</span> 
                        <span style="color: #4CAF50;">${memory.total}MB</span>
                    </div>
                    <div style="margin-bottom: 5px;">
                        <span style="color: #2196F3;">Limit:</span> 
                        <span style="color: #4CAF50;">${memory.limit}MB</span>
                    </div>
                </div>
            `;
        } else {
            document.getElementById('memory-stats').innerHTML = `
                <div style="margin-bottom: 10px;">
                    <strong style="color: #F44336;">🧠 Memory Usage</strong>
                    <div style="color: #666;">Not available</div>
                </div>
            `;
        }
    }

    updateConnectionStats() {
        const connection = this.getConnectionInfo();
        document.getElementById('connection-stats').innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong style="color: #00BCD4;">🌐 Connection</strong>
                <div style="margin-bottom: 5px;">
                    <span style="color: #2196F3;">Type:</span> 
                    <span style="color: #4CAF50;">${connection.effectiveType || 'Unknown'}</span>
                </div>
                <div style="margin-bottom: 5px;">
                    <span style="color: #2196F3;">Downlink:</span> 
                    <span style="color: #4CAF50;">${connection.downlink || 'Unknown'} Mbps</span>
                </div>
                <div style="margin-bottom: 5px;">
                    <span style="color: #2196F3;">RTT:</span> 
                    <span style="color: #4CAF50;">${connection.rtt || 'Unknown'}ms</span>
                </div>
            </div>
        `;
    }

    getMemoryUsage() {
        if ('memory' in performance) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                total: Math.round(performance.memory.totalJSHeapSize / 1048576),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
            };
        }
        return null;
    }

    getConnectionInfo() {
        if ('connection' in navigator) {
            return navigator.connection;
        }
        return {};
    }
}

// Create global performance dashboard
export const performanceDashboard = new PerformanceDashboard();

// Add keyboard shortcut to toggle dashboard (Ctrl+Shift+P)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        performanceDashboard.toggle();
    }
});

// Add console command
window.showPerformanceDashboard = () => performanceDashboard.show();
window.hidePerformanceDashboard = () => performanceDashboard.hide();