const express = require("express");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.API_KEY;
const ADMIN_KEY = process.env.ADMIN_KEY;
const UNIVERSE_ID = process.env.UNIVERSE_ID;

const PAGE_SIZE = 25;
const CACHE_TIME = 60000; // 60 seconds

// ---------------------------
// Rate Limiting
// ---------------------------
app.use(rateLimit({
    windowMs: 60 * 1000,
    max: 60, // 60 requests per minute
    message: { error: "Too many requests" }
}));

// ---------------------------
// Cache System
// ---------------------------
let cache = null;
let lastFetch = 0;

// ---------------------------
// Endpoint
// ---------------------------
app.get("/banned", async (req, res) => {
    try {
        // ---------------------------
        // Admin Authentication
        // ---------------------------
        if (req.headers["x-admin-key"] !== ADMIN_KEY) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        let page = parseInt(req.query.page) || 1;
        if (page < 1) page = 1;

        const now = Date.now();

        // ---------------------------
        // Fetch from Roblox if cache expired
        // ---------------------------
        if (!cache || now - lastFetch > CACHE_TIME) {
            let allBanned = [];
            let nextPageToken = "";

            do {
                let url = `https://apis.roblox.com/cloud/v2/universes/${UNIVERSE_ID}/user-restrictions?maxPageSize=100&filter=game_join_restriction.active=="true"`;
                if (nextPageToken) {
                    url += `&pageToken=${nextPageToken}`;
                }

                const response = await fetch(url, {
                    headers: { "x-api-key": API_KEY }
                });

                if (!response.ok) {
                    throw new Error(`Roblox API error: ${response.status}`);
                }

                const data = await response.json();

                if (data.userRestrictions) {
                    allBanned.push(...data.userRestrictions);
                }

                nextPageToken = data.nextPageToken;
            } while (nextPageToken);

            cache = allBanned.map(entry => {
                const userId = entry.user.split("/")[1];
                return {
                    userId,
                    reason: entry.gameJoinRestriction.displayReason,
                    privateReason: entry.gameJoinRestriction.privateReason,
                    startTime: entry.gameJoinRestriction.startTime
                };
            });

            lastFetch = now;
            console.log("Ban list refreshed");
        }

        // ---------------------------
        // Pagination
        // ---------------------------
        const totalUsers = cache.length;
        const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));

        if (page > totalPages) page = totalPages;

        const start = (page - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;

        const paginated = cache.slice(start, end);

        res.json({
            success: true,
            currentPage: page,
            totalPages,
            totalUsers,
            users: paginated
        });

    } catch (err) {
        console.error("Error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
