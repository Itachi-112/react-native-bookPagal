import cron from "cron";
import https from "https";

console.log("API URL:", process.env.API_URL); // Debugging log

if (!process.env.API_URL) {
  console.error("Error: API_URL is not set. Check your environment variables.");
} else {
  const job = new cron.CronJob("*/14 * * * *", function () {
    https
      .get(process.env.API_URL, (res) => {
        if (res.statusCode === 200) {
          console.log("GET request sent successfully");
        } else {
          console.log("GET request failed", res.statusCode);
        }
      })
      .on("error", (e) => console.error("Error while sending request", e));
  });

  job.start(); // Ensure the cron job actually starts
  console.log("Cron job scheduled successfully.");
}

export default job;
