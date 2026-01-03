#!/usr/bin/env python3
import argparse
import datetime
import re
import sys
from difflib import SequenceMatcher
from pathlib import Path

DEFAULT_CATEGORIES = [
    "architecture",
    "preferences",
    "workflow",
    "tooling",
    "domain",
    "product",
]

META_ORDER = ["status", "created", "updated", "source", "confidence", "tags"]


def today():
    return datetime.date.today().isoformat()


def find_project_root(start_path):
    current = start_path.resolve()
    for candidate in [current] + list(current.parents):
        if (candidate / ".ai_agents").is_dir():
            return candidate
    return start_path.resolve()


def memories_dir(root):
    return root / ".ai_agents" / "memories"


def slugify(text):
    normalized = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return normalized or "memory"


def normalize_text(text):
    lowered = text.lower()
    cleaned = re.sub(r"[^a-z0-9\s]", " ", lowered)
    return re.sub(r"\s+", " ", cleaned).strip()


def similarity(a, b):
    return SequenceMatcher(None, normalize_text(a), normalize_text(b)).ratio()


def split_frontmatter(text):
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}, lines
    end_idx = None
    for idx in range(1, len(lines)):
        if lines[idx].strip() == "---":
            end_idx = idx
            break
    if end_idx is None:
        return {}, lines
    meta = parse_frontmatter(lines[1:end_idx])
    body = lines[end_idx + 1 :]
    return meta, body


def parse_frontmatter(lines):
    meta = {}
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line or ":" not in line:
            i += 1
            continue
        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip()
        if value == "":
            items = []
            j = i + 1
            while j < len(lines):
                entry = lines[j].strip()
                if entry.startswith("- "):
                    items.append(entry[2:].strip())
                    j += 1
                else:
                    break
            meta[key] = items
            i = j
            continue
        if value.startswith("[") and value.endswith("]"):
            inner = value[1:-1].strip()
            meta[key] = [v.strip() for v in inner.split(",") if v.strip()] if inner else []
        else:
            meta[key] = value
        i += 1
    return meta


def render_frontmatter(meta):
    lines = ["---"]
    for key in META_ORDER:
        if key in meta:
            value = meta[key]
            if key == "tags":
                tags = value if isinstance(value, list) else [value]
                tags = [t for t in tags if t]
                lines.append(f"tags: [{', '.join(tags)}]")
            else:
                lines.append(f"{key}: {value}")
    extra_keys = [k for k in meta.keys() if k not in META_ORDER]
    for key in sorted(extra_keys):
        value = meta[key]
        if isinstance(value, list):
            lines.append(f"{key}: [{', '.join(value)}]")
        else:
            lines.append(f"{key}: {value}")
    lines.append("---")
    return "\n".join(lines)


def parse_sections(body_lines):
    title = ""
    sections = {}
    current = None
    buffer = []
    for line in body_lines:
        if line.startswith("# "):
            if current is not None:
                sections[current] = "\n".join(buffer).strip()
            title = line[2:].strip()
            current = None
            buffer = []
            continue
        if line.startswith("## "):
            if current is not None:
                sections[current] = "\n".join(buffer).strip()
            current = line[3:].strip().lower()
            buffer = []
            continue
        if current is not None:
            buffer.append(line)
    if current is not None:
        sections[current] = "\n".join(buffer).strip()
    return title, sections


def render_memory_file(meta, title, sections):
    lines = [render_frontmatter(meta), "", f"# {title}", ""]
    for section in ["memory", "scope", "evolution"]:
        content = sections.get(section, "").strip()
        if content:
            lines.append(f"## {section.title()}")
            lines.append(content)
            lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def ensure_memories_dir(root):
    mem_dir = memories_dir(root)
    mem_dir.mkdir(parents=True, exist_ok=True)
    for category in DEFAULT_CATEGORIES:
        (mem_dir / category).mkdir(parents=True, exist_ok=True)
    return mem_dir


def read_memory_file(path):
    text = path.read_text(encoding="utf-8")
    meta, body = split_frontmatter(text)
    title, sections = parse_sections(body)
    return meta, title, sections


def write_memory_file(path, meta, title, sections):
    content = render_memory_file(meta, title, sections)
    path.write_text(content, encoding="utf-8")


