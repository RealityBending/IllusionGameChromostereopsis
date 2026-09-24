"""
data/download.py — the sessions, off Zenodo and into data/raw/.

Adapted from TestYourself's `data/collected/download.py`. The experiment sends every session
through DataPipe into a Zenodo deposit (see "Saving" in `experiment/README.md`); this fetches
what is in that deposit, checks each file against its checksum and puts it in `data/raw/`,
which is git-ignored: it holds participant data, and this repository is public.

    python data/download.py               # fetch what is new, verify, report
    python data/download.py --skip-test   # leave the test runs on Zenodo
    python data/download.py --list        # say what is there, download nothing

Standard library only, and safe to run again: a file already in `data/raw/` with the right
size and checksum is left alone, so it can be rerun to pull an ongoing study down.

**The token.** While DataPipe is collecting, the deposit is an unpublished **draft** (DataPipe
creates one and never publishes it), and a draft can only be read by its owner, so a token is
needed throughout the study. The same goes for a published record with restricted files; only
an open-access published record can be read without one. Two places are looked at, in order:

    ZENODO_TOKEN                 environment variable
    ~/.zenodo_token              a file with the token as its only line

Neither is in this repository: a token in a folder git watches gets committed sooner or later,
and this one is also synced by Dropbox. Make it at
zenodo.org/account/settings/applications/tokens/new with the `deposit:write` scope (the
narrowest that can read a draft; it can also write, so rotate it when the study ends).

**What comes down.** One file per session:

    chromostereopsis_<START>_<ID>.json                 a finished session (the `log` container)
    test_chromostereopsis_...json                      a test run: not data
    <the same name without .json>-<id>.partial.json    someone who stopped partway

A partial is a bare JSON array of the records staged during the session: one `"record":
"frame"` (session, demographics, design) followed by one `"record": "trial"` per trial.
Past 80 files in a deposit, DataPipe packs the older ones into `datapipe-batch-NNNN.zip`;
those are unpacked here as they arrive, so `data/raw/` always holds sessions, not archives.

**The report** counts finished sessions apart from partials and test runs, and names any session
that has *both* a complete file and a partial. That means the session was not closed as
submitted (a tab shut at the very end, most likely): the complete file is the session, and the
partial beside it is an earlier copy of the same person, not a second participant.
"""

import argparse
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

ZENODO = "https://zenodo.org/api"
DEPOSIT = 22944626  # IllusionGameChromostereopsis, the deposit DataPipe writes into
HERE = Path(__file__).resolve().parent
RAW = HERE / "raw"

CHUNK = 1 << 16  # bytes a download is read in, so a big archive never lands in memory whole

# A partial is the complete run's own filename with an id put after it: the
# `.json` comes off, `-<id>.partial.json` goes on. Read back, it says which run
# it is the staged copy of.
PARTIAL = re.compile(r"^(?P<base>.+?)-(?P<id>[0-9a-f]+)\.partial\.json$")

# A test run's name starts `test_` (`?test` in the URL, or the task run from disk or localhost)
TEST_PREFIXES = ("test_",)


TOKEN_FILE = Path.home() / ".zenodo_token"


def token():
    """
    The Zenodo token, from the environment or from a file in the home folder.

    Two places, and **neither of them is this repository**: a token in a folder
    that git watches gets committed sooner or later, and this one is in Dropbox
    besides, which would sync it. `ZENODO_TOKEN` is the first place looked and
    the ordinary way; `~/.zenodo_token` is the second, so that the token
    survives being set once and works in any shell afterwards without anybody
    having to remember to export it — including a shell somebody else's tooling
    opened. The file is one line and nothing else.
    """
    from_environment = tidy_token(os.environ.get("ZENODO_TOKEN", ""))
    if from_environment:
        return from_environment
    if TOKEN_FILE.exists():
        # `utf-8-sig` rather than `utf-8`: PowerShell's `Set-Content -Encoding
        # utf8` writes a byte order mark, which is not whitespace and so
        # survives `strip()` — and a token with a `﻿` on the front goes
        # into the Authorization header and blows up encoding it to latin-1,
        # a long way from anything that mentions tokens.
        held = tidy_token(TOKEN_FILE.read_text(encoding="utf-8-sig"))
        if held:
            return held
    return None


def tidy_token(text):
    """What somebody pasted, less what they pasted around it: a byte order
    mark, stray whitespace, and the quotes that come with copying out of a
    config file or a shell line."""
    text = text.replace("﻿", "").strip()
    if len(text) > 1 and text[0] == text[-1] and text[0] in "\"'":
        text = text[1:-1].strip()
    return text


