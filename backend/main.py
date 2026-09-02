from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

env_path = os.path.join(BASE_DIR, ".env")

load_dotenv(env_path)

SPORTMONKS_API_TOKEN = os.getenv("SPORTMONKS_API_TOKEN")

if not SPORTMONKS_API_TOKEN:
    raise RuntimeError("SPORTMONKS_API_TOKEN is missing from .env")


app = FastAPI(title="Live Sports Tracker API")


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ============================================================
# API URLS
# ============================================================

SPORTMONKS_URL = "https://api.sportmonks.com/v3/football"

F1_URL = "https://f1api.dev/api"


# ============================================================
# SPORTMONKS HEADERS
# ============================================================

SPORTMONKS_HEADERS = {
    "Authorization": SPORTMONKS_API_TOKEN,
    "Accept": "application/json"
}


# ============================================================
# TIMEZONE
# ============================================================

INDIA_TIMEZONE = ZoneInfo("Asia/Kolkata")


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {
        "message": "Live Sports Tracker backend is working!"
    }


# ============================================================
# GET LIVE FOOTBALL
# ============================================================

def get_live_football():

    response = requests.get(
        f"{SPORTMONKS_URL}/livescores",
        headers=SPORTMONKS_HEADERS,
        params={
            "include": "participants;scores;events;state"
        },
        timeout=10
    )

    response.raise_for_status()

    return response.json().get("data", [])


# ============================================================
# GET FOOTBALL FIXTURES
# ============================================================

def get_football_fixtures():

    today = datetime.now(
        INDIA_TIMEZONE
    ).date()

    start_date = today - timedelta(
        days=7
    )

    end_date = today + timedelta(
        days=7
    )

    response = requests.get(
        f"{SPORTMONKS_URL}/fixtures/between/{start_date}/{end_date}",
        headers=SPORTMONKS_HEADERS,
        params={
            "include": "participants;scores;state"
        },
        timeout=10
    )

    response.raise_for_status()

    return response.json().get("data", [])


# ============================================================
# GET TEAM INFORMATION
# ============================================================

def get_team_information(match):

    home_team = {
        "name": "Home Team",
        "logo": ""
    }

    away_team = {
        "name": "Away Team",
        "logo": ""
    }


    participants = match.get("participants", [])


    for team in participants:

        location = team.get(
            "meta",
            {}
        ).get(
            "location"
        )


        team_data = {
            "name": team.get(
                "name",
                "Unknown Team"
            ),

            "logo": team.get(
                "image_path",
                ""
            )
        }


        if location == "home":

            home_team = team_data


        elif location == "away":

            away_team = team_data


    return home_team, away_team


# ============================================================
# GET MATCH SCORE
# ============================================================

def get_match_score(match):

    home_score = "-"
    away_score = "-"


    for score in match.get("scores", []):

        description = score.get(
            "description",
            ""
        )


        if description not in [
            "CURRENT",
            "CURRENT SCORE",
            "1ST_HALF",
            "2ND_HALF",
            "ET",
            "EXTRA_TIME"
        ]:

            continue


        score_data = score.get(
            "score",
            {}
        )


        participant = score_data.get(
            "participant"
        )


        goals = score_data.get(
            "goals"
        )


        if participant == "home":

            home_score = goals


        elif participant == "away":

            away_score = goals


    return home_score, away_score


# ============================================================
# GET MATCH STATUS
# ============================================================

def get_match_status(match):

    state = match.get(
        "state",
        {}
    )


    state_name = state.get(
        "name",
        ""
    )


    developer_name = state.get(
        "developer_name",
        ""
    )


    state_code = state.get(
        "state",
        ""
    )


    return {
        "name": state_name,
        "developer_name": developer_name,
        "state": state_code
    }

#def get_match_details(match):

    venue = match.get("venue") or {}
    league = match.get("league") or {}
    referee = match.get("referee") or {}
    round_data = match.get("round") or {}
    season = match.get("season") or {}
    stage = match.get("stage") or {}

    return {
        "venue": {
            "name": venue.get(
                "name",
                ""
            ),
            "city": venue.get(
                "city_name",
                ""
            ),
            "address": venue.get(
                "address",
                ""
            ),
            "capacity": venue.get(
                "capacity",
                ""
            )
        },

        "league": {
            "name": league.get(
                "name",
                ""
            ),
            "logo": league.get(
                "image_path",
                ""
            )
        },

        "referee": {
            "name": referee.get(
                "name",
                ""
            )
        },

        "round": round_data.get(
            "name",
            ""
        ),

        "season": season.get(
            "name",
            ""
        ),

        "stage": stage.get(
            "name",
            ""
        )
    }


# ============================================================
# CONVERT MATCH
# ============================================================

