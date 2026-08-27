module.exports = {
  apps: [
    {
      name: "xenon-backend",
      script: "server.js", // The entry point of your application
      instances: "max", // Run as many instances as there are CPU cores
      exec_mode: "cluster", // Enables cluster mode for high availability
      autorestart: true, // Auto restart if the app crashes
      watch: false, // Don't watch files in production (better performance)
      max_memory_restart: "1G", // Restart if it exceeds 1GB of memory
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      }
    }
  ]
};
