"""Capture REAL data for the mission-sandbox demo video.

Narrative: a user never has a hand-curated "golden set" of facts. What they have is an EVAL — their
app's real questions, and whether the memory lets the app answer them. So this:

  1. Extracts facts from the user's notes with a NARROW vs a REFINED retain mission (the engine's
     extract_facts_from_text — what the dry-run endpoint runs internally). Those facts ARE the memory.
  2. Runs the user's eval: for each question, the "app" answers using ONLY what got remembered
     (or admits it can't), then a judge scores it against the expected answer.

The eval score (answer quality from recall) is the success metric — not fact-checking.
Real Gemini throughout. No DB, no server. Writes ../data.json.
"""

import asyncio
import json
import os
import re
import time
from datetime import datetime

import hindsight_api.config as _cfg  # noqa: F401  (import triggers load_dotenv)

# The repo .env pins the retired gemini-2.0-flash (404); override AFTER dotenv load.
os.environ["HINDSIGHT_API_LLM_MODEL"] = "gemini-2.5-flash"

from google import genai  # noqa: E402
from hindsight_api.config import _get_raw_config  # noqa: E402
from hindsight_api.engine.llm_wrapper import LLMConfig  # noqa: E402
from hindsight_api.engine.retain.fact_extraction import extract_facts_from_text  # noqa: E402

MODEL = "gemini-2.5-flash"

DOCS = [
    {
        "id": "journal-03-15",
        "date": "2024-03-15",
        "text": "Hey — quick update: I just accepted the senior product designer role at Lumen Labs! "
        "I'm relocating from Seattle to Austin next month to start. A bit nervous but mostly thrilled.",
    },
    {
        "id": "journal-05-02",
        "date": "2024-05-02",
        "text": "Settled into Austin finally. The big news: I adopted a rescue greyhound and named him Pixel. "
        "My favorite thing now is taking him to Zilker Park on Saturday mornings. I also signed up for a "
        "beginner pottery class — I've always wanted to try it.",
    },
    {
        "id": "journal-06-20",
        "date": "2024-06-20",
        "text": "Big week. We shipped the onboarding redesign I led at Lumen and the early metrics look great. "
        "To celebrate I booked a solo trip to Lisbon in September — I've wanted to see the tilework and "
        "architecture for years. Also: I switched to oat milk, since dairy's been upsetting my stomach.",
    },
]

# The user's EVAL: the real questions their assistant must answer from memory (+ expected answers
# the eval grades against). This is what they actually have — not a list of "correct facts".
EVAL = [
    {"q": "What does Maya do for work, and where?", "expected": "Senior product designer at Lumen Labs."},
    {"q": "Which city does Maya live in now?", "expected": "Austin."},
    {"q": "Does Maya have any pets?", "expected": "Yes — a rescue greyhound named Pixel."},
    {"q": "What new hobby is Maya taking up?", "expected": "Pottery (a beginner class)."},
    {"q": "Does Maya have any trips planned?", "expected": "A solo trip to Lisbon in September 2024."},
    {"q": "Any recent change to Maya's diet?", "expected": "She switched to oat milk."},
]

BASELINE_MISSION = (
    "Only record professional facts about the person: their name, job title, and employer. "
    "Do not record pets, hobbies, preferences, travel, or personal plans."
)

REFINED_MISSION = (
    "Extract durable facts about each person — identity, job/career, residence, and relocations "
    "(with dates). ALSO capture, attributed to the right person: pets (names), personal preferences "
    "and favorites, plans and intentions, the motivation or reason behind a decision, and notable "
    "dated events or achievements."
)


def mayaize(s: str) -> str:
    """First-person journal → no narrator → facts say 'the user'. Name her Maya so the memory,
    the eval questions, and the on-screen text all refer to the same person."""
    s = re.sub(r"\bthe user's\b", "Maya's", s, flags=re.I)
    s = re.sub(r"\bthe user\b", "Maya", s, flags=re.I)
    s = re.sub(r"\bUser\b", "Maya", s)
    s = re.sub(r"\btheir\b", "her", s, flags=re.I)
    s = re.sub(r"\bthem\b", "her", s, flags=re.I)
    s = re.sub(r"\bthey\b", "she", s, flags=re.I)
    return s