HOW_TO_SET_A_TOKEN = """
Make one at zenodo.org/account/settings/applications/tokens/new with the
deposit:write scope, then either of these, once and for good:

  setx ZENODO_TOKEN "the-token"                 (a new terminal picks it up)
  or write it as the only line of %s
""" % TOKEN_FILE


def ask(url, token=None, binary=False):
    """One GET. Zenodo answers JSON for the API and bytes for a file."""
    request = urllib.request.Request(url)
    if token:
        request.add_header("Authorization", "Bearer " + token)
    reply = urllib.request.urlopen(request, timeout=60)
    return reply if binary else json.load(reply)


def deposit(which, token):
    """
    What is in the deposit, whichever of the three it can be: a draft that has
    never been published, a published record anybody may read, and a published
    record whose files are **restricted**.

    **The owner's view is asked for first whenever there is a token**, and that
    is the whole of why this is not two lines. A restricted record answers the
    public endpoint perfectly happily — on Zenodo the metadata of a restricted
    record is public and only the *files* are held back — so trying the public
    endpoint first and believing it would leave us listing a record whose files
    then refuse to download. The deposit endpoint is the owner's own and always
    has the files, so with a token that is the one to trust; without one, the
    public endpoint is all there is and open access is the only case it serves.
    """
    if token:
        try:
            return "owner", ask("%s/deposit/depositions/%d" % (ZENODO, which), token)
        except urllib.error.HTTPError as answer:
            if answer.code in (401, 403):
                sys.exit(
                    "Zenodo refused the token (HTTP %d). It has to belong to the account that owns\n"
                    "deposit %d and carry the deposit:write scope.\n%s" % (answer.code, which, HOW_TO_SET_A_TOKEN)
                )
            if answer.code != 404:
                raise
            # A record published through the newer API may not answer the
            # legacy deposit endpoint; the public one still knows it.

    try:
        return "record", ask("%s/records/%d" % (ZENODO, which), token)
    except urllib.error.HTTPError as answer:
        if answer.code in (401, 403, 404) and not token:
            sys.exit(
                "Zenodo would not show deposit %d without a token (HTTP %d).\n"
                "A draft, or a record whose files are restricted, can only be read by its owner.\n%s"
                % (which, answer.code, HOW_TO_SET_A_TOKEN)
            )
        if answer.code == 404:
            sys.exit("Zenodo has no deposit %d for this account." % which)
        raise


def listing(which, body):
    """
    The files, under one set of names. The two endpoints describe the same file
    differently — `key` against `filename`, `size` against `filesize`, a checksum
    with an `md5:` in front of it or without — and a record may hand its files
    back as a list or as an `entries` map, so all of it is read into one shape
    here and nothing below has to know which came back.
    """
    held = body.get("files", [])
    if isinstance(held, dict):  # a record's files: {enabled, entries: {name: {...}}}
        entries = held.get("entries", {})
        held = [dict(entry, key=name) for name, entry in entries.items()] if isinstance(entries, dict) else entries

    files = []
    for entry in held:
        name = entry.get("key") or entry.get("filename")
        if not name:
            continue
        links = entry.get("links", {})
        # `self` is the file's *metadata* on the record endpoint, not the file,
        # so it is never a fallback: where no download link is offered, the
        # content URL is built from the name instead.
        url = links.get("content") or links.get("download")
        if not url:
            url = "%s/records/%d/files/%s/content" % (ZENODO, which, urllib.parse.quote(name))
        checksum = entry.get("checksum") or ""
        files.append(
            {
                "name": name,
                "size": entry.get("size", entry.get("filesize")),
                "md5": checksum.replace("md5:", "") or None,
                "url": url,
            }
        )
    return sorted(files, key=lambda one: one["name"])


def settled(path, size, md5):
    """
    Whether the copy on this machine is already the one Zenodo is offering. The
    size is checked first because it is free; the checksum is what is trusted.
    """
    if not path.exists():
        return False
    if size is not None and path.stat().st_size != size:
        return False
    if not md5:
        return True

    digest = hashlib.md5()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(CHUNK), b""):
            digest.update(block)
    return digest.hexdigest() == md5


def fetch(entry, token, into):
    """One file onto the disk, written beside itself and moved into place only
    once it is whole, so an interrupted run never leaves a half file that the
    next run would take for a finished one."""
    target = into / entry["name"]
    part = target.with_suffix(target.suffix + ".part")

    reply = ask(entry["url"], token, binary=True)
    with part.open("wb") as handle:
        for block in iter(lambda: reply.read(CHUNK), b""):
            handle.write(block)

    if entry["md5"] and not settled(part, None, entry["md5"]):
        part.unlink()
        return False

    part.replace(target)
    return True


