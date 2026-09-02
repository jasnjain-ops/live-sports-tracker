const API_URL = "http://127.0.0.1:8000";

let footballRefreshTimer = null;
let currentFootballData = null;
let currentFootballFilter = "all";
let currentFootballSearch = "";


// ============================================================
// SELECT SPORT
// ============================================================

async function selectSport(sport) {

    const matchList =
        document.getElementById("match-list");

    const matchesTitle =
        document.getElementById("matches-title");

    const footballSearchContainer =
        document.getElementById("football-search-container");


    if (footballRefreshTimer) {

        clearInterval(
            footballRefreshTimer
        );

        footballRefreshTimer = null;

    }


    matchList.innerHTML = `
        <p class="loading">
            Loading matches...
        </p>
    `;


    if (sport === "football") {

        footballSearchContainer.style.display =
            "block";

    }

    else {

        footballSearchContainer.style.display =
            "none";

        document.getElementById(
            "football-search"
        ).value = "";

        currentFootballSearch = "";

    }


    if (sport === "f1") {

        matchesTitle.innerText =
            "🏎️ Formula 1";

    }

    else {

        matchesTitle.innerText =
            sport.charAt(0).toUpperCase() +
            sport.slice(1) +
            " Matches";

    }


    try {

        // ====================================================
        // F1
        // ====================================================

        if (sport === "f1") {

            const response =
                await fetch(
                    API_URL + "/api/f1/races"
                );


            if (!response.ok) {

                throw new Error(
                    "Server returned " +
                    response.status
                );

            }


            const data =
                await response.json();


            displayF1Races(data);

            return;

        }


        // ====================================================
        // FOOTBALL
        // ====================================================

        if (sport === "football") {

            await loadFootball();


            footballRefreshTimer =
                setInterval(
                    loadFootball,
                    60000
                );


            return;

        }


        // ====================================================
        // OTHER SPORTS
        // ====================================================

        matchList.innerHTML = `
            <p class="no-matches">
                ${sport.charAt(0).toUpperCase() +
                sport.slice(1)}
                API is not connected yet.
            </p>
        `;

    }


    catch (error) {

        console.error(error);

        matchList.innerHTML = `
            <p class="error">
                ❌ Unable to load matches.
                Make sure FastAPI is running.
            </p>
        `;

    }

}


// ============================================================
// LOAD FOOTBALL
// ============================================================

async function loadFootball() {

    const refreshButton =
        document.getElementById("football-refresh");

    try {

        // Show refreshing status
        if (refreshButton) {
            refreshButton.disabled = true;
            refreshButton.innerHTML = "🔄 Refreshing...";
        }

        const response = await fetch(
            `${API_URL}/api/live/football`
        );

        if (!response.ok) {
            throw new Error("Football API request failed");
        }

        const data = await response.json();

        displayFootballMatches(data);

    } catch (error) {

        console.error("Football error:", error);

        document.getElementById("match-list").innerHTML =
            `<p class="error">
                Unable to load football matches.
            </p>`;

    } finally {

        // Enable button again
        if (refreshButton) {
            refreshButton.disabled = false;
            refreshButton.innerHTML = "🔄 Refresh";
        }

    }
}


// ============================================================
// DISPLAY FOOTBALL MATCHES
// ============================================================

function displayFootballMatches(data) {

    currentFootballData = data;

    renderFootballMatches();

}


// ============================================================
// RENDER FOOTBALL MATCHES
// ============================================================

