const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

const API_KEY = process.env.API_KEY;
const UNIVERSE_ID = process.env.UNIVERSE_ID;

app.get("/banned", async (req, res) => {
    let allBanned = [];
    let nextPageToken = "";

    try {
        do {
            let url = `https://apis.roblox.com/cloud/v2/universes/${UNIVERSE_ID}/user-restrictions?maxPageSize=100&filter=game_join_restriction.active=="true"`;
            if (nextPageToken) {
                url += `&pageToken=${nextPageToken}`;
            }

            const response = await fetch(url, {
                headers: {
                    "x-api-key": API_KEY
                }
            });

            const data = await response.json();

            if (data.userRestrictions) {
                allBanned.push(...data.userRestrictions);
            }

            nextPageToken = data.nextPageToken;
        } while (nextPageToken);

        const cleaned = allBanned.map(entry => {
            const userId = entry.user.split("/")[1];
            return {
                userId: userId,
                reason: entry.gameJoinRestriction.displayReason,
                privateReason: entry.gameJoinRestriction.privateReason,
                startTime: entry.gameJoinRestriction.startTime
            };
        });

        res.json(cleaned);


    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