def convert_match(match):

    home_team, away_team = get_team_information(match)

    home_score, away_score = get_match_score(match)

    status = get_match_status(match)

    starting_at = match.get("starting_at")

    return {
        "id": match.get("id"),

        "home": home_team["name"],
        "away": away_team["name"],

        "home_logo": home_team["logo"],
        "away_logo": away_team["logo"],

        "home_score": home_score,
        "away_score": away_score,

        "status": status["name"],
        "state": status["state"],
        "developer_name": status["developer_name"],

        "starting_at": starting_at,

        "result_info": match.get(
            "result_info",
            ""
        )
    }


# ============================================================
# CHECK IF MATCH IS FINISHED
# ============================================================

def is_finished(match):

    state = match.get(
        "state",
        {}
    )

    state_name = str(
        state.get("name", "")
    ).upper()

    developer_name = str(
        state.get("developer_name", "")
    ).upper()

    state_code = str(
        state.get("state", "")
    ).upper()

    combined = (
        state_name + " " +
        developer_name + " " +
        state_code
    )

    # Common finished statuses
    finished_words = [
        "FT",
        "FULL TIME",
        "FINISHED",
        "AFTER FULL TIME",
        "AFTER EXTRA TIME",
        "AFTER PENALTIES",
        "AET",
        "AP"
    ]

    for word in finished_words:

        if word in combined:

            return True

    # Sportmonks full-time state
    if match.get("state_id") == 5:

        return True

    # If the fixture is clearly in the past
    starting_at = match.get(
        "starting_at"
    )

    if starting_at:

        try:

            match_time = datetime.strptime(
                starting_at,
                "%Y-%m-%d %H:%M:%S"
            ).replace(
                tzinfo=ZoneInfo("UTC")
            )

            now = datetime.now(
                INDIA_TIMEZONE
            )

            # More than 3 hours in the past
            # and it isn't marked postponed/cancelled
            if match_time < now - timedelta(hours=3):

                if not is_postponed(match):

                    return True

        except ValueError:

            pass

    return False


# ============================================================
# CHECK IF MATCH IS POSTPONED
# ============================================================

def is_postponed(match):

    state = match.get(
        "state",
        {}
    )


    text = (
        str(state.get("name", "")) +
        " " +
        str(state.get("developer_name", "")) +
        " " +
        str(state.get("state", ""))
    ).upper()


    return (
        "POSTPON" in text or
        "CANCEL" in text or
        "SUSPEND" in text
    )


# ============================================================
# FOOTBALL MAIN API
# ============================================================

@app.get("/api/live")
def live_matches(sport: str = "football"):

    if sport != "football":

        raise HTTPException(
            status_code=400,
            detail="Currently only football is connected"
        )


    try:

        # ----------------------------------------------------
        # GET LIVE MATCHES
        # ----------------------------------------------------

        live_matches = get_live_football()


        # ----------------------------------------------------
        # GET FIXTURES
        # ----------------------------------------------------

        fixtures = get_football_fixtures()


        # ----------------------------------------------------
        # LIVE MATCH IDs
        # ----------------------------------------------------

        live_ids = set()

        for match in live_matches:

            live_ids.add(
                match.get("id")
            )


        # ----------------------------------------------------
        # ARRAYS
        # ----------------------------------------------------

        live = []

        today_upcoming = []

        upcoming = []

        finished = []

        postponed = []


        now = datetime.now(
            INDIA_TIMEZONE
        )


        today = now.date()


        # ====================================================
        # LIVE
        # ====================================================

        for match in live_matches:

            live.append(
                convert_match(match)
            )


        # ====================================================
        # PROCESS FIXTURES
        # ====================================================

        for match in fixtures:

            match_id = match.get(
                "id"
            )


            # Don't duplicate live matches

            if match_id in live_ids:

                continue


            converted = convert_match(
                match
            )


            starting_at = match.get(
                "starting_at"
            )


            if not starting_at:

                continue


            # ------------------------------------------------
            # CONVERT API UTC TIME TO INDIA TIME
            # ------------------------------------------------

            try:

                match_datetime = datetime.strptime(
                    starting_at,
                    "%Y-%m-%d %H:%M:%S"
                ).replace(
                    tzinfo=ZoneInfo("UTC")
                ).astimezone(
                    INDIA_TIMEZONE
                )

            except ValueError:

                continue


            # =================================================
            # POSTPONED
            # =================================================

            if is_postponed(match):

                postponed.append(
                    converted
                )

                continue


            # =================================================
            # FINISHED
            # =================================================

            if is_finished(match):

                finished.append(
                    converted
                )

                continue


            # =================================================
            # UPCOMING
            # =================================================

            if match_datetime >= now:

                if match_datetime.date() == today:

                    today_upcoming.append(
                        converted
                    )

                else:

                    upcoming.append(
                        converted
                    )


        # ====================================================
        # SORT
        # ====================================================

        today_upcoming.sort(
            key=lambda x: x.get(
                "starting_at",
                ""
            )
        )


        upcoming.sort(
            key=lambda x: x.get(
                "starting_at",
                ""
            )
        )


        finished.sort(
            key=lambda x: x.get(
                "starting_at",
                ""
            ),
            reverse=True
        )


        postponed.sort(
            key=lambda x: x.get(
                "starting_at",
                ""
            )
        )


        # ====================================================
        # RETURN DATA
        # ====================================================

        return {

            "live": live,

            "today_upcoming": today_upcoming,

            "upcoming": upcoming,

            "finished": finished,

            "postponed": postponed,

            "last_updated": now.strftime(
                "%Y-%m-%d %H:%M:%S"
            )

        }


    except requests.exceptions.RequestException as e:

        raise HTTPException(
            status_code=500,
            detail=f"Football API error: {str(e)}"
        )