def _gen(client: genai.Client, **kw):
    """generate_content with a small retry on transient Gemini 5xx/429."""
    for attempt in range(5):
        try:
            return client.models.generate_content(**kw)
        except Exception as e:  # noqa: BLE001
            msg = str(e)
            transient = any(c in msg for c in ("503", "500", "429", "UNAVAILABLE", "overloaded"))
            if not transient or attempt == 4:
                raise
            time.sleep(2**attempt)


async def extract_for_mission(mission: str) -> list[dict]:
    llm_config = LLMConfig.from_env()
    config = _get_raw_config()
    config.retain_mission = mission
    facts: list[dict] = []
    for doc in DOCS:
        result_facts, _chunks, _usage = await extract_facts_from_text(
            text=doc["text"],
            event_date=datetime.fromisoformat(doc["date"]),
            llm_config=llm_config,
            agent_name="",
            config=config,
            context="Personal journal note",
        )
        for f in result_facts:
            facts.append({"text": mayaize(f.fact)})
    return facts


def run_eval(client: genai.Client, facts: list[dict]) -> list[dict]:
    """The user's eval: answer each question from memory only, then judge vs the expected answer."""
    memory = "\n".join(f"- {f['text']}" for f in facts) or "(memory is empty)"
    results = []
    for item in EVAL:
        ans = _gen(
            client,
            model=MODEL,
            contents=(
                f"You are an AI assistant answering from your long-term memory of the user.\n"
                f"Everything you remember:\n{memory}\n\n"
                f"Question: {item['q']}\n"
                "Answer in one short sentence using ONLY the memories above. "
                "If the answer is not in your memory, reply exactly: I don't have that in my memory."
            ),
            config={"temperature": 0},
        ).text.strip()
        verdict = _gen(
            client,
            model=MODEL,
            contents=(
                f"Question: {item['q']}\nExpected answer: {item['expected']}\n"
                f"Assistant's answer: {ans}\n\n"
                "Grade leniently. The answer is CORRECT if it conveys the key information in the expected "
                "answer — extra detail, paraphrase, or a missing minor specific (e.g. the exact year) is "
                "fine. It is INCORRECT only if it is wrong, omits the key information, or says it doesn't "
                "have the information in memory."
            ),
            config={
                "temperature": 0,
                "response_mime_type": "application/json",
                "response_schema": {"type": "OBJECT", "properties": {"correct": {"type": "BOOLEAN"}}, "required": ["correct"]},
            },
        ).text
        correct = bool(json.loads(verdict).get("correct"))
        results.append({"q": item["q"], "answer": ans, "correct": correct})
    return results


async def main() -> None:
    client = genai.Client(api_key=os.environ["HINDSIGHT_API_LLM_API_KEY"])
    out = {"documents": DOCS, "evalQuestions": [e["q"] for e in EVAL]}
    for name, mission in (("baseline", BASELINE_MISSION), ("refined", REFINED_MISSION)):
        print(f"Extracting + evaluating: {name}…")
        facts = await extract_for_mission(mission)
        results = run_eval(client, facts)
        score = sum(1 for r in results if r["correct"])
        out[name] = {"mission": mission, "facts": facts, "eval": results, "score": score, "total": len(EVAL)}
        print(f"  {name}: {len(facts)} facts in memory, eval {score}/{len(EVAL)}")

    path = os.path.join(os.path.dirname(__file__), "..", "data.json")
    with open(path, "w") as fh:
        json.dump(out, fh, indent=2)
    print(f"Wrote {os.path.abspath(path)}")


if __name__ == "__main__":
    asyncio.run(main())
