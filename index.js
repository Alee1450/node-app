const express = require("express");
const fetch = require("node-fetch");
const app = express();

const API_KEY = process.env.API_KEY;
const UNIVERSE_ID = process.env.UNIVERSE_ID;

app.get("/banned", async (req, res) => {
    const pageToken = req.query.pageToken || "";
    const pageSize = parseInt(req.query.pageSize) || 25;

    try {
        let url = `https://apis.roblox.com/cloud/v2/universes/${UNIVERSE_ID}/user-restrictions?maxPageSize=${pageSize}&filter=game_join_restriction.active=="true"`;
        if (pageToken) url += `&pageToken=${pageToken}`;

        const response = await fetch(url, { headers: { "x-api-key": API_KEY } });
        if (!response.ok) return res.status(response.status).json({ error: "Roblox API error" });

        const data = await response.json();
        const cleaned = (data.userRestrictions || []).map(entry => {
            const userId = entry.user.split("/")[1];
            return {
                userId,
                reason: entry.gameJoinRestriction.displayReason,
                privateReason: entry.gameJoinRestriction.privateReason,
                startTime: entry.gameJoinRestriction.startTime
            };
        });

        res.json({
            data: cleaned,
            nextPageToken: data.nextPageToken || null
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(process.env.PORT || 3000, () => console.log("Server running"));
