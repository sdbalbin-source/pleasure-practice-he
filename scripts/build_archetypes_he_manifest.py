import json
import re
import unicodedata
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HE_CARDS_PATH = ROOT / "hypnocards-v2-he" / "archetypes_he_data.json"
HE_IMAGE_MAP_PATH = ROOT / "hypnocards-v2-he" / "archetypes-he" / "image-map.json"
OUT_MANIFEST_PATH = ROOT / "hypnocards-v2-he" / "archetypes-he" / "archetypes-he-manifest.json"
OUT_REPORT_PATH = ROOT / "docs" / "archetypes-he-manifest-build-report.md"


def normalize_key(value: str) -> str:
    s = unicodedata.normalize("NFKC", str(value or "")).strip().lower()
    s = s.replace("׳", "'").replace("״", '"')
    s = re.sub(r"[()\[\]{}]", "", s)
    s = re.sub(r"\s+", " ", s)
    s = s.replace(" - ", "-").replace(" ", "").replace("_", "").replace("-", "")
    return s


def main() -> None:
    cards_data = json.loads(HE_CARDS_PATH.read_text(encoding="utf-8"))
    image_map_data = json.loads(HE_IMAGE_MAP_PATH.read_text(encoding="utf-8"))

    cards = cards_data["cards"]
    image_entries = image_map_data["images"]

    by_id = {entry.get("id"): entry for entry in image_entries if entry.get("id")}
    by_name = {entry.get("name"): entry for entry in image_entries if entry.get("name")}
    by_id_normalized = {
        normalize_key(entry.get("id")): entry for entry in image_entries if entry.get("id")
    }
    by_name_normalized = {
        normalize_key(entry.get("name")): entry for entry in image_entries if entry.get("name")
    }

    manifest = []
    unresolved = []

    for card in cards:
        card_id = card.get("id")
        card_name = card.get("name")

        hit = (
            by_id.get(card_id)
            or by_name.get(card_name)
            or by_id_normalized.get(normalize_key(card_id))
            or by_name_normalized.get(normalize_key(card_name))
        )
        image = (hit or {}).get("image", "")
        if not image:
            unresolved.append({"id": card_id, "name": card_name})

        manifest.append(
            {
                "id": card_id,
                "name": card_name,
                "realm": card.get("realm", ""),
                # EN shape compatibility: HE uses "frequency", EN expects "energy".
                "energy": card.get("frequency", ""),
                "essence": card.get("essence", ""),
                "gift": card.get("gift", ""),
                "shadow": card.get("shadow", ""),
                "practice": card.get("practice", ""),
                "question": card.get("question", ""),
                "image": image,
            }
        )

    OUT_MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    lines = [
        "# Archetypes HE Manifest Build Report",
        "",
        f"- Source cards: `{len(cards)}`",
        f"- Source image-map entries: `{len(image_entries)}`",
        f"- Manifest records: `{len(manifest)}`",
        f"- Unresolved image links: `{len(unresolved)}`",
        "",
    ]

    if unresolved:
        lines.append("## Unresolved cards")
        lines.extend([f"- `{item['id']}` / `{item['name']}`" for item in unresolved])

    OUT_REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print("manifest_generated: true")
    print(f"records: {len(manifest)}")
    print(f"unresolved: {len(unresolved)}")


if __name__ == "__main__":
    main()
