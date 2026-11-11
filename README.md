# Beaver Planner

**[Open Beaver Planner](https://beaver-apps.github.io/planner/)** · beaver-apps.github.io/planner/

Hi!! its me, the beaver :D I hung up a big wooden timetable in my lodge, just like the one you had at school, and
I write evrything on it for you. You tell me what is fixed (work, classes, gym on Tuesdays) and I make it repeat by
itself. You tell me the chores (laundry, once a week, about an hour) and I find them a spot ^_^ When a birthday
party turns up and your plan breaks, I just say "how about Sunday at 4?" and you tap OK. No re-planning, no
fuss. I am prety proud of this one <3

Beaver Planner is the fourth Beaver App, beside Beaver Reader, Beaver Focus and Beaver Cook. A school timetable for
grown-up life, a pixel-art React 18 PWA.

**New and early.** This is an early version (v0.1.1 · Clear Print), so expect rough edges; it runs at
https://beaver-apps.github.io/planner/ and installs as an app from there.

## What it does

Fixed things repeat weekly, on A/B two-week cycles, or monthly ("first Saturday"), and can carry a place with a map
link. Chores get a rough time and a length, and the beaver picks the exact slot around everything fixed. When
something gets in the way, he suggests a new slot and you choose OK, another, or skip this week. Ticking a chore
off is one tap and gets a pencil strike, never a red overdue mark: no streaks, no guilt.

The wall shows Today, the Week, two weeks, the Month or a plain List; drag a note to move it, or pick the beaver
up. Add one thing or a whole list at once, or tell him your usual day in the first questions. The beaver's desk is a
second room where he tells you what's coming up and asks what happened, and where you type
phrases like "something came up Saturday afternoon" or "remind me to call mum in 20 minutes". A built-in phrase
understander reads them offline, with no AI and no server, and asks back with buttons when it is unsure. Titled
alarms and timers ring while the app is open, and an alarm can go on the wall too. With the Beaver Focus link switched on, a work or study slot gets a
Start in Beaver Focus button (Focus learns to read it soon).

## It's on your device

No account, no server. Everything is stored on your device (IndexedDB and localStorage) and works offline once
loaded. Backups are a file you save and load yourself. Google Drive sync and read-only Google Calendar busy times
come later, and only if you sign in.

## The PWA rings only while it's open

A web page cannot wake a sleeping phone, so alarms and timers ring only while Beaver Planner is open. An Android app
with exact alarms is planned (Stage 2) so reminders can ring when the app is closed.

## Languages

English, Svenska, Dansk, Norsk bokmål, Suomi, Deutsch, Español, Français, Chinese and Japanese, including the
phrase understander. Phrasing in languages other than English still needs native speakers to check it.


## About this repo

This repo holds the ready-to-use Beaver Planner that runs at https://beaver-apps.github.io/planner/ (just the built files).
The source code is private for now. Licences: `LICENSE.md` and `fonts/OFL.txt`.
