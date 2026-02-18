const express = require("express")
const app = express()

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send("Hello skibidi!");
})

app.get('/api/info', (req, res) => {
    res.json({ message: 'Hello World!' })
})

app.listen(PORT, () => {
    console.log(`MESSAGE RECIVED: ${PORT}`);
})