function renderFootballMatches() {

    const matchList =
        document.getElementById("match-list");


    matchList.innerHTML = "";


    if (!currentFootballData) {

        return;

    }


    const data =
        currentFootballData;


    const live =
        filterFootballMatches(
            data.live || []
        );


    const todayUpcoming =
        filterFootballMatches(
            data.today_upcoming || []
        );


    const upcoming =
        filterFootballMatches(
            data.upcoming || []
        );


    const finished =
        filterFootballMatches(
            data.finished || []
        );


    const postponed =
        filterFootballMatches(
            data.postponed || []
        );


    createFootballFilters();


    // ========================================================
    // LAST UPDATED
    // ========================================================

    const updateText =
        document.createElement("p");


    updateText.className =
        "last-updated";


    updateText.innerText =
    "🕐 Last updated: " +
    formatDateTime(
        data.last_updated
    );


    matchList.appendChild(
        updateText
    );


    // ========================================================
    // ALL
    // ========================================================

    if (currentFootballFilter === "all") {

        if (live.length > 0) {

            createSectionTitle(
                "🔴 LIVE NOW"
            );


            live.forEach(
                function(match) {

                    createFootballCard(
                        match,
                        "live"
                    );

                }
            );

        }


        if (todayUpcoming.length > 0) {

            createSectionTitle(
                "📅 TODAY"
            );


            todayUpcoming.forEach(
                function(match) {

                    createFootballCard(
                        match,
                        "upcoming"
                    );

                }
            );

        }


        if (upcoming.length > 0) {

            createSectionTitle(
                "🗓️ NEXT MATCHES"
            );


            upcoming.forEach(
                function(match) {

                    createFootballCard(
                        match,
                        "upcoming"
                    );

                }
            );

        }


        if (finished.length > 0) {

            createSectionTitle(
                "✅ FINISHED"
            );


            finished.forEach(
                function(match) {

                    createFootballCard(
                        match,
                        "finished"
                    );

                }
            );

        }


        if (postponed.length > 0) {

            createSectionTitle(
                "⏸️ POSTPONED"
            );


            postponed.forEach(
                function(match) {

                    createFootballCard(
                        match,
                        "postponed"
                    );

                }
            );

        }

    }


    // ========================================================
    // LIVE
    // ========================================================

    else if (
        currentFootballFilter === "live"
    ) {

        createFilteredSection(
            live,
            "🔴 LIVE NOW",
            "live"
        );

    }


    // ========================================================
    // TODAY
    // ========================================================

    else if (
        currentFootballFilter === "today"
    ) {

        createFilteredSection(
            todayUpcoming,
            "📅 TODAY",
            "upcoming"
        );

    }


    // ========================================================
    // UPCOMING
    // ========================================================

    else if (
        currentFootballFilter === "upcoming"
    ) {

        const allUpcoming =
            todayUpcoming.concat(
                upcoming
            );


        createFilteredSection(
            allUpcoming,
            "🗓️ UPCOMING",
            "upcoming"
        );

    }


    // ========================================================
    // FINISHED
    // ========================================================

    else if (
        currentFootballFilter === "finished"
    ) {

        createFilteredSection(
            finished,
            "✅ FINISHED",
            "finished"
        );

    }


    // ========================================================
    // POSTPONED
    // ========================================================

    else if (
        currentFootballFilter === "postponed"
    ) {

        createFilteredSection(
            postponed,
            "⏸️ POSTPONED",
            "postponed"
        );

    }

}


// ============================================================
// CREATE FOOTBALL FILTERS
// ============================================================

function createFootballFilters() {

    const matchList =
        document.getElementById("match-list");


    const filterContainer =
        document.createElement("div");


    filterContainer.className =
        "football-filters";


    const filters = [

        {
            name: "ALL",
            value: "all"
        },

        {
            name: "🔴 LIVE",
            value: "live"
        },

        {
            name: "📅 TODAY",
            value: "today"
        },

        {
            name: "🗓️ UPCOMING",
            value: "upcoming"
        },

        {
            name: "✅ FINISHED",
            value: "finished"
        },

        {
            name: "⏸️ POSTPONED",
            value: "postponed"
        }

    ];


    filters.forEach(
        function(filter) {

            const button =
                document.createElement("button");


            button.className =
                "football-filter";


            if (
                currentFootballFilter ===
                filter.value
            ) {

                button.classList.add(
                    "active"
                );

            }


            button.innerText =
                filter.name;


            button.onclick =
                function() {

                    currentFootballFilter =
                        filter.value;

                    renderFootballMatches();

                };


            filterContainer.appendChild(
                button
            );

        }
    );


    matchList.appendChild(
        filterContainer
    );

}


// ============================================================
// FILTER FOOTBALL MATCHES BY TEAM
// ============================================================

function filterFootballMatches(matches) {

    if (!currentFootballSearch) {

        return matches;

    }


    return matches.filter(
        function(match) {

            const home =
                (match.home || "")
                .toLowerCase();


            const away =
                (match.away || "")
                .toLowerCase();


            return (
                home.includes(
                    currentFootballSearch
                ) ||
                away.includes(
                    currentFootballSearch
                )
            );

        }
    );

}


// ============================================================
// CREATE FILTERED SECTION
// ============================================================

function createFilteredSection(
    matches,
    title,
    type
) {

    if (
        !matches ||
        matches.length === 0
    ) {

        const noMatches =
            document.createElement("p");


        noMatches.className =
            "no-matches";


        if (currentFootballSearch) {

            noMatches.innerText =
                '🔍 No matches found for "' +
                currentFootballSearch +
                '".';

        }

        else {

            noMatches.innerText =
                "⚽ No matches in this category.";

        }


        document
            .getElementById("match-list")
            .appendChild(
                noMatches
            );


        return;

    }


    createSectionTitle(
        title
    );


    matches.forEach(
        function(match) {

            createFootballCard(
                match,
                type
            );

        }
    );

}


