const matches = {
    Football: [
        {
            team1: "Manchester United",
            team2: "Chelsea",
            score1: 2,
            score2: 1,
            status: "LIVE"
        },
        {
            team1: "Barcelona",
            team2: "Real Madrid",
            score1: 0,
            score2: 0,
            status: "UPCOMING"
        }
    ],

    Cricket: [
        {
            team1: "India",
            team2: "Australia",
            score1: 185,
            score2: 172,
            status: "LIVE"
        },
        {
            team1: "England",
            team2: "South Africa",
            score1: 0,
            score2: 0,
            status: "UPCOMING"
        }
    ],

    Basketball: [
        {
            team1: "Lakers",
            team2: "Warriors",
            score1: 98,
            score2: 94,
            status: "LIVE"
        }
    ],

    Tennis: [
        {
            team1: "Player A",
            team2: "Player B",
            score1: 2,
            score2: 1,
            status: "LIVE"
        }
    ]
};


function selectSport(sport) {

    const matchList = document.getElementById("match-list");

    matchList.innerHTML = "";

    matches[sport].forEach(function(match) {

        const matchCard = document.createElement("div");

        matchCard.className = "match-card";

        matchCard.innerHTML = `
            <div>
                <h3>${match.team1}</h3>
                <p>${match.score1}</p>
            </div>

            <div class="live">
                ${match.status}
            </div>

            <div>
                <h3>${match.team2}</h3>
                <p>${match.score2}</p>
            </div>
        `;

        matchList.appendChild(matchCard);
    });
}