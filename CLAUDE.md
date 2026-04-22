# Bauservice — Repo-Anleitung für Claude Code

## Projekt

AI-Powered Email-Automation für **Bauservice KG** (Brixen). Generiert automatisiert personalisierte Werbe-E-Mails aus den vier Datenservices des Kunden (Ausschreibungen, Ergebnisse/Teilnehmer, Beschlüsse/Projekte, Baukonzessionen). Mensch-im-Loop: nichts geht ohne Freigabe raus.

**Stack**
- Frontend: Next.js (App Router) + TypeScript + shadcn/ui + Tailwind
- Vector-DB: Weaviate (semantische Beispielauswahl)
- SQL: Read-only aus Bauservice-Bestands-DB (Views, DBMS noch zu bestätigen — vermutlich MySQL)
- Email: Mailjet + MJML-Templates
- Hosting: AlpinoAI Cloud, EU, DSGVO-konform

## Knowledge Base (Obsidian Vault)

**Absoluter Pfad:** `/Users/juliansommavilla/Desktop/Coding/alpino-kb/`

**Bei Session-Start immer zuerst `alpino-kb/CLAUDE.md` lesen** (Regeln, Write-Zonen, Naming, Save-This-Routing). Danach für Bauservice-Kontext:

- `alpino-kb/wiki/clients/bauservice/bauservice-overview.md` — Company Profile, Stack-Entscheidungen
- `alpino-kb/wiki/clients/bauservice/projects/bauservice-email-automation.md` — Scope, Workflow, Open Issues (hier am Session-Ende updaten)
- `alpino-kb/wiki/clients/bauservice/proposals/bauservice-2026-01-email-automation.md` — Vertragsbasis
- `alpino-kb/wiki/clients/bauservice/bauservice-future-ideas.md` — Backlog Folgeprojekte

**Session-Ende-Routine:** Projekt-Updates in `alpino-kb/wiki/clients/bauservice/projects/bauservice-email-automation.md` dokumentieren (Session Log + `last_updated`). Neue offene Fragen in "Open Issues" übernehmen.

## Task-Tracking

ClickUp-MCP verwenden (Workspace → Alpino AI → Bauservice-Liste). Status, Kommentare, Subtasks dort pflegen.

## Alter MVP-Repo

Es gibt ein älteres Repo **"Bauservice Frontend"** (MVP, MCP-Setup). Dieses wird in einer separaten Iteration **von Grund auf überarbeitet** und nicht in diesem Repo weitergeführt. Nicht anfassen, bis explizit der Refactor-Task gestartet wird.

## Referenzen

- **Live-Bauservice-Portal (Demo-Modus, Look & Feel):** https://www.bauservice.it/de/intranet/beschluesse-projekte.html
- **Bauservice-Datenbank** (aktuell nur Erkundung, heute bleiben Dummy-Endpoints):
  - Host: `167.235.240.105` (phpMyAdmin über Browser)
  - DB: `bauservice`
  - Credentials nicht committen — nur im Projekt-Vault und lokaler Session halten

## Repo-Konventionen

- Deutsche Sprache als Projektstandard (Dokumentation, Commit-Messages können Englisch bleiben)
- Konzept-Dokumente in `/docs/`
- Keine Secrets im Repo (`.env.local` ist gitignored)
- `git push` ist erlaubt, sobald Julian in der aktuellen Session explizit darum bittet. Ohne diese Aufforderung nicht pushen.
- `git push --force` / Force-Push auf `main` bleibt tabu — immer erst Rückfrage, dann ein regulärer Merge- oder Rebase-Flow.
