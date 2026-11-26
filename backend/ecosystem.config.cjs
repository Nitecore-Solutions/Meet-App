module.exports = {
  apps: [
    {
      name: "pagalpagal",
      script: "dist/index.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "1G",
      // NODE_ENV and all secrets come from backend/.env, never from here.
    },
  ],
};