# ============================================================
# FOOTBALL DIRECT ROUTE
# ============================================================

@app.get("/api/live/{sport}")
def live_matches_by_sport(sport: str):

    return live_matches(sport)

@app.get("/api/football/match/{match_id}")
def football_match_details(match_id: int):

    try:

        # ==========================================
        # 1. GET BASIC FIXTURE
        # ==========================================

        fixture_response = requests.get(
            f"{SPORTMONKS_URL}/fixtures/{match_id}",
            headers=SPORTMONKS_HEADERS,
            timeout=10
        )

        fixture_response.raise_for_status()

        fixture = fixture_response.json().get(
            "data",
            {}
        )

        if not fixture:
            raise HTTPException(
                status_code=404,
                detail="Match not found"
            )


        # ==========================================
        # 2. GET VENUE
        # ==========================================

        venue = {}

        venue_id = fixture.get("venue_id")

        if venue_id:

            venue_response = requests.get(
                f"{SPORTMONKS_URL}/venues/{venue_id}",
                headers=SPORTMONKS_HEADERS,
                timeout=10
            )

            if venue_response.ok:

                venue = venue_response.json().get(
                    "data",
                    {}
                )


        # ==========================================
        # 3. GET LEAGUE
        # ==========================================

        league = {}

        league_id = fixture.get("league_id")

        if league_id:

            league_response = requests.get(
                f"{SPORTMONKS_URL}/leagues/{league_id}",
                headers=SPORTMONKS_HEADERS,
                timeout=10
            )

            if league_response.ok:

                league = league_response.json().get(
                    "data",
                    {}
                )


        # ==========================================
        # 4. RETURN DETAILS
        # ==========================================

        return {
            "fixture": fixture,
            "venue": venue,
            "league": league
        }


    except requests.exceptions.RequestException as e:

        print("SPORTMONKS ERROR:")
        print(str(e))

        raise HTTPException(
            status_code=500,
            detail=f"Football API error: {str(e)}"
        )
# ============================================================
# FORMULA 1
# ============================================================

@app.get("/api/f1/drivers")
def f1_drivers():

    try:

        response = requests.get(
            f"{F1_URL}/current/drivers",
            timeout=10
        )

        response.raise_for_status()

        return response.json()

    except requests.exceptions.RequestException as e:

        raise HTTPException(
            status_code=500,
            detail=f"F1 API error: {str(e)}"
        )


# ============================================================
# F1 - MAX VERSTAPPEN
# ============================================================

@app.get("/api/f1/drivers/max")
def max_verstappen():

    try:

        response = requests.get(
            f"{F1_URL}/current/drivers/max_verstappen",
            timeout=10
        )

        response.raise_for_status()

        return response.json()

    except requests.exceptions.RequestException as e:

        raise HTTPException(
            status_code=500,
            detail=f"F1 API error: {str(e)}"
        )


# ============================================================
# F1 - DRIVER STANDINGS
# ============================================================

@app.get("/api/f1/standings")
def f1_driver_standings():

    try:

        response = requests.get(
            f"{F1_URL}/current/drivers-championship",
            timeout=10
        )

        response.raise_for_status()

        return response.json()

    except requests.exceptions.RequestException as e:

        raise HTTPException(
            status_code=500,
            detail=f"F1 API error: {str(e)}"
        )


# ============================================================
# F1 - CONSTRUCTOR STANDINGS
# ============================================================

@app.get("/api/f1/constructors")
def f1_constructor_standings():

    try:

        response = requests.get(
            f"{F1_URL}/current/constructors-championship",
            timeout=10
        )

        response.raise_for_status()

        return response.json()

    except requests.exceptions.RequestException as e:

        raise HTTPException(
            status_code=500,
            detail=f"F1 API error: {str(e)}"
        )


# ============================================================
# F1 - RACE CALENDAR
# ============================================================

@app.get("/api/f1/races")
def f1_races():

    try:

        response = requests.get(
            f"{F1_URL}/current",
            timeout=10
        )

        response.raise_for_status()

        return response.json()

    except requests.exceptions.RequestException as e:

        raise HTTPException(
            status_code=500,
            detail=f"F1 API error: {str(e)}"
        )