def ensure_index(mem_dir):
    index_path = mem_dir / "memories.md"
    if not index_path.exists():
        index_path.write_text(build_index_content(mem_dir), encoding="utf-8")


def build_index_content(mem_dir):
    entries = collect_entries(mem_dir)
    lines = ["# Memories", "", f"Last reviewed: {today()}", ""]
    categories = ordered_categories(entries)
    for category in categories:
        title = category_title(category)
        lines.append(f"## {title}")
        items = sorted(entries.get(category, []), key=lambda item: item[0].lower())
        if items:
            for entry in items:
                lines.append(f"- [{entry[0]}]({entry[1]}) — updated {entry[2]}")
        else:
            lines.append("- (none)")
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def ordered_categories(entries):
    categories = list(entries.keys())
    ordered = []
    for category in DEFAULT_CATEGORIES:
        if category in categories:
            ordered.append(category)
    for category in sorted(categories):
        if category not in ordered:
            ordered.append(category)
    return ordered


def category_title(category):
    return category.replace("-", " ").replace("_", " ").title()


def collect_entries(mem_dir):
    entries = {}
    for path in mem_dir.rglob("*.md"):
        if path.name == "memories.md":
            continue
        rel = path.relative_to(mem_dir).as_posix()
        category = rel.split("/", 1)[0]
        meta, title, _sections = read_memory_file(path)
        updated = meta.get("updated", "")
        if not title:
            title = path.stem
        entries.setdefault(category, []).append((title, rel, updated))
    return entries


def load_memory_text(memory, memory_file):
    if memory_file:
        return Path(memory_file).read_text(encoding="utf-8").strip()
    if memory:
        return memory.strip()
    return ""


def load_scope_text(scope, scope_file):
    if scope_file:
        return Path(scope_file).read_text(encoding="utf-8").strip()
    if scope:
        return scope.strip()
    return ""


def parse_tags(tags):
    if not tags:
        return []
    return [tag.strip() for tag in tags.split(",") if tag.strip()]


def find_similar(mem_dir, title, memory_text, limit):
    combined = f"{title}\n{memory_text}".strip()
    matches = []
    for path in mem_dir.rglob("*.md"):
        if path.name == "memories.md":
            continue
        meta, existing_title, sections = read_memory_file(path)
        existing_memory = sections.get("memory", "")
        existing_text = f"{existing_title}\n{existing_memory}".strip()
        score = similarity(combined, existing_text)
        matches.append({
            "path": path,
            "score": score,
            "title": existing_title or path.stem,
            "meta": meta,
        })
    matches.sort(key=lambda item: item["score"], reverse=True)
    return matches[:limit]


def choose_action(matches, threshold):
    candidates = [m for m in matches if m["score"] >= threshold]
    if not candidates:
        return "create", None
    print("Similar memories found:")
    for idx, match in enumerate(candidates, start=1):
        rel = match["path"].as_posix()
        print(f"{idx}) {match['title']} ({match['score']:.2f}) - {rel}")
    choice = input("Choose action: [u]pdate [s]upersede [c]reate [q]uit: ").strip().lower()
    if choice == "u":
        return "update", candidates[0]
    if choice == "s":
        return "supersede", candidates[0]
    if choice == "c":
        return "create", None
    return "quit", None


def unique_path(category_dir, slug):
    candidate = category_dir / f"{slug}.md"
    if not candidate.exists():
        return candidate
    counter = 2
    while True:
        candidate = category_dir / f"{slug}-{counter}.md"
        if not candidate.exists():
            return candidate
        counter += 1


def append_evolution(sections, note):
    entry = f"- {today()}: {note}".strip()
    existing = sections.get("evolution", "").strip()
    if existing:
        sections["evolution"] = f"{existing}\n{entry}"
    else:
        sections["evolution"] = entry


def update_existing_memory(path, memory_text, scope_text, meta_updates, evolution_note):
    meta, title, sections = read_memory_file(path)
    meta.update(meta_updates)
    if memory_text:
        sections["memory"] = memory_text
    if scope_text:
        sections["scope"] = scope_text
    append_evolution(sections, evolution_note)
    write_memory_file(path, meta, title, sections)


def create_memory(mem_dir, category, title, memory_text, scope_text, meta):
    category_dir = mem_dir / category
    category_dir.mkdir(parents=True, exist_ok=True)
    path = unique_path(category_dir, slugify(title))
    sections = {
        "memory": memory_text,
        "scope": scope_text,
        "evolution": f"- {today()}: Initial capture.",
    }
    write_memory_file(path, meta, title, sections)
    return path


