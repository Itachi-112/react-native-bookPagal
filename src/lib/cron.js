import cron from "cron";
import https from "https";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Debugging: Check if API_URL is properly loaded
console.log("API_URL from env:", process.env.API_URL);

const job = new cron.CronJob("*/14 * * * *", function () {
    if (!process.env.API_URL) {
        console.error("Error: API_URL is not defined in environment variables!");
        return;
    }

    https
        .get(process.env.API_URL, (res) => {
            if (res.statusCode === 200) console.log("GET request sent successfully");
            else console.log("GET request failed", res.statusCode);
        })
        .on("error", (e) => console.error("Error while sending request", e));
});

// Start the cron job

console.log("Cron job started...");
export default job;
