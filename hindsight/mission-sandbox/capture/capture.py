"""Capture REAL extraction output for the mission-sandbox demo video.

Mirrors what the dry-run-extract endpoint does internally: calls the engine's
extract_facts_from_text with a BASELINE vs a REFINED retain mission over a small,
realistic (non-LOCOMO) dataset, then scores golden coverage with a real Gemini judge.
Writes demo-data.json for the Remotion composition. No DB, no server.
"""

import asyncio
import json
import os
from datetime import datetime

import hindsight_api.config as _cfg  # noqa: F401  (import triggers load_dotenv)

# The repo .env pins the retired gemini-2.0-flash (404); override AFTER dotenv load.
os.environ["HINDSIGHT_API_LLM_MODEL"] = "gemini-2.5-flash"

from google import genai  # noqa: E402
from hindsight_api.config import _get_raw_config  # noqa: E402
from hindsight_api.engine.llm_wrapper import LLMConfig  # noqa: E402
from hindsight_api.engine.retain.fact_extraction import extract_facts_from_text  # noqa: E402

NARRATOR = ""

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

GOLDEN = [
    "Maya is a senior product designer at Lumen Labs.",
    "Maya relocated from Seattle to Austin around April 2024.",
    "Maya adopted a rescue greyhound named Pixel.",
    "Maya's favorite weekend activity is taking Pixel to Zilker Park on Saturday mornings.",
    "Maya signed up for a beginner pottery class because she always wanted to try it.",
    "Maya led and shipped the onboarding redesign at Lumen Labs (June 2024).",
    "Maya booked a solo trip to Lisbon in September 2024 to see the architecture and tilework.",
    "Maya switched to oat milk because dairy upsets her stomach.",
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


async def extract_for_mission(mission: str) -> dict:
    llm_config = LLMConfig.from_env()
    config = _get_raw_config()
    config.retain_mission = mission
    facts: list[dict] = []
    in_tok = out_tok = 0
    for doc in DOCS:
        result_facts, _chunks, usage = await extract_facts_from_text(
            text=doc["text"],
            event_date=datetime.fromisoformat(doc["date"]),
            llm_config=llm_config,
            agent_name=NARRATOR,
            config=config,
            context="Personal journal note",
        )
        in_tok += usage.input_tokens
        out_tok += usage.output_tokens
        for f in result_facts:
            facts.append(
                {
                    "doc": doc["id"],
                    "text": f.fact,
                    "fact_type": f.fact_type,
                    "occurred_start": f.occurred_start,
                    "entities": [e.text for e in (f.entities or []) if getattr(e, "text", None)],
                }
            )
    return {"mission": mission, "facts": facts, "usage": {"input": in_tok, "output": out_tok}}


def score_coverage(client: genai.Client, facts: list[dict]) -> dict:
    """Real Gemini coverage judge — which golden facts are reproduced by the candidate set."""
    golden_list = "\n".join(f"[{i}] {g}" for i, g in enumerate(GOLDEN))
    cand = "\n".join(f"- {f['text']}" for f in facts) or "(none)"
    resp = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=(
            f"GOLDEN facts (the target):\n{golden_list}\n\n"
            f"CANDIDATE facts (what a mission extracted):\n{cand}\n\n"
            "Return the indices of GOLDEN facts whose information is present in the CANDIDATE set "
            "(allow paraphrase/different wording), and the texts of the missing ones."
        ),
        config={
            "temperature": 0,
            "response_mime_type": "application/json",
            "response_schema": {
                "type": "OBJECT",
                "properties": {
                    "coveredIndices": {"type": "ARRAY", "items": {"type": "INTEGER"}},
                    "missing": {"type": "ARRAY", "items": {"type": "STRING"}},
                },
                "required": ["coveredIndices", "missing"],
            },
        },
    )
    parsed = json.loads(resp.text)
    covered = sorted(set(parsed.get("coveredIndices", [])))
    return {"covered": covered, "missing": parsed.get("missing", []), "total": len(GOLDEN)}


async def main() -> None:
    client = genai.Client(api_key=os.environ["HINDSIGHT_API_LLM_API_KEY"])
    print("Extracting with BASELINE mission…")
    baseline = await extract_for_mission(BASELINE_MISSION)
    baseline["coverage"] = score_coverage(client, baseline["facts"])
    print(f"  baseline: {len(baseline['facts'])} facts, coverage {len(baseline['coverage']['covered'])}/{len(GOLDEN)}")

    print("Extracting with REFINED mission…")
    refined = await extract_for_mission(REFINED_MISSION)
    refined["coverage"] = score_coverage(client, refined["facts"])
    print(f"  refined: {len(refined['facts'])} facts, coverage {len(refined['coverage']['covered'])}/{len(GOLDEN)}")

    out = {
        "narrator": NARRATOR,
        "documents": DOCS,
        "golden": GOLDEN,
        "baseline": baseline,
        "refined": refined,
    }
    # Write next to the video folder: hindsight/mission-sandbox/data.json
    path = os.path.join(os.path.dirname(__file__), "..", "data.json")
    with open(path, "w") as fh:
        json.dump(out, fh, indent=2)
    print(f"Wrote {os.path.abspath(path)}")


if __name__ == "__main__":
    asyncio.run(main())
