const app = require("./app");
const env = require("./config/env");

app.listen(env.PORT, () => {
  console.log(`✅ Server running: http://localhost:${env.PORT}`);
});