def rebuild_index(mem_dir):
    index_path = mem_dir / "memories.md"
    index_path.write_text(build_index_content(mem_dir), encoding="utf-8")


def handle_init(args, root):
    mem_dir = ensure_memories_dir(root)
    ensure_index(mem_dir)
    print(f"Initialized {mem_dir}")


def handle_add(args, root):
    mem_dir = ensure_memories_dir(root)
    ensure_index(mem_dir)
    memory_text = load_memory_text(args.memory, args.memory_file)
    if not memory_text:
        print("Memory text is required.")
        sys.exit(1)
    scope_text = load_scope_text(args.scope, args.scope_file)
    tags = parse_tags(args.tags)
    meta = {
        "status": args.status,
        "created": today(),
        "updated": today(),
        "source": args.source,
        "confidence": args.confidence,
        "tags": tags,
    }
    matches = find_similar(mem_dir, args.title, memory_text, limit=5)
    action = args.if_similar
    match = None
    if action == "prompt":
        action, match = choose_action(matches, args.similarity_threshold)
    elif action in {"update", "supersede"}:
        for candidate in matches:
            if candidate["score"] >= args.similarity_threshold:
                match = candidate
                break
        if match is None:
            action = "create"
    if action == "quit":
        print("Aborted.")
        return
    if action == "update" and match is not None:
        evolution_note = args.evolution_note or "Updated memory."
        meta_updates = {
            "updated": today(),
            "source": args.source,
            "confidence": args.confidence,
        }
        if tags:
            meta_updates["tags"] = tags
        update_existing_memory(match["path"], memory_text, scope_text, meta_updates, evolution_note)
        print(f"Updated {match['path']}")
    elif action == "supersede" and match is not None:
        new_path = create_memory(mem_dir, args.category, args.title, memory_text, scope_text, meta)
        supersede_note = f"Superseded by {new_path.relative_to(mem_dir).as_posix()}"
        update_existing_memory(
            match["path"],
            "",
            "",
            {"status": "superseded", "updated": today()},
            supersede_note,
        )
        print(f"Superseded {match['path']} -> {new_path}")
    else:
        path = create_memory(mem_dir, args.category, args.title, memory_text, scope_text, meta)
        print(f"Created {path}")
    if not args.no_index:
        rebuild_index(mem_dir)


def handle_find(args, root):
    mem_dir = ensure_memories_dir(root)
    query = (args.query or "").lower()
    results = []
    for path in mem_dir.rglob("*.md"):
        if path.name == "memories.md":
            continue
        meta, title, sections = read_memory_file(path)
        text = "\n".join([title, sections.get("memory", ""), sections.get("scope", "")]).lower()
        if query and query not in text:
            continue
        if args.tag:
            tags = meta.get("tags", [])
            tags = tags if isinstance(tags, list) else [tags]
            if args.tag not in tags:
                continue
        if args.status and meta.get("status") != args.status:
            continue
        if args.confidence and meta.get("confidence") != args.confidence:
            continue
        rel = path.relative_to(mem_dir).as_posix()
        updated = meta.get("updated", "")
        results.append((title or path.stem, rel, updated))
    results.sort(key=lambda item: item[0].lower())
    for item in results[: args.limit]:
        print(f"{item[0]} | {item[1]} | updated {item[2]}")


def handle_index(args, root):
    mem_dir = ensure_memories_dir(root)
    rebuild_index(mem_dir)
    print(f"Updated {mem_dir / 'memories.md'}")


def parse_date(value):
    if not value:
        return None
    try:
        return datetime.date.fromisoformat(value)
    except ValueError:
        return None


def handle_review(args, root):
    mem_dir = ensure_memories_dir(root)
    now = datetime.date.today()
    results = []
    for path in mem_dir.rglob("*.md"):
        if path.name == "memories.md":
            continue
        meta, title, _sections = read_memory_file(path)
        updated = parse_date(meta.get("updated"))
        age = (now - updated).days if updated else None
        reasons = []
        if age is None or age >= args.stale_days:
            reasons.append("stale")
        if meta.get("confidence") == "low":
            reasons.append("low-confidence")
        if meta.get("status") in {"superseded", "deprecated"}:
            reasons.append(meta.get("status"))
        if reasons:
            rel = path.relative_to(mem_dir).as_posix()
            results.append((title or path.stem, rel, ", ".join(reasons)))
    for item in results[: args.limit]:
        print(f"{item[0]} | {item[1]} | {item[2]}")