def unpack(archive, into):
    """
    The runs inside one of DataPipe's archives. Past eighty files in a record it
    packs the older ones into `datapipe-batch-NNNN.zip`, so a study of any size
    ends up part loose files and part archives; unpacked here, `raw/` is runs
    either way. Only the names are taken, never the paths inside the zip, since
    an archive is somebody else's file and a path in one can point anywhere.
    """
    taken = []
    with zipfile.ZipFile(archive) as bundle:
        for member in bundle.infolist():
            if member.is_dir():
                continue
            name = Path(member.filename).name
            if not name.endswith(".json"):
                continue
            target = into / name
            if target.exists():
                continue
            with bundle.open(member) as source, target.open("wb") as handle:
                while True:
                    block = source.read(CHUNK)
                    if not block:
                        break
                    handle.write(block)
            taken.append(name)
    return taken


def report(names):
    """
    What was collected, in the terms the study cares about: how many people
    finished, how many stopped partway, and what is not data at all. Everything
    here is read off the filenames, which is what they are written to carry.
    """
    runs, partials, tests, test_partials, other = [], [], [], [], []
    for name in sorted(names):
        is_test = name.startswith(TEST_PREFIXES)
        found = PARTIAL.match(name)
        if found:
            (test_partials if is_test else partials).append(found.group("base") + ".json")
        elif name.endswith(".json"):
            (tests if is_test else runs).append(name)
        else:
            other.append(name)

    print("\n  %-28s %d" % ("complete runs", len(runs)))
    print("  %-28s %d" % ("stopped partway", len(partials)))
    if tests or test_partials:
        print("  %-28s %d complete, %d partial   (not data)" % ("test runs", len(tests), len(test_partials)))
    if other:
        print("  %-28s %d" % ("other files", len(other)))

    # A partial whose run also finished is the staged copy of somebody the app
    # went on to file properly: one person, two files, and only one of them is
    # the run. Worth saying out loud, since counting them both is a wrong n.
    both = sorted(set(partials) & set(runs)) + sorted(set(test_partials) & set(tests))
    if both:
        print("\n  %d partial(s) belong to a run that also finished; the complete file is the run:" % len(both))
        for base in both:
            print("      %s" % base)

    orphans = sorted(set(partials) - set(runs))
    if orphans:
        print("\n  %d partial(s) with no complete file: somebody who stopped and did not come back." % len(orphans))


def main():
    parser = argparse.ArgumentParser(description="Download the sessions from Zenodo into data/raw/.")
    parser.add_argument("--deposit", type=int, default=DEPOSIT, help="Zenodo deposit id (default: this study's)")
    parser.add_argument("--list", action="store_true", help="say what is in the deposit and download nothing")
    parser.add_argument("--skip-test", action="store_true", help="leave the test runs on Zenodo")
    parser.add_argument("--into", type=Path, default=RAW, help="where to put them (default: data/raw)")
    args = parser.parse_args()

    held = token()
    kind, body = deposit(args.deposit, held)
    files = listing(args.deposit, body)
    title = body.get("title") or body.get("metadata", {}).get("title") or "(untitled)"
    print("Deposit %d: %s [%s], %d file(s)" % (args.deposit, title, kind, len(files)))

    if args.list:
        for entry in files:
            print("  %10s  %s" % (entry["size"], entry["name"]))
        report([entry["name"] for entry in files])
        return

    args.into.mkdir(parents=True, exist_ok=True)
    got, kept, failed, unpacked = 0, 0, 0, []

    for entry in files:
        if args.skip_test and entry["name"].startswith(TEST_PREFIXES):
            continue
        target = args.into / entry["name"]
        if settled(target, entry["size"], entry["md5"]):
            kept += 1
        elif fetch(entry, held, args.into):
            got += 1
            print("  got  %s" % entry["name"])
        else:
            failed += 1
            print("  FAILED (checksum)  %s" % entry["name"])

        if target.suffix == ".zip" and target.exists():
            unpacked += unpack(target, args.into)

    print("\n%d new, %d already here, %d failed." % (got, kept, failed))
    if unpacked:
        print("%d run(s) unpacked out of archives." % len(unpacked))

    report([one.name for one in args.into.glob("*.json")])
    print("\nIn %s. Not to be committed: this is participant data." % args.into)


if __name__ == "__main__":
    main()
