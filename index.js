import express from "express";
const app = express();

const PORT = process.env.PORT || 3000;

const API_KEY = process.env.API_KEY;
const UNIVERSE_ID = process.env.UNIVERSE_ID;

app.get("/banned", async (req, res) => {
    const pageToken = req.query.pageToken || "";

    try {
        let url = `https://apis.roblox.com/cloud/v2/universes/${UNIVERSE_ID}/user-restrictions?maxPageSize=1&filter=game_join_restriction.active=="true"`;

        if (pageToken) {
            url += `&pageToken=${pageToken}`;
        }

        const response = await fetch(url, {
            headers: { "x-api-key": API_KEY }
        });

        const data = await response.json();

        const cleaned = (data.userRestrictions || []).map(entry => ({
            userId: entry.user.split("/")[1],
            reason: entry.gameJoinRestriction.displayReason,
            privateReason: entry.gameJoinRestriction.privateReason,
            startTime: entry.gameJoinRestriction.startTime
        }));

        res.json({
            data: cleaned,
            nextPageToken: data.nextPageToken || null
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