// ============================================================
// CREATE FOOTBALL CARD
// ============================================================

function createFootballCard(
    match,
    type
) {

    const matchList =
        document.getElementById("match-list");


    const matchCard =
        document.createElement("div");


    matchCard.className =
        "football-card";


    // ========================================================
    // STATUS
    // ========================================================

    let statusText =
        "Upcoming";


    let statusClass =
        "upcoming-status";


    if (type === "live") {

        statusText =
            "🔴 LIVE";

        statusClass =
            "live-status";

    }

    else if (type === "finished") {

        statusText =
            "FT";

        statusClass =
            "finished-status";

    }

    else if (type === "postponed") {

        statusText =
            "POSTPONED";

        statusClass =
            "postponed-status";

    }

    else if (match.starting_at) {

        statusText =
            formatMatchTime(
                match.starting_at
            );

    }


    // ========================================================
    // TEAM NAMES
    // ========================================================

    const homeName =
        match.home ||
        "Home Team";


    const awayName =
        match.away ||
        "Away Team";


    // ========================================================
    // LOGOS
    // ========================================================

    let homeLogo = "";


    if (match.home_logo) {

        homeLogo = `
            <img
                src="${match.home_logo}"
                class="football-team-logo"
                alt="${homeName}"
                onerror="this.style.display='none'"
            >
        `;

    }


    let awayLogo = "";


    if (match.away_logo) {

        awayLogo = `
            <img
                src="${match.away_logo}"
                class="football-team-logo"
                alt="${awayName}"
                onerror="this.style.display='none'"
            >
        `;

    }


    // ========================================================
    // DATE
    // ========================================================

    let matchDate = "";


    if (match.starting_at) {

        matchDate =
            formatMatchDate(
                match.starting_at
            );

    }


    // ========================================================
    // SCORE
    // ========================================================

    const homeScore =
        match.home_score ?? "-";


    const awayScore =
        match.away_score ?? "-";


    // ========================================================
    // CARD HTML
    // ========================================================

    matchCard.innerHTML = `

        <div class="football-card-top">

            <span class="football-match-date">
                📅 ${matchDate}
            </span>

            <span class="football-status ${statusClass}">
                ${statusText}
            </span>

        </div>


        <div class="football-match">

            <div class="football-team">

                <div class="football-logo-container">
                    ${homeLogo}
                </div>

                <h3>
                    ${homeName}
                </h3>

                <p class="football-score">
                    ${homeScore}
                </p>

            </div>


            <div class="football-middle">

                <span class="football-vs">
                    VS
                </span>

                ${
                    match.result_info
                        ? `
                            <small class="result-info">
                                ${match.result_info}
                            </small>
                          `
                        : ""
                }

            </div>


            <div class="football-team">

                <div class="football-logo-container">
                    ${awayLogo}
                </div>

                <h3>
                    ${awayName}
                </h3>

                <p class="football-score">
                    ${awayScore}
                </p>

            </div>

        </div>

        <div class="football-click-hint">
            Click for match details
        </div>

    `;


    // ========================================================
    // OPEN MATCH DETAILS
    // ========================================================

    matchCard.addEventListener(
        "click",
        function() {

            showMatchDetails(
                match,
                type
            );

        }
    );


    matchList.appendChild(
        matchCard
    );

}


// ============================================================
// MATCH DETAILS POPUP
// ============================================================

// ============================================================
// MATCH DETAILS POPUP
// ============================================================

