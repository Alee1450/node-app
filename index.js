const express = require("express");
const fetch = require("node-fetch");
const app = express();

const API_KEY = process.env.API_KEY;
const UNIVERSE_ID = process.env.UNIVERSE_ID;

app.get("/banned", async (req, res) => {
    let page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 1;

    try {
        let allBanned = [];
        let nextPageToken = "";
        do {
            let url = `https://apis.roblox.com/cloud/v2/universes/${UNIVERSE_ID}/user-restrictions?maxPageSize=${pageSize}&filter=game_join_restriction.active=="true"`;
            if (nextPageToken) url += `&pageToken=${nextPageToken}`;

            const response = await fetch(url, { headers: { "x-api-key": API_KEY } });
            const data = await response.json();

            if (data.userRestrictions) {
                allBanned.push(...data.userRestrictions);
            }
            nextPageToken = data.nextPageToken;
        } while (allBanned.length < page * pageSize && nextPageToken);

        const start = (page - 1) * pageSize;
        const pageData = allBanned.slice(start, start + pageSize).map(entry => {
            const userId = entry.user.split("/")[1];
            return {
                userId,
                reason: entry.gameJoinRestriction.displayReason,
                privateReason: entry.gameJoinRestriction.privateReason,
                startTime: entry.gameJoinRestriction.startTime
            };
        });

        res.json({
            page,
            pageSize,
            total: allBanned.length,
            totalPages: Math.ceil(allBanned.length / pageSize),
            data: pageData
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(process.env.PORT || 3000, () => console.log("Server running"));