def handle_supersede(args, root):
    mem_dir = ensure_memories_dir(root)
    ensure_index(mem_dir)
    memory_text = load_memory_text(args.memory, args.memory_file)
    if not memory_text:
        print("Memory text is required.")
        sys.exit(1)
    scope_text = load_scope_text(args.scope, args.scope_file)
    tags = parse_tags(args.tags)
    meta = {
        "status": "active",
        "created": today(),
        "updated": today(),
        "source": args.source,
        "confidence": args.confidence,
        "tags": tags,
    }
    old_path = Path(args.old)
    if not old_path.is_absolute():
        old_path = mem_dir / old_path
    if not old_path.exists():
        print(f"Old memory not found: {old_path}")
        sys.exit(1)
    new_path = create_memory(mem_dir, args.category, args.title, memory_text, scope_text, meta)
    supersede_note = args.evolution_note or f"Superseded by {new_path.relative_to(mem_dir).as_posix()}"
    update_existing_memory(
        old_path,
        "",
        "",
        {"status": "superseded", "updated": today()},
        supersede_note,
    )
    rebuild_index(mem_dir)
    print(f"Superseded {old_path} -> {new_path}")


def build_parser():
    parser = argparse.ArgumentParser(prog="memories")
    parser.add_argument("--root", help="Project root (defaults to auto-detect)")
    subparsers = parser.add_subparsers(dest="command", required=True)

    init_parser = subparsers.add_parser("init")
    init_parser.set_defaults(func=handle_init)

    add_parser = subparsers.add_parser("add")
    add_parser.add_argument("--title", required=True)
    add_parser.add_argument("--category", required=True)
    add_parser.add_argument("--memory")
    add_parser.add_argument("--memory-file")
    add_parser.add_argument("--scope")
    add_parser.add_argument("--scope-file")
    add_parser.add_argument("--tags", default="")
    add_parser.add_argument("--source", default="agent", choices=["user", "agent"])
    add_parser.add_argument("--confidence", default="medium", choices=["high", "medium", "low"])
    add_parser.add_argument("--status", default="active", choices=["active", "superseded", "deprecated"])
    add_parser.add_argument(
        "--if-similar",
        default="prompt",
        choices=["prompt", "update", "supersede", "create"],
    )
    add_parser.add_argument("--similarity-threshold", type=float, default=0.6)
    add_parser.add_argument("--evolution-note")
    add_parser.add_argument("--no-index", action="store_true")
    add_parser.set_defaults(func=handle_add)

    find_parser = subparsers.add_parser("find")
    find_parser.add_argument("--query")
    find_parser.add_argument("--tag")
    find_parser.add_argument("--status")
    find_parser.add_argument("--confidence")
    find_parser.add_argument("--limit", type=int, default=20)
    find_parser.set_defaults(func=handle_find)

    index_parser = subparsers.add_parser("index")
    index_parser.set_defaults(func=handle_index)

    review_parser = subparsers.add_parser("review")
    review_parser.add_argument("--stale-days", type=int, default=180)
    review_parser.add_argument("--limit", type=int, default=50)
    review_parser.set_defaults(func=handle_review)

    supersede_parser = subparsers.add_parser("supersede")
    supersede_parser.add_argument("--old", required=True)
    supersede_parser.add_argument("--title", required=True)
    supersede_parser.add_argument("--category", required=True)
    supersede_parser.add_argument("--memory")
    supersede_parser.add_argument("--memory-file")
    supersede_parser.add_argument("--scope")
    supersede_parser.add_argument("--scope-file")
    supersede_parser.add_argument("--tags", default="")
    supersede_parser.add_argument("--source", default="agent", choices=["user", "agent"])
    supersede_parser.add_argument("--confidence", default="medium", choices=["high", "medium", "low"])
    supersede_parser.add_argument("--evolution-note")
    supersede_parser.set_defaults(func=handle_supersede)

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()
    root = Path(args.root).resolve() if args.root else find_project_root(Path.cwd())
    args.func(args, root)


if __name__ == "__main__":
    main()