async function showMatchDetails(
    match,
    type
) {

    // ========================================================
    // REMOVE EXISTING MODAL
    // ========================================================

    const existingModal =
        document.getElementById(
            "football-details-modal"
        );


    if (existingModal) {

        existingModal.remove();

    }


    // ========================================================
    // STATUS
    // ========================================================

    let statusText =
        "Upcoming";


    if (type === "live") {

        statusText =
            "🔴 LIVE";

    }

    else if (type === "finished") {

        statusText =
            "✅ FINISHED";

    }

    else if (type === "postponed") {

        statusText =
            "⏸️ POSTPONED";

    }


    // ========================================================
    // CREATE LOADING MODAL
    // ========================================================

    const modal =
        document.createElement("div");


    modal.id =
        "football-details-modal";


    modal.className =
        "football-details-modal";


    modal.innerHTML = `

        <div class="football-details-box">

            <button
                class="football-details-close"
                id="football-details-close"
            >
                ✕
            </button>


            <h2>
                ⚽ Match Details
            </h2>


            <div class="details-status">
                ${statusText}
            </div>


            <div class="details-teams">

                <div class="details-team">

                    ${
                        match.home_logo
                            ? `
                                <img
                                    src="${match.home_logo}"
                                    class="details-team-logo"
                                    alt="${match.home || "Home Team"}"
                                    onerror="this.style.display='none'"
                                >
                              `
                            : ""
                    }

                    <h3>
                        ${match.home || "Home Team"}
                    </h3>

                    <div class="details-score">
                        ${match.home_score ?? "-"}
                    </div>

                </div>


                <div class="details-vs">
                    VS
                </div>


                <div class="details-team">

                    ${
                        match.away_logo
                            ? `
                                <img
                                    src="${match.away_logo}"
                                    class="details-team-logo"
                                    alt="${match.away || "Away Team"}"
                                    onerror="this.style.display='none'"
                                >
                              `
                            : ""
                    }

                    <h3>
                        ${match.away || "Away Team"}
                    </h3>

                    <div class="details-score">
                        ${match.away_score ?? "-"}
                    </div>

                </div>

            </div>


            <div class="details-information">

                <p class="loading">
                    Loading match information...
                </p>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    // ========================================================
    // CLOSE BUTTON
    // ========================================================

    document
        .getElementById(
            "football-details-close"
        )
        .addEventListener(
            "click",
            closeMatchDetails
        );


    // ========================================================
    // CLICK OUTSIDE TO CLOSE
    // ========================================================

    modal.addEventListener(
        "click",
        function(event) {

            if (
                event.target === modal
            ) {

                closeMatchDetails();

            }

        }
    );


    // ========================================================
    // GET DETAILED MATCH DATA
    // ========================================================

    try {

        const response =
            await fetch(
                API_URL +
                "/api/football/match/" +
                match.id
            );


        if (!response.ok) {

            throw new Error(
                "Server returned " +
                response.status
            );

        }


        const data =
            await response.json();


        // ====================================================
        // GET DATA
        // ====================================================

        const fixture =
            data.fixture || {};


        const venue =
            data.venue || {};


        const league =
            data.league || {};


        // ====================================================
        // FORMAT DATE AND TIME
        // ====================================================

        const matchDate =
            fixture.starting_at
                ? formatMatchDate(
                    fixture.starting_at
                )
                : "Not available";


        const matchTime =
            fixture.starting_at
                ? formatMatchTime(
                    fixture.starting_at
                )
                : "Not available";


        // ====================================================
        // RESULT INFORMATION
        // ====================================================

        const resultInfo =
            fixture.result_info ||
            match.result_info ||
            "No result information available";


        // ====================================================
        // LEAGUE
        // ====================================================

        const leagueName =
            league.name ||
            "Not available";


        const leagueLogo =
            league.image_path ||
            "";


        // ====================================================
        // VENUE INFORMATION
        // ====================================================

        const venueName =
            venue.name ||
            "Not available";


        const venueCity =
            venue.city_name ||
            "Not available";


        const venueAddress =
            venue.address ||
            "Not available";


        const venueCapacity =
            venue.capacity
                ? venue.capacity.toLocaleString()
                : "Not available";


        const venueSurface =
            venue.surface ||
            "Not available";


        // ====================================================
        // OTHER FIXTURE INFORMATION
        // ====================================================

        const matchState =
            match.state ||
            "Not available";


        const developerName =
            match.developer_name ||
            "Not available";


        const matchLength =
            fixture.length
                ? fixture.length + " minutes"
                : "Not available";


        const matchId =
            fixture.id ||
            match.id ||
            "Not available";


        // ====================================================
        // LEAGUE HEADER
        // ====================================================

        // ====================================================
// LEAGUE HEADER
// ====================================================

const leagueHTML = `

    <div class="details-league">

        <strong>
            🏆 ${leagueName}
        </strong>

    </div>

`;


        // ====================================================
        // UPDATE INFORMATION AREA
        // ====================================================

        const information =
            modal.querySelector(
                ".details-information"
            );


        information.innerHTML = `

            ${leagueHTML}


            <div class="details-row">

                <span>📅 Date</span>

                <strong>
                    ${matchDate}
                </strong>

            </div>


            <div class="details-row">

                <span>🕐 Kick-off</span>

                <strong>
                    ${matchTime}
                </strong>

            </div>


            <div class="details-row">

                <span>🏟️ Stadium</span>

                <strong>
                    ${venueName}
                </strong>

            </div>


            <div class="details-row">

                <span>📍 Location</span>

                <strong>
                    ${venueCity}
                </strong>

            </div>


            <div class="details-row">

                <span>📍 Address</span>

                <strong>
                    ${venueAddress}
                </strong>

            </div>


            <div class="details-row">

                <span>👥 Capacity</span>

                <strong>
                    ${venueCapacity}
                </strong>

            </div>


            <div class="details-row">

                <span>🌱 Surface</span>

                <strong>
                    ${venueSurface}
                </strong>

            </div>


            <div class="details-row">

                <span>⏱️ Match Length</span>

                <strong>
                    ${matchLength}
                </strong>

            </div>


            <div class="details-row">

                <span>🆔 Match ID</span>

                <strong>
                    ${matchId}
                </strong>

            </div>


            <div class="details-row">

                <span>📊 Match State</span>

                <strong>
                    ${matchState}
                </strong>

            </div>


            <div class="details-row">

                <span>🏷️ State Code</span>

                <strong>
                    ${developerName}
                </strong>

            </div>


            <div class="details-result">

                <span>📝 Result Information</span>

                <p>
                    ${resultInfo}
                </p>

            </div>

        `;

    }


    catch (error) {

        console.error(
            "Match details error:",
            error
        );


        const information =
            modal.querySelector(
                ".details-information"
            );


        information.innerHTML = `

            <p class="error">

                ❌ Unable to load detailed
                match information.

            </p>


            <div class="details-row">

                <span>🆔 Match ID</span>

                <strong>
                    ${match.id || "Not available"}
                </strong>

            </div>

        `;

    }

}


// ============================================================
// CLOSE MATCH DETAILS
// ============================================================

function closeMatchDetails() {

    const modal =
        document.getElementById(
            "football-details-modal"
        );


    if (modal) {

        modal.remove();

    }

}


// ============================================================
// CREATE SECTION TITLE
// ============================================================

function createSectionTitle(title) {

    const matchList =
        document.getElementById("match-list");


    const heading =
        document.createElement("h3");


    heading.className =
        "section-title";


    heading.innerText =
        title;


    matchList.appendChild(
        heading
    );

}


// ============================================================
// FORMAT MATCH TIME
// ============================================================

function formatMatchTime(
    dateTime
) {

    try {

        const date =
            new Date(
                dateTime.replace(
                    " ",
                    "T"
                ) + "Z"
            );


        return date.toLocaleString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            }
        );

    }


    catch (error) {

        return dateTime;

    }

}


// ============================================================
// FORMAT MATCH DATE
// ============================================================

function formatMatchDate(
    dateTime
) {

    try {

        const date =
            new Date(
                dateTime.replace(
                    " ",
                    "T"
                ) + "Z"
            );


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    }


    catch (error) {

        return "";

    }

}


// ============================================================
// FORMAT DATE TIME
// ============================================================

function formatDateTime(
    dateTime
) {

    if (!dateTime) {

        return "Unknown";

    }


    try {

        const date =
            new Date(
                dateTime.replace(
                    " ",
                    "T"
                )
            );


        return date.toLocaleString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true
            }
        );

    }


    catch (error) {

        return dateTime;

    }

}


// ============================================================
// FORMULA 1
// ============================================================

function displayF1Races(data) {

    const matchList =
        document.getElementById("match-list");


    matchList.innerHTML = "";


    if (
        !data.races ||
        data.races.length === 0
    ) {

        matchList.innerHTML = `
            <p class="no-matches">
                No Formula 1 races found.
            </p>
        `;

        return;

    }


    createSectionTitle(
        "🏎️ 2026 F1 RACE CALENDAR"
    );


    data.races.forEach(
        function(race) {

            const raceCard =
                document.createElement("div");


            raceCard.className =
                "match-card";


            raceCard.innerHTML = `

                <div>

                    <h3>
                        🏁 ${
                            race.raceName ||
                            "F1 Race"
                        }
                    </h3>

                    <p>
                        Round ${
                            race.round || ""
                        }
                    </p>

                </div>


                <div class="live">
                    F1
                </div>


                <div>

                    <h3>
                        ${
                            race.circuit || ""
                        }
                    </h3>

                    <p>
                        ${
                            race.date || ""
                        }
                    </p>

                </div>

            `;


            matchList.appendChild(
                raceCard
            );

        }
    );

}


// ============================================================
// SEARCH INPUT
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const searchInput =
            document.getElementById(
                "football-search"
            );


        searchInput.addEventListener(
            "input",
            function() {

                currentFootballSearch =
                    this.value
                        .trim()
                        .toLowerCase();


                renderFootballMatches();

            }
        );

    }
);
// Football refresh button
document.getElementById("football-refresh").addEventListener("click", function () {

    if (currentFootballData.length === 0) {
        loadFootball();
        return;
    }

    loadFootball();

});