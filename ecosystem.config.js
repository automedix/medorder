module.exports = {
  apps: [{
    name: 'medorder',
    script: 'npm',
    args: 'start',
    cwd: '/opt/medorder',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
    },
    log_file: '/opt/medorder/logs/combined.log',
    out_file: '/opt/medorder/logs/out.log',
    error_file: '/opt/medorder/logs/error.log',
    time: true
  }]
}
