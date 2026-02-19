import { app } from "@/app";
import { env } from "@/env";

app
  .listen({
    host: "0.0.0.0",
    port: env.PORT,
  })
  .then(() => {
    console.log("🚀 HTTP Server Running!");

    const gracefulShutdown = (signal: any) => {
      console.log(`Received ${signal}. Closing server and connections...`);
      app
        .close()
        .then(() => {
          console.log("Server and all resources have been closed gracefully.");

          // When using tools like nodemon that send SIGUSR2, re-emit SIGUSR2
          // This ensures the process can be restarted by the development tool
          if (signal === "SIGUSR2") {
            process.kill(process.pid, "SIGUSR2");
          } else {
            process.exit(0);
          }
        })
        .catch((err) => {
          console.error("Error during shutdown:", err);
          process.exit(1);
        });
    };

    // Intercept SIGINT and SIGTERM signals
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    // Handle SIGUSR2 separately for development restarts
    process.once("SIGUSR2", () => gracefulShutdown("SIGUSR2"));
  })
  .catch((error) => {
    console.error("Error starting server:", error);
    process.exit(1);
  });